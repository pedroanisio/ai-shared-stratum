import { readFile } from "fs/promises";
import path from "path";

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");

type IndexEntry = {
  number?: string;
  title?: string;
  $ref: string;
};

type SectionNode = {
  id: string;
  title?: string;
  suffix?: string;
  children?: SectionNode[];
};

function findSub(node: SectionNode, subId: string): SectionNode | null {
  if (node.id === subId) return node;
  const children = node.children || [];
  for (const child of children) {
    const hit = findSub(child, subId);
    if (hit) return hit;
  }
  return null;
}

export async function lookupSubId(subId: string): Promise<{
  sectionNumber: string | null;
  sectionName: string | null;
  subSuffix: string | null;
  suffixName: string | null;
} | null> {
  const indexRaw = await readFile(INDEX_PATH, "utf-8");
  const index = JSON.parse(indexRaw) as { sections: IndexEntry[] };

  for (const entry of index.sections || []) {
    const sectionPath = path.join(SECTIONS_DIR, entry.$ref);
    const sectionRaw = await readFile(sectionPath, "utf-8");
    const section = JSON.parse(sectionRaw) as SectionNode;

    const hit = findSub(section, subId);
    if (hit) {
      return {
        sectionNumber: entry.number ?? null,
        sectionName: entry.title ?? null,
        subSuffix: hit.suffix ?? null,
        suffixName: hit.title ?? null,
      };
    }
  }

  return null;
}
