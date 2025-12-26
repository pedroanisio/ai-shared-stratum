#!/usr/bin/env node
import { readFile, writeFile } from "fs/promises";
import path from "path";

const ROOT = path.resolve(process.cwd());
const SECTIONS_DIR = path.join(ROOT, "docs", "sections");
const INDEX_PATH = path.join(SECTIONS_DIR, "index.json");
const OUTPUT_PATH = path.join(ROOT, "docs", "document-graph.html");

type IndexSection = {
  id: string;
  number?: number;
  title?: string;
  contentRef: string;
};

type IndexPart = {
  id: string;
  number?: number;
  title?: string;
  sections: string[];
};

type IndexFile = {
  title?: string;
  parts?: IndexPart[];
  sections: IndexSection[];
};

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function renderMermaid(index: IndexFile): string {
  const sectionMap = new Map(index.sections.map((entry) => [entry.id, entry]));
  const lines: string[] = ["flowchart TD"]; 

  if (index.parts && index.parts.length > 0) {
    for (const part of index.parts) {
      const partId = safeId(part.id);
      const partLabel = part.title ? `PART ${part.number ?? ""} ${part.title}`.trim() : part.id;
      lines.push(`  ${partId}["${partLabel}"]`);
      for (const sectionId of part.sections) {
        const entry = sectionMap.get(sectionId);
        const sectionLabel = entry?.title ? `${entry.number ?? ""} ${entry.title}`.trim() : sectionId;
        const nodeId = safeId(sectionId);
        lines.push(`  ${nodeId}["${sectionLabel}"]`);
        lines.push(`  ${partId} --> ${nodeId}`);
      }
    }
  } else {
    const rootId = "Document";
    lines.push(`  ${rootId}["Document"]`);
    for (const entry of index.sections) {
      const sectionLabel = entry.title ? `${entry.number ?? ""} ${entry.title}`.trim() : entry.id;
      const nodeId = safeId(entry.id);
      lines.push(`  ${nodeId}["${sectionLabel}"]`);
      lines.push(`  ${rootId} --> ${nodeId}`);
    }
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  const indexRaw = await readFile(INDEX_PATH, "utf8");
  const index = JSON.parse(indexRaw) as IndexFile;
  const title = index.title ?? "Document Graph";
  const graph = renderMermaid(index);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} - Graph</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
        background: #f7f5f2;
        color: #1c1c1c;
      }
      body {
        margin: 0;
        padding: 40px 24px 60px;
        min-height: 100vh;
      }
      body.fullscreen {
        padding: 0;
        background: #ffffff;
      }
      main {
        max-width: 1600px;
        margin: 0 auto;
        background: #ffffff;
        padding: 28px;
        border-radius: 16px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.08);
      }
      body.fullscreen main {
        max-width: none;
        margin: 0;
        min-height: 100vh;
        border-radius: 0;
        box-shadow: none;
      }
      h1 {
        font-family: "IBM Plex Serif", "Georgia", serif;
        margin: 0 0 0.6rem;
      }
      p {
        margin: 0 0 1.4rem;
        color: #4a453f;
      }
      .mermaid {
        background: #fbfaf8;
        border: 1px solid #e1ddd6;
        border-radius: 12px;
        padding: 16px;
        overflow: hidden;
        height: 560px;
      }
      .mermaid svg {
        width: 100%;
        height: 100%;
      }
      body.fullscreen .mermaid {
        height: calc(100vh - 160px);
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        text-decoration: none;
        color: #2c2a27;
        font-weight: 600;
        margin-bottom: 1rem;
      }
      .graph-toolbar {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        margin: 0 0 1rem;
      }
      .graph-btn {
        border: 1px solid #d1ccc4;
        background: #fff;
        color: #2c2a27;
        border-radius: 999px;
        padding: 0.4rem 0.9rem;
        font-weight: 600;
        cursor: pointer;
      }
      .graph-btn:hover {
        background: #f1ede6;
      }
    </style>
  </head>
  <body>
    <main>
      <a class="back-link" href="stratum-v.2.5.html">← Back to document</a>
      <h1>${title}</h1>
      <p>Section structure and part grouping.</p>
      <div class="graph-toolbar">
        <button class="graph-btn" type="button" data-action="zoom-in">Zoom In</button>
        <button class="graph-btn" type="button" data-action="zoom-out">Zoom Out</button>
        <button class="graph-btn" type="button" data-action="reset">Reset</button>
        <button class="graph-btn" type="button" data-action="fullscreen">Full Screen</button>
      </div>
      <div class="mermaid">
${graph}
      </div>
    </main>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    <script>
      if (window.mermaid && window.mermaid.initialize) {
        window.mermaid.initialize({ startOnLoad: true, theme: "neutral" });
      }
    </script>
    <script>
      (function () {
        var container = document.querySelector(".mermaid");
        if (!container) return;

        function initPanZoom() {
          var svg = container.querySelector("svg");
          if (!svg) return;
          var viewBox = svg.getAttribute("viewBox");
          if (!viewBox) {
            var bbox = svg.getBBox();
            svg.setAttribute("viewBox", [bbox.x, bbox.y, bbox.width, bbox.height].join(" "));
          }
          var vb = svg.getAttribute("viewBox").split(" ").map(Number);
          var state = { x: vb[0], y: vb[1], w: vb[2], h: vb[3], dragging: false, lastX: 0, lastY: 0 };

          function setViewBox() {
            svg.setAttribute("viewBox", [state.x, state.y, state.w, state.h].join(" "));
          }

          function zoom(delta, centerX, centerY) {
            var scale = delta > 0 ? 0.9 : 1.1;
            var mx = centerX;
            var my = centerY;
            state.x = mx - (mx - state.x) * scale;
            state.y = my - (my - state.y) * scale;
            state.w *= scale;
            state.h *= scale;
            setViewBox();
          }

          container.addEventListener("wheel", function (event) {
            event.preventDefault();
            var rect = svg.getBoundingClientRect();
            var mx = state.x + ((event.clientX - rect.left) / rect.width) * state.w;
            var my = state.y + ((event.clientY - rect.top) / rect.height) * state.h;
            zoom(event.deltaY, mx, my);
          }, { passive: false });

          container.addEventListener("pointerdown", function (event) {
            state.dragging = true;
            state.lastX = event.clientX;
            state.lastY = event.clientY;
            container.setPointerCapture(event.pointerId);
          });

          container.addEventListener("pointermove", function (event) {
            if (!state.dragging) return;
            var rect = svg.getBoundingClientRect();
            var dx = (event.clientX - state.lastX) / rect.width * state.w;
            var dy = (event.clientY - state.lastY) / rect.height * state.h;
            state.x -= dx;
            state.y -= dy;
            state.lastX = event.clientX;
            state.lastY = event.clientY;
            setViewBox();
          });

          container.addEventListener("pointerup", function () {
            state.dragging = false;
          });
          container.addEventListener("pointercancel", function () {
            state.dragging = false;
          });

          document.querySelectorAll("[data-action]").forEach(function (button) {
            button.addEventListener("click", function () {
              var action = button.getAttribute("data-action");
              if (action === "zoom-in") {
                zoom(1, state.x + state.w / 2, state.y + state.h / 2);
              } else if (action === "zoom-out") {
                zoom(-1, state.x + state.w / 2, state.y + state.h / 2);
              } else if (action === "reset") {
                var vb = svg.getAttribute("viewBox").split(" ").map(Number);
                state.x = vb[0];
                state.y = vb[1];
                state.w = vb[2];
                state.h = vb[3];
                setViewBox();
              } else if (action === "fullscreen") {
                document.body.classList.toggle("fullscreen");
              }
            });
          });
        }

        if (window.mermaid) {
          window.mermaid.initialize({ startOnLoad: true, theme: "neutral" });
          window.mermaid.run().then(initPanZoom);
        } else {
          initPanZoom();
        }
      })();
    </script>
  </body>
</html>`;

  await writeFile(OUTPUT_PATH, html, "utf8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
