const { readFile } = require("fs/promises");
const path = require("path");

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");

function findSub(node, subId) {
  if (!node) return null;
  if (node.id === subId) return node;
  const children = node.children || [];
  for (const child of children) {
    const hit = findSub(child, subId);
    if (hit) return hit;
  }
  return null;
}

async function lookupSubId(subId) {
  const indexRaw = await readFile(INDEX_PATH, "utf-8");
  const index = JSON.parse(indexRaw);

  for (const entry of index.sections || []) {
    const sectionPath = path.join(SECTIONS_DIR, entry.$ref);
    const sectionRaw = await readFile(sectionPath, "utf-8");
    const section = JSON.parse(sectionRaw);

    const hit = findSub(section, subId);
    if (hit) {
      return {
        sectionNumber: entry.number || null,
        sectionName: entry.title || null,
        subSuffix: hit.suffix || null,
        suffixName: hit.title || null,
      };
    }
  }

  return null;
}

module.exports = { lookupSubId };
