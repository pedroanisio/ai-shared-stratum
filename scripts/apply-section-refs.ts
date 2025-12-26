#!/usr/bin/env node
import { readFile, readdir, writeFile } from "fs/promises";
import path from "path";

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const MAPPING_PATH = path.join(SECTIONS_DIR, "mapping.json");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");

type IndexEntry = {
  id: string;
  number?: number;
  title?: string;
  contentRef: string;
};

type MappingEntry =
  | string
  | {
      title?: {
        title?: string;
      };
      suffix?: string | null;
    };

const SECTION_REF_REGEX = /§\s*\d+(?:\.\d+)?(?:\s*[–-]\s*\d+(?:\.\d+)?)?/g;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildNumberMap(entries: IndexEntry[]): Map<number, IndexEntry> {
  const map = new Map<number, IndexEntry>();
  for (const entry of entries) {
    if (typeof entry.number === "number") {
      map.set(entry.number, entry);
    }
  }
  return map;
}

function mappingTitleForId(mapping: Record<string, MappingEntry>, id: string): string | null {
  const entry = mapping[id];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  return entry.title?.title ?? null;
}

function listChildSuffixes(sectionData: unknown): string[] {
  if (!sectionData || typeof sectionData !== "object") {
    return [];
  }
  const children = (sectionData as { children?: { suffix?: string }[] }).children || [];
  return children
    .map((child) => child.suffix)
    .filter((suffix): suffix is string => typeof suffix === "string");
}

function findChildIdBySuffix(sectionData: unknown, suffix: string): string | null {
  if (!sectionData || typeof sectionData !== "object") {
    return null;
  }
  const children = (sectionData as { children?: { id?: string; suffix?: string }[] }).children || [];
  const match = children.find((child) => child.suffix === suffix);
  return match?.id ?? null;
}

function createSectionLoader() {
  const cache = new Map<string, unknown | null>();
  return async (sectionId: string): Promise<unknown | null> => {
    if (cache.has(sectionId)) {
      return cache.get(sectionId) ?? null;
    }
    const filePath = path.join(SECTIONS_DIR, `${sectionId}.json`);
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      cache.set(sectionId, parsed);
      return parsed;
    } catch {
      cache.set(sectionId, null);
      return null;
    }
  };
}

async function suggestReplacement(
  ref: string,
  numberMap: Map<number, IndexEntry>,
  mapping: Record<string, MappingEntry>,
  loadSection: (sectionId: string) => Promise<unknown | null>
): Promise<string | null> {
  const trimmed = ref.replace(/\s+/g, " ").trim();
  const match = trimmed.match(/^§\s*(\d+)(?:\.(\d+))?(?:\s*[–-]\s*(\d+)(?:\.(\d+))?)?$/);
  if (!match) {
    return null;
  }
  const startNumber = Number(match[1]);
  const startSuffix = match[2];
  const endNumber = match[3] ? Number(match[3]) : undefined;
  const endSuffix = match[4];

  if (!endNumber) {
    const entry = numberMap.get(startNumber);
    if (!entry) {
      return null;
    }
    if (!startSuffix) {
      return `referenceMap("${entry.id}", "§{{sectionNumber}}")`;
    }
    const sectionData = await loadSection(entry.id);
    if (!sectionData) {
      return null;
    }
    const childId = findChildIdBySuffix(sectionData, startSuffix);
    if (!childId) {
      return null;
    }
    const childTitle = mappingTitleForId(mapping, childId);
    const titleSuffix = childTitle ? ` ${childTitle}` : "";
    return `referenceMap("${childId}", "§{{sectionNumber}}.${startSuffix}${titleSuffix}")`;
  }

  if (startSuffix || endSuffix) {
    if (!startSuffix || !endSuffix) {
      return null;
    }
    if (startNumber !== endNumber) {
      return null;
    }
    const entry = numberMap.get(startNumber);
    if (!entry) {
      return null;
    }
    const sectionData = await loadSection(entry.id);
    if (!sectionData) {
      return null;
    }
    const suffixes = listChildSuffixes(sectionData)
      .map((suffix) => ({ suffix, number: Number(suffix) }))
      .filter((item) => Number.isFinite(item.number))
      .sort((a, b) => a.number - b.number);
    if (suffixes.length === 0) {
      return null;
    }
    const start = Number(startSuffix);
    const end = Number(endSuffix);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      return null;
    }
    const range = suffixes.filter((item) => item.number >= start && item.number <= end);
    if (range.length === 0) {
      return null;
    }
    const pieces: string[] = [];
    for (const item of range) {
      const childId = findChildIdBySuffix(sectionData, String(item.number));
      if (!childId) {
        return null;
      }
      const childTitle = mappingTitleForId(mapping, childId);
      const titleSuffix = childTitle ? ` ${childTitle}` : "";
      pieces.push(`referenceMap("${childId}", "§{{sectionNumber}}.${item.number}${titleSuffix}")`);
    }
    return pieces.join(" – ");
  }

  if (endNumber < startNumber) {
    return null;
  }

  const entries: IndexEntry[] = [];
  for (let num = startNumber; num <= endNumber; num += 1) {
    const entry = numberMap.get(num);
    if (!entry) {
      return null;
    }
    entries.push(entry);
  }

  if (entries.length === 1) {
    return `referenceMap("${entries[0].id}", "§{{sectionNumber}}")`;
  }

  const pieces = entries.map((entry) => `referenceMap("${entry.id}", "§{{sectionNumber}}")`);
  return pieces.join(" – ");
}

async function replaceRefsInString(
  value: string,
  numberMap: Map<number, IndexEntry>,
  mapping: Record<string, MappingEntry>,
  loadSection: (sectionId: string) => Promise<unknown | null>
): Promise<{ value: string; changed: boolean }> {
  let result = "";
  let lastIndex = 0;
  let changed = false;
  SECTION_REF_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = SECTION_REF_REGEX.exec(value)) !== null) {
    const ref = match[0];
    result += value.slice(lastIndex, match.index);
    const replacement = await suggestReplacement(ref, numberMap, mapping, loadSection);
    if (replacement) {
      result += replacement;
      changed = true;
    } else {
      result += ref;
    }
    lastIndex = SECTION_REF_REGEX.lastIndex;
  }
  result += value.slice(lastIndex);
  return { value: result, changed };
}

async function replaceRefsInValue(
  value: unknown,
  numberMap: Map<number, IndexEntry>,
  mapping: Record<string, MappingEntry>,
  loadSection: (sectionId: string) => Promise<unknown | null>
): Promise<{ value: unknown; changed: boolean }> {
  if (typeof value === "string") {
    return replaceRefsInString(value, numberMap, mapping, loadSection);
  }

  if (Array.isArray(value)) {
    let changed = false;
    const updated: unknown[] = [];
    for (const item of value) {
      const next = await replaceRefsInValue(item, numberMap, mapping, loadSection);
      updated.push(next.value);
      if (next.changed) {
        changed = true;
      }
    }
    return { value: updated, changed };
  }

  if (isObject(value)) {
    let changed = false;
    const updated: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      const next = await replaceRefsInValue(child, numberMap, mapping, loadSection);
      updated[key] = next.value;
      if (next.changed) {
        changed = true;
      }
    }
    return { value: updated, changed };
  }

  return { value, changed: false };
}

async function main(): Promise<void> {
  const files = (await readdir(SECTIONS_DIR)).filter((name) => name.endsWith(".json"));
  const indexRaw = await readFile(INDEX_PATH, "utf8");
  const index = JSON.parse(indexRaw) as { sections: IndexEntry[] };
  const numberMap = buildNumberMap(index.sections || []);
  const mappingRaw = await readFile(MAPPING_PATH, "utf8");
  const mapping = JSON.parse(mappingRaw) as Record<string, MappingEntry>;
  const loadSection = createSectionLoader();

  let changedFiles = 0;
  let changedRefs = 0;

  for (const name of files) {
    if (name === "index.json" || name === "mapping.json") {
      continue;
    }
    const filePath = path.join(SECTIONS_DIR, name);
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw) as unknown;
    const replaced = await replaceRefsInValue(data, numberMap, mapping, loadSection);
    if (replaced.changed) {
      changedFiles += 1;
      const countMatches = raw.match(SECTION_REF_REGEX);
      if (countMatches) {
        for (const ref of countMatches) {
          const suggestion = await suggestReplacement(ref, numberMap, mapping, loadSection);
          if (suggestion) {
            changedRefs += 1;
          }
        }
      }
      await writeFile(filePath, JSON.stringify(replaced.value, null, 2) + "\n", "utf8");
    }
  }

  console.log(`Updated ${changedFiles} file(s). Replaced ${changedRefs} reference(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
