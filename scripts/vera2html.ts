/**
 * VERA Document to HTML Renderer
 *
 * Renders VERA markdown documents (flat entity array format) to HTML.
 * Based on the build-html.ts patterns but adapted for VERA's entity structure.
 */

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { VERA_CSS } from "./shared-css";
import { buildLatexDownloadScript, makeExportFilename } from "./shared-utils";

// =============================================================================
// VERA Document Types
// =============================================================================

export type MdastNode = {
  type: string;
  value?: string;
  ordered?: boolean;
  identifier?: string;
  label?: string;
  url?: string;
  children?: MdastNode[];
  [key: string]: unknown;
};

export type VeraEntity = {
  type: "containerDirective";
  name: string;
  localId: string;
  attributes: {
    alias?: string;
    tags?: string;
    note?: string;
    refs?: string;
    placeholder?: boolean;
    sourceLoc?: string;
    confidence?: number;
    verified?: boolean;
    derivedFrom?: string;
    // Entity-specific attributes
    title?: string;
    term?: string;
    statement?: string;
    defName?: string;
    label?: string;
    variant?: string;
    [key: string]: unknown;
  };
  children: MdastNode[];
  position?: unknown;
  data?: Record<string, unknown>;
};

export type VeraFrontmatter = {
  documentId: string;
  title?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  provenance?: {
    source?: {
      type?: string;
      path?: string;
      sha256?: string;
      accessedAt?: string;
      bibliographicRef?: string;
    };
    extraction?: {
      method?: string;
      pipeline?: string;
      model?: string;
      confidence?: number;
      extractedAt?: string;
    };
    review?: {
      status?: string;
      reviewer?: string;
      reviewedAt?: string;
    };
  };
};

export type VeraDocument = {
  documentId: string;
  frontmatter?: VeraFrontmatter;
  entities: VeraEntity[];
};

type RenderContext = {
  footnoteOrder: string[];
  footnoteIndex: Map<string, number>;
  footnoteDefs: Map<string, MdastNode[]>;
};

function createRenderContext(): RenderContext {
  return {
    footnoteOrder: [],
    footnoteIndex: new Map(),
    footnoteDefs: new Map(),
  };
}

function getFootnoteId(node: MdastNode): string {
  return String(node.identifier ?? node.label ?? node.value ?? "").trim();
}

function registerFootnote(ctx: RenderContext, id: string): number {
  const existing = ctx.footnoteIndex.get(id);
  if (existing !== undefined) return existing;
  const next = ctx.footnoteOrder.length + 1;
  ctx.footnoteOrder.push(id);
  ctx.footnoteIndex.set(id, next);
  return next;
}

// =============================================================================
// HTML Escaping & Inline Rendering
// =============================================================================

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderInline(input: string): string {
  const escaped = escapeHtml(input);
  const strong = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const em = strong.replace(/\*(.+?)\*/g, "<em>$1</em>");
  const code = em.replace(/`([^`]+)`/g, "<code>$1</code>");
  return code;
}

type ParsedTable = {
  headers: string[];
  rows: string[][];
};

function splitMarkdownTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function parseMarkdownTable(markdown: string): ParsedTable | null {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return null;

  const headerLine = lines[0];
  const separatorLine = lines[1];
  if (!/^\|?[-:\s|]+\|?$/.test(separatorLine)) return null;

  const headers = splitMarkdownTableRow(headerLine);
  if (headers.length === 0) return null;

  const rows = lines.slice(2).map(splitMarkdownTableRow).filter((row) => row.some((cell) => cell.length > 0));
  return { headers, rows };
}

// =============================================================================
// Mdast Node Rendering
// =============================================================================

export function renderMdastNode(node: MdastNode, ctx?: RenderContext): string {
  switch (node.type) {
    case "text": {
      const value = node.value ?? "";
      // If text starts with list marker, render as-is for proper formatting
      if (value.startsWith("-") || value.startsWith("•")) {
        return `<p>${renderInline(value)}</p>`;
      }
      return renderInline(value);
    }

    case "paragraph":
      return `<p>${renderMdastChildren(node.children, ctx)}</p>`;

    case "list": {
      const tag = node.ordered ? "ol" : "ul";
      return `<${tag}>${renderMdastChildren(node.children, ctx)}</${tag}>`;
    }

    case "listItem":
      return `<li>${renderMdastChildren(node.children, ctx)}</li>`;

    case "code":
      return `<pre><code>${escapeHtml(node.value ?? "")}</code></pre>`;

    case "inlineCode":
      return `<code>${escapeHtml(node.value ?? "")}</code>`;

    case "math":
      // Block-level math (display mode)
      return `<div class="math">${escapeHtml(node.value ?? "")}</div>`;

    case "inlineMath":
      // Inline math
      return `<span class="math-inline">${escapeHtml(node.value ?? "")}</span>`;

    case "strong":
      return `<strong>${renderMdastChildren(node.children, ctx)}</strong>`;

    case "emphasis":
      return `<em>${renderMdastChildren(node.children, ctx)}</em>`;

    case "heading": {
      const level = Math.min(6, Math.max(1, (node.depth as number) ?? 3));
      return `<h${level}>${renderMdastChildren(node.children, ctx)}</h${level}>`;
    }

    case "blockquote":
      return `<blockquote>${renderMdastChildren(node.children, ctx)}</blockquote>`;

    case "thematicBreak":
      return "<hr />";

    case "link": {
      const url = escapeHtml(String(node.url ?? "#"));
      const title = node.title ? ` title="${escapeHtml(String(node.title))}"` : "";
      return `<a href="${url}"${title}>${renderMdastChildren(node.children, ctx)}</a>`;
    }

    case "footnoteReference": {
      if (!ctx) return "";
      const id = getFootnoteId(node);
      if (!id) return "";
      const num = registerFootnote(ctx, id);
      const safeId = escapeHtml(id);
      return `<sup class="footnote-ref" id="fnref-${safeId}"><a href="#fn-${safeId}">${num}</a></sup>`;
    }

    case "footnoteDefinition": {
      if (!ctx) return "";
      const id = getFootnoteId(node);
      if (!id) return "";
      if (node.children) {
        ctx.footnoteDefs.set(id, node.children);
      }
      return "";
    }

    default:
      // For unknown node types, try to render children or value
      if (node.children && node.children.length > 0) {
        return renderMdastChildren(node.children, ctx);
      }
      if (node.value) {
        return renderInline(String(node.value));
      }
      return "";
  }
}

export function renderMdastChildren(children: MdastNode[] | undefined, ctx?: RenderContext): string {
  if (!children || children.length === 0) return "";

  // Check if we have multiple consecutive text nodes - they need separation
  const hasMultipleTextNodes = children.filter(c => c.type === "text").length > 1;

  if (hasMultipleTextNodes) {
    // Wrap each text node in a paragraph for proper separation
    return children.map(node => {
      if (node.type === "text") {
        const value = node.value ?? "";
        // List items starting with "-" or "•"
        if (value.startsWith("-") || value.startsWith("•")) {
          return `<p>${renderInline(value)}</p>`;
        }
        // Regular text lines
        return `<p>${renderInline(value)}</p>`;
      }
      return renderMdastNode(node, ctx);
    }).join("");
  }

  return children.map((node) => renderMdastNode(node, ctx)).join("");
}

// =============================================================================
// Entity Rendering
// =============================================================================

export function renderEntity(
  entity: VeraEntity,
  entityMap: Map<string, VeraEntity>,
  ctx?: RenderContext
): string {
  const { name, localId, attributes, children, data } = entity;
  const alias = attributes.alias ? ` data-alias="${escapeHtml(attributes.alias)}"` : "";

  switch (name) {
    case "section_block": {
      const title = attributes.title ?? "Untitled Section";
      const suffix = data?.suffix ? ` (${data.suffix})` : "";
      return `
        <section class="vera-section" id="${escapeHtml(localId)}"${alias}>
          <h2>${renderInline(title)}${suffix}
            <a class="anchor" href="#${escapeHtml(localId)}">#</a>
          </h2>
        </section>`;
    }

    case "para": {
      const content = renderMdastChildren(children, ctx);
      return `<div class="vera-para" id="${escapeHtml(localId)}"${alias}>${content || "<p></p>"}</div>`;
    }

    case "definition": {
      const term = attributes.term ?? "Definition";
      const statement = attributes.statement ? String(attributes.statement) : "";
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-definition definition" id="${escapeHtml(localId)}"${alias}>
          <p class="definition-title">
            <strong>Definition (${renderInline(term)})</strong>
            <a class="anchor" href="#${escapeHtml(localId)}">#</a>
          </p>
          ${statement ? `<p>${renderInline(statement)}</p>` : ""}
          ${content}
        </div>`;
    }

    case "rule_def": {
      const defName = attributes.defName ?? "Rule";
      const label = attributes.label ?? "";
      const content = renderMdastChildren(children, ctx);
      // Prefer children content; only use data.formula/description as fallback
      const formula = data?.formula ? String(data.formula) : "";
      const description = data?.description ? String(data.description) : "";
      const hasChildren = children && children.length > 0;
      return `
        <div class="vera-rule rule" id="${escapeHtml(localId)}"${alias}>
          <p><strong>${escapeHtml(defName)}${label ? ` (${renderInline(label)})` : ""}</strong></p>
          ${hasChildren ? content : `${formula ? `<pre><code>${escapeHtml(formula)}</code></pre>` : ""}${description ? `<p class="rule-description"><em>${renderInline(description)}</em></p>` : ""}`}
        </div>`;
    }

    case "guarantee_block": {
      const defName = attributes.defName ?? "G";
      const label = attributes.label ?? "";
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-guarantee guarantee" id="${escapeHtml(localId)}"${alias}>
          <p class="guarantee-header"><strong>GUARANTEE ${escapeHtml(defName)} - ${escapeHtml(label)}</strong></p>
          ${content}
        </div>`;
    }

    case "theorem_block": {
      const variant = attributes.variant ?? "theorem";
      const label = attributes.label ?? "";
      const formula = data?.formula ? String(data.formula) : "";
      const content = renderMdastChildren(children, ctx);
      const variantLabel = variant.charAt(0).toUpperCase() + variant.slice(1);
      return `
        <div class="vera-theorem theorem" id="${escapeHtml(localId)}"${alias}>
          <p><strong>${escapeHtml(variantLabel)}${label ? `: ${renderInline(label)}` : ""}</strong></p>
          ${content}
          ${formula && !content ? `<pre><code>${escapeHtml(formula)}</code></pre>` : ""}
        </div>`;
    }

    case "proof_block": {
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-proof" id="${escapeHtml(localId)}"${alias}>
          <p><strong>Proof:</strong></p>
          ${content}
          <p class="proof-end">∎</p>
        </div>`;
    }

    case "formula_block": {
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-formula math" id="${escapeHtml(localId)}"${alias}>
          ${content}
        </div>`;
    }

    case "admonition_block": {
      const variant = attributes.variant ?? "note";
      const title = attributes.title ?? variant.toUpperCase();
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-admonition admonition admonition-${escapeHtml(variant)}" id="${escapeHtml(localId)}"${alias}>
          <p><strong>${renderInline(title)}</strong></p>
          ${content}
        </div>`;
    }

    case "code_block": {
      const language = attributes.language ? String(attributes.language) : "";
      const content = renderMdastChildren(children, ctx);
      const langClass = language ? ` class="language-${escapeHtml(language)}"` : "";
      return `
        <figure class="vera-code code-block" id="${escapeHtml(localId)}"${alias}>
          <pre><code${langClass}>${content || escapeHtml(String(data?.content ?? ""))}</code></pre>
        </figure>`;
    }

    case "table_block": {
      const tableText = children?.find((child) => child.type === "text")?.value;
      const parsedTable = tableText ? parseMarkdownTable(String(tableText)) : null;
      const content = parsedTable
        ? `
          <thead>
            <tr>${parsedTable.headers.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${parsedTable.rows
              .map((row) => {
                const cells = parsedTable.headers.map((_, idx) => `<td>${renderInline(row[idx] ?? "")}</td>`);
                return `<tr>${cells.join("")}</tr>`;
              })
              .join("")}
          </tbody>
        `
        : renderMdastChildren(children);
      return `
        <div class="vera-table table" id="${escapeHtml(localId)}"${alias}>
          <table>${content}</table>
        </div>`;
    }

    case "figure_block": {
      const src = attributes.src ? String(attributes.src) : "";
      const alt = attributes.alt ? String(attributes.alt) : "";
      const caption = attributes.caption ? String(attributes.caption) : "";
      return `
        <figure class="vera-figure" id="${escapeHtml(localId)}"${alias}>
          ${src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" />` : ""}
          ${caption ? `<figcaption>${renderInline(caption)}</figcaption>` : ""}
        </figure>`;
    }

    case "diagram_block": {
      const format = attributes.format ? String(attributes.format) : "";
      const caption = attributes.caption ? String(attributes.caption) : "";
      const content = renderMdastChildren(children, ctx);
      const diagramClass = format === "mermaid" ? "diagram mermaid" : "diagram";
      return `
        <figure class="vera-diagram" id="${escapeHtml(localId)}"${alias}>
          <div class="${diagramClass}">${content}</div>
          ${caption ? `<figcaption>${renderInline(caption)}</figcaption>` : ""}
        </figure>`;
    }

    case "quote_block": {
      const attribution = attributes.attribution ? String(attributes.attribution) : "";
      const content = renderMdastChildren(children, ctx);
      return `
        <blockquote class="vera-quote" id="${escapeHtml(localId)}"${alias}>
          ${content}
          ${attribution ? `<footer>— ${renderInline(attribution)}</footer>` : ""}
        </blockquote>`;
    }

    case "example_block": {
      const label = attributes.label ?? "Example";
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-example" id="${escapeHtml(localId)}"${alias}>
          <p><strong>${renderInline(label)}</strong></p>
          ${content}
        </div>`;
    }

    case "exercise_block": {
      const label = attributes.label ?? "Exercise";
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-exercise" id="${escapeHtml(localId)}"${alias}>
          <p><strong>${renderInline(label)}</strong></p>
          ${content}
        </div>`;
    }

    case "claim_block": {
      const strength = attributes.strength ? String(attributes.strength) : "";
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-claim" id="${escapeHtml(localId)}"${alias}>
          <p><strong>Claim${strength ? ` (${escapeHtml(strength)})` : ""}:</strong></p>
          ${content}
        </div>`;
    }

    case "evidence_block": {
      const kind = attributes.kind ? String(attributes.kind) : "";
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-evidence" id="${escapeHtml(localId)}"${alias}>
          <p><strong>Evidence${kind ? ` (${escapeHtml(kind)})` : ""}:</strong></p>
          ${content}
        </div>`;
    }

    case "gap_block": {
      const kind = attributes.kind ? String(attributes.kind) : "unknown";
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-gap" id="${escapeHtml(localId)}"${alias}>
          <p class="gap-marker">[GAP: ${escapeHtml(kind)}]</p>
          ${content}
        </div>`;
    }

    case "redaction_block": {
      const basis = attributes.basis ? String(attributes.basis) : "";
      return `
        <div class="vera-redaction" id="${escapeHtml(localId)}"${alias}>
          <span class="redaction-marker">[REDACTED${basis ? `: ${escapeHtml(basis)}` : ""}]</span>
        </div>`;
    }

    case "reference_def": {
      const title = attributes.title ? String(attributes.title) : "Reference";
      const author = attributes.author ? String(attributes.author) : "";
      const year = attributes.year ? String(attributes.year) : "";
      const kind = attributes.kind ? String(attributes.kind) : "";
      const publisher = attributes.publisher ? String(attributes.publisher) : "";
      const journal = attributes.journal ? String(attributes.journal) : "";
      const booktitle = attributes.booktitle ? String(attributes.booktitle) : "";
      const note = attributes.note ? String(attributes.note) : "";
      const url = attributes.url ? String(attributes.url) : "";
      const key = attributes.key ? String(attributes.key) : "";
      const metaParts = [publisher, journal, booktitle].filter(Boolean).join(" · ");
      return `
        <div class="vera-reference reference" id="${escapeHtml(localId)}"${alias}>
          <div class="reference-head">
            <strong class="reference-title">${renderInline(title)}</strong>
            ${year ? `<span class="reference-year">${escapeHtml(year)}</span>` : ""}
          </div>
          ${author ? `<div class="reference-authors">${renderInline(author)}</div>` : ""}
          ${metaParts ? `<div class="reference-meta">${renderInline(metaParts)}</div>` : ""}
          ${(kind || key) ? `<div class="reference-tags">${kind ? `<span class="reference-kind">${escapeHtml(kind)}</span>` : ""}${key ? `<span class="reference-key">${escapeHtml(key)}</span>` : ""}</div>` : ""}
          ${note ? `<p class="reference-note">${renderInline(note)}</p>` : ""}
          ${url ? `<a class="reference-link" href="${escapeHtml(url)}">${escapeHtml(url)}</a>` : ""}
        </div>`;
    }

    default: {
      // Generic fallback for unknown entity types
      const content = renderMdastChildren(children, ctx);
      return `
        <div class="vera-entity vera-${escapeHtml(name)}" id="${escapeHtml(localId)}"${alias}>
          ${content}
        </div>`;
    }
  }
}

// =============================================================================
// Document Structure Building
// =============================================================================

type EntityGroup = {
  section: VeraEntity | null;
  entities: VeraEntity[];
};

export function groupEntitiesBySections(entities: VeraEntity[]): EntityGroup[] {
  const groups: EntityGroup[] = [];
  let currentGroup: EntityGroup = { section: null, entities: [] };

  for (const entity of entities) {
    if (entity.name === "section_block") {
      // Start a new group
      if (currentGroup.section !== null || currentGroup.entities.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = { section: entity, entities: [] };
    } else {
      // Check if this entity belongs to a section via refs
      const refs = entity.attributes.refs;
      if (refs && currentGroup.section && refs === currentGroup.section.localId) {
        currentGroup.entities.push(entity);
      } else if (currentGroup.section) {
        // Entity belongs to current section
        currentGroup.entities.push(entity);
      } else {
        // Orphan entity (no section yet)
        currentGroup.entities.push(entity);
      }
    }
  }

  // Push the last group
  if (currentGroup.section !== null || currentGroup.entities.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

// =============================================================================
// Cover & TOC Rendering
// =============================================================================

export function renderCover(doc: VeraDocument): string {
  const fm = doc.frontmatter;
  const title = fm?.title ?? "VERA Document";
  const author = fm?.author ?? "";
  const createdAt = fm?.createdAt ?? "";
  const updatedAt = fm?.updatedAt ?? "";

  const provenance = fm?.provenance;
  const source = provenance?.source;
  const extraction = provenance?.extraction;
  const review = provenance?.review;

  const metaRows: { label: string; value: string }[] = [];
  if (doc.documentId) metaRows.push({ label: "Document ID", value: doc.documentId });
  if (author) metaRows.push({ label: "Author", value: author });
  if (createdAt) metaRows.push({ label: "Created", value: createdAt });
  if (updatedAt) metaRows.push({ label: "Updated", value: updatedAt });
  if (source?.type) metaRows.push({ label: "Source Type", value: source.type });
  if (source?.path) metaRows.push({ label: "Source Path", value: source.path });
  if (extraction?.method) metaRows.push({ label: "Extraction", value: extraction.method });
  if (extraction?.model) metaRows.push({ label: "Model", value: extraction.model });
  if (extraction?.confidence !== undefined) metaRows.push({ label: "Confidence", value: `${(extraction.confidence * 100).toFixed(0)}%` });
  if (review?.status) metaRows.push({ label: "Review Status", value: review.status });
  if (review?.reviewer) metaRows.push({ label: "Reviewer", value: review.reviewer });

  const metaHtml = metaRows
    .map((row) => `<div class="cover-meta-row"><span>${escapeHtml(row.label)}</span><span>${renderInline(row.value)}</span></div>`)
    .join("");

  return `
    <section class="cover">
      <div class="cover-surface">
        <div class="cover-head">
          <p class="cover-eyebrow">VERA Document</p>
          <h1 class="cover-title">${renderInline(title)}</h1>
        </div>
        <div class="cover-body">
          ${metaHtml ? `<div class="cover-meta">${metaHtml}</div>` : ""}
        </div>
        <div class="cover-links">
          <button class="cover-link" id="export-latex" type="button">Export LaTeX</button>
        </div>
      </div>
    </section>
  `;
}

export function renderTOC(groups: EntityGroup[]): string {
  const items = groups
    .filter((g) => g.section !== null)
    .map((g) => {
      const section = g.section!;
      const title = section.attributes.title ?? "Untitled";
      const suffix = section.data?.suffix ? ` (${section.data.suffix})` : "";
      return `<li><a href="#${escapeHtml(section.localId)}">${renderInline(title)}${suffix}</a></li>`;
    })
    .join("");

  if (!items) return "";

  return `
    <nav class="toc">
      <h2>Contents</h2>
      <ul>${items}</ul>
    </nav>
  `;
}

// =============================================================================
// Full Document Rendering
// =============================================================================

export function renderVeraDocument(doc: VeraDocument): string {
  const entityMap = new Map(doc.entities.map((e) => [e.localId, e]));
  const groups = groupEntitiesBySections(doc.entities);
  const ctx = createRenderContext();
  const referencesSectionMeta = findReferencesSectionMeta(doc.entities);
  const references: VeraEntity[] = [];
  const referenceIntro: VeraEntity[] = [];

  const sectionsHtml = groups
    .map((group) => {
      const isReferencesSection = group.section && referencesSectionMeta?.ids.has(group.section.localId);
      const sectionHtml = isReferencesSection || !group.section ? "" : renderEntity(group.section, entityMap, ctx);
      const contentHtml = group.entities
        .filter((e) => {
          if (e.name === "reference_def") {
            references.push(e);
            return false;
          }
          if (referencesSectionMeta?.ids.has(String(e.attributes.refs ?? ""))) {
            referenceIntro.push(e);
            return false;
          }
          return true;
        })
        .map((e) => renderEntity(e, entityMap, ctx))
        .join("\n");
      return `${sectionHtml}\n${contentHtml}`;
    })
    .join("\n");

  const coverHtml = renderCover(doc);
  const tocHtml = renderTOC(groups);
  const hasToc = tocHtml.trim().length > 0;
  const title = doc.frontmatter?.title ?? "VERA Document";
  const footnotesHtml = renderFootnotes(ctx);
  const referencesHtml = renderReferencesSection(referencesSectionMeta, referenceIntro, references, entityMap, ctx);
  const latexContent = buildVeraLatexDocument(doc);
  const latexFilename = makeExportFilename(title);
  const latexScript = buildLatexDownloadScript(latexContent, latexFilename);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>${VERA_CSS}</style>
  </head>
  <body class="vera-doc">
    <main>
      ${coverHtml}
      <div class="doc-grid${hasToc ? " has-toc" : " no-toc"}">
        ${hasToc ? tocHtml : ""}
        <div class="doc-content">
          ${sectionsHtml}
          ${referencesHtml}
          ${footnotesHtml}
        </div>
      </div>
    </main>
    <script>
      ${latexScript}
    </script>
  </body>
</html>`;
}

type ReferencesSectionMeta = {
  ids: Set<string>;
  title: string;
  primaryId: string;
};

function findReferencesSectionMeta(entities: VeraEntity[]): ReferencesSectionMeta | null {
  const ids = new Set<string>();
  let title = "References";
  let primaryId = "";

  for (const entity of entities) {
    if (entity.name !== "section_block") continue;
    const sectionTitle = String(entity.attributes.title ?? "").trim();
    const alias = String(entity.attributes.alias ?? "");
    const isReferences = sectionTitle.toLowerCase() === "references" || alias === "sub-references";
    if (isReferences) {
      ids.add(entity.localId);
      if (!primaryId) {
        primaryId = entity.localId;
        if (sectionTitle) title = sectionTitle;
      }
    }
  }

  return ids.size > 0 ? { ids, title, primaryId } : null;
}

function renderReferencesSection(
  meta: ReferencesSectionMeta | null,
  intro: VeraEntity[],
  references: VeraEntity[],
  entityMap: Map<string, VeraEntity>,
  ctx: RenderContext
): string {
  if (!meta && references.length === 0) return "";
  const sectionId = meta?.primaryId ?? "references";
  const sectionTitle = meta?.title ?? "References";
  const introHtml = intro.map((e) => renderEntity(e, entityMap, ctx)).join("\n");
  const referencesHtml = references.map((e) => renderEntity(e, entityMap, ctx)).join("\n");

  return `
    <section class="vera-section references-section" id="${escapeHtml(sectionId)}">
      <h2>${renderInline(sectionTitle)}
        <a class="anchor" href="#${escapeHtml(sectionId)}">#</a>
      </h2>
      ${introHtml}
      ${referencesHtml}
    </section>
  `;
}

function renderFootnotes(ctx: RenderContext): string {
  if (ctx.footnoteOrder.length === 0) return "";
  const items = ctx.footnoteOrder
    .map((id) => {
      const nodes = ctx.footnoteDefs.get(id);
      const content = nodes ? renderMdastChildren(nodes, ctx) : "<em>Missing footnote.</em>";
      const safeId = escapeHtml(id);
      return `<li id="fn-${safeId}">${content} <a href="#fnref-${safeId}" class="footnote-backref">↩</a></li>`;
    })
    .join("");

  return `
    <section class="footnotes">
      <h2>Footnotes</h2>
      <ol>${items}</ol>
    </section>
  `;
}

function escapeLatexText(input: string): string {
  return input
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/~/g, "\\textasciitilde{}");
}

function renderInlineMarkdownToLatex(input: string): string {
  let result = "";
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (input.startsWith("**", i)) {
      const end = input.indexOf("**", i + 2);
      if (end !== -1) {
        const content = input.slice(i + 2, end);
        result += `\\textbf{${escapeLatexText(content)}}`;
        i = end + 2;
        continue;
      }
    }

    if (char === "*") {
      const end = input.indexOf("*", i + 1);
      if (end !== -1) {
        const content = input.slice(i + 1, end);
        result += `\\emph{${escapeLatexText(content)}}`;
        i = end + 1;
        continue;
      }
    }

    if (char === "`") {
      const end = input.indexOf("`", i + 1);
      if (end !== -1) {
        const content = input.slice(i + 1, end);
        result += `\\texttt{${escapeLatexText(content)}}`;
        i = end + 1;
        continue;
      }
    }

    result += escapeLatexText(char);
    i += 1;
  }

  return result;
}

function mdastInlineToLatex(node: MdastNode): string {
  switch (node.type) {
    case "text":
      return renderInlineMarkdownToLatex(node.value ?? "");
    case "strong":
      return `\\textbf{${mdastChildrenToLatex(node.children)}}`;
    case "emphasis":
      return `\\emph{${mdastChildrenToLatex(node.children)}}`;
    case "inlineCode":
      return `\\texttt{${escapeLatexText(node.value ?? "")}}`;
    case "inlineMath":
      return `$${node.value ?? ""}$`;
    case "link": {
      const label = mdastChildrenToLatex(node.children);
      const url = escapeLatexText(String(node.url ?? ""));
      return url ? `\\href{${url}}{${label || url}}` : label;
    }
    default:
      return mdastChildrenToLatex(node.children);
  }
}

function mdastChildrenToLatex(children: MdastNode[] | undefined): string {
  if (!children || children.length === 0) return "";
  return children.map(mdastInlineToLatex).join("");
}

function mdastBlockToLatex(node: MdastNode): string {
  switch (node.type) {
    case "text":
      return `${renderInlineMarkdownToLatex(node.value ?? "")}\n\n`;
    case "paragraph":
      return `${mdastChildrenToLatex(node.children)}\n\n`;
    case "list": {
      const tag = node.ordered ? "enumerate" : "itemize";
      const items = (node.children ?? []).map(mdastBlockToLatex).join("");
      return `\\begin{${tag}}\n${items}\\end{${tag}}\n\n`;
    }
    case "listItem": {
      const content = mdastChildrenToLatex(node.children);
      return `\\item ${content}\n`;
    }
    case "code":
      return `\\begin{verbatim}\n${node.value ?? ""}\n\\end{verbatim}\n\n`;
    case "math":
      return `\\[\n${node.value ?? ""}\n\\]\n\n`;
    case "blockquote":
      return `\\begin{quote}\n${mdastChildrenToLatex(node.children)}\n\\end{quote}\n\n`;
    case "heading": {
      const level = Math.min(6, Math.max(1, (node.depth as number) ?? 3));
      const content = mdastChildrenToLatex(node.children);
      if (level <= 2) return `\\section*{${content}}\n\n`;
      if (level === 3) return `\\subsection*{${content}}\n\n`;
      return `\\paragraph{${content}}\n\n`;
    }
    default:
      if (node.value) {
        return `${escapeLatexText(String(node.value))}\n\n`;
      }
      return mdastChildrenToLatex(node.children) + "\n\n";
  }
}

function renderMdastToLatex(children: MdastNode[] | undefined): string {
  if (!children || children.length === 0) return "";
  return children.map(mdastBlockToLatex).join("");
}

function renderEntityToLatex(entity: VeraEntity): string {
  const { name, attributes, children, data } = entity;
  switch (name) {
    case "section_block":
      return `\\section{${escapeLatexText(String(attributes.title ?? "Untitled Section"))}}\n\n`;
    case "interpretation": {
      const term = escapeLatexText(String(attributes.term ?? "Interpretation"));
      const content = renderMdastToLatex(children);
      return `\\paragraph{Interpretation (${term})}\n${content}\n`;
    }
    case "para":
      return renderMdastToLatex(children);
    case "definition": {
      const term = escapeLatexText(String(attributes.term ?? "Definition"));
      const statement = attributes.statement ? escapeLatexText(String(attributes.statement)) : "";
      const content = renderMdastToLatex(children);
      return `\\paragraph{Definition (${term})} ${statement}\n\n${content}`;
    }
    case "rule_def": {
      const defName = escapeLatexText(String(attributes.defName ?? "Rule"));
      const label = attributes.label ? escapeLatexText(String(attributes.label)) : "";
      const content = renderMdastToLatex(children);
      const formula = data?.formula ? String(data.formula) : "";
      const description = data?.description ? String(data.description) : "";
      return `\\paragraph{${defName}${label ? ` (${label})` : ""}}\n${content || `${formula ? `\\begin{verbatim}\n${formula}\n\\end{verbatim}\n` : ""}${description ? `${escapeLatexText(description)}\n\n` : ""}`}\n`;
    }
    case "guarantee_block": {
      const defName = escapeLatexText(String(attributes.defName ?? "G"));
      const label = escapeLatexText(String(attributes.label ?? ""));
      return `\\paragraph{Guarantee ${defName}${label ? ` - ${label}` : ""}}\n\n`;
    }
    case "theorem_block": {
      const variant = String(attributes.variant ?? "theorem");
      const label = attributes.label ? escapeLatexText(String(attributes.label)) : "";
      const content = renderMdastToLatex(children);
      const formula = data?.formula ? String(data.formula) : "";
      const title = `${variant.charAt(0).toUpperCase() + variant.slice(1)}${label ? `: ${label}` : ""}`;
      return `\\paragraph{${escapeLatexText(title)}}\n${content || `${formula ? `\\begin{verbatim}\n${formula}\n\\end{verbatim}\n` : ""}`}\n`;
    }
    case "proof_block":
      return `\\paragraph{Proof.}\n${renderMdastToLatex(children)}\\hfill $\\square$\n\n`;
    case "formula_block": {
      const text = children?.map((child) => child.value ?? "").join("\n") ?? "";
      return `\\[\n${text}\n\\]\n\n`;
    }
    case "admonition_block": {
      const title = escapeLatexText(String(attributes.title ?? attributes.variant ?? "Note"));
      const content = renderMdastToLatex(children);
      return `\\paragraph{${title}} ${content}\n`;
    }
    case "code_block": {
      const content = children?.map((child) => child.value ?? "").join("\n") ?? String(data?.content ?? "");
      return `\\begin{verbatim}\n${content}\n\\end{verbatim}\n\n`;
    }
    case "table_block": {
      const text = children?.map((child) => child.value ?? "").join("\n") ?? "";
      const parsed = parseMarkdownTable(text);
      if (!parsed) {
        return `\\begin{verbatim}\n${text}\n\\end{verbatim}\n\n`;
      }
      const cols = "l".repeat(parsed.headers.length);
      const header = parsed.headers.map((cell) => escapeLatexText(cell)).join(" & ");
      const rows = parsed.rows
        .map((row) => row.map((cell) => escapeLatexText(cell ?? "")).join(" & "))
        .join(" \\\\\n");
      return `\\begin{tabular}{${cols}}\n${header} \\\\\n${rows}\n\\end{tabular}\n\n`;
    }
    case "quote_block": {
      const content = renderMdastToLatex(children);
      const attribution = attributes.attribution ? escapeLatexText(String(attributes.attribution)) : "";
      return `\\begin{quote}\n${content}${attribution ? `\\hfill -- ${attribution}\n` : ""}\\end{quote}\n\n`;
    }
    case "example_block":
      return `\\paragraph{${escapeLatexText(String(attributes.label ?? "Example"))}} ${renderMdastToLatex(children)}\n`;
    case "exercise_block":
      return `\\paragraph{${escapeLatexText(String(attributes.label ?? "Exercise"))}} ${renderMdastToLatex(children)}\n`;
    case "claim_block":
      return `\\paragraph{Claim${attributes.strength ? ` (${escapeLatexText(String(attributes.strength))})` : ""}} ${renderMdastToLatex(children)}\n`;
    case "evidence_block":
      return `\\paragraph{Evidence${attributes.kind ? ` (${escapeLatexText(String(attributes.kind))})` : ""}} ${renderMdastToLatex(children)}\n`;
    case "gap_block":
      return `\\paragraph{Gap (${escapeLatexText(String(attributes.kind ?? "unknown"))})} ${renderMdastToLatex(children)}\n`;
    default:
      return renderMdastToLatex(children);
  }
}

function buildVeraLatexDocument(doc: VeraDocument): string {
  const title = escapeLatexText(doc.frontmatter?.title ?? "VERA Document");
  const groups = groupEntitiesBySections(doc.entities);
  const referencesMeta = findReferencesSectionMeta(doc.entities);
  const referenceIntro: VeraEntity[] = [];
  const bodyParts: string[] = [];

  for (const group of groups) {
    const isReferencesSection = group.section && referencesMeta?.ids.has(group.section.localId);
    if (group.section && !isReferencesSection) {
      bodyParts.push(renderEntityToLatex(group.section));
    }
    for (const entity of group.entities) {
      if (entity.name === "reference_def") continue;
      if (referencesMeta?.ids.has(String(entity.attributes.refs ?? ""))) {
        referenceIntro.push(entity);
        continue;
      }
      bodyParts.push(renderEntityToLatex(entity));
    }
  }

  const references = doc.entities.filter((entity) => entity.name === "reference_def");
  if (references.length > 0) {
    const introText = referenceIntro.map((entity) => renderEntityToLatex(entity)).join("");
    const items = references
      .map((ref) => {
        const titleText = escapeLatexText(String(ref.attributes.title ?? "Reference"));
        const author = ref.attributes.author ? escapeLatexText(String(ref.attributes.author)) : "";
        const year = ref.attributes.year ? escapeLatexText(String(ref.attributes.year)) : "";
        const venue = ref.attributes.journal ?? ref.attributes.booktitle ?? ref.attributes.publisher ?? ref.attributes.note ?? "";
        const venueText = venue ? escapeLatexText(String(venue)) : "";
        const details = [author, year, venueText].filter(Boolean).join(". ");
        return `\\item ${titleText}${details ? `. ${details}` : ""}`;
      })
      .join("\n");
    bodyParts.push(`\\section*{References}\n${introText}\\begin{itemize}\n${items}\n\\end{itemize}\n\n`);
  }

  return `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{hyperref}
\\title{${title}}
\\date{}
\\begin{document}
\\maketitle
${bodyParts.join("")}
\\end{document}
`;
}

// =============================================================================
// CLI Entry Point
// =============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: tsx scripts/vera2html.ts <input.vera.json> [output.html]");
    console.log("       tsx scripts/vera2html.ts docs/vera/*.vera.json");
    process.exit(1);
  }

  for (const inputPath of args) {
    if (!inputPath.endsWith(".json")) continue;

    try {
      const raw = await readFile(inputPath, "utf-8");
      const doc = JSON.parse(raw) as VeraDocument;

      const html = renderVeraDocument(doc);

      const outputPath = inputPath.replace(/\.vera\.json$/, ".html").replace(/\.json$/, ".html");
      await writeFile(outputPath, html, "utf-8");
      console.log(`Wrote ${outputPath}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Error processing ${inputPath}: ${message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
