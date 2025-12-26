const { readFile, writeFile } = require("fs/promises");
const path = require("path");

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");
const OUTPUT_PATH = path.join(ROOT, "docs", "document-stats.json");

function countContentTypes(content) {
  const counts = {};
  for (const item of content || []) {
    const type = (item && item.type) || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  }
  return counts;
}

function mergeCounts(target, source) {
  for (const [key, value] of Object.entries(source)) {
    target[key] = (target[key] || 0) + value;
  }
}

function walkChildren(node) {
  let subCount = 0;
  let contentItems = 0;
  const contentTypes = {};

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

async function buildDocumentStats() {
  const indexRaw = await readFile(INDEX_PATH, "utf-8");
  const index = JSON.parse(indexRaw);

  const sectionStats = [];
  const totalContentTypes = {};
  let totalSubCount = 0;
  let totalContentItems = 0;

  for (const entry of index.sections || []) {
    const sectionPath = path.join(SECTIONS_DIR, entry.contentRef);
    const sectionRaw = await readFile(sectionPath, "utf-8");
    const section = JSON.parse(sectionRaw);

    const directSubCount = section.children ? section.children.length : 0;
    const ownContentItems = section.content ? section.content.length : 0;
    const ownContentTypes = countContentTypes(section.content);

    const nested = walkChildren(section);

    const combinedTypes = {};
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
    totals: {
      sections: index.sections.length,
      subSections: totalSubCount,
      contentItems: totalContentItems,
    },
    contentTypes: totalContentTypes,
    sections: sectionStats,
  };
}

async function main() {
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

module.exports = { buildDocumentStats };
