"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escapeHtml = escapeHtml;
exports.renderInline = renderInline;
exports.renderTemplateValue = renderTemplateValue;
exports.applyRenderTemplates = applyRenderTemplates;
exports.applyReferenceMap = applyReferenceMap;
exports.applyDefinitionLinks = applyDefinitionLinks;
exports.renderInlineWithRefs = renderInlineWithRefs;
exports.applyReferenceMapLatex = applyReferenceMapLatex;
exports.escapeLatex = escapeLatex;
exports.renderLatexInline = renderLatexInline;
exports.renderLatexTextBlocks = renderLatexTextBlocks;
exports.renderLatexContent = renderLatexContent;
exports.renderLatexSection = renderLatexSection;
exports.renderDefinitionEntriesLatex = renderDefinitionEntriesLatex;
exports.buildLatexDocument = buildLatexDocument;
exports.renderTextBlocks = renderTextBlocks;
exports.renderContent = renderContent;
exports.renderDefinitionEntries = renderDefinitionEntries;
exports.renderCover = renderCover;
exports.toRoman = toRoman;
exports.formatPartLabel = formatPartLabel;
exports.formatPartSectionRange = formatPartSectionRange;
exports.formatPartLabelWithRange = formatPartLabelWithRange;
exports.renderSection = renderSection;
exports.renderTOC = renderTOC;
exports.renderPartsContent = renderPartsContent;
exports.countContentTypes = countContentTypes;
exports.mergeCounts = mergeCounts;
exports.walkChildren = walkChildren;
exports.buildDocumentStats = buildDocumentStats;
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const ROOT = path_1.default.resolve(process.cwd());
const SECTIONS_DIR = path_1.default.join(ROOT, "docs", "sections");
const INDEX_PATH = path_1.default.join(SECTIONS_DIR, "index.json");
const OUTPUT_PATH = path_1.default.join(ROOT, "docs", "stratum-v.2.5.html");
let REFERENCE_MAP = new Map();
let TEMPLATE_CONTEXT = {};
let DEF_LINK_MAP = new Map();
function escapeHtml(input) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function renderInline(input) {
    const escaped = escapeHtml(input);
    const strong = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    const code = strong.replace(/`([^`]+)`/g, "<code>$1</code>");
    return code;
}
function renderTemplateValue(value) {
    if (value === null || value === undefined)
        return "";
    if (Array.isArray(value))
        return value.join(", ");
    if (typeof value === "object")
        return JSON.stringify(value);
    return String(value);
}
function applyRenderTemplates(text) {
    return text.replace(/render\(\s*([a-zA-Z_]\w*)\s*,\s*\"([^\"]+)\"\s*\)/g, (match, objName, path) => {
        const root = TEMPLATE_CONTEXT[objName];
        if (!root)
            return match;
        const value = path
            .split(".")
            .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), root);
        if (value === undefined)
            return match;
        return renderTemplateValue(value);
    });
}
function applyReferenceMap(text) {
    return text.replace(/referenceMap\(\"([^\"]+)\"\s*,\s*([^\)]*)\)/g, (match, id, template) => {
        const ref = REFERENCE_MAP.get(id);
        if (!ref)
            return match;
        let tpl = template.trim();
        if ((tpl.startsWith("\"") && tpl.endsWith("\"")) || (tpl.startsWith("'") && tpl.endsWith("'"))) {
            tpl = tpl.slice(1, -1);
        }
        const filled = tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, key) => {
            return ref[key] ?? placeholder;
        });
        return `[[REF|${id}|${filled}]]`;
    });
}
function applyDefinitionLinks(text) {
    const withLegacy = text.replace(/Definition\s+§?(\d+)\.(\d+)(?:\s*\([^)]+\))?/g, (match, sectionNumber, defIndex) => {
        const key = `${Number(sectionNumber)}.${Number(defIndex)}`;
        const defId = DEF_LINK_MAP.get(key);
        if (!defId)
            return match;
        return `[[DEF|${defId}|${match}]]`;
    });
    return withLegacy.replace(/DEF:\s*§(\d+)-DEF-(\d+)-[A-Z0-9_]+/g, (match, sectionNumber, defIndex) => {
        const key = `${Number(sectionNumber)}.${Number(defIndex)}`;
        const defId = DEF_LINK_MAP.get(key);
        if (!defId)
            return match;
        return `[[DEF|${defId}|${match}]]`;
    });
}
function renderInlineWithRefs(input) {
    const withMarkers = applyDefinitionLinks(applyReferenceMap(applyRenderTemplates(input)));
    const rendered = renderInline(withMarkers);
    const withDefLinks = rendered.replace(/\[\[DEF\|([^|]+)\|([\s\S]*?)\]\]/g, (match, id, content) => {
        return `<a class="ref-link" href="#${escapeHtml(id)}">${content}</a>`;
    });
    return withDefLinks.replace(/\[\[REF\|([^|]+)\|([\s\S]*?)\]\]/g, (match, id, content) => {
        return `<a class="ref-link" href="#${escapeHtml(id)}">${content}</a>`;
    });
}
function applyReferenceMapLatex(text) {
    return text.replace(/referenceMap\(\"([^\"]+)\"\s*,\s*([^\)]*)\)/g, (match, id, template) => {
        const ref = REFERENCE_MAP.get(id);
        if (!ref)
            return match;
        let tpl = template.trim();
        if ((tpl.startsWith("\"") && tpl.endsWith("\"")) || (tpl.startsWith("'") && tpl.endsWith("'"))) {
            tpl = tpl.slice(1, -1);
        }
        return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, key) => {
            return ref[key] ?? placeholder;
        });
    });
}
function escapeLatex(input) {
    return input
        .replace(/\\/g, "\\textbackslash{}")
        .replace(/([{}$&%#_])/g, "\\$1")
        .replace(/\^/g, "\\textasciicircum{}")
        .replace(/~/g, "\\textasciitilde{}");
}
function renderLatexInline(input) {
    const processed = applyReferenceMapLatex(applyRenderTemplates(input));
    const escaped = escapeLatex(processed);
    const bold = escaped.replace(/\*\*(.+?)\*\*/g, "\\textbf{$1}");
    const code = bold.replace(/`([^`]+)`/g, "\\texttt{$1}");
    return code;
}
function renderLatexTextBlocks(text) {
    const fenceRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    const parts = [];
    while ((match = fenceRegex.exec(text)) !== null) {
        const before = text.slice(lastIndex, match.index);
        if (before.trim()) {
            parts.push(`${renderLatexInline(before.replace(/\n+/g, " "))}\n`);
        }
        const code = match[2] || "";
        parts.push(`\\begin{verbatim}\n${code}\n\\end{verbatim}\n`);
        lastIndex = fenceRegex.lastIndex;
    }
    const remaining = text.slice(lastIndex);
    if (remaining.trim()) {
        parts.push(`${renderLatexInline(remaining.replace(/\n+/g, " "))}\n`);
    }
    return parts.join("\n");
}
function renderLatexContent(items) {
    if (!items || items.length === 0)
        return "";
    return items
        .map((item) => {
        switch (item.type) {
            case "heading": {
                const level = Math.min(6, Math.max(1, item.level));
                const title = renderLatexInline(item.text);
                if (level <= 2)
                    return `\\subsection{${title}}`;
                if (level === 3)
                    return `\\subsubsection{${title}}`;
                if (level === 4)
                    return `\\paragraph{${title}}`;
                return `\\subparagraph{${title}}`;
            }
            case "paragraph":
                return renderLatexTextBlocks(item.text);
            case "definition-list": {
                const items = item.items
                    .map((entry) => `\\item[${renderLatexInline(entry.term)}] ${renderLatexTextBlocks(entry.definition)}`)
                    .join("\n");
                return `\\begin{description}\n${items}\n\\end{description}`;
            }
            case "list": {
                const items = item.items
                    .map((entry) => (typeof entry === "string" ? `\\item ${renderLatexTextBlocks(entry)}` : ""))
                    .join("\n");
                return `\\begin{itemize}\n${items}\n\\end{itemize}`;
            }
            case "admonition": {
                const label = item.level.toUpperCase();
                return `\\begin{quote}\\textbf{${escapeLatex(label)}:} ${renderLatexInline(item.text)}\\end{quote}`;
            }
            case "reference": {
                const key = renderLatexInline(item.key);
                const citation = renderLatexInline(item.citation);
                const rating = item.rating ? ` (${renderLatexInline(item.rating)})` : "";
                const use = item.use ? `\\\\${renderLatexInline(item.use)}` : "";
                return `\\begin{quote}\\textbf{${key}}${rating}\\\\${citation}${use}\\end{quote}`;
            }
            case "code": {
                const lines = Array.isArray(item.lines)
                    ? item.lines.join("\n")
                    : "";
                return `\\begin{verbatim}\n${lines}\n\\end{verbatim}`;
            }
            case "definition":
            case "rule":
            case "theorem":
            case "guarantee":
            case "operation": {
                const label = renderLatexInline(item.label ?? "");
                const bodyKey = item.type === "definition" ? "text" : item.type === "operation" ? "semantics" : "formula";
                const bodyValue = item[bodyKey];
                const body = typeof bodyValue === "string" ? renderLatexTextBlocks(bodyValue) : "";
                return `\\begin{quote}\\textbf{${label}}\\\\${body}\\end{quote}`;
            }
            case "profile": {
                const label = renderLatexInline(item.label ?? "");
                const layers = item.layers || {};
                const layerBlocks = Object.entries(layers)
                    .map(([key, values]) => {
                    const items = Array.isArray(values)
                        ? values.map((val) => `\\item ${renderLatexInline(String(val))}`).join("\n")
                        : "";
                    return `\\item[${renderLatexInline(key)}] \\begin{itemize}\n${items}\n\\end{itemize}`;
                })
                    .join("\n");
                return `\\begin{description}\n\\item[${label}] \\begin{description}\n${layerBlocks}\n\\end{description}\n\\end{description}`;
            }
            case "checklist": {
                const label = renderLatexInline(item.label ?? "");
                const items = (item.items || [])
                    .map((entry) => `\\item ${renderLatexInline(String(entry))}`)
                    .join("\n");
                return `\\begin{quote}\\textbf{${label}}\\\\\\begin{itemize}\n${items}\n\\end{itemize}\\end{quote}`;
            }
            case "table": {
                const columns = Array.isArray(item.columns)
                    ? item.columns
                    : [];
                const rows = Array.isArray(item.rows)
                    ? item.rows
                    : [];
                const colSpec = columns.map(() => "l").join(" | ");
                const head = columns.map((col) => renderLatexInline(String(col))).join(" & ");
                const body = rows
                    .map((row) => row.map((cell) => renderLatexInline(String(cell))).join(" & "))
                    .join(" \\\\\n");
                return `\\begin{longtable}{${colSpec}}\n${head} \\\\\n\\hline\n${body}\n\\end{longtable}`;
            }
            case "diagram": {
                const content = item.content ? String(item.content) : "";
                return `\\begin{verbatim}\n${content}\n\\end{verbatim}`;
            }
            default:
                return "";
        }
    })
        .filter(Boolean)
        .join("\n\n");
}
function renderLatexSection(node, number, level) {
    const label = number ? `${number} ${node.title ?? ""}`.trim() : node.title ?? "";
    const title = renderLatexInline(label);
    const headingLevel = Math.min(6, Math.max(2, level));
    const safeLabel = node.id.replace(/[^a-zA-Z0-9:-]+/g, "-");
    let heading = "";
    if (headingLevel === 2)
        heading = `\\section{${title}}\\label{${safeLabel}}`;
    else if (headingLevel === 3)
        heading = `\\subsection{${title}}\\label{${safeLabel}}`;
    else if (headingLevel === 4)
        heading = `\\subsubsection{${title}}\\label{${safeLabel}}`;
    else if (headingLevel === 5)
        heading = `\\paragraph{${title}}\\label{${safeLabel}}`;
    else
        heading = `\\subparagraph{${title}}\\label{${safeLabel}}`;
    const overview = node.overview ? `${renderLatexInline(node.overview)}\n` : "";
    const defs = renderDefinitionEntriesLatex(node.defs);
    const content = renderLatexContent(node.content);
    const children = (node.children || [])
        .map((child) => {
        const childNumber = number && child.suffix ? `${number}.${child.suffix}` : undefined;
        return renderLatexSection(child, childNumber, headingLevel + 1);
    })
        .join("\n\n");
    return [heading, overview, defs, content, children].filter(Boolean).join("\n\n");
}
function renderDefinitionEntriesLatex(defs) {
    if (!defs || defs.length === 0)
        return "";
    const items = defs
        .map((entry) => {
        if (!entry || typeof entry !== "object")
            return "";
        const record = entry;
        const key = typeof record.key === "string" ? record.key : "";
        const value = typeof record.value === "string" ? record.value : "";
        if (!key && !value)
            return "";
        return `\\item[${renderLatexInline(key)}] ${renderLatexTextBlocks(value)}`;
    })
        .filter(Boolean)
        .join("\n");
    return `\\begin{description}\n${items}\n\\end{description}`;
}
function buildLatexDocument(index, sections) {
    const title = index.title ? renderLatexInline(index.title) : "Document";
    const subtitle = index.subtitle ? renderLatexInline(index.subtitle) : "";
    const authors = Array.isArray(index.meta?.authors) ? renderLatexInline(index.meta?.authors.join(", ")) : "";
    const date = index.meta?.generatedAt ? renderLatexInline(index.meta.generatedAt) : "";
    const body = index.parts && index.parts.length > 0
        ? renderPartsContentLatex(index.parts, sections)
        : sections
            .map(({ entry, section }) => renderLatexSection(section, entry.number?.toString(), 2))
            .join("\n\n");
    const cover = buildLatexCover(index);
    const definitions = buildDefinitionsSectionLatex(sections);
    const subtitleLine = subtitle ? `\\\\${subtitle}` : "";
    const authorLine = authors ? `\\author{${authors}}` : "";
    const dateLine = date ? `\\date{${date}}` : "\\date{}";
    return [
        "\\documentclass{article}",
        "\\usepackage[utf8]{inputenc}",
        "\\usepackage[T1]{fontenc}",
        "\\usepackage{geometry}",
        "\\usepackage{hyperref}",
        "\\usepackage{longtable}",
        "\\usepackage{graphicx}",
        "\\usepackage{enumitem}",
        "\\usepackage{amsmath}",
        "\\usepackage{amssymb}",
        "\\geometry{margin=1in}",
        "\\begin{document}",
        `\\title{${title}${subtitleLine}}`,
        authorLine,
        dateLine,
        "\\maketitle",
        cover,
        body,
        definitions,
        "\\end{document}",
    ]
        .filter(Boolean)
        .join("\n");
}
function renderPartsContentLatex(parts, sections) {
    const sectionMap = new Map(sections.map(({ entry, section }) => [entry.id, { entry, section }]));
    const used = new Set();
    const partsContent = parts
        .map((part) => {
        const label = formatPartLabelWithRange(part, new Map(sections.map(({ entry }) => [entry.id, entry])));
        const partHeading = `\\section*{${renderLatexInline(label)}}`;
        const partSections = part.sections
            .map((sectionId) => {
            used.add(sectionId);
            const entry = sectionMap.get(sectionId)?.entry;
            const section = sectionMap.get(sectionId)?.section;
            if (!entry || !section)
                return "";
            return renderLatexSection(section, entry.number?.toString(), 2);
        })
            .join("\n\n");
        return [partHeading, partSections].filter(Boolean).join("\n\n");
    })
        .join("\n\n");
    const remaining = sections.filter(({ entry }) => !used.has(entry.id));
    if (remaining.length === 0)
        return partsContent;
    const extra = remaining
        .map(({ entry, section }) => renderLatexSection(section, entry.number?.toString(), 2))
        .join("\n\n");
    return [partsContent, "\\section*{Other Sections}", extra].filter(Boolean).join("\n\n");
}
function buildLatexCover(index) {
    const abstractText = index.meta?.abstract
        ? renderLatexTextBlocks(String(index.meta.abstract))
        : "";
    const details = [
        ["Version", index.version],
        ["Namespace", index.namespace],
        ["Document Type", index.documentType],
        ["Structure", index.documentStruct],
        ["Created", index.meta?.createdAt],
        ["Updated", index.meta?.updatedAt],
        ["Generated", index.meta?.generatedAt],
        ["Authors", Array.isArray(index.meta?.authors) ? index.meta?.authors.join(", ") : undefined],
        ["Domains", Array.isArray(index.meta?.domains) ? index.meta?.domains.join(", ") : undefined],
        ["Keywords", Array.isArray(index.meta?.keywords) ? index.meta?.keywords.join(", ") : undefined],
    ].filter((row) => row[1]);
    const metaLines = details
        .map(([label, value]) => `\\item[${escapeLatex(String(label))}] ${renderLatexInline(String(value))}`)
        .join("\n");
    const metaBlock = metaLines ? `\\section*{Document Metadata}\n\\begin{description}\n${metaLines}\n\\end{description}` : "";
    const abstractBlock = abstractText
        ? `\\section*{Abstract}\n${abstractText}`
        : "";
    return [metaBlock, abstractBlock].filter(Boolean).join("\n\n");
}
function buildDefinitionsSectionLatex(sections) {
    const allDefs = [];
    for (const { entry, section } of sections) {
        const defs = extractDefinitions(section, entry.id, entry.number);
        defs.forEach((def) => {
            allDefs.push({
                ...def,
                rootId: entry.id,
                rootNumber: entry.number,
                rootTitle: entry.title,
            });
        });
    }
    if (allDefs.length === 0)
        return "";
    const items = allDefs
        .map((def) => {
        const label = renderLatexInline(def.label);
        const origin = def.rootTitle ? renderLatexInline(def.rootTitle) : "";
        return `\\item ${label}${origin ? ` (${origin})` : ""}`;
    })
        .join("\n");
    return `\\section*{Definitions}\n\\begin{itemize}\n${items}\n\\end{itemize}`;
}
function renderTextBlocks(text) {
    const fenceRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    const parts = [];
    while ((match = fenceRegex.exec(text)) !== null) {
        const before = text.slice(lastIndex, match.index);
        if (before.trim()) {
            parts.push(`<p>${renderInlineWithRefs(before).replace(/\n/g, "<br>")}</p>`);
        }
        const language = match[1] || "";
        const code = match[2] || "";
        if (language.toLowerCase() === "mermaid" || language.toLowerCase() === "diagram") {
            parts.push(`<div class="diagram mermaid">${escapeHtml(code)}</div>`);
        }
        else {
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
function renderContent(items, context) {
    if (!items || items.length === 0)
        return "";
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
                return `<dl class="definition-list">${item.items
                    .map((entry) => `<dt>${renderInlineWithRefs(entry.term)}</dt><dd>${renderTextBlocks(entry.definition)}</dd>`)
                    .join("")}</dl>`;
            case "list": {
                const listItem = item;
                const tag = listItem.ordered ? "ol" : "ul";
                const renderListItem = (entry) => {
                    if (typeof entry === "string") {
                        return `<li>${renderTextBlocks(entry)}</li>`;
                    }
                    if (entry && typeof entry === "object" && entry.type === "list") {
                        return `<li>${renderContent([entry], context)}</li>`;
                    }
                    return "";
                };
                return `<${tag}>${listItem.items.map(renderListItem).join("")}</${tag}>`;
            }
            case "admonition":
                return `<div class="admonition admonition-${escapeHtml(item.level)}"><p>${renderInlineWithRefs(item.text).replace(/\n/g, "<br>")}</p></div>`;
            case "reference":
                return `<div class="reference"><p><strong>${renderInlineWithRefs(item.key)}</strong>${item.rating ? ` <em>${renderInlineWithRefs(item.rating)}</em>` : ""}</p><p>${renderInlineWithRefs(item.citation)}</p>${item.use ? `<p><em>${renderInlineWithRefs(item.use)}</em></p>` : ""}</div>`;
            case "code": {
                const codeItem = item;
                const highlightSet = new Set(codeItem.highlight || []);
                const linesHtml = (codeItem.lines || [])
                    .map((line, i) => {
                    const lineNum = i + 1;
                    const cls = highlightSet.has(lineNum) ? ' class="highlight"' : "";
                    return `<span${cls}>${escapeHtml(line)}</span>`;
                })
                    .join("\n");
                const language = codeItem.language
                    ? ` class="language-${escapeHtml(codeItem.language)}"`
                    : "";
                const filenameHeader = codeItem.filename
                    ? `<div class="code-filename">${escapeHtml(codeItem.filename)}</div>`
                    : "";
                const caption = codeItem.caption
                    ? `<figcaption>${renderInlineWithRefs(codeItem.caption)}</figcaption>`
                    : "";
                return `<figure class="code-block">${filenameHeader}<pre><code${language}>${linesHtml}</code></pre>${caption}</figure>`;
            }
            case "definition": {
                const labelRaw = item.label ?? "";
                const title = extractDefinitionTitle(labelRaw);
                let labelText = labelRaw;
                const rootSectionId = context?.rootSectionId ?? "";
                const rootSectionNumber = context?.rootSectionNumber;
                const counters = context?.definitionCounters;
                if (rootSectionId && counters) {
                    const next = (counters.get(rootSectionId) ?? 0) + 1;
                    counters.set(rootSectionId, next);
                    labelText = formatDefinitionLabel(rootSectionId, rootSectionNumber, next, title);
                }
                const label = renderInlineWithRefs(labelText);
                const body = item.text ? renderTextBlocks(item.text) : "";
                const defId = item.id ? ` id="${escapeHtml(item.id)}"` : "";
                const anchor = item.id
                    ? `<a class="anchor" href="#${escapeHtml(item.id)}" aria-label="Definition link">#</a>`
                    : "";
                return `<div class="definition"${defId}><p class="definition-title"><strong>${label}</strong>${anchor}</p>${body}</div>`;
            }
            case "rule": {
                const label = renderInlineWithRefs(item.label ?? "");
                const formula = item.formula ? escapeHtml(item.formula) : "";
                return `<div class="rule"><p><strong>${label}</strong></p><pre><code>${formula}</code></pre></div>`;
            }
            case "theorem": {
                const label = renderInlineWithRefs(item.label ?? "");
                const formula = item.formula ? escapeHtml(item.formula) : "";
                return `<div class="theorem"><p><strong>${label}</strong></p><pre><code>${formula}</code></pre></div>`;
            }
            case "guarantee": {
                const label = renderInlineWithRefs(item.label ?? "");
                const description = item.description
                    ? renderTextBlocks(item.description)
                    : "";
                const formula = item.formula ? escapeHtml(item.formula) : "";
                return `<div class="guarantee"><p><strong>${label}</strong></p>${description}<pre><code>${formula}</code></pre></div>`;
            }
            case "operation": {
                const label = renderInlineWithRefs(item.label ?? "");
                const signature = item.signature
                    ? escapeHtml(item.signature)
                    : "";
                const semantics = item.semantics
                    ? renderTextBlocks(item.semantics)
                    : "";
                return `<div class="operation"><p><strong>${label}</strong></p><pre><code>${signature}</code></pre>${semantics}</div>`;
            }
            case "profile": {
                const label = renderInlineWithRefs(item.label ?? "");
                const layers = item.layers || {};
                const layerBlocks = Object.entries(layers)
                    .map(([key, values]) => {
                    const itemsHtml = Array.isArray(values)
                        ? values.map((val) => `<li>${renderInlineWithRefs(String(val))}</li>`).join("")
                        : "";
                    return `<div class="profile-layer"><p><strong>${renderInlineWithRefs(key)}</strong></p><ul>${itemsHtml}</ul></div>`;
                })
                    .join("");
                return `<div class="profile"><p><strong>${label}</strong></p>${layerBlocks}</div>`;
            }
            case "checklist": {
                const label = renderInlineWithRefs(item.label ?? "");
                const itemsHtml = (item.items || [])
                    .map((entry) => `<li>${renderInlineWithRefs(String(entry))}</li>`)
                    .join("");
                return `<div class="checklist"><p><strong>${label}</strong></p><ul>${itemsHtml}</ul></div>`;
            }
            case "table": {
                const tableItem = item;
                const columns = Array.isArray(tableItem.columns) ? tableItem.columns : [];
                const rows = Array.isArray(tableItem.rows) ? tableItem.rows : [];
                const caption = tableItem.caption
                    ? `<caption>${renderInlineWithRefs(tableItem.caption)}</caption>`
                    : "";
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
                return `<div class="table"><table>${caption}<thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
            }
            case "diagram": {
                const format = String(item.format || "").toLowerCase();
                const content = item.content ? String(item.content) : "";
                const caption = item.caption ? renderInlineWithRefs(item.caption) : "";
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
function renderDefinitionEntries(defs) {
    if (!defs || defs.length === 0)
        return "";
    const normalizeList = (value) => {
        if (!Array.isArray(value))
            return [];
        return value.map((entry) => String(entry));
    };
    const renderList = (label, items) => {
        if (!items.length)
            return "";
        const listItems = items.map((entry) => `<li>${renderInlineWithRefs(entry)}</li>`).join("");
        return `<div class="def-list"><p><strong>${escapeHtml(label)}</strong></p><ul>${listItems}</ul></div>`;
    };
    const blocks = defs
        .map((entry) => {
        if (!entry || typeof entry !== "object")
            return "";
        const record = entry;
        const kind = typeof record.kind === "string" ? record.kind : "definition";
        const number = typeof record.number === "string" ? record.number : "";
        const name = (typeof record.name === "string" && record.name) ||
            (typeof record.label === "string" && record.label) ||
            (typeof record.id === "string" && record.id) ||
            "";
        const title = [number, name].filter(Boolean).join(" ");
        const description = typeof record.description === "string" ? renderTextBlocks(record.description) : "";
        const syntax = typeof record.syntax === "string" ? record.syntax : "";
        const signature = typeof record.signature === "string" ? record.signature : "";
        const conclusion = typeof record.conclusion === "string" ? record.conclusion : "";
        const premises = normalizeList(record.premises);
        const values = normalizeList(record.values);
        const changeTypes = normalizeList(record.change_types);
        const compatibleChanges = normalizeList(record.compatible_changes);
        const breakingChanges = normalizeList(record.breaking_changes);
        const category = typeof record.category === "string" ? record.category : "";
        const proofSketch = typeof record.proof_sketch === "string" ? renderTextBlocks(record.proof_sketch) : "";
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
    if (!blocks)
        return "";
    return `<div class="def-stack">${blocks}</div>`;
}
function renderCover(index) {
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
            <a class="cover-link" href="document-graph-3d.html">View 3D Graph</a>
            <button class="cover-link" id="export-latex" type="button">Export LaTeX</button>
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
function toRoman(value) {
    const numerals = [
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
function formatPartLabel(part) {
    if (typeof part.number === "number") {
        const roman = toRoman(part.number);
        const title = part.title ?? part.id;
        return `PART ${roman}: ${title}`;
    }
    return part.title ?? part.id;
}
function formatPartSectionRange(part, sectionMap) {
    const numbers = part.sections
        .map((id) => sectionMap.get(id)?.number)
        .filter((value) => typeof value === "number")
        .sort((a, b) => a - b);
    if (numbers.length === 0)
        return "";
    const first = numbers[0];
    const last = numbers[numbers.length - 1];
    return first === last ? `§${first}` : `§${first}–${last}`;
}
function formatPartLabelWithRange(part, sectionMap) {
    const label = formatPartLabel(part);
    const range = formatPartSectionRange(part, sectionMap);
    return range ? `${label} (${range})` : label;
}
function renderSection(node, number, level, rootSectionId, rootSectionNumber, definitionCounters) {
    const headingLevel = Math.min(6, Math.max(2, level));
    const label = number ? `${number} ${node.title ?? ""}`.trim() : node.title ?? "";
    const rootAttr = rootSectionId ? ` data-root-section="${escapeHtml(rootSectionId)}"` : "";
    const heading = label
        ? `<h${headingLevel} id="${escapeHtml(node.id)}"${rootAttr}>${renderInline(label)}<a class="anchor" href="#${escapeHtml(node.id)}">#</a><button class="copy-link" data-id="${escapeHtml(node.id)}" type="button" title="Copy link" aria-label="Copy link"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></h${headingLevel}>`
        : "";
    const overview = node.overview ? `<p>${renderInlineWithRefs(node.overview)}</p>` : "";
    const defs = renderDefinitionEntries(node.defs);
    const content = renderContent(node.content, {
        rootSectionId,
        rootSectionNumber,
        definitionCounters,
    });
    const children = (node.children || [])
        .map((child) => {
        const childNumber = number && child.suffix ? `${number}.${child.suffix}` : undefined;
        return renderSection(child, childNumber, headingLevel + 1, rootSectionId, rootSectionNumber, definitionCounters);
    })
        .join("\n");
    return `<section>${heading}\n${overview}\n${defs}\n${content}\n${children}</section>`;
}
function renderTOC(index) {
    const sectionMap = new Map(index.sections.map((entry) => [entry.id, entry]));
    let items = "";
    if (index.parts && index.parts.length > 0) {
        const used = new Set();
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
        }
        else {
            items = partItems;
        }
    }
    else {
        items = index.sections
            .map((entry) => {
            const label = `${entry.number ?? ""} ${entry.title ?? ""}`.trim();
            const href = `#${entry.contentRef.replace(/\.json$/, "")}`;
            return `<li><a href="${escapeHtml(href)}">${renderInline(label)}</a></li>`;
        })
            .join("");
    }
    const definitionsEntry = `<li class="toc-part"><span>References</span><ul><li><a href="#definitions">Definitions</a></li></ul></li>`;
    return `<nav class="toc"><div class="toc-header"><div class="toc-title"><h2>Contents</h2><input class="toc-search" type="search" placeholder="Filter sections" aria-label="Filter table of contents" /></div><button class="toc-toggle" type="button">Switch side</button></div><ul>${items}${definitionsEntry}</ul></nav>`;
}
function renderPartsContent(parts, sectionMap) {
    const used = new Set();
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
            return renderSection(section, entry.number, 3, entry.id, entry.number, new Map());
        })
            .join("\n");
        const partHeading = `<h2 id="${escapeHtml(part.id)}">${renderInline(label)}<a class="anchor" href="#${escapeHtml(part.id)}">#</a><button class="copy-link" data-id="${escapeHtml(part.id)}" type="button" title="Copy link" aria-label="Copy link"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button></h2>`;
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
        if (!entry || !section)
            return "";
        return renderSection(section, entry.number, 2, entry.id, entry.number, new Map());
    })
        .join("\n");
    return `${partsHtml}\n<section class="part"><h2>Other Sections</h2>\n${extraSections}</section>`;
}
function countContentTypes(content) {
    const counts = {};
    for (const item of content || []) {
        const type = item?.type || "unknown";
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
function buildDocumentStats(index, sections) {
    const sectionMap = new Map(index.sections.map((entry) => [entry.id, entry]));
    const sectionStats = [];
    const totalContentTypes = {};
    let totalSubCount = 0;
    let totalContentItems = 0;
    for (const { entry, section } of sections) {
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
        sectionsById: sectionStats.reduce((acc, entry) => {
            acc[entry.id] = {
                id: entry.id,
                number: entry.number,
                title: entry.title,
            };
            return acc;
        }, {}),
        parts: index.parts && index.parts.length > 0
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
        partsSummaryText: index.parts && index.parts.length > 0
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
function extractDefinitionTitle(label) {
    const match = label.match(/\(([^)]+)\)\s*$/);
    if (match)
        return match[1].trim();
    return label.replace(/^Definition\s+/i, "").trim();
}
function slugifyDefinitionLabel(label) {
    return label
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .replace(/_{2,}/g, "_")
        .toUpperCase();
}
function formatDefinitionNumber(value) {
    if (value === undefined || value === null)
        return "";
    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
        return asNumber < 10 ? `0${asNumber}` : String(asNumber);
    }
    return String(value);
}
function formatDefinitionLabel(rootSectionId, sectionNumber, index, title) {
    const sectionText = formatDefinitionNumber(sectionNumber);
    const suffix = `DEF-${formatDefinitionNumber(index)}`;
    const label = slugifyDefinitionLabel(title ? title : "Definition");
    return `DEF: §${sectionText}-${suffix}-${label}`;
}
function extractDefinitions(section, rootSectionId, rootSectionNumber) {
    const entries = [];
    let definitionIndex = 0;
    const collectFromNode = (node) => {
        const defs = Array.isArray(node.defs) ? node.defs : [];
        for (const entry of defs) {
            if (!entry || typeof entry !== "object")
                continue;
            const record = entry;
            const label = typeof record.key === "string" ? record.key : "";
            if (!label)
                continue;
            entries.push({
                id: typeof record.id === "string" ? record.id : undefined,
                label,
                labelHtml: renderInlineWithRefs(label),
                text: typeof record.value === "string" ? record.value : undefined,
                source: "defs",
            });
        }
        const contentItems = Array.isArray(node.content) ? node.content : [];
        for (const item of contentItems) {
            if (!item || typeof item !== "object")
                continue;
            const record = item;
            if (record.type !== "definition")
                continue;
            const label = typeof record.label === "string" ? record.label : "";
            if (!label)
                continue;
            definitionIndex += 1;
            const title = extractDefinitionTitle(label);
            const numberedLabel = formatDefinitionLabel(rootSectionId, rootSectionNumber, definitionIndex, title);
            entries.push({
                id: typeof record.id === "string" ? record.id : undefined,
                label: numberedLabel,
                labelHtml: renderInlineWithRefs(numberedLabel),
                text: typeof record.text === "string" ? record.text : undefined,
                source: "content",
            });
        }
        const children = Array.isArray(node.children) ? node.children : [];
        for (const child of children) {
            collectFromNode(child);
        }
    };
    collectFromNode(section);
    return entries;
}
function buildDefinitionsSection(sections) {
    const allDefs = [];
    for (const { entry, section } of sections) {
        const defs = extractDefinitions(section, entry.id, entry.number);
        defs.forEach((def) => {
            allDefs.push({
                ...def,
                rootId: entry.id,
                rootNumber: entry.number,
                rootTitle: entry.title,
            });
        });
    }
    if (allDefs.length === 0) {
        return "";
    }
    const items = allDefs
        .map((def) => {
        const label = def.labelHtml || def.label || "Definition";
        const anchor = def.id ? `#${escapeHtml(def.id)}` : `#${escapeHtml(def.rootId)}`;
        const sectionRef = def.rootId
            ? renderInlineWithRefs(`referenceMap("${def.rootId}", "§{{sectionNumber}}")`)
            : "";
        const sectionTitle = def.rootTitle ? renderInlineWithRefs(def.rootTitle) : "";
        const origin = sectionRef || sectionTitle ? `<span class="def-origin">${sectionRef} ${sectionTitle}</span>` : "";
        return `<li><a href="${anchor}">${label}</a>${origin}</li>`;
    })
        .join("");
    return `
      <section class="definitions-index">
        <h2 id="definitions">Definitions<a class="anchor" href="#definitions">#</a></h2>
        <ul>${items}</ul>
      </section>
    `;
}
function makeExportFilename(title) {
    const base = (title ?? "document")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return `${base || "document"}.tex`;
}
async function main() {
    const indexRaw = await (0, promises_1.readFile)(INDEX_PATH, "utf-8");
    const index = JSON.parse(indexRaw);
    const docTitle = index.title ?? "STRATUM";
    const sections = await Promise.all(index.sections.map(async (entry) => {
        const sectionPath = path_1.default.join(SECTIONS_DIR, entry.contentRef);
        try {
            const sectionRaw = await (0, promises_1.readFile)(sectionPath, "utf-8");
            const section = JSON.parse(sectionRaw);
            return { entry, section };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(`Failed to load section "${entry.contentRef}": ${message}`);
        }
    }));
    REFERENCE_MAP = new Map();
    TEMPLATE_CONTEXT = { documentStats: buildDocumentStats(index, sections) };
    for (const { entry, section } of sections) {
        REFERENCE_MAP.set(section.id, {
            sectionNumber: entry.number ?? "",
            sectionName: entry.title ?? "",
            suffix: "",
            suffixName: "",
        });
        const walk = (node) => {
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
    DEF_LINK_MAP = new Map();
    for (const { entry, section } of sections) {
        if (entry.number === undefined)
            continue;
        let defIndex = 0;
        const walkDefs = (node) => {
            const items = Array.isArray(node.content) ? node.content : [];
            for (const item of items) {
                if (!item || typeof item !== "object")
                    continue;
                const record = item;
                if (record.type !== "definition")
                    continue;
                defIndex += 1;
                const id = typeof record.id === "string" ? record.id : "";
                if (id) {
                    DEF_LINK_MAP.set(`${entry.number}.${defIndex}`, id);
                }
            }
            const children = Array.isArray(node.children) ? node.children : [];
            for (const child of children) {
                walkDefs(child);
            }
        };
        walkDefs(section);
    }
    const sectionMap = new Map(sections.map(({ entry, section }) => [entry.id, { entry, section }]));
    const sectionsHtml = index.parts && index.parts.length > 0
        ? renderPartsContent(index.parts, sectionMap)
        : sections
            .map(({ entry, section }) => {
            return renderSection(section, entry.number, 2, entry.id, entry.number, new Map());
        })
            .join("\n");
    const coverHtml = renderCover(index);
    const sectionInfo = index.sections.reduce((acc, entry) => {
        const section = sectionMap.get(entry.id)?.section;
        const definitions = section ? extractDefinitions(section, entry.id, entry.number) : [];
        acc[entry.id] = {
            id: entry.id,
            number: entry.number,
            title: entry.title,
            contentRef: entry.contentRef,
            definitions,
        };
        return acc;
    }, {});
    const definitionsHtml = buildDefinitionsSection(sections);
    const latexContent = buildLatexDocument(index, sections);
    const latexFilename = makeExportFilename(index.title);
    // Check if any section contains mermaid diagrams
    const hasMermaid = sections.some(({ section }) => JSON.stringify(section).includes('"format":"mermaid"'));
    const mermaidScript = hasMermaid
        ? '<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>'
        : "";
    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(docTitle)}</title>
    ${mermaidScript}
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        line-height: 1.55;
        color: #1f1b16;
        background: #f5f2ec;
        --bg: #f5f2ec;
        --surface: #fffdf9;
        --surface-strong: #ffffff;
        --ink: #1f1b16;
        --muted: #6b6257;
        --accent: #1f6b5a;
        --accent-2: #c1552c;
        --border: #e1ddd6;
        --shadow: rgba(19, 16, 12, 0.12);
        --code-bg: #f1ede6;
        --soft: #fbfaf8;
        --highlight: rgba(31, 107, 90, 0.12);
      }
      body {
        margin: 0;
        padding: 56px 24px 96px;
        color: var(--ink);
        background: var(--bg);
        position: relative;
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        background:
          radial-gradient(circle at 12% 8%, rgba(31, 107, 90, 0.14), transparent 55%),
          radial-gradient(circle at 85% 15%, rgba(193, 85, 44, 0.14), transparent 50%),
          linear-gradient(180deg, #fff7ec 0%, #f5f2ec 55%, #f2eee6 100%);
        z-index: -2;
      }
      body::after {
        content: "";
        position: fixed;
        inset: 0;
        background-image:
          linear-gradient(transparent 94%, rgba(0, 0, 0, 0.03) 95%),
          linear-gradient(90deg, transparent 94%, rgba(0, 0, 0, 0.03) 95%);
        background-size: 48px 48px;
        opacity: 0.35;
        z-index: -1;
        pointer-events: none;
      }
      @keyframes riseIn {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      main {
        max-width: 980px;
        margin: 0 auto;
        background: var(--surface-strong);
        padding: 36px;
        border-radius: 20px;
        box-shadow: 0 32px 90px rgba(19, 16, 12, 0.12);
        position: relative;
        animation: riseIn 0.6s ease-out;
      }
      .cover {
        margin: 0 0 3rem;
        padding: 28px;
        border-radius: 20px;
        background: linear-gradient(135deg, #fdf6ea 0%, #e6f3ee 55%, #faefe7 100%);
        animation: riseIn 0.7s ease-out;
      }
      .cover-surface {
        background: rgba(255, 255, 255, 0.92);
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 14px 36px rgba(19, 16, 12, 0.12);
      }
      .cover-eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-size: 0.72rem;
        color: var(--muted);
        margin: 0 0 0.6rem;
      }
      .cover-title {
        font-size: 2.8rem;
        margin: 0 0 0.5rem;
      }
      .cover-subtitle {
        font-size: 1.2rem;
        color: var(--muted);
        margin: 0 0 0.8rem;
      }
      .cover-description {
        font-size: 1rem;
        margin: 0 0 1.4rem;
        max-width: 60ch;
        color: #4a453f;
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
        color: var(--ink);
        font-weight: 600;
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 0.4rem 0.9rem;
        background: var(--surface-strong);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .cover-link:hover {
        background: #f1ede6;
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(31, 27, 22, 0.12);
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
      section.part > section + section {
        border-top: 1px solid transparent;
        border-image: linear-gradient(90deg, transparent 10%, #e1ddd6 30%, #e1ddd6 70%, transparent 90%) 1;
        padding-top: 3rem;
        margin-top: 2.5rem;
        position: relative;
      }
      section.part > section + section::before {
        content: "§";
        position: absolute;
        top: -0.7em;
        left: 50%;
        transform: translateX(-50%);
        background: var(--surface-strong);
        padding: 0 0.8rem;
        color: #c1bbb3;
        font-size: 1.1rem;
      }
      section.part > section > h3 {
        border-left: 4px solid var(--accent);
        padding-left: 1rem;
        margin-left: -1rem;
        padding-top: 0.2rem;
        padding-bottom: 0.2rem;
      }
      dl { margin: 1rem 0; }
      dt { font-weight: 600; margin-top: 0.6rem; }
      dd { margin-left: 1rem; margin-bottom: 0.4rem; }
      code {
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        background: var(--code-bg);
        padding: 0 0.2em;
        border-radius: 4px;
      }
      pre {
        background: var(--code-bg);
        padding: 0.9rem 1rem;
        border-radius: 10px;
        overflow-x: auto;
        box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.04);
      }
      pre code {
        background: transparent;
        padding: 0;
        display: block;
        white-space: pre;
      }
      pre code span.highlight {
        background: rgba(255, 243, 205, 0.8);
        display: block;
        margin: 0 -1rem;
        padding: 0 1rem;
        border-left: 3px solid #c77a1c;
      }
      .code-block {
        margin: 1rem 0;
      }
      .code-block pre {
        margin: 0;
      }
      .code-filename {
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        font-size: 0.85rem;
        color: var(--muted);
        background: #e9e5df;
        padding: 0.4rem 1rem;
        border-radius: 10px 10px 0 0;
        border-bottom: 1px solid var(--border);
      }
      .code-filename + pre {
        border-radius: 0 0 10px 10px;
      }
      .diagram {
        background: #e7f2ef;
        border-left: 4px solid var(--accent);
        padding: 0.9rem 1rem;
        border-radius: 8px;
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        white-space: pre;
      }
      ul { padding-left: 1.4rem; }
      .admonition {
        border-left: 4px solid #c77a1c;
        background: #fff4e1;
        padding: 0.8rem 1rem;
        margin: 1rem 0;
      }
      .admonition-note { border-left-color: var(--accent); background: #e7f2ef; }
      .admonition-important { border-left-color: #b24729; background: #ffebe6; }
      .reference {
        border: 1px solid var(--border);
        background: var(--soft);
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
        border: 1px solid var(--border);
        background: var(--soft);
        padding: 0.8rem 1rem;
        margin: 0.8rem 0;
        border-radius: 12px;
      }
      .definition-title {
        display: flex;
        align-items: baseline;
        gap: 0.35rem;
        flex-wrap: wrap;
        word-break: break-word;
      }
      .definitions-index {
        margin-top: 3rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border);
      }
      .definitions-index ul {
        list-style: none;
        padding: 0;
        margin: 1rem 0 0;
        display: grid;
        gap: 0.6rem;
      }
      .definitions-index li {
        background: var(--soft);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 0.6rem 0.8rem;
      }
      .definitions-index a {
        color: var(--ink);
        text-decoration: none;
        font-weight: 600;
      }
      .definitions-index a:hover {
        text-decoration: underline;
      }
      .def-origin {
        display: block;
        margin-top: 0.3rem;
        font-size: 0.85rem;
        color: var(--muted);
      }
      .definition .anchor {
        font-size: 0.85em;
        color: #9c9488;
        text-decoration: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .definition:hover .anchor {
        opacity: 1;
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
        border: 1px solid var(--border);
        padding: 0.4rem 0.6rem;
        text-align: left;
      }
      th {
        background: #f1ede6;
      }
      .toc {
        background: var(--soft);
        border: 1px solid var(--border);
        padding: 1rem 1.2rem;
        border-radius: 16px;
        margin: 1.5rem 0 2rem;
        max-width: 380px;
        box-shadow: 0 16px 40px rgba(19, 16, 12, 0.08);
      }
      .toc-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }
      .toc-title {
        flex: 1;
      }
      .toc-toggle {
        border: 1px solid var(--border);
        background: var(--surface-strong);
        color: var(--ink);
        border-radius: 999px;
        padding: 0.3rem 0.8rem;
        cursor: pointer;
        font-size: 0.85rem;
      }
      .toc-search {
        width: 100%;
        border: 1px solid var(--border);
        background: var(--surface-strong);
        border-radius: 999px;
        padding: 0.35rem 0.8rem;
        font-size: 0.85rem;
        color: var(--ink);
        margin-top: 0.4rem;
      }
      .toc-search:focus {
        outline: 2px solid rgba(31, 107, 90, 0.2);
        border-color: var(--accent);
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
        margin: 0.35rem 0;
      }
      .toc li a {
        display: inline-flex;
        align-items: baseline;
        gap: 0.35rem;
        padding: 0.18rem 0.4rem;
        border-radius: 8px;
        transition: background 0.2s ease, color 0.2s ease;
      }
      .toc li a:hover {
        background: rgba(31, 107, 90, 0.12);
        text-decoration: none;
      }
      .toc-part > span {
        display: block;
        font-weight: 600;
        margin-top: 0.6rem;
        color: var(--muted);
        letter-spacing: 0.02em;
      }
      .toc-hidden {
        display: none;
      }
      .def-stack {
        display: grid;
        gap: 1rem;
        margin: 1.4rem 0;
      }
      .def-block {
        border: 1px solid var(--border);
        background: var(--soft);
        padding: 1rem 1.2rem;
        border-radius: 12px;
      }
      .def-header {
        display: flex;
        gap: 0.6rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem;
        color: var(--muted);
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
      .definition-list {
        display: grid;
        grid-template-columns: minmax(180px, 240px) 1fr;
        gap: 0;
        margin: 1.4rem 0;
        background: var(--soft);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
      }
      .definition-list dt,
      .definition-list dd {
        padding: 0.8rem 1rem;
        margin: 0;
        border-bottom: 1px solid #e9e5df;
      }
      .definition-list dt {
        font-weight: 600;
        color: #3c3731;
        background: rgba(241, 237, 230, 0.5);
        border-right: 1px solid #e9e5df;
      }
      .definition-list dd {
        color: #4a453f;
      }
      .definition-list dt:last-of-type,
      .definition-list dd:last-of-type {
        border-bottom: none;
      }
      @media (max-width: 720px) {
        .definition-list {
          grid-template-columns: 1fr;
        }
        .definition-list dt {
          border-right: none;
          border-bottom: none;
          padding-bottom: 0.4rem;
        }
        .definition-list dd {
          padding-top: 0;
        }
      }
      .breadcrumb-links {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        overflow: hidden;
        white-space: nowrap;
      }
      .breadcrumb-actions {
        margin-left: auto;
        display: flex;
        gap: 0.4rem;
      }
      .breadcrumb-btn {
        border: 1px solid var(--border);
        background: var(--surface-strong);
        color: var(--ink);
        border-radius: 999px;
        padding: 0.25rem 0.7rem;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
      }
      .breadcrumb-btn:hover {
        background: #f1ede6;
      }
      .inspect-modal {
        position: fixed;
        right: clamp(16px, 3vw, 32px);
        top: 96px;
        width: min(360px, calc(100vw - 48px));
        background: var(--surface-strong);
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: 0 18px 50px rgba(19, 16, 12, 0.18);
        padding: 1rem 1.2rem;
        display: none;
        z-index: 41;
        max-height: calc(100vh - 140px);
        overflow: hidden;
      }
      .inspect-modal.active {
        display: block;
      }
      .inspect-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.6rem;
      }
      .inspect-modal h3 {
        margin: 0;
        font-size: 1.1rem;
      }
      .inspect-close {
        border: none;
        background: transparent;
        font-size: 1.4rem;
        line-height: 1;
        color: var(--muted);
        cursor: pointer;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
      }
      .inspect-close:hover {
        background: #f1ede6;
        color: #2c2a27;
      }
      .inspect-modal p {
        margin: 0.4rem 0;
        font-size: 0.95rem;
      }
      .inspect-content {
        max-height: calc(100vh - 240px);
        overflow: auto;
        padding-right: 0.4rem;
      }
      .inspect-defs {
        margin-top: 0.8rem;
        border-top: 1px solid var(--border);
        padding-top: 0.8rem;
      }
      .inspect-defs h4 {
        margin: 0 0 0.6rem;
        font-size: 0.95rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }
      .inspect-defs ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.4rem;
        max-height: 240px;
        overflow: auto;
        padding-right: 0.2rem;
      }
      .inspect-defs li {
        background: #f7f4ee;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.5rem 0.7rem;
      }
      .inspect-defs code {
        background: transparent;
        padding: 0;
      }
      .inspect-meta {
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        font-size: 0.85rem;
        color: #4a453f;
        background: #f7f5f2;
        border-radius: 8px;
        padding: 0.6rem 0.7rem;
        margin-top: 0.6rem;
        white-space: pre-wrap;
      }
      .inspect-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.8rem;
      }
      .inspect-copy {
        border: 1px solid var(--border);
        background: var(--surface-strong);
        color: var(--ink);
        border-radius: 999px;
        padding: 0.35rem 0.8rem;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
      }
      .inspect-copy:hover {
        background: #f1ede6;
      }
      .toc a {
        color: var(--ink);
        text-decoration: none;
      }
      .toc a:hover {
        text-decoration: underline;
      }
      .ref-link {
        color: var(--ink);
        text-decoration: underline dotted;
      }
      a:focus-visible,
      button:focus-visible,
      input:focus-visible {
        outline: 2px solid rgba(31, 107, 90, 0.5);
        outline-offset: 2px;
      }
      .progress-bar {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent), var(--accent-2));
        width: 0%;
        z-index: 200;
        transition: width 0.1s ease-out;
      }
      .back-to-top {
        position: fixed;
        bottom: 32px;
        right: 32px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--surface-strong);
        color: var(--ink);
        font-size: 1.4rem;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(19, 16, 12, 0.12);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.25s ease, visibility 0.25s ease, transform 0.2s ease;
        z-index: 90;
      }
      .back-to-top:hover {
        background: #f1ede6;
        transform: translateY(-2px);
      }
      .back-to-top.visible {
        opacity: 1;
        visibility: visible;
      }
      .toc a.active {
        color: var(--accent);
        font-weight: 600;
        background: rgba(31, 107, 90, 0.12);
        border-radius: 8px;
      }
      html {
        scroll-behavior: smooth;
      }
      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto;
        }
        .progress-bar {
          transition: none;
        }
        main,
        .cover {
          animation: none;
        }
      }
      .breadcrumb {
        position: fixed;
        top: 3px;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.92);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--border);
        padding: 0.6rem 1.2rem;
        font-size: 0.85rem;
        z-index: 100;
        transform: translateY(-100%);
        transition: transform 0.25s ease;
        box-shadow: 0 2px 8px rgba(19, 16, 12, 0.08);
      }
      .breadcrumb.visible {
        transform: translateY(0);
      }
      .breadcrumb-inner {
        max-width: 980px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        overflow: hidden;
        white-space: nowrap;
      }
      .breadcrumb-item {
        color: var(--muted);
        text-decoration: none;
        flex-shrink: 0;
      }
      .breadcrumb-item:hover {
        color: #2c2a27;
        text-decoration: underline;
      }
      .breadcrumb-item.current {
        color: var(--ink);
        font-weight: 600;
      }
      .breadcrumb-sep {
        color: #c1bbb3;
        flex-shrink: 0;
      }
      .breadcrumb-item.truncated {
        flex-shrink: 1;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .toc ul {
        max-height: none;
        overflow: visible;
      }
      body.toc-floating .toc {
        position: fixed;
        top: 24px;
        width: 320px;
        max-height: calc(100vh - 48px);
        overflow: auto;
        box-shadow: 0 12px 40px rgba(19, 16, 12, 0.18);
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      body.toc-floating .toc::before {
        content: "Outline";
        display: block;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--muted);
        margin-bottom: 0.5rem;
      }
      body.toc-right.toc-floating .toc {
        right: 24px;
        left: auto;
      }
      body.toc-left.toc-floating .toc {
        left: 24px;
        right: auto;
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
      .copy-link {
        margin-left: 0.3rem;
        color: #9c9488;
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.2s ease, color 0.2s ease;
        padding: 0.2rem;
        border-radius: 4px;
        vertical-align: middle;
        width: 1.2em;
        height: 1.2em;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .copy-link svg {
        width: 0.85em;
        height: 0.85em;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
        pointer-events: none;
      }
      .copy-link:hover {
        color: var(--accent);
        background: var(--highlight);
      }
      .copy-link.copied {
        color: #2d8a4e;
      }
      h2[id],
      h3[id],
      h4[id],
      h5[id],
      h6[id] {
        scroll-margin-top: 120px;
      }
      h2[id]:target,
      h3[id]:target,
      h4[id]:target,
      h5[id]:target,
      h6[id]:target {
        background: var(--highlight);
        border-radius: 12px;
        padding: 0.2rem 0.4rem;
      }
      h2:hover .copy-link,
      h3:hover .copy-link,
      h4:hover .copy-link,
      h5:hover .copy-link,
      h6:hover .copy-link {
        opacity: 1;
      }
      @media (max-width: 900px) {
        .cover-body {
          grid-template-columns: 1fr;
        }
        .cover-title {
          font-size: 2.2rem;
        }
        .toc ul {
          columns: 1;
        }
        body.toc-floating .toc {
          left: 16px;
          right: 16px;
          width: auto;
        }
        .inspect-modal {
          right: 16px;
          left: 16px;
          width: auto;
          top: 96px;
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
    <div class="progress-bar" id="progress-bar"></div>
    <button class="back-to-top" id="back-to-top" type="button" aria-label="Back to top">↑</button>
    <nav class="breadcrumb" aria-label="Current section">
      <div class="breadcrumb-inner">
        <div class="breadcrumb-links"></div>
        <div class="breadcrumb-actions">
          <button class="breadcrumb-btn" id="inspect-toggle" type="button">Inspect</button>
        </div>
      </div>
    </nav>
    <div class="inspect-modal" id="inspect-modal">
      <div class="inspect-header">
        <h3>Context Inspector</h3>
        <button class="inspect-close" id="inspect-close" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="inspect-content">
        <p id="inspect-title">No section detected</p>
        <p id="inspect-root"></p>
        <div class="inspect-meta" id="inspect-meta"></div>
        <div class="inspect-defs" id="inspect-defs"></div>
        <div class="inspect-actions">
          <button class="inspect-copy" id="inspect-copy" type="button">Copy</button>
        </div>
      </div>
    </div>
    <main>
      ${coverHtml}
      ${renderTOC(index)}
      ${sectionsHtml}
      ${definitionsHtml}
    </main>
    <script>
      var SECTION_INFO = ${JSON.stringify(sectionInfo)};
      var LATEX_CONTENT = ${JSON.stringify(latexContent)};
      var LATEX_FILENAME = ${JSON.stringify(latexFilename)};
      (function () {
        var threshold = 360;
        var positionKey = "toc-position";
        var toc = document.querySelector(".toc");
        var toggle = toc ? toc.querySelector(".toc-toggle") : null;
        var search = toc ? toc.querySelector(".toc-search") : null;

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

        if (toc && search) {
          var tocItems = Array.prototype.slice.call(toc.querySelectorAll("li"));
          tocItems.forEach(function (item) {
            var text = item.textContent ? item.textContent.toLowerCase() : "";
            item.setAttribute("data-toc-text", text);
          });

          function filterToc(query) {
            var q = query.trim().toLowerCase();
            tocItems.forEach(function (item) {
              item.classList.remove("toc-hidden");
            });
            if (!q) return;
            tocItems.forEach(function (item) {
              var text = item.getAttribute("data-toc-text") || "";
              if (text.indexOf(q) === -1) {
                item.classList.add("toc-hidden");
              }
            });
          }

          search.addEventListener("input", function () {
            filterToc(search.value || "");
          });
          search.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
              search.value = "";
              filterToc("");
            }
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

        // Breadcrumb logic
        var breadcrumb = document.querySelector(".breadcrumb");
        var breadcrumbInner = document.querySelector(".breadcrumb-inner");
        var breadcrumbLinks = document.querySelector(".breadcrumb-links");
        var sections = [];
        var headings = document.querySelectorAll("h2[id], h3[id], h4[id], h5[id], h6[id]");

        headings.forEach(function (heading) {
          var level = parseInt(heading.tagName.substring(1), 10);
          var id = heading.id;
          var text = heading.textContent.replace(/#$/, "").trim();
          sections.push({ el: heading, id: id, text: text, level: level });
        });

        function buildBreadcrumbTrail(currentIndex) {
          if (currentIndex < 0) return [];
          var trail = [];
          var current = sections[currentIndex];
          trail.unshift(current);
          var targetLevel = current.level;
          for (var i = currentIndex - 1; i >= 0; i--) {
            if (sections[i].level < targetLevel) {
              trail.unshift(sections[i]);
              targetLevel = sections[i].level;
            }
            if (targetLevel <= 2) break;
          }
          return trail;
        }

        function renderBreadcrumb(trail) {
          if (!breadcrumbInner || !breadcrumbLinks) return;
          if (trail.length === 0) {
            breadcrumbLinks.innerHTML = "";
            return;
          }
          var html = trail.map(function (item, idx) {
            var isLast = idx === trail.length - 1;
            var classes = "breadcrumb-item" + (isLast ? " current truncated" : "");
            var link = '<a class="' + classes + '" href="#' + item.id + '">' + item.text + "</a>";
            return idx > 0 ? '<span class="breadcrumb-sep">›</span>' + link : link;
          }).join("");
          breadcrumbLinks.innerHTML = html;
        }

        var lastIndex = -1;
        function updateBreadcrumb() {
          var scrollY = window.scrollY;
          var viewportTop = scrollY + 60;
          var currentIndex = -1;

          for (var i = sections.length - 1; i >= 0; i--) {
            var rect = sections[i].el.getBoundingClientRect();
            var top = rect.top + scrollY;
            if (top <= viewportTop) {
              currentIndex = i;
              break;
            }
          }

          if (scrollY > threshold) {
            breadcrumb.classList.add("visible");
          } else {
            breadcrumb.classList.remove("visible");
          }

          if (currentIndex !== lastIndex) {
            lastIndex = currentIndex;
            var trail = buildBreadcrumbTrail(currentIndex);
            renderBreadcrumb(trail);
          }
        }

        window.addEventListener("scroll", updateBreadcrumb, { passive: true });
        updateBreadcrumb();
      })();

      (function () {
        var exportBtn = document.getElementById("export-latex");
        if (!exportBtn) return;
        exportBtn.addEventListener("click", function () {
          if (!LATEX_CONTENT) return;
          var blob = new Blob([LATEX_CONTENT], { type: "application/x-latex" });
          var url = URL.createObjectURL(blob);
          var link = document.createElement("a");
          link.href = url;
          link.download = LATEX_FILENAME || "document.tex";
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(function () {
            URL.revokeObjectURL(url);
          }, 1000);
        });
      })();

      // Progress bar
      (function () {
        var progressBar = document.getElementById("progress-bar");
        function updateProgress() {
          var scrollTop = window.scrollY || document.documentElement.scrollTop;
          var docHeight = document.documentElement.scrollHeight - window.innerHeight;
          var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
          if (progressBar) {
            progressBar.style.width = progress + "%";
          }
        }
        window.addEventListener("scroll", updateProgress, { passive: true });
        updateProgress();
      })();

      // Back to top button
      (function () {
        var backToTop = document.getElementById("back-to-top");
        var showThreshold = 400;
        function toggleBackToTop() {
          if (window.scrollY > showThreshold) {
            backToTop.classList.add("visible");
          } else {
            backToTop.classList.remove("visible");
          }
        }
        if (backToTop) {
          backToTop.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
          });
          window.addEventListener("scroll", toggleBackToTop, { passive: true });
          toggleBackToTop();
        }
      })();

      // TOC current section highlighting
      (function () {
        var toc = document.querySelector(".toc");
        if (!toc) return;
        var tocLinks = toc.querySelectorAll("a[href^=\\"#\\"]");
        var tocMap = {};
        tocLinks.forEach(function (link) {
          var href = link.getAttribute("href");
          if (href && href.startsWith("#")) {
            tocMap[href.substring(1)] = link;
          }
        });

        var headings = document.querySelectorAll("h2[id], h3[id]");
        var sectionIds = [];
        headings.forEach(function (heading) {
          var rootSection = heading.getAttribute("data-root-section");
          if (rootSection && sectionIds.indexOf(rootSection) === -1) {
            sectionIds.push(rootSection);
          }
        });

        function updateTocHighlight() {
          var scrollY = window.scrollY;
          var viewportTop = scrollY + 100;
          var activeId = null;

          headings.forEach(function (heading) {
            var rect = heading.getBoundingClientRect();
            var top = rect.top + scrollY;
            if (top <= viewportTop) {
              var rootSection = heading.getAttribute("data-root-section");
              if (rootSection) {
                activeId = rootSection;
              }
            }
          });

          tocLinks.forEach(function (link) {
            link.classList.remove("active");
          });

          if (activeId && tocMap[activeId]) {
            tocMap[activeId].classList.add("active");
          }
        }

        window.addEventListener("scroll", updateTocHighlight, { passive: true });
        updateTocHighlight();
      })();

      if (window.mermaid && window.mermaid.initialize) {
        window.mermaid.initialize({ startOnLoad: true });
      }

      // Copy section content buttons
      (function () {
        var copyIcon = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        var checkIcon = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';

        function getSectionContent(id) {
          var heading = document.getElementById(id);
          if (!heading) return "";
          var section = heading.closest("section");
          if (!section) return heading.textContent || "";
          var clone = section.cloneNode(true);
          var buttons = clone.querySelectorAll(".copy-link, .anchor");
          buttons.forEach(function (btn) { btn.remove(); });
          return clone.textContent || "";
        }

        document.addEventListener("click", function (e) {
          var btn = e.target.closest(".copy-link");
          if (!btn) return;
          var id = btn.getAttribute("data-id");
          if (!id) return;
          var content = getSectionContent(id).trim().replace(/\\s+/g, " ").replace(/^ | $/gm, "");
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(content).then(function () {
              btn.classList.add("copied");
              btn.innerHTML = checkIcon;
              setTimeout(function () {
                btn.classList.remove("copied");
                btn.innerHTML = copyIcon;
              }, 1500);
            });
          }
        });
      })();
    </script>
    <script>
      (function () {
        var inspectToggle = document.getElementById("inspect-toggle");
        var inspectModal = document.getElementById("inspect-modal");
        var inspectClose = document.getElementById("inspect-close");
        var inspectTitle = document.getElementById("inspect-title");
        var inspectRoot = document.getElementById("inspect-root");
        var inspectMeta = document.getElementById("inspect-meta");
        var inspectDefs = document.getElementById("inspect-defs");
        var inspectCopy = document.getElementById("inspect-copy");

        function getActiveHeading() {
          var headings = document.querySelectorAll("h2[id], h3[id], h4[id], h5[id], h6[id]");
          var active = null;
          var minOffset = Infinity;
          headings.forEach(function (heading) {
            var rect = heading.getBoundingClientRect();
            if (rect.top <= 140 && Math.abs(rect.top) < minOffset) {
              minOffset = Math.abs(rect.top);
              active = heading;
            }
          });
          return active;
        }

        function updateInspect() {
          var active = getActiveHeading();
          if (!active) {
            inspectTitle.textContent = "No section detected";
            inspectRoot.textContent = "";
            inspectMeta.textContent = "";
            if (inspectDefs) {
              inspectDefs.innerHTML = "";
            }
            return;
          }
          var rootId = active.getAttribute("data-root-section") || active.id;
          var section = SECTION_INFO[rootId];
          var headingText = active.textContent ? active.textContent.replace(/#$/, "").trim() : active.id;
          var scrollTop = window.scrollY || document.documentElement.scrollTop;
          var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          var percent = maxScroll > 0 ? Math.round((scrollTop / maxScroll) * 100) : 0;

          inspectTitle.textContent = headingText;
          inspectRoot.textContent = section
            ? "Section: " + (section.number ? section.number + " " : "") + (section.title || section.id)
            : "Section: " + rootId;
          inspectMeta.textContent =
            "Heading ID: " + active.id + "\\n" +
            "Root section ID: " + rootId + "\\n" +
            (section ? "Content file: docs/sections/" + section.contentRef + "\\n" : "") +
            "Anchor: " + window.location.pathname.split("/").pop() + "#" + active.id + "\\n" +
            "Scroll: " + percent + "%";
          if (inspectDefs) {
            var defs = section && Array.isArray(section.definitions) ? section.definitions : [];
            if (defs.length === 0) {
              inspectDefs.innerHTML = "";
            } else {
              var list = defs.map(function (def) {
                var label = def.labelHtml || def.label || "Definition";
                var id = def.id ? "<code>" + def.id + "</code> " : "";
                var link = def.id ? "<a href=\\\"#" + def.id + "\\\">" + label + "</a>" : label;
                return "<li>" + id + link + "</li>";
              }).join("");
              inspectDefs.innerHTML = "<h4>Definitions</h4><ul>" + list + "</ul>";
            }
          }
        }

        if (inspectToggle) {
          inspectToggle.addEventListener("click", function () {
            inspectModal.classList.toggle("active");
            updateInspect();
          });
        }

        if (inspectClose) {
          inspectClose.addEventListener("click", function () {
            inspectModal.classList.remove("active");
          });
        }

        if (inspectCopy) {
          inspectCopy.addEventListener("click", function () {
            var text = [inspectTitle.textContent, inspectRoot.textContent, inspectMeta.textContent]
              .filter(Boolean)
              .join("\\n");
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(text);
            }
          });
        }

        window.addEventListener("scroll", function () {
          if (inspectModal.classList.contains("active")) {
            updateInspect();
          }
        }, { passive: true });

        window.addEventListener("resize", function () {
          if (inspectModal.classList.contains("active")) {
            updateInspect();
          }
        });
      })();
    </script>
  </body>
</html>`;
    await (0, promises_1.writeFile)(OUTPUT_PATH, html, "utf-8");
    console.log(`Wrote ${OUTPUT_PATH}`);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
