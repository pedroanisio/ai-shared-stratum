/**
 * Section to VERA Document Converter
 *
 * Converts docs/sections/<FILE>.json to docs/vera/<FILE>.vera.json
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

// =============================================================================
// Types for Source Section Format
// =============================================================================

type DefinitionListItem = {
  term: string;
  definition: string;
};

type SectionContentItem =
  | { type: "paragraph"; text: string }
  | { type: "definition"; label: string; text: string; id?: string }
  | { type: "definition-list"; items: DefinitionListItem[] }
  | { type: "rule"; label: string; formula: string; description?: string }
  | { type: "theorem"; label: string; formula: string }
  | { type: "guarantee"; label: string; formula: string; description?: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "code"; language?: string; content: string }
  | { type: "admonition"; variant?: string; title?: string; text: string; level?: string }
  | { type: "heading"; level: number; text: string };

type SubSection = {
  id: string;
  title: string;
  defs?: string[];
  content: SectionContentItem[];
  suffix?: string;
};

type SectionDocument = {
  id: string;
  title: string;
  defs?: string[];
  children: SubSection[];
};

// =============================================================================
// Types for VERA Format
// =============================================================================

type MdastNode = {
  type: string;
  value?: string;
  ordered?: boolean;
  children?: MdastNode[];
  [key: string]: unknown;
};

type VeraEntity = {
  type: "containerDirective";
  name: string;
  localId: string;
  attributes: Record<string, unknown>;
  children: MdastNode[];
  data: Record<string, unknown>;
};

type VeraDocument = {
  documentId: string;
  frontmatter: {
    documentId: string;
    title: string;
  };
  entities: VeraEntity[];
};

// =============================================================================
// ID Generation
// =============================================================================

// Simple ULID-like ID generator (26 chars, monotonic within same ms)
let lastTime = 0;
let counter = 0;

function generateULID(): string {
  const now = Date.now();
  if (now === lastTime) {
    counter++;
  } else {
    lastTime = now;
    counter = 0;
  }

  // Crockford's Base32
  const chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

  // Encode timestamp (10 chars)
  let ts = now;
  let timeStr = "";
  for (let i = 0; i < 10; i++) {
    timeStr = chars[ts % 32] + timeStr;
    ts = Math.floor(ts / 32);
  }

  // Encode randomness + counter (16 chars)
  let randStr = "";
  for (let i = 0; i < 14; i++) {
    randStr += chars[Math.floor(Math.random() * 32)];
  }
  // Include counter in last 2 positions
  randStr += chars[Math.floor(counter / 32) % 32];
  randStr += chars[counter % 32];

  return timeStr + randStr;
}

// =============================================================================
// Content Conversion
// =============================================================================

function parseDefinitionLabel(label: string): { term: string } {
  // Parse labels like "Definition referenceMap(...).1 (GC Safety)" or "Definition (Term)"
  const match = label.match(/\(([^)]+)\)\s*$/);
  const term = match ? match[1] : label.replace(/^Definition\s*/i, "").trim();
  return { term };
}

function parseRuleLabel(label: string): { defName: string; ruleLabel: string } {
  // Parse labels like "GC-1 (Convergence Preservation)"
  const match = label.match(/^([A-Z0-9-]+)\s*\((.+)\)$/);
  if (match) {
    return { defName: match[1], ruleLabel: match[2] };
  }
  return { defName: label, ruleLabel: "" };
}

function parseTheoremLabel(label: string): { variant: string; theoremLabel: string } {
  // Parse labels like "Theorem 24.1 (Checkpoint GC Safety)"
  const match = label.match(/^(Theorem|Lemma|Corollary|Proposition)\s+(.+)$/i);
  if (match) {
    return {
      variant: match[1].toLowerCase(),
      theoremLabel: match[2],
    };
  }
  return { variant: "theorem", theoremLabel: label };
}

// Check if text looks like a math expression
function isMathExpression(text: string): boolean {
  // Contains math symbols like ∀, ∃, →, ⟹, ≥, ⊔, etc.
  const mathSymbols = /[∀∃→⟹⟺≥≤⊔⊓∈∉⊆⊇∪∩λ∧∨¬≡≠∞∑∏∫√]/;
  // Contains typical math patterns
  const mathPatterns = /(\w+\s*[=<>≤≥]\s*\w+)|(\w+\(\w+\))/;
  return mathSymbols.test(text) || (mathPatterns.test(text) && text.includes(":"));
}

function lineToMdastNode(line: string): MdastNode {
  const trimmed = line.trim();
  if (isMathExpression(trimmed)) {
    return { type: "math", value: trimmed };
  }
  return { type: "text", value: trimmed };
}

function textToMdast(text: string): MdastNode[] {
  // Split text into paragraphs and convert to mdast nodes
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());

  if (paragraphs.length === 0) {
    return [lineToMdastNode(text)];
  }

  if (paragraphs.length === 1) {
    // Single paragraph - check if it has line breaks
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length <= 1) {
      return [lineToMdastNode(text.trim())];
    }
    // Multiple lines - each becomes its own node
    return lines.map(lineToMdastNode);
  }

  // Multiple paragraphs - each becomes its own node
  return paragraphs.map((p) => lineToMdastNode(p.trim()));
}

function listItemsToMdast(items: string[], ordered: boolean = false): MdastNode[] {
  // Check if items start with numbers (like "1. ...")
  const isNumbered = items.every((item) => /^\d+\.\s/.test(item));
  const actualOrdered = ordered || isNumbered;

  return [
    {
      type: "list",
      ordered: actualOrdered,
      children: items.map((item) => ({
        type: "listItem",
        children: [
          {
            type: "text",
            // Remove leading numbers if present
            value: item.replace(/^\d+\.\s*/, "").trim(),
          },
        ],
      })),
    },
  ];
}

// =============================================================================
// Main Conversion
// =============================================================================

function convertContentItem(
  item: SectionContentItem,
  parentSectionId: string
): VeraEntity[] {
  const localId = generateULID();

  switch (item.type) {
    case "paragraph": {
      return [{
        type: "containerDirective",
        name: "para",
        localId,
        attributes: {
          refs: parentSectionId,
        },
        children: [{ type: "text", value: item.text }],
        data: {},
      }];
    }

    case "definition": {
      const { term } = parseDefinitionLabel(item.label);
      // Split text into statement (first line/sentence) and elaboration
      const lines = item.text.split("\n").filter((l) => l.trim());
      const statement = lines[0] || item.text;
      const elaboration = lines.slice(1).join("\n").trim();

      const entities: VeraEntity[] = [{
        type: "containerDirective",
        name: "definition",
        localId,
        attributes: {
          term,
          statement,
          ...(item.id && { alias: item.id }),
          refs: parentSectionId,
        },
        children: [],
        data: {},
      }];

      // Add formula_block for elaboration if it contains math
      if (elaboration) {
        const elabLines = elaboration.split("\n").filter((l) => l.trim());
        for (const line of elabLines) {
          if (isMathExpression(line)) {
            entities.push({
              type: "containerDirective",
              name: "formula_block",
              localId: generateULID(),
              attributes: {
                refs: localId,
              },
              children: [{ type: "text", value: line.trim() }],
              data: {},
            });
          } else {
            entities.push({
              type: "containerDirective",
              name: "para",
              localId: generateULID(),
              attributes: {
                refs: localId,
              },
              children: [{ type: "text", value: line.trim() }],
              data: {},
            });
          }
        }
      }

      return entities;
    }

    case "rule": {
      const { defName, ruleLabel } = parseRuleLabel(item.label);
      const entities: VeraEntity[] = [];

      // Rule definition entity
      const ruleId = localId;
      entities.push({
        type: "containerDirective",
        name: "rule_def",
        localId: ruleId,
        attributes: {
          defName,
          ...(ruleLabel && { label: ruleLabel }),
          refs: parentSectionId,
        },
        children: [],
        data: {},
      });

      // Formula as formula_block entity
      if (item.formula) {
        entities.push({
          type: "containerDirective",
          name: "formula_block",
          localId: generateULID(),
          attributes: {
            refs: ruleId,
          },
          children: [{ type: "text", value: item.formula }],
          data: {},
        });
      }

      // Description as para entity
      if (item.description) {
        entities.push({
          type: "containerDirective",
          name: "para",
          localId: generateULID(),
          attributes: {
            refs: ruleId,
          },
          children: [{ type: "text", value: item.description }],
          data: {},
        });
      }

      return entities;
    }

    case "theorem": {
      const { variant, theoremLabel } = parseTheoremLabel(item.label);

      // Parse formula into structured content
      const children = textToMdast(item.formula);

      return [{
        type: "containerDirective",
        name: "theorem_block",
        localId,
        attributes: {
          variant,
          label: theoremLabel,
          refs: parentSectionId,
        },
        children,
        data: {},
      }];
    }

    case "guarantee": {
      // Guarantees are rendered as guarantee_block entities
      const entities: VeraEntity[] = [];

      // Parse label like "GUARANTEE G1 - TRACEABILITY"
      const labelMatch = item.label.match(/GUARANTEE\s+(G\d+)\s*[-–]\s*(.+)/i);
      const guaranteeId = labelMatch ? labelMatch[1] : item.label;
      const guaranteeName = labelMatch ? labelMatch[2] : "";

      const guaranteeBlockId = localId;
      entities.push({
        type: "containerDirective",
        name: "guarantee_block",
        localId: guaranteeBlockId,
        attributes: {
          defName: guaranteeId,
          ...(guaranteeName && { label: guaranteeName }),
          refs: parentSectionId,
        },
        children: [],
        data: {},
      });

      // Formula as formula_block entity
      if (item.formula) {
        entities.push({
          type: "containerDirective",
          name: "formula_block",
          localId: generateULID(),
          attributes: {
            refs: guaranteeBlockId,
          },
          children: [{ type: "text", value: item.formula }],
          data: {},
        });
      }

      // Description as para entity
      if (item.description) {
        entities.push({
          type: "containerDirective",
          name: "para",
          localId: generateULID(),
          attributes: {
            refs: guaranteeBlockId,
          },
          children: [{ type: "text", value: item.description }],
          data: {},
        });
      }

      return entities;
    }

    case "list": {
      return [{
        type: "containerDirective",
        name: "para",
        localId,
        attributes: {
          refs: parentSectionId,
        },
        children: listItemsToMdast(item.items, item.ordered),
        data: {},
      }];
    }

    case "code": {
      return [{
        type: "containerDirective",
        name: "code_block",
        localId,
        attributes: {
          ...(item.language && { language: item.language }),
          refs: parentSectionId,
        },
        children: [{ type: "text", value: item.content }],
        data: {},
      }];
    }

    case "admonition": {
      return [{
        type: "containerDirective",
        name: "admonition_block",
        localId,
        attributes: {
          variant: item.variant || item.level || "note",
          ...(item.title && { title: item.title }),
          refs: parentSectionId,
        },
        children: [{ type: "text", value: item.text }],
        data: {},
      }];
    }

    case "definition-list": {
      // Convert each definition list item into a definition entity
      const entities: VeraEntity[] = [];
      for (const defItem of item.items) {
        entities.push({
          type: "containerDirective",
          name: "definition",
          localId: generateULID(),
          attributes: {
            term: defItem.term,
            statement: defItem.definition,
            refs: parentSectionId,
          },
          children: [],
          data: {},
        });
      }
      return entities;
    }

    case "heading": {
      // Headings become section blocks
      return [{
        type: "containerDirective",
        name: "section_block",
        localId,
        attributes: {
          title: item.text,
        },
        children: [],
        data: {},
      }];
    }

    default:
      console.warn(`Unknown content type: ${(item as any).type}`);
      return [];
  }
}

function convertSection(doc: SectionDocument): VeraDocument {
  const documentId = generateULID();
  const entities: VeraEntity[] = [];

  // Convert each subsection
  for (const sub of doc.children) {
    // Create section entity
    const sectionId = generateULID();
    entities.push({
      type: "containerDirective",
      name: "section_block",
      localId: sectionId,
      attributes: {
        title: sub.title,
        alias: sub.id,
      },
      children: [],
      data: {},
    });

    // Convert content items, looking for proof patterns
    for (let i = 0; i < sub.content.length; i++) {
      const item = sub.content[i];
      const nextItem = sub.content[i + 1];

      // Check for proof pattern: paragraph "Proof:" followed by list
      if (
        item.type === "paragraph" &&
        /^Proof[:.]?\s*$/i.test(item.text.trim()) &&
        nextItem?.type === "list"
      ) {
        // Create proof_block with the list content
        const proofId = generateULID();
        entities.push({
          type: "containerDirective",
          name: "proof_block",
          localId: proofId,
          attributes: {
            refs: sectionId,
          },
          children: listItemsToMdast(nextItem.items, nextItem.ordered),
          data: {},
        });
        // Skip the next item (the list) since we consumed it
        i++;
        continue;
      }

      const newEntities = convertContentItem(item, sectionId);
      entities.push(...newEntities);
    }
  }

  return {
    documentId,
    frontmatter: {
      documentId,
      title: doc.title,
    },
    entities,
  };
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: tsx scripts/section2vera.ts <input.json> [output.vera.json]");
    console.log("       tsx scripts/section2vera.ts --all");
    process.exit(1);
  }

  // Ensure output directory exists
  const veraDir = "docs/vera";
  if (!existsSync(veraDir)) {
    await mkdir(veraDir, { recursive: true });
  }

  if (args[0] === "--all") {
    // Convert all section files
    const { glob } = await import("glob");
    const files = await glob("docs/sections/sec-*.json");

    console.log(`Found ${files.length} section files`);

    for (const inputPath of files) {
      const basename = inputPath.split("/").pop()!.replace(".json", "");
      const outputPath = `${veraDir}/${basename}.vera.json`;

      try {
        const inputJson = await readFile(inputPath, "utf-8");
        const doc = JSON.parse(inputJson) as SectionDocument;
        const vera = convertSection(doc);
        await writeFile(outputPath, JSON.stringify(vera, null, 2));
        console.log(`Converted: ${inputPath} -> ${outputPath}`);
      } catch (err) {
        console.error(`Error converting ${inputPath}:`, err);
      }
    }
  } else {
    const inputPath = args[0];
    const basename = inputPath.split("/").pop()!.replace(".json", "");
    const outputPath = args[1] || `${veraDir}/${basename}.vera.json`;

    const inputJson = await readFile(inputPath, "utf-8");
    const doc = JSON.parse(inputJson) as SectionDocument;
    const vera = convertSection(doc);

    await writeFile(outputPath, JSON.stringify(vera, null, 2));
    console.log(`Wrote ${outputPath}`);
  }
}

main().catch(console.error);
