import { readFile, writeFile } from "fs/promises";
import path from "path";

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");
const OUTPUT_PATH = path.join(ROOT, "docs", "document-stats.json");

type IndexEntry = {
  id: string;
  number?: number;
  title?: string;
  contentRef: string;
};

type IndexPart = {
  id: string;
  number?: number;
  title?: string;
  summary?: string;
  sections: string[];
};

type IndexFile = {
  id?: string;
  title?: string;
  subtitle?: string;
  version?: string;
  description?: string;
  namespace?: string;
  documentType?: string;
  documentStruct?: string;
  parts?: IndexPart[];
  sections: IndexEntry[];
};

type SectionNode = {
  id: string;
  title?: string;
  suffix?: string;
  overview?: string;
  defs?: { kind?: string }[];
  content?: { type?: string }[];
  children?: SectionNode[];
};

type SectionStats = {
  id: string;
  number?: number;
  title?: string;
  directSubCount: number;
  subCount: number;
  contentItems: number;
  contentTypes: Record<string, number>;
  defsCount: number;
  defsKinds: Record<string, number>;
};

function countContentTypes(content: { type?: string }[] | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of content || []) {
    const type = item?.type || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

function countDefKinds(defs: { kind?: string }[] | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of defs || []) {
    const kind = entry?.kind || "definition";
    counts[kind] = (counts[kind] || 0) + 1;
  }
  return counts;
}

function mergeCounts(target: Record<string, number>, source: Record<string, number>): void {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] || 0) + value;
  }
}

function walkChildren(node: SectionNode): {
  subCount: number;
  contentItems: number;
  contentTypes: Record<string, number>;
  defsCount: number;
  defsKinds: Record<string, number>;
} {
  let subCount = 0;
  let contentItems = 0;
  const contentTypes: Record<string, number> = {};
  let defsCount = 0;
  const defsKinds: Record<string, number> = {};

  const children = node.children || [];
  for (const child of children) {
    subCount += 1;
    const childContentCount = child.content ? child.content.length : 0;
    contentItems += childContentCount;
    mergeCounts(contentTypes, countContentTypes(child.content));
    const childDefKinds = countDefKinds(child.defs);
    const childDefsCount = Object.values(childDefKinds).reduce((sum, value) => sum + value, 0);
    defsCount += childDefsCount;
    mergeCounts(defsKinds, childDefKinds);

    const nested = walkChildren(child);
    subCount += nested.subCount;
    contentItems += nested.contentItems;
    mergeCounts(contentTypes, nested.contentTypes);
    defsCount += nested.defsCount;
    mergeCounts(defsKinds, nested.defsKinds);
  }

  return { subCount, contentItems, contentTypes, defsCount, defsKinds };
}

export async function buildDocumentStats(): Promise<Record<string, unknown>> {
  const indexRaw = await readFile(INDEX_PATH, "utf-8");
  const index = JSON.parse(indexRaw) as IndexFile;

  const sectionStats: SectionStats[] = [];
  const totalContentTypes: Record<string, number> = {};
  const totalDefsKinds: Record<string, number> = {};
  let totalSubCount = 0;
  let totalContentItems = 0;
  let totalDefsCount = 0;

  for (const entry of index.sections || []) {
    const sectionPath = path.join(SECTIONS_DIR, entry.contentRef);
    const sectionRaw = await readFile(sectionPath, "utf-8");
    const section = JSON.parse(sectionRaw) as SectionNode;

    const directSubCount = section.children ? section.children.length : 0;
    const ownContentItems = section.content ? section.content.length : 0;
    const ownContentTypes = countContentTypes(section.content);
    const ownDefsKinds = countDefKinds(section.defs);
    const ownDefsCount = Object.values(ownDefsKinds).reduce((sum, value) => sum + value, 0);

    const nested = walkChildren(section);

    const combinedTypes: Record<string, number> = {};
    mergeCounts(combinedTypes, ownContentTypes);
    mergeCounts(combinedTypes, nested.contentTypes);
    const combinedDefs: Record<string, number> = {};
    mergeCounts(combinedDefs, ownDefsKinds);
    mergeCounts(combinedDefs, nested.defsKinds);

    const contentItems = ownContentItems + nested.contentItems;
    totalContentItems += contentItems;
    totalSubCount += nested.subCount;
    mergeCounts(totalContentTypes, combinedTypes);
    const defsCount = ownDefsCount + nested.defsCount;
    totalDefsCount += defsCount;
    mergeCounts(totalDefsKinds, combinedDefs);

    sectionStats.push({
      id: section.id,
      number: entry.number,
      title: entry.title,
      directSubCount,
      subCount: nested.subCount,
      contentItems,
      contentTypes: combinedTypes,
      defsCount,
      defsKinds: combinedDefs,
    });
  }

  const partStats =
    index.parts && index.parts.length > 0
      ? index.parts.map((part) => {
          const entries = part.sections
            .map((id) => sectionStats.find((section) => section.id === id))
            .filter(Boolean) as SectionStats[];
          const contentTypes: Record<string, number> = {};
          const defsKinds: Record<string, number> = {};
          let contentItems = 0;
          let defsCount = 0;
          let subCount = 0;
          for (const entry of entries) {
            contentItems += entry.contentItems;
            defsCount += entry.defsCount;
            subCount += entry.subCount;
            mergeCounts(contentTypes, entry.contentTypes);
            mergeCounts(defsKinds, entry.defsKinds);
          }
          return {
            id: part.id,
            number: part.number,
            title: part.title,
            sections: part.sections,
            summary: part.summary,
            totals: {
              sections: entries.length,
              subSections: subCount,
              contentItems,
              defsCount,
            },
            contentTypes,
            defsKinds,
          };
        })
      : undefined;

  return {
    meta: {
      id: index.id,
      title: index.title,
      subtitle: index.subtitle,
      version: index.version,
      description: index.description,
      namespace: index.namespace,
      documentType: index.documentType,
      documentStruct: index.documentStruct,
    },
    sectionsById: sectionStats.reduce((acc, entry) => {
      acc[entry.id] = {
        id: entry.id,
        number: entry.number,
        title: entry.title,
      };
      return acc;
    }, {} as Record<string, { id: string; number?: number; title?: string }>),
    totals: {
      sections: index.sections.length,
      subSections: totalSubCount,
      contentItems: totalContentItems,
      defsCount: totalDefsCount,
    },
    contentTypes: totalContentTypes,
    defsKinds: totalDefsKinds,
    parts: partStats,
    partsSummaryText: partStats
      ? partStats
          .map((part) => {
            const label = part.number ? `PART ${part.number}: ${part.title ?? part.id}` : part.title ?? part.id;
            const summary = part.summary ? `: ${part.summary}` : "";
            return `**${label}**${summary}`;
          })
          .join("\n\n")
      : undefined,
    sections: sectionStats,
  };
}

async function main(): Promise<void> {
  const stats = await buildDocumentStats();
  await writeFile(OUTPUT_PATH, JSON.stringify(stats, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
