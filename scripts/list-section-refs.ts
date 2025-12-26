#!/usr/bin/env node
import { readFile, readdir } from "fs/promises";
import path from "path";

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const MAPPING_PATH = path.join(SECTIONS_DIR, "mapping.json");

type RefMatch = {
  file: string;
  jsonPath: string;
  value: string;
  matches: string[];
};

const SECTION_REF_REGEX = /§\s*\d+(?:\.\d+)?(?:\s*[–-]\s*\d+(?:\.\d+)?)?/g;

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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectRefs(value: unknown, file: string, jsonPath: string, results: RefMatch[]): void {
  if (typeof value === "string") {
    const matches = value.match(SECTION_REF_REGEX);
    if (matches && matches.length > 0) {
      results.push({ file, jsonPath, value, matches });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectRefs(item, file, `${jsonPath}[${index}]`, results);
    });
    return;
  }

  if (isObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      const nextPath = jsonPath ? `${jsonPath}.${key}` : key;
      collectRefs(child, file, nextPath, results);
    }
  }
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

async function loadSection(sectionId: string): Promise<unknown | null> {
  const filePath = path.join(SECTIONS_DIR, `${sectionId}.json`);
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function findChildIdBySuffix(sectionData: unknown, suffix: string): string | null {
  if (!sectionData || typeof sectionData !== "object") {
    return null;
  }
  const children = (sectionData as { children?: { id?: string; suffix?: string }[] }).children || [];
  const match = children.find((child) => child.suffix === suffix);
  return match?.id ?? null;
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

function mappingTitleForId(mapping: Record<string, MappingEntry>, id: string): string | null {
  const entry = mapping[id];
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  return entry.title?.title ?? null;
}

async function suggestReplacement(
  ref: string,
  numberMap: Map<number, IndexEntry>,
  mapping: Record<string, MappingEntry>
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
      pieces.push(`referenceMap(\"${childId}\", \"§{{sectionNumber}}.${item.number}${titleSuffix}\")`);
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

async function main(): Promise<void> {
  const files = (await readdir(SECTIONS_DIR)).filter((name) => name.endsWith(".json"));
  const indexRaw = await readFile(path.join(SECTIONS_DIR, "index.json"), "utf8");
  const index = JSON.parse(indexRaw) as { sections: IndexEntry[] };
  const numberMap = buildNumberMap(index.sections || []);
  const mappingRaw = await readFile(MAPPING_PATH, "utf8");
  const mapping = JSON.parse(mappingRaw) as Record<string, MappingEntry>;
  const results: RefMatch[] = [];

  for (const name of files) {
    if (name === "index.json" || name === "mapping.json") {
      continue;
    }
    const filePath = path.join(SECTIONS_DIR, name);
    const raw = await readFile(filePath, "utf8");
    const data = JSON.parse(raw) as unknown;
    collectRefs(data, name, "", results);
  }

  if (results.length === 0) {
    console.log("No section references found.");
    return;
  }

  results.sort((a, b) => a.file.localeCompare(b.file) || a.jsonPath.localeCompare(b.jsonPath));

  for (const entry of results) {
    console.log(`${entry.file} :: ${entry.jsonPath}`);
    console.log(`  refs: ${entry.matches.join(", ")}`);
    const suggestionList: string[] = [];
    for (const ref of entry.matches) {
      const suggestion = await suggestReplacement(ref, numberMap, mapping);
      if (suggestion) {
        suggestionList.push(`${ref} -> ${suggestion}`);
      }
    }
    const suggestions = suggestionList;
    if (suggestions.length > 0) {
      console.log(`  suggest: ${suggestions.join(" | ")}`);
    } else {
      console.log("  suggest: (no safe auto-mapping)");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
