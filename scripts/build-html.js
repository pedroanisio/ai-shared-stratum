const { readFile, writeFile } = require("fs/promises");
const path = require("path");

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");
const OUTPUT_PATH = path.join(ROOT, "docs", "stratum-v.2.5.html");

let REFERENCE_MAP = new Map();
let TEMPLATE_CONTEXT = {};

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
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function applyRenderTemplates(text) {
  return text.replace(/render\(\s*([a-zA-Z_]\w*)\s*,\s*\"([^\"]+)\"\s*\)/g, (match, objName, path) => {
    const root = TEMPLATE_CONTEXT[objName];
    if (!root) return match;
    const value = path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), root);
    if (value === undefined) return match;
    return renderTemplateValue(value);
  });
}

function applyReferenceMap(text) {
  return text.replace(/referenceMap\(\"([^\"]+)\"\s*,\s*([^\)]*)\)/g, (match, id, template) => {
    const ref = REFERENCE_MAP.get(id);
    if (!ref) return match;
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

function renderInlineWithRefs(input) {
  const withMarkers = applyReferenceMap(applyRenderTemplates(input));
  const rendered = renderInline(withMarkers);
  return rendered.replace(/\[\[REF\|([^|]+)\|([\s\S]*?)\]\]/g, (match, id, content) => {
    return `<a class="ref-link" href="#${escapeHtml(id)}">${content}</a>`;
  });
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
    } else {
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

function renderContent(items) {
  if (!items || items.length === 0) return "";
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
          return `<dl>${item.items
            .map(
              (entry) =>
                `<dt>${renderInlineWithRefs(entry.term)}</dt><dd>${renderTextBlocks(
                  entry.definition
                )}</dd>`
            )
            .join("")}</dl>`;
        case "list":
          return `<ul>${item.items
            .map((entry) => `<li>${renderTextBlocks(entry)}</li>`)
            .join("")}</ul>`;
        case "admonition":
          return `<div class="admonition admonition-${escapeHtml(
            item.level
          )}"><p>${renderInlineWithRefs(item.text).replace(
            /\n/g,
            "<br>"
          )}</p></div>`;
        case "reference":
          return `<div class="reference"><p><strong>${renderInlineWithRefs(
            item.key
          )}</strong>${item.rating ? ` <em>${renderInlineWithRefs(item.rating)}</em>` : ""}</p><p>${renderInlineWithRefs(
            item.citation
          )}</p>${
            item.use ? `<p><em>${renderInlineWithRefs(item.use)}</em></p>` : ""
          }</div>`;
        case "code": {
          const lines = Array.isArray(item.lines) ? item.lines.join("\n") : "";
          const language = item.language ? ` class="language-${escapeHtml(item.language)}"` : "";
          return `<pre><code${language}>${escapeHtml(lines)}</code></pre>`;
        }
        case "definition": {
          const label = renderInlineWithRefs(item.label ?? "");
          const body = item.text ? renderTextBlocks(item.text) : "";
          return `<div class="definition"><p><strong>${label}</strong></p>${body}</div>`;
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
          const description = item.description ? renderTextBlocks(item.description) : "";
          const formula = item.formula ? escapeHtml(item.formula) : "";
          return `<div class="guarantee"><p><strong>${label}</strong></p>${description}<pre><code>${formula}</code></pre></div>`;
        }
        case "operation": {
          const label = renderInlineWithRefs(item.label ?? "");
          const signature = item.signature ? escapeHtml(item.signature) : "";
          const semantics = item.semantics ? renderTextBlocks(item.semantics) : "";
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
              return `<div class="profile-layer"><p><strong>${renderInlineWithRefs(
                key
              )}</strong></p><ul>${itemsHtml}</ul></div>`;
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
          const columns = Array.isArray(item.columns) ? item.columns : [];
          const rows = Array.isArray(item.rows) ? item.rows : [];
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
          return `<div class="table"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
        }
        case "diagram": {
          const format = (item.format || "").toLowerCase();
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

function renderSection(node, number, level) {
  const headingLevel = Math.min(6, Math.max(2, level));
  const label = number ? `${number} ${node.title ?? ""}`.trim() : node.title ?? "";
  const anchor = label
    ? `<h${headingLevel} id="${escapeHtml(node.id)}">${renderInline(
        label
      )}<a class="anchor" href="#${escapeHtml(node.id)}">#</a></h${headingLevel}>`
    : "";
  const overview = node.overview ? `<p>${renderInlineWithRefs(node.overview)}</p>` : "";
  const content = renderContent(node.content);
  const children = (node.children || [])
    .map((child) => {
      const childNumber = number && child.suffix ? `${number}.${child.suffix}` : undefined;
      return renderSection(child, childNumber, headingLevel + 1);
    })
    .join("\n");

  return `<section>${anchor}\n${overview}\n${content}\n${children}</section>`;
}

function renderTOC(sections) {
  const items = sections
    .map((entry) => {
      const label = `${entry.number ?? ""} ${entry.title ?? ""}`.trim();
      const href = `#${entry.contentRef.replace(/\.json$/, "")}`;
      return `<li><a href="${escapeHtml(href)}">${renderInline(label)}</a></li>`;
    })
    .join("");

  return `<nav class="toc"><div class="toc-header"><h2>Contents</h2><button class="toc-toggle" type="button">Switch side</button></div><ul>${items}</ul></nav>`;
}

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

function buildDocumentStats(index, sections) {
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
  const indexRaw = await readFile(INDEX_PATH, "utf-8");
  const index = JSON.parse(indexRaw);

  const docTitle = index.title ?? "STRATUM";
  const sections = await Promise.all(
    index.sections.map(async (entry) => {
      const sectionPath = path.join(SECTIONS_DIR, entry.contentRef);
      const sectionRaw = await readFile(sectionPath, "utf-8");
      const section = JSON.parse(sectionRaw);
      return { entry, section };
    })
  );

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

  const sectionsHtml = sections.map(({ entry, section }) => {
    return renderSection(section, entry.number, 2);
  });

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(docTitle)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        line-height: 1.5;
        color: #1c1c1c;
        background: #f7f5f2;
      }
      body {
        margin: 0;
        padding: 48px 24px 80px;
      }
      main {
        max-width: 920px;
        margin: 0 auto;
        background: #ffffff;
        padding: 32px;
        border-radius: 16px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.08);
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
      dl { margin: 1rem 0; }
      dt { font-weight: 600; margin-top: 0.6rem; }
      dd { margin-left: 1rem; margin-bottom: 0.4rem; }
      code {
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        background: #f2efea;
        padding: 0 0.2em;
        border-radius: 4px;
      }
      pre {
        background: #f2efea;
        padding: 0.9rem 1rem;
        border-radius: 8px;
        overflow-x: auto;
      }
      pre code {
        background: transparent;
        padding: 0;
        display: block;
        white-space: pre;
      }
      .diagram {
        background: #eef4ff;
        border-left: 4px solid #3f6fd3;
        padding: 0.9rem 1rem;
        border-radius: 8px;
        font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
        white-space: pre;
      }
      ul { padding-left: 1.4rem; }
      .admonition {
        border-left: 4px solid #d67f00;
        background: #fff7eb;
        padding: 0.8rem 1rem;
        margin: 1rem 0;
      }
      .admonition-note { border-left-color: #3f6fd3; background: #eef4ff; }
      .admonition-important { border-left-color: #b92d2d; background: #ffecec; }
      .reference {
        border: 1px solid #e1ddd6;
        background: #fbfaf8;
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
        border: 1px solid #e1ddd6;
        background: #fbfaf8;
        padding: 0.8rem 1rem;
        margin: 0.8rem 0;
        border-radius: 10px;
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
        border: 1px solid #e1ddd6;
        padding: 0.4rem 0.6rem;
        text-align: left;
      }
      th {
        background: #f1ede6;
      }
      .toc {
        background: #fbfaf8;
        border: 1px solid #e1ddd6;
        padding: 1rem 1.2rem;
        border-radius: 12px;
        margin: 1.5rem 0 2rem;
        max-width: 360px;
      }
      .toc-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .toc-toggle {
        border: 1px solid #d1ccc4;
        background: #fff;
        color: #2c2a27;
        border-radius: 999px;
        padding: 0.3rem 0.8rem;
        cursor: pointer;
        font-size: 0.85rem;
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
      .toc li {
        break-inside: avoid;
        margin: 0.4rem 0;
      }
      .toc a {
        color: #2c2a27;
        text-decoration: none;
      }
      .toc a:hover {
        text-decoration: underline;
      }
      .ref-link {
        color: #2c2a27;
        text-decoration: underline dotted;
      }
      .toc ul {
        max-height: none;
        overflow: visible;
      }
      body.toc-floating main {
        padding-right: 360px;
      }
      body.toc-floating {
        padding-left: 0;
      }
      body.toc-floating .toc {
        position: fixed;
        top: 24px;
        width: 320px;
        max-height: calc(100vh - 48px);
        overflow: auto;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
      }
      body.toc-right.toc-floating .toc {
        right: 24px;
        left: auto;
      }
      body.toc-left.toc-floating .toc {
        left: 24px;
        right: auto;
      }
      body.toc-left.toc-floating main {
        padding-left: 360px;
        padding-right: 32px;
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
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(docTitle)}</h1>
      ${index.description ? `<p>${renderInline(index.description)}</p>` : ""}
      ${renderTOC(index.sections)}
      ${sectionsHtml.join("\n")}
    </main>
    <script>
      (function () {
        var threshold = 360;
        var positionKey = "toc-position";
        var toc = document.querySelector(".toc");
        var toggle = toc ? toc.querySelector(".toc-toggle") : null;

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

        function toggleToc() {
          if (window.scrollY > threshold) {
            document.body.classList.add("toc-floating");
          } else {
            document.body.classList.remove("toc-floating");
          }
        }
        window.addEventListener("scroll", toggleToc, { passive: true });
        toggleToc();
      })();
      if (window.mermaid && window.mermaid.initialize) {
        window.mermaid.initialize({ startOnLoad: true });
      }
    </script>
  </body>
</html>`;

  await writeFile(OUTPUT_PATH, html, "utf-8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
