#!/usr/bin/env node
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");

const LABEL_REGEX = /^Definition\s+(\d+)\.(\d+)\s*\((.+)\)$/;

type IndexEntry = {
  id: string;
  contentRef: string;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildContentRefMap(entries: IndexEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of entries) {
    map.set(entry.contentRef, entry.id);
  }
  return map;
}

function updateLabel(label: string, rootId: string): string | null {
  const match = label.match(LABEL_REGEX);
  if (!match) return null;
  const suffix = match[2];
  const title = match[3].trim();
  return `Definition referenceMap("${rootId}", "§{{sectionNumber}}").${suffix} (${title})`;
}

function updateInValue(value: unknown, rootId: string): { value: unknown; changed: boolean } {
  if (Array.isArray(value)) {
    let changed = false;
    const updated = value.map((item) => {
      const next = updateInValue(item, rootId);
      if (next.changed) changed = true;
      return next.value;
    });
    return { value: updated, changed };
  }

  if (isObject(value)) {
    let changed = false;
    const updated: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      if (key === "label" && typeof child === "string") {
        const nextLabel = updateLabel(child, rootId);
        if (nextLabel) {
          updated[key] = nextLabel;
          changed = true;
          continue;
        }
      }
      const next = updateInValue(child, rootId);
      updated[key] = next.value;
      if (next.changed) changed = true;
    }
    return { value: updated, changed };
  }

  return { value, changed: false };
}

async function main(): Promise<void> {
  const indexRaw = await readFile(INDEX_PATH, "utf8");
  const index = JSON.parse(indexRaw) as { sections: IndexEntry[] };
  const refMap = buildContentRefMap(index.sections || []);

  const files = (await readdir(SECTIONS_DIR)).filter((name) => name.endsWith(".json"));
  let changedFiles = 0;
  let changedLabels = 0;

  for (const name of files) {
    if (name === "index.json" || name === "mapping.json") continue;
    const rootId = refMap.get(name);
    if (!rootId) continue;

    const filePath = path.join(SECTIONS_DIR, name);
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw) as unknown;

    const updated = updateInValue(data, rootId);
    if (updated.changed) {
      changedFiles += 1;
      const matches = raw.match(LABEL_REGEX);
      if (matches) {
        changedLabels += 1;
      }
      await writeFile(filePath, JSON.stringify(updated.value, null, 2) + "\n", "utf8");
    }
  }

  console.log(`Updated ${changedFiles} file(s).`);
  console.log(`Updated definition labels in ${changedLabels} file(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
