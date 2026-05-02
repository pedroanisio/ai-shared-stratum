/**
 * Shared CSS styles for VERA HTML rendering
 * Used by both build-html.ts and vera2html.ts
 */

export const VERA_CSS = `
:root {
  color-scheme: light;
  font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
  line-height: 1.55;
  color: #1f1b16;
  background: #f5f2ec;
  --bg: #f5f2ec;
  --surface: #fffdf9;
  --surface-strong: #ffffff;
  --surface-muted: #f9f6f1;
  --ink: #1f1b16;
  --muted: #6b6257;
  --accent: #1f6b5a;
  --accent-2: #c1552c;
  --accent-3: #2c5282;
  --border: #e1ddd6;
  --shadow: rgba(19, 16, 12, 0.12);
  --code-bg: #f1ede6;
  --soft: #fbfaf8;
  --highlight: rgba(31, 107, 90, 0.16);
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
  max-width: 1100px;
  margin: 0 auto;
  background: var(--surface-strong);
  padding: 36px;
  border-radius: 22px;
  border: 1px solid rgba(31, 27, 22, 0.06);
  box-shadow: 0 34px 110px rgba(19, 16, 12, 0.14);
  position: relative;
  animation: riseIn 0.6s ease-out;
}
.doc-content > :first-child {
  margin-top: 0;
}
.doc-grid {
  display: grid;
  gap: 2.4rem;
  align-items: start;
}
.doc-grid.has-toc {
  grid-template-columns: minmax(220px, 320px) minmax(0, 1fr);
}
.doc-grid.no-toc {
  grid-template-columns: minmax(0, 1fr);
}
.doc-content {
  min-width: 0;
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
  font-family: "IBM Plex Serif", Georgia, serif;
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
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 0.9rem 1rem;
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
.cover-meta-row span:last-child {
  font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
  font-size: 0.9rem;
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  width: fit-content;
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
.doc-content p {
  font-size: 1.02rem;
  line-height: 1.7;
}
.doc-content p + p {
  margin-top: 0.9rem;
}
.vera-section {
  margin: 2.4rem 0 1.2rem;
}
.vera-section h2 {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(31, 27, 22, 0.08);
}
.vera-section h2::after {
  content: "";
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(31, 107, 90, 0.25), transparent 70%);
  margin-left: 0.4rem;
}
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
ul, ol { padding-left: 1.4rem; margin: 0.5em 0; }
li { margin: 0.3em 0; }
.doc-content ul,
.doc-content ol {
  max-width: 76ch;
  padding-left: 1.2rem;
}
.doc-content li {
  line-height: 1.65;
}
.admonition {
  border-left: 4px solid #c77a1c;
  background: #fff4e1;
  padding: 0.8rem 1rem;
  margin: 1rem 0;
  border-radius: 0 8px 8px 0;
}
.admonition-note { border-left-color: var(--accent); background: #e7f2ef; }
.admonition-warning { border-left-color: #c77a1c; background: #fff4e1; }
.admonition-important { border-left-color: #b24729; background: #ffebe6; }
.admonition-tip { border-left-color: #2c5282; background: #e6f0ff; }
.reference {
  border: 1px solid var(--border);
  background: var(--soft);
  padding: 0.65rem 0.85rem;
  margin: 0.6rem 0;
  border-radius: 12px;
  font-size: 0.84rem;
  line-height: 1.5;
}
.reference-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
}
.reference-title {
  font-family: "IBM Plex Serif", "Georgia", serif;
  font-size: 0.86rem;
}
.reference-year {
  font-size: 0.78rem;
  color: var(--muted);
  background: #f1ede6;
  border-radius: 999px;
  padding: 0.12rem 0.45rem;
}
.reference-authors {
  margin-top: 0.2rem;
  font-weight: 600;
  color: #3b3630;
  font-size: 0.8rem;
}
.reference-meta {
  margin-top: 0.15rem;
  color: var(--muted);
  font-size: 0.78rem;
}
.reference-tags {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.3rem;
  flex-wrap: wrap;
}
.reference-kind,
.reference-key {
  background: #e7f2ef;
  color: var(--accent);
  font-size: 0.65rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  border: 1px solid rgba(31, 107, 90, 0.2);
}
.reference-key {
  background: #f3efe7;
  color: #7a6a58;
  border-color: rgba(122, 106, 88, 0.2);
}
.reference-note {
  margin-top: 0.45rem;
  color: #3d3832;
  font-size: 0.82rem;
}
.reference-link {
  display: inline-flex;
  margin-top: 0.35rem;
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.78rem;
}
.reference-link:hover {
  text-decoration: underline;
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
  box-shadow: 0 10px 28px rgba(19, 16, 12, 0.06);
}
.vera-table {
  overflow-x: auto;
}
.vera-table table {
  min-width: 560px;
}
.definition { border-left: 4px solid var(--accent); }
.rule { border-left: 4px solid #9c5b1c; }
.theorem { border-left: 4px solid #9b2c4a; background: #fef5f7; }
.proof { border-left: 4px solid #6b46c1; background: #f9f5ff; padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; }
.example { border-left: 4px solid #2c5282; background: #f0f5ff; }
.exercise { border-left: 4px solid #c77a1c; background: #fff8f0; }
.definition-title {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  flex-wrap: wrap;
  word-break: break-word;
  margin: 0 0 0.5rem;
}
.definition-title strong {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
  color: #2a2621;
}
.definition-title strong::before {
  content: "DEF";
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  padding: 0.18rem 0.4rem;
  border-radius: 999px;
  background: #e7f2ef;
  color: var(--accent);
}
.definition p {
  margin: 0.45rem 0;
}
.definition p code,
.definition p em {
  font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
}
.rule-description { color: var(--muted); font-size: 0.95rem; }
.proof-end { text-align: right; color: var(--muted); margin: 0.5rem 0 0; }
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
  background: var(--surface-muted);
  border: 1px solid var(--border);
  padding: 1.1rem 1.3rem;
  border-radius: 18px;
  margin: 0;
  box-shadow: 0 18px 48px rgba(19, 16, 12, 0.1);
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 64px);
  overflow: auto;
}
.toc::after {
  content: "";
  display: block;
  margin-top: 0.8rem;
  height: 1px;
  background: linear-gradient(90deg, rgba(31, 107, 90, 0.2), transparent);
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
  font-size: 1.2rem;
  border: none;
}
.toc ul {
  list-style: none;
  padding-left: 0;
  margin: 0.5rem 0 0;
}
.toc ul ul {
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
  color: var(--ink);
  text-decoration: none;
}
.toc li a::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(31, 27, 22, 0.18);
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
.def-code {
  margin: 0.6rem 0;
}
.def-code-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin-bottom: 0.3rem;
}
.def-code pre {
  margin: 0;
}
.def-kv {
  display: grid;
  grid-template-columns: minmax(120px, 200px) 1fr;
  gap: 0;
  margin: 0;
}
.def-kv dt {
  font-weight: 600;
  color: #3c3731;
  padding: 0.4rem 0.8rem 0.4rem 0;
  border-right: 2px solid var(--border);
}
.def-kv dd {
  margin: 0;
  padding: 0.4rem 0 0.4rem 0.8rem;
}
.def-kind {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  background: #e9e5df;
}
.def-kind-enum {
  background: #e7f2ef;
  color: #1f6b5a;
}
.def-kind-type {
  background: #e6eef8;
  color: #2c5282;
}
.def-kind-rule {
  background: #fef3e2;
  color: #9c5b1c;
}
.def-kind-function {
  background: #f0e7f6;
  color: #6b46c1;
}
.def-kind-theorem {
  background: #fce8ec;
  color: #9b2c4a;
}
.def-category {
  background: #f1ede6;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
.def-section {
  color: #9c9488;
  font-size: 0.7rem;
}
.def-enum-values ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  list-style: none;
  padding: 0;
}
.def-enum-values li {
  background: #e7f2ef;
  color: #1f6b5a;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.85rem;
}
.def-compatible ul {
  list-style: none;
  padding: 0;
}
.def-compatible li::before {
  content: "+";
  color: #1f6b5a;
  font-weight: 700;
  margin-right: 0.4rem;
}
.def-breaking ul {
  list-style: none;
  padding: 0;
}
.def-breaking li::before {
  content: "!";
  color: #b24729;
  font-weight: 700;
  margin-right: 0.4rem;
}
.def-block.def-enum {
  border-left: 4px solid #1f6b5a;
}
.def-block.def-type {
  border-left: 4px solid #2c5282;
}
.def-block.def-rule {
  border-left: 4px solid #9c5b1c;
}
.def-block.def-function {
  border-left: 4px solid #6b46c1;
}
.def-block.def-theorem {
  border-left: 4px solid #9b2c4a;
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
.gap {
  background: #fff3cd;
  border: 1px dashed #ffc107;
  padding: 0.8rem 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}
.gap-marker { color: #856404; font-weight: 600; }
.redaction {
  display: inline-block;
  background: #333;
  color: #333;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}
.redaction-marker { font-family: monospace; }
.quote {
  border-left: 4px solid var(--border);
  padding-left: 1rem;
  margin: 1rem 0;
  color: var(--muted);
  font-style: italic;
}
.quote footer { margin-top: 0.5rem; font-size: 0.9rem; }
.math {
  font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
  background: var(--code-bg);
  padding: 0.8rem 1rem;
  border-radius: 8px;
  margin: 0.5rem 0;
  overflow-x: auto;
  white-space: pre-wrap;
}
.math-inline {
  font-family: "IBM Plex Mono", monospace;
  background: var(--code-bg);
  padding: 0.1em 0.3em;
  border-radius: 4px;
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
.toc a.active::before {
  background: var(--accent);
}
.footnotes {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border);
}
.footnotes h2 {
  font-size: 1.2rem;
  margin-top: 0;
}
.footnotes ol {
  padding-left: 1.2rem;
}
.footnotes li {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: #2a2621;
}
.footnote-ref {
  font-size: 0.75em;
}
.footnote-ref a {
  text-decoration: none;
  color: var(--accent);
}
.footnote-ref a:hover {
  text-decoration: underline;
}
.footnote-backref {
  margin-left: 0.4rem;
  text-decoration: none;
  color: var(--muted);
}
.footnote-backref:hover {
  color: var(--accent);
}
html {
  scroll-behavior: smooth;
}
.anchor {
  margin-left: 0.4rem;
  font-size: 0.75em;
  color: #9c9488;
  text-decoration: none;
  opacity: 0;
  transition: opacity 0.2s;
}
h2:hover .anchor, h3:hover .anchor, h4:hover .anchor, h5:hover .anchor, h6:hover .anchor {
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
/* VERA-specific entity styles */
.vera-para {
  margin: 0.8rem 0;
  max-width: 78ch;
  font-size: 1.03rem;
  line-height: 1.7;
  color: #2a2621;
}
.vera-definition,
.vera-rule,
.vera-theorem,
.vera-proof,
.vera-example,
.vera-exercise,
.vera-claim,
.vera-evidence,
.vera-guarantee,
.vera-admonition {
  box-shadow: 0 14px 32px rgba(19, 16, 12, 0.08);
}
.vera-definition { border: 1px solid var(--border); background: var(--soft); padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; border-left: 4px solid var(--accent); }
.vera-rule { border: 1px solid var(--border); background: var(--soft); padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; border-left: 4px solid #9c5b1c; }
.vera-theorem { border: 1px solid var(--border); background: #fef5f7; padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; border-left: 4px solid #9b2c4a; }
.vera-proof { border: 1px solid var(--border); background: #f9f5ff; padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; border-left: 4px solid #6b46c1; }
.vera-example { border: 1px solid var(--border); background: #f0f5ff; padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; border-left: 4px solid #2c5282; }
.vera-exercise { border: 1px solid var(--border); background: #fff8f0; padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; border-left: 4px solid #c77a1c; }
.vera-claim { border: 1px solid var(--border); background: var(--soft); padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; }
.vera-evidence { border: 1px solid var(--border); background: var(--soft); padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; }
.vera-gap { background: #fff3cd; border: 1px dashed #ffc107; padding: 0.8rem 1rem; border-radius: 8px; margin: 1rem 0; }
.vera-redaction { display: inline-block; background: #333; color: #333; padding: 0.2rem 0.5rem; border-radius: 4px; }
.vera-admonition { border-left: 4px solid #c77a1c; background: #fff4e1; padding: 0.8rem 1rem; margin: 1rem 0; border-radius: 0 8px 8px 0; }
.vera-quote { border-left: 4px solid var(--border); padding-left: 1rem; margin: 1rem 0; color: var(--muted); font-style: italic; }
.vera-quote footer { margin-top: 0.5rem; font-size: 0.9rem; }
.vera-formula {
  font-family: "IBM Plex Mono", "SFMono-Regular", monospace;
  background: linear-gradient(180deg, #f8f4ed 0%, #f1ece3 100%);
  padding: 0.95rem 1.2rem;
  border-radius: 12px;
  margin: 0.75rem 0;
  overflow-x: auto;
  white-space: pre-wrap;
  border: 1px solid rgba(31, 27, 22, 0.12);
  border-left: 4px solid rgba(31, 107, 90, 0.4);
  font-size: 0.95rem;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
}
.vera-guarantee { border: 1px solid var(--border); background: #f0fff4; padding: 1rem 1.2rem; margin: 1rem 0; border-radius: 12px; border-left: 4px solid #2d8a4e; }
.vera-guarantee .guarantee-header {
  margin: 0 0 0.6rem;
  color: #1a5c32;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.vera-guarantee .guarantee-header strong {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.vera-guarantee .guarantee-header strong::before {
  content: "G";
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 50%;
  background: #2d8a4e;
  color: #f8fff9;
  font-size: 0.75rem;
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
  .doc-grid.has-toc {
    grid-template-columns: minmax(0, 1fr);
  }
  .toc {
    position: static;
    max-height: none;
  }
}
@media (max-width: 600px) {
  body { padding: 24px 16px 64px; }
  main { padding: 24px; border-radius: 16px; }
  .cover { padding: 16px; }
  .cover-title { font-size: 1.8rem; }
  .cover-meta-row { grid-template-columns: 1fr; gap: 0.2rem; }
}
@media print {
  .cover {
    page-break-after: always;
  }
}
`;
