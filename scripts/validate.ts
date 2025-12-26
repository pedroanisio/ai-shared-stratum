#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

const args = process.argv.slice(2);
const usage = "Usage: pnpm validate:schema <schema.json> <data.json> [--strict]";

if (args.length < 2 || args.includes("-h") || args.includes("--help")) {
  console.log(usage);
  process.exit(args.includes("-h") || args.includes("--help") ? 0 : 1);
}

const [schemaPathRaw, dataPathRaw, ...rest] = args;
const strict = rest.includes("--strict");

const schemaPath = path.resolve(schemaPathRaw);
const dataPath = path.resolve(dataPathRaw);

function readJson(filePath: string): unknown {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to read JSON: ${filePath}`);
    console.error(message);
    process.exit(1);
  }
}

function decodePointer(pointer: string): string[] {
  if (!pointer || pointer === "") {
    return [];
  }
  return pointer
    .replace(/^\//, "")
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
}

function getValueAtPointer(data: unknown, pointer: string): unknown {
  const parts = decodePointer(pointer);
  let current: unknown = data;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = Number(part);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }
    if (typeof current === "object") {
      const record = current as Record<string, unknown>;
      current = record[part];
      continue;
    }
    return undefined;
  }
  return current;
}

function formatValue(value: unknown): string {
  if (value === undefined) {
    return "<undefined>";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    const trimmed = value.length > 120 ? `${value.slice(0, 117)}...` : value;
    return JSON.stringify(trimmed);
  }
  try {
    const serialized = JSON.stringify(value);
    if (!serialized) {
      return String(value);
    }
    return serialized.length > 140 ? `${serialized.slice(0, 137)}...` : serialized;
  } catch {
    return String(value);
  }
}

const schema = readJson(schemaPath);
const data = readJson(dataPath);

const ajv = new Ajv2020({
  allErrors: true,
  strict,
  allowUnionTypes: true
});
addFormats(ajv);

const validate = ajv.compile(schema);
const valid = validate(data);

if (valid) {
  console.log("Validation passed.");
  console.log(`Schema: ${schemaPath}`);
  console.log(`Data: ${dataPath}`);
  process.exit(0);
}

const errors = validate.errors ?? [];
console.log(`Validation failed: ${errors.length} error(s).`);
console.log(`Schema: ${schemaPath}`);
console.log(`Data: ${dataPath}`);

errors.forEach((error, index) => {
  const basePath = error.instancePath || "";
  let displayPath = basePath || "/";

  if (error.keyword === "required" && typeof error.params === "object") {
    const missing = (error.params as { missingProperty?: string }).missingProperty;
    if (missing) {
      displayPath = `${basePath}/${missing}`.replace("//", "/");
    }
  }

  if (error.keyword === "additionalProperties" && typeof error.params === "object") {
    const extra = (error.params as { additionalProperty?: string }).additionalProperty;
    if (extra) {
      displayPath = `${basePath}/${extra}`.replace("//", "/");
    }
  }

  const value = getValueAtPointer(data, basePath);
  const message = error.message ?? "Validation error";
  const schemaPathText = error.schemaPath || "<unknown>";

  console.log("");
  console.log(`[${index + 1}] ${displayPath}`);
  console.log(`Message: ${message}`);
  console.log(`Keyword: ${error.keyword}`);
  console.log(`Schema: ${schemaPathText}`);
  console.log(`Value: ${formatValue(value)}`);
});

process.exit(1);
