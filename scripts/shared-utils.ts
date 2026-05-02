export function makeExportFilename(title: string | undefined, ext = "tex"): string {
  const base = (title ?? "document")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const safeBase = base || "document";
  const safeExt = ext.replace(/^\.+/, "") || "tex";
  return `${safeBase}.${safeExt}`;
}

export function buildLatexDownloadScript(latexContent: string, latexFilename: string): string {
  const content = JSON.stringify(latexContent);
  const filename = JSON.stringify(latexFilename);
  return `
      var LATEX_CONTENT = ${content};
      var LATEX_FILENAME = ${filename};
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
  `;
}
