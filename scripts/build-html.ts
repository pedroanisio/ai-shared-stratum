import { readFile, writeFile } from "fs/promises";
import path from "path";

export type IndexSection = {
  id: string;
  number?: string;
  title?: string;
  contentRef: string;
};

export type IndexPart = {
  id: string;
  number?: number;
  title?: string;
  summary?: string;
  sections: string[];
};

export type IndexFile = {
  id?: string;
  title?: string;
  subtitle?: string;
  version?: string;
  description?: string;
  namespace?: string;
  documentType?: string;
  documentStruct?: string;
  parts?: IndexPart[];
  meta?: {
    createdAt?: string;
    updatedAt?: string;
    generatedAt?: string;
    authors?: unknown[];
    keywords?: string[];
    domains?: string[];
    abstract?: string;
    [key: string]: unknown;
  };
  sections: IndexSection[];
};

export type ContentItem =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "definition-list"; items: { term: string; definition: string }[] }
  | { type: "list"; items: string[] }
  | { type: "admonition"; level: string; text: string }
  | {
      type: "reference";
      key: string;
      rating?: string;
      citation: string;
      use?: string;
    }
  | { type: "code"; lines: string[]; language?: string }
  | { type: "definition"; label: string; text: string }
  | { type: "rule"; label: string; formula: string }
  | { type: "theorem"; label: string; formula: string }
  | { type: "guarantee"; label: string; description: string; formula: string }
  | { type: "operation"; label: string; signature: string; semantics: string }
  | { type: "profile"; label: string; layers: Record<string, string[]> }
  | { type: "checklist"; label: string; items: string[] }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "diagram"; format: string; content: string; caption?: string; alt?: string };

export type SectionNode = {
  id: string;
  title?: string;
  suffix?: string;
  overview?: string;
  defs?: unknown[];
  content?: ContentItem[];
  children?: SectionNode[];
};

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");
const OUTPUT_PATH = path.join(ROOT, "docs", "stratum-v.2.5.html");

let REFERENCE_MAP = new Map<
  string,
  {
    sectionNumber: string;
    sectionName: string;
    suffix: string;
    suffixName: string;
  }
>();
let TEMPLATE_CONTEXT: Record<string, unknown> = {};

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInline(input: string): string {
  const escaped = escapeHtml(input);
  const strong = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const code = strong.replace(/`([^`]+)`/g, "<code>$1</code>");
  return code;
}

export function renderTemplateValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function applyRenderTemplates(text: string): string {
  return text.replace(/render\(\s*([a-zA-Z_]\w*)\s*,\s*\"([^\"]+)\"\s*\)/g, (match, objName, path) => {
    const root = (TEMPLATE_CONTEXT as Record<string, unknown>)[objName];
    if (!root) return match;
    const value = path
      .split(".")
      .reduce((acc: any, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), root as any);
    if (value === undefined) return match;
    return renderTemplateValue(value);
  });
}

export function applyReferenceMap(text: string): string {
  return text.replace(/referenceMap\(\"([^\"]+)\"\s*,\s*([^\)]*)\)/g, (match, id, template) => {
    const ref = REFERENCE_MAP.get(id);
    if (!ref) return match;
    let tpl = template.trim();
    if ((tpl.startsWith("\"") && tpl.endsWith("\"")) || (tpl.startsWith("'") && tpl.endsWith("'"))) {
      tpl = tpl.slice(1, -1);
    }
    const filled = tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, key) => {
      return (ref as Record<string, string>)[key] ?? placeholder;
    });
    return `[[REF|${id}|${filled}]]`;
  });
}

export function renderInlineWithRefs(input: string): string {
  const withMarkers = applyReferenceMap(applyRenderTemplates(input));
  const rendered = renderInline(withMarkers);
  return rendered.replace(/\[\[REF\|([^|]+)\|([\s\S]*?)\]\]/g, (match, id, content) => {
    return `<a class="ref-link" href="#${escapeHtml(id)}">${content}</a>`;
  });
}

export function renderTextBlocks(text: string): string {
  const fenceRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const parts: string[] = [];

  while ((match = fenceRegex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before.trim()) {
      parts.push(`<p>${renderInlineWithRefs(before).replace(/\n/g, "<br>")}</p>`);
    }

    const language = match[1] || "";
    const code = match[2] || "";
    if (language.toLowerCase() === "mermaid" || language.toLowerCase() === "diagram") {
      parts.push(`<div class="diagram mermaid">${escapeHtml(code)}</div>`);
    } else {
      const className = language ? ` class="language-${escapeHtml(language)}"` : "";
      parts.push(`<pre><code${className}>${escapeHtml(code)}</code></pre>`);
    }
    lastIndex = fenceRegex.lastIndex;
  }

  const remaining = text.slice(lastIndex);
  if (remaining.trim()) {
    parts.push(`<p>${renderInlineWithRefs(remaining).replace(/\n/g, "<br>")}</p>`);
  }

  return parts.join("\n");
}

export function renderContent(items: ContentItem[] | undefined): string {
  if (!items || items.length === 0) return "";
  return items
    .map((item) => {
      switch (item.type) {
        case "heading": {
          const level = Math.min(6, Math.max(1, item.level));
          return `<h${level}>${renderInlineWithRefs(item.text)}</h${level}>`;
        }
        case "paragraph":
          return renderTextBlocks(item.text);
        case "definition-list":
          return `<dl>${item.items
            .map(
              (entry) =>
                `<dt>${renderInlineWithRefs(entry.term)}</dt><dd>${renderTextBlocks(
                  entry.definition
                )}</dd>`
            )
            .join("")}</dl>`;
        case "list":
          return `<ul>${item.items
            .map((entry) => `<li>${renderTextBlocks(entry)}</li>`)
            .join("")}</ul>`;
        case "admonition":
          return `<div class="admonition admonition-${escapeHtml(
            item.level
          )}"><p>${renderInlineWithRefs(item.text).replace(
            /\n/g,
            "<br>"
          )}</p></div>`;
        case "reference":
          return `<div class="reference"><p><strong>${renderInlineWithRefs(
            item.key
          )}</strong>${item.rating ? ` <em>${renderInlineWithRefs(item.rating)}</em>` : ""}</p><p>${renderInlineWithRefs(
            item.citation
          )}</p>${
            item.use ? `<p><em>${renderInlineWithRefs(item.use)}</em></p>` : ""
          }</div>`;
        case "code": {
          const lines = Array.isArray((item as { lines?: string[] }).lines)
            ? (item as { lines: string[] }).lines.join("\n")
            : "";
          const language = (item as { language?: string }).language
            ? ` class="language-${escapeHtml((item as { language: string }).language)}"`
            : "";
          return `<pre><code${language}>${escapeHtml(lines)}</code></pre>`;
        }
        case "definition": {
          const label = renderInlineWithRefs((item as { label?: string }).label ?? "");
          const body = (item as { text?: string }).text ? renderTextBlocks((item as { text: string }).text) : "";
          return `<div class="definition"><p><strong>${label}</strong></p>${body}</div>`;
        }
        case "rule": {
          const label = renderInlineWithRefs((item as { label?: string }).label ?? "");
          const formula = (item as { formula?: string }).formula ? escapeHtml((item as { formula: string }).formula) : "";
          return `<div class="rule"><p><strong>${label}</strong></p><pre><code>${formula}</code></pre></div>`;
        }
        case "theorem": {
          const label = renderInlineWithRefs((item as { label?: string }).label ?? "");
          const formula = (item as { formula?: string }).formula ? escapeHtml((item as { formula: string }).formula) : "";
          return `<div class="theorem"><p><strong>${label}</strong></p><pre><code>${formula}</code></pre></div>`;
        }
        case "guarantee": {
          const label = renderInlineWithRefs((item as { label?: string }).label ?? "");
          const description = (item as { description?: string }).description
            ? renderTextBlocks((item as { description: string }).description)
            : "";
          const formula = (item as { formula?: string }).formula ? escapeHtml((item as { formula: string }).formula) : "";
          return `<div class="guarantee"><p><strong>${label}</strong></p>${description}<pre><code>${formula}</code></pre></div>`;
        }
        case "operation": {
          const label = renderInlineWithRefs((item as { label?: string }).label ?? "");
          const signature = (item as { signature?: string }).signature
            ? escapeHtml((item as { signature: string }).signature)
            : "";
          const semantics = (item as { semantics?: string }).semantics
            ? renderTextBlocks((item as { semantics: string }).semantics)
            : "";
          return `<div class="operation"><p><strong>${label}</strong></p><pre><code>${signature}</code></pre>${semantics}</div>`;
        }
        case "profile": {
          const label = renderInlineWithRefs((item as { label?: string }).label ?? "");
          const layers = (item as { layers?: Record<string, unknown> }).layers || {};
          const layerBlocks = Object.entries(layers)
            .map(([key, values]) => {
              const itemsHtml = Array.isArray(values)
                ? values.map((val) => `<li>${renderInlineWithRefs(String(val))}</li>`).join("")
                : "";
              return `<div class="profile-layer"><p><strong>${renderInlineWithRefs(
                key
              )}</strong></p><ul>${itemsHtml}</ul></div>`;
            })
            .join("");
          return `<div class="profile"><p><strong>${label}</strong></p>${layerBlocks}</div>`;
        }
        case "checklist": {
          const label = renderInlineWithRefs((item as { label?: string }).label ?? "");
          const itemsHtml = ((item as { items?: string[] }).items || [])
            .map((entry) => `<li>${renderInlineWithRefs(String(entry))}</li>`)
            .join("");
          return `<div class="checklist"><p><strong>${label}</strong></p><ul>${itemsHtml}</ul></div>`;
        }
        case "table": {
          const columns = Array.isArray((item as { columns?: string[] }).columns)
            ? (item as { columns: string[] }).columns
            : [];
          const rows = Array.isArray((item as { rows?: string[][] }).rows)
            ? (item as { rows: string[][] }).rows
            : [];
          const head = columns
            .map((col) => `<th>${renderInlineWithRefs(String(col))}</th>`)
            .join("");
          const body = rows
            .map((row) => {
              const cells = Array.isArray(row) ? row : [];
              return `<tr>${cells
                .map((cell) => `<td>${renderInlineWithRefs(String(cell))}</td>`)
                .join("")}</tr>`;
            })
            .join("");
          return `<div class="table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
        }
        case "diagram": {
          const format = String((item as { format?: string }).format || "").toLowerCase();
          const content = (item as { content?: string }).content ? String((item as { content: string }).content) : "";
          const caption = (item as { caption?: string }).caption ? renderInlineWithRefs((item as { caption: string }).caption) : "";
          const diagramClass = format === "mermaid" ? "diagram mermaid" : "diagram";
          const block = `<div class="${diagramClass}">${escapeHtml(content)}</div>`;
          return `<figure>${block}${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
        }
        default:
          return "";
      }
    })
    .join("\n");
}

export function renderDefinitionEntries(defs: unknown[] | undefined): string {
  if (!defs || defs.length === 0) return "";

  const normalizeList = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.map((entry) => String(entry));
  };

  const renderList = (label: string, items: string[]): string => {
    if (!items.length) return "";
    const listItems = items.map((entry) => `<li>${renderInlineWithRefs(entry)}</li>`).join("");
    return `<div class="def-list"><p><strong>${escapeHtml(label)}</strong></p><ul>${listItems}</ul></div>`;
  };

  const blocks = defs
    .map((entry) => {
      if (!entry || typeof entry !== "object") return "";
      const record = entry as Record<string, unknown>;
      const kind = typeof record.kind === "string" ? record.kind : "definition";
      const number = typeof record.number === "string" ? record.number : "";
      const name =
        (typeof record.name === "string" && record.name) ||
        (typeof record.label === "string" && record.label) ||
        (typeof record.id === "string" && record.id) ||
        "";
      const title = [number, name].filter(Boolean).join(" ");
      const description =
        typeof record.description === "string" ? renderTextBlocks(record.description) : "";
      const syntax = typeof record.syntax === "string" ? record.syntax : "";
      const signature = typeof record.signature === "string" ? record.signature : "";
      const conclusion = typeof record.conclusion === "string" ? record.conclusion : "";
      const premises = normalizeList(record.premises);
      const values = normalizeList(record.values);
      const changeTypes = normalizeList(record.change_types);
      const compatibleChanges = normalizeList(record.compatible_changes);
      const breakingChanges = normalizeList(record.breaking_changes);
      const category = typeof record.category === "string" ? record.category : "";
      const proofSketch =
        typeof record.proof_sketch === "string" ? renderTextBlocks(record.proof_sketch) : "";

      const headerBits = [
        kind ? `<span class="def-kind">${renderInlineWithRefs(kind)}</span>` : "",
        category ? `<span class="def-category">${renderInlineWithRefs(category)}</span>` : "",
      ].filter(Boolean);

      return `<div class="def-block def-${escapeHtml(kind)}">
        <div class="def-header">${headerBits.join("")}</div>
        ${title ? `<h4>${renderInlineWithRefs(title)}</h4>` : ""}
        ${description}
        ${syntax ? `<pre><code>${escapeHtml(syntax)}</code></pre>` : ""}
        ${signature ? `<pre><code>${escapeHtml(signature)}</code></pre>` : ""}
        ${conclusion ? `<pre><code>${escapeHtml(conclusion)}</code></pre>` : ""}
        ${renderList("Premises", premises)}
        ${renderList("Values", values)}
        ${renderList("Change types", changeTypes)}
        ${renderList("Compatible changes", compatibleChanges)}
        ${renderList("Breaking changes", breakingChanges)}
        ${proofSketch ? `<div class="def-proof"><h5>Proof Sketch</h5>${proofSketch}</div>` : ""}
      </div>`;
    })
    .filter(Boolean)
    .join("\n");

  if (!blocks) return "";
  return `<div class="def-stack">${blocks}</div>`;
}

export function renderCover(index: IndexFile): string {
  const title = index.title ? renderInline(index.title) : "Untitled Document";
  const subtitle = index.subtitle ? renderInline(index.subtitle) : "";
  const description = index.description ? renderInline(index.description) : "";
  const abstractText = index.meta?.abstract ? renderTextBlocks(String(index.meta.abstract)) : "";
  const keywords = Array.isArray(index.meta?.keywords) ? index.meta?.keywords.join(", ") : "";
  const domains = Array.isArray(index.meta?.domains) ? index.meta?.domains.join(", ") : "";
  const authors = Array.isArray(index.meta?.authors) ? index.meta?.authors.join(", ") : "";

  const details = [
    { label: "Version", value: index.version },
    { label: "Namespace", value: index.namespace },
    { label: "Document Type", value: index.documentType },
    { label: "Structure", value: index.documentStruct },
    { label: "Created", value: index.meta?.createdAt },
    { label: "Updated", value: index.meta?.updatedAt },
    { label: "Generated", value: index.meta?.generatedAt },
    { label: "Authors", value: authors },
    { label: "Domains", value: domains },
    { label: "Keywords", value: keywords },
  ].filter((item) => item.value);

  const metaRows = details
    .map((item) => `<div class="cover-meta-row"><span>${escapeHtml(item.label)}</span><span>${renderInline(String(item.value))}</span></div>`)
    .join("");

  return `
      <section class="cover">
        <div class="cover-surface">
          <div class="cover-head">
            <p class="cover-eyebrow">${escapeHtml(index.id ?? "Document")}</p>
            <h1 class="cover-title">${title}</h1>
            ${subtitle ? `<p class="cover-subtitle">${subtitle}</p>` : ""}
            ${description ? `<p class="cover-description">${description}</p>` : ""}
            <div class="cover-links">
              <a class="cover-link" href="document-graph.html">View Document Graph</a>
            </div>
          </div>
          <div class="cover-body">
            ${metaRows ? `<div class="cover-meta">${metaRows}</div>` : ""}
            ${abstractText ? `<div class="cover-abstract"><h2>Abstract</h2>${abstractText}</div>` : ""}
          </div>
        </div>
      </section>
  `;
}

export function toRoman(value: number): string {
  const numerals: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let remaining = value;
  let result = "";
  for (const [num, numeral] of numerals) {
    while (remaining >= num) {
      result += numeral;
      remaining -= num;
    }
  }
  return result || String(value);
}

export function formatPartLabel(part: IndexPart): string {
  if (typeof part.number === "number") {
    const roman = toRoman(part.number);
    const title = part.title ?? part.id;
    return `PART ${roman}: ${title}`;
  }
  return part.title ?? part.id;
}

export function formatPartSectionRange(
  part: IndexPart,
  sectionMap: Map<string, IndexSection>
): string {
  const numbers = part.sections
    .map((id) => sectionMap.get(id)?.number)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);
  if (numbers.length === 0) return "";
  const first = numbers[0];
  const last = numbers[numbers.length - 1];
  return first === last ? `§${first}` : `§${first}–${last}`;
}

export function formatPartLabelWithRange(
  part: IndexPart,
  sectionMap: Map<string, IndexSection>
): string {
  const label = formatPartLabel(part);
  const range = formatPartSectionRange(part, sectionMap);
  return range ? `${label} (${range})` : label;
}

export function renderSection(node: SectionNode, number: string | undefined, level: number): string {
  const headingLevel = Math.min(6, Math.max(2, level));
  const label = number ? `${number} ${node.title ?? ""}`.trim() : node.title ?? "";
  const heading = label
    ? `<h${headingLevel} id="${escapeHtml(node.id)}">${renderInline(
        label
      )}<a class="anchor" href="#${escapeHtml(node.id)}">#</a></h${headingLevel}>`
    : "";
  const overview = node.overview ? `<p>${renderInlineWithRefs(node.overview)}</p>` : "";
  const defs = renderDefinitionEntries(node.defs);
  const content = renderContent(node.content);
  const children = (node.children || [])
    .map((child) => {
      const childNumber = number && child.suffix ? `${number}.${child.suffix}` : undefined;
      return renderSection(child, childNumber, headingLevel + 1);
    })
    .join("\n");

  return `<section>${heading}\n${overview}\n${defs}\n${content}\n${children}</section>`;
}

export function renderTOC(index: IndexFile): string {
  const sectionMap = new Map(index.sections.map((entry) => [entry.id, entry]));
  let items = "";

  if (index.parts && index.parts.length > 0) {
    const used = new Set<string>();
    const partItems = index.parts
      .map((part) => {
        const partLabel = formatPartLabelWithRange(part, sectionMap);
        const partSections = part.sections
          .map((sectionId) => {
            used.add(sectionId);
            const entry = sectionMap.get(sectionId);
            const label = entry ? `${entry.number ?? ""} ${entry.title ?? ""}`.trim() : sectionId;
            const href = entry ? `#${entry.contentRef.replace(/\.json$/, "")}` : `#${sectionId}`;
            return `<li><a href="${escapeHtml(href)}">${renderInline(label)}</a></li>`;
          })
          .join("");
        return `<li class="toc-part"><span>${renderInline(partLabel)}</span><ul>${partSections}</ul></li>`;
      })
      .join("");

    const remaining = index.sections.filter((entry) => !used.has(entry.id));
    if (remaining.length > 0) {
      const extra = remaining
        .map((entry) => {
          const label = `${entry.number ?? ""} ${entry.title ?? ""}`.trim();
          const href = `#${entry.contentRef.replace(/\.json$/, "")}`;
          return `<li><a href="${escapeHtml(href)}">${renderInline(label)}</a></li>`;
        })
        .join("");
      items = `${partItems}<li class="toc-part"><span>Other Sections</span><ul>${extra}</ul></li>`;
    } else {
      items = partItems;
    }
  } else {
    items = index.sections
      .map((entry) => {
        const label = `${entry.number ?? ""} ${entry.title ?? ""}`.trim();
        const href = `#${entry.contentRef.replace(/\.json$/, "")}`;
        return `<li><a href="${escapeHtml(href)}">${renderInline(label)}</a></li>`;
      })
      .join("");
  }

  return `<nav class="toc"><div class="toc-header"><h2>Contents</h2><button class="toc-toggle" type="button">Switch side</button></div><ul>${items}</ul></nav>`;
}

export function renderPartsContent(
  parts: IndexPart[],
  sectionMap: Map<string, { entry: IndexSection; section: SectionNode }>
): string {
  const used = new Set<string>();
  const partsHtml = parts
    .map((part) => {
      const label = formatPartLabelWithRange(part, new Map(Array.from(sectionMap.entries()).map(([id, value]) => [id, value.entry])));
      const partSections = part.sections
        .map((sectionId) => {
          used.add(sectionId);
          const entry = sectionMap.get(sectionId)?.entry;
          const section = sectionMap.get(sectionId)?.section;
          if (!entry || !section) {
            return "";
          }
          return renderSection(section, entry.number, 3);
        })
        .join("\n");
      const partHeading = `<h2 id="${escapeHtml(part.id)}">${renderInline(label)}<a class="anchor" href="#${escapeHtml(
        part.id
      )}">#</a></h2>`;
      return `<section class="part">${partHeading}\n${partSections}</section>`;
    })
    .join("\n");

  const remaining = Array.from(sectionMap.keys()).filter((id) => !used.has(id));
  if (remaining.length === 0) {
    return partsHtml;
  }

  const extraSections = remaining
    .map((id) => {
      const entry = sectionMap.get(id)?.entry;
      const section = sectionMap.get(id)?.section;
      if (!entry || !section) return "";
      return renderSection(section, entry.number, 2);
    })
    .join("\n");
  return `${partsHtml}\n<section class="part"><h2>Other Sections</h2>\n${extraSections}</section>`;
}

export function countContentTypes(content: { type?: string }[] | undefined): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of content || []) {
    const type = item?.type || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

export function mergeCounts(target: Record<string, number>, source: Record<string, number>): void {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] || 0) + value;
  }
}

export function walkChildren(node: SectionNode): { subCount: number; contentItems: number; contentTypes: Record<string, number> } {
  let subCount = 0;
  let contentItems = 0;
  const contentTypes: Record<string, number> = {};

  const children = node.children || [];
  for (const child of children) {
    subCount += 1;
    const childContentCount = child.content ? child.content.length : 0;
    contentItems += childContentCount;
    mergeCounts(contentTypes, countContentTypes(child.content));

    const nested = walkChildren(child);
    subCount += nested.subCount;
    contentItems += nested.contentItems;
    mergeCounts(contentTypes, nested.contentTypes);
  }

  return { subCount, contentItems, contentTypes };
}

export function buildDocumentStats(index: IndexFile, sections: { entry: IndexSection; section: SectionNode }[]) {
  const sectionMap = new Map(index.sections.map((entry) => [entry.id, entry]));
  const sectionStats = [];
  const totalContentTypes: Record<string, number> = {};
  let totalSubCount = 0;
  let totalContentItems = 0;

  for (const { entry, section } of sections) {
    const directSubCount = section.children ? section.children.length : 0;
    const ownContentItems = section.content ? section.content.length : 0;
    const ownContentTypes = countContentTypes(section.content);

    const nested = walkChildren(section);

    const combinedTypes: Record<string, number> = {};
    mergeCounts(combinedTypes, ownContentTypes);
    mergeCounts(combinedTypes, nested.contentTypes);

    const contentItems = ownContentItems + nested.contentItems;
    totalContentItems += contentItems;
    totalSubCount += nested.subCount;
    mergeCounts(totalContentTypes, combinedTypes);

    sectionStats.push({
      id: section.id,
      number: entry.number,
      title: entry.title,
      directSubCount,
      subCount: nested.subCount,
      contentItems,
      contentTypes: combinedTypes,
    });
  }

  return {
    meta: {
      id: index.id,
      title: index.title,
      version: index.version,
      description: index.description,
      namespace: index.namespace,
    },
    sectionsById: sectionStats.reduce((acc, entry) => {
      acc[entry.id] = {
        id: entry.id,
        number: entry.number,
        title: entry.title,
      };
      return acc;
    }, {} as Record<string, { id: string; number?: number; title?: string }>),
    parts:
      index.parts && index.parts.length > 0
        ? index.parts.map((part) => {
            const label = formatPartLabel(part);
            const labelWithRange = formatPartLabelWithRange(part, sectionMap);
            const sectionRange = formatPartSectionRange(part, sectionMap);
            return {
              id: part.id,
              number: part.number,
              title: part.title,
              label,
              labelWithRange,
              sectionRange,
              summary: part.summary,
              sections: part.sections,
            };
          })
        : undefined,
    partsSummaryText:
      index.parts && index.parts.length > 0
        ? index.parts
            .map((part) => {
              const labelWithRange = formatPartLabelWithRange(part, sectionMap);
              const summary = part.summary ? `: ${part.summary}` : "";
              return `**${labelWithRange}**${summary}`;
            })
            .join("\n\n")
        : undefined,
    totals: {
      sections: index.sections.length,
      subSections: totalSubCount,
      contentItems: totalContentItems,
    },
    contentTypes: totalContentTypes,
    sections: sectionStats,
  };
}

async function main(): Promise<void> {
  const indexRaw = await readFile(INDEX_PATH, "utf-8");
  const index = JSON.parse(indexRaw) as IndexFile;

  const docTitle = index.title ?? "STRATUM";
  const sections = await Promise.all(
    index.sections.map(async (entry) => {
      const sectionPath = path.join(SECTIONS_DIR, entry.contentRef);
      const sectionRaw = await readFile(sectionPath, "utf-8");
      const section = JSON.parse(sectionRaw) as SectionNode;
      return { entry, section };
    })
  );

  REFERENCE_MAP = new Map();
  TEMPLATE_CONTEXT = { documentStats: buildDocumentStats(index, sections) };
  for (const { entry, section } of sections) {
    REFERENCE_MAP.set(section.id, {
      sectionNumber: entry.number ?? "",
      sectionName: entry.title ?? "",
      suffix: "",
      suffixName: "",
    });
    const walk = (node: SectionNode): void => {
      if (node && node.suffix) {
        REFERENCE_MAP.set(node.id, {
          sectionNumber: entry.number ?? "",
          sectionName: entry.title ?? "",
          suffix: node.suffix ?? "",
          suffixName: node.title ?? "",
        });
      }
      const children = node.children || [];
      for (const child of children) {
        walk(child);
      }
    };
    walk(section);
  }

  const sectionMap = new Map(
    sections.map(({ entry, section }) => [entry.id, { entry, section }])
  );
  const sectionsHtml =
    index.parts && index.parts.length > 0
      ? renderPartsContent(index.parts, sectionMap)
      : sections
          .map(({ entry, section }) => {
            return renderSection(section, entry.number, 2);
          })
          .join("\n");

  const coverHtml = renderCover(index);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(docTitle)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        line-height: 1.5;
        color: #1c1c1c;
        background: #f7f5f2;
      }
      body {
        margin: 0;
        padding: 48px 24px 80px;
      }
      main {
        max-width: 920px;
        margin: 0 auto;
        background: #ffffff;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.08);
      }
      .cover {
        margin: 0 0 3rem;
        padding: 24px;
        border-radius: 18px;
        background: linear-gradient(135deg, #fef7e8 0%, #e8f0ff 55%, #f4ecff 100%);
      }
      .cover-surface {
        background: rgba(255, 255, 255, 0.88);
        border-radius: 14px;
        padding: 32px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
      }
      .cover-eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.75rem;
        color: #6a6258;
        margin: 0 0 0.6rem;
      }
      .cover-title {
        font-size: 2.8rem;
        margin: 0 0 0.5rem;
      }
      .cover-subtitle {
        font-size: 1.2rem;
        color: #4a453f;
        margin: 0 0 0.8rem;
      }
      .cover-description {
        font-size: 1rem;
        margin: 0 0 1.4rem;
        max-width: 60ch;
      }
      .cover-links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin-top: 0.8rem;
      }
      .cover-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        text-decoration: none;
        color: #2c2a27;
        font-weight: 600;
        border: 1px solid #d1ccc4;
        border-radius: 999px;
        padding: 0.4rem 0.9rem;
        background: #ffffff;
      }
      .cover-link:hover {
        background: #f1ede6;
      }
      .cover-body {
        display: grid;
        grid-template-columns: minmax(220px, 1fr) 2fr;
        gap: 2rem;
      }
      .cover-meta {
        display: grid;
        gap: 0.6rem;
        font-size: 0.95rem;
      }
      .cover-meta-row {
        display: grid;
        grid-template-columns: 110px 1fr;
        gap: 0.6rem;
        color: #3c3731;
      }
      .cover-meta-row span:first-child {
        font-weight: 600;
        color: #3f3a34;
      }
      .cover-abstract h2 {
        margin-top: 0;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: "IBM Plex Serif", "Georgia", serif;
        margin: 1.6em 0 0.4em;
        color: #2c2a27;
      }
      h1 { font-size: 2.4rem; }
      h2 { font-size: 1.9rem; }
      h3 { font-size: 1.5rem; }
      h4 { font-size: 1.2rem; }
      p { margin: 0.6em 0; }
      section { margin-bottom: 2rem; }
      dl { margin: 1rem 0; }
      dt { font-weight: 600; margin-top: 0.6rem; }
      dd { margin-left: 1rem; margin-bottom: 0.4rem; }
      code {
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        background: #f2efea;
        padding: 0 0.2em;
        border-radius: 4px;
      }
      pre {
        background: #f2efea;
        padding: 0.9rem 1rem;
        border-radius: 8px;
        overflow-x: auto;
      }
      pre code {
        background: transparent;
        padding: 0;
        display: block;
        white-space: pre;
      }
      .diagram {
        background: #eef4ff;
        border-left: 4px solid #3f6fd3;
        padding: 0.9rem 1rem;
        border-radius: 8px;
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        white-space: pre;
      }
      ul { padding-left: 1.4rem; }
      .admonition {
        border-left: 4px solid #d67f00;
        background: #fff7eb;
        padding: 0.8rem 1rem;
        margin: 1rem 0;
      }
      .admonition-note { border-left-color: #3f6fd3; background: #eef4ff; }
      .admonition-important { border-left-color: #b92d2d; background: #ffecec; }
      .reference {
        border: 1px solid #e1ddd6;
        background: #fbfaf8;
        padding: 0.8rem 1rem;
        margin: 0.8rem 0;
      }
      .definition,
      .rule,
      .theorem,
      .guarantee,
      .operation,
      .profile,
      .checklist,
      .table {
        border: 1px solid #e1ddd6;
        background: #fbfaf8;
        padding: 0.8rem 1rem;
        margin: 0.8rem 0;
        border-radius: 10px;
      }
      .profile-layer + .profile-layer {
        margin-top: 0.8rem;
      }
      figure {
        margin: 1rem 0;
      }
      figcaption {
        margin-top: 0.6rem;
        font-size: 0.95rem;
        color: #5b564f;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
      }
      th,
      td {
        border: 1px solid #e1ddd6;
        padding: 0.4rem 0.6rem;
        text-align: left;
      }
      th {
        background: #f1ede6;
      }
      .toc {
        background: #fbfaf8;
        border: 1px solid #e1ddd6;
        padding: 1rem 1.2rem;
        border-radius: 12px;
        margin: 1.5rem 0 2rem;
        max-width: 360px;
      }
      .toc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .toc-toggle {
        border: 1px solid #d1ccc4;
        background: #fff;
        color: #2c2a27;
        border-radius: 999px;
        padding: 0.3rem 0.8rem;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .toc h2 {
        margin-top: 0;
      }
      .toc ul {
        list-style: none;
        padding-left: 0;
        margin: 0;
        columns: 2;
        column-gap: 2rem;
      }
      .toc ul ul {
        columns: 1;
        padding-left: 1rem;
        margin-top: 0.4rem;
      }
      .toc li {
        break-inside: avoid;
        margin: 0.4rem 0;
      }
      .toc-part > span {
        display: block;
        font-weight: 600;
        margin-top: 0.6rem;
      }
      .def-stack {
        display: grid;
        gap: 1rem;
        margin: 1.4rem 0;
      }
      .def-block {
        border: 1px solid #e1ddd6;
        background: #fbfaf8;
        padding: 1rem 1.2rem;
        border-radius: 12px;
      }
      .def-header {
        display: flex;
        gap: 0.6rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem;
        color: #6a6258;
        margin-bottom: 0.4rem;
      }
      .def-block h4 {
        margin: 0.4rem 0 0.6rem;
      }
      .def-list ul {
        margin: 0.4rem 0 0.8rem;
      }
      .def-proof h5 {
        margin: 1rem 0 0.4rem;
      }
      .toc a {
        color: #2c2a27;
        text-decoration: none;
      }
      .toc a:hover {
        text-decoration: underline;
      }
      .ref-link {
        color: #2c2a27;
        text-decoration: underline dotted;
      }
      .toc ul {
        max-height: none;
        overflow: visible;
      }
      body.toc-floating main {
        padding-right: 360px;
      }
      body.toc-floating .toc {
        position: fixed;
        top: 24px;
        width: 320px;
        max-height: calc(100vh - 48px);
        overflow: auto;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
      }
      body.toc-right.toc-floating .toc {
        right: 24px;
        left: auto;
      }
      body.toc-left.toc-floating .toc {
        left: 24px;
        right: auto;
      }
      body.toc-left.toc-floating main {
        padding-left: 360px;
        padding-right: 32px;
      }
      body.toc-floating {
        padding-left: 0;
      }
      h2 .anchor,
      h3 .anchor,
      h4 .anchor,
      h5 .anchor,
      h6 .anchor {
        margin-left: 0.4rem;
        font-size: 0.8em;
        color: #9c9488;
        text-decoration: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      h2:hover .anchor,
      h3:hover .anchor,
      h4:hover .anchor,
      h5:hover .anchor,
      h6:hover .anchor {
        opacity: 1;
      }
      @media (max-width: 900px) {
        .cover-body {
          grid-template-columns: 1fr;
        }
        .cover-title {
          font-size: 2.2rem;
        }
      }
      @media print {
        .cover {
          page-break-after: always;
        }
      }
    </style>
  </head>
  <body>
    <main>
      ${coverHtml}
      ${renderTOC(index)}
      ${sectionsHtml}
    </main>
    <script>
      (function () {
        var threshold = 360;
        var positionKey = "toc-position";
        var toc = document.querySelector(".toc");
        var toggle = toc ? toc.querySelector(".toc-toggle") : null;

        function applyPosition(position) {
          document.body.classList.remove("toc-left", "toc-right");
          document.body.classList.add(position);
        }

        var savedPosition = localStorage.getItem(positionKey) || "toc-right";
        applyPosition(savedPosition);

        if (toggle) {
          toggle.addEventListener("click", function () {
            var next = document.body.classList.contains("toc-right") ? "toc-left" : "toc-right";
            applyPosition(next);
            localStorage.setItem(positionKey, next);
          });
        }

        function toggleToc() {
          if (window.scrollY > threshold) {
            document.body.classList.add("toc-floating");
          } else {
            document.body.classList.remove("toc-floating");
          }
        }
        window.addEventListener("scroll", toggleToc, { passive: true });
        toggleToc();
      })();
      if (window.mermaid && window.mermaid.initialize) {
        window.mermaid.initialize({ startOnLoad: true });
      }
    </script>
  </body>
</html>`;

  await writeFile(OUTPUT_PATH, html, "utf-8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
