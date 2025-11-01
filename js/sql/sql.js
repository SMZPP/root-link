document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");

  const beautifyBtn = document.getElementById("beautify");
  const minifyBtn = document.getElementById("minify");
  const uppercaseBtn = document.getElementById("uppercase");

  const clearIn = document.getElementById("clearIn");
  const clearOut = document.getElementById("clearOut");
  const copyIn = document.getElementById("copyIn");
  const copyOut = document.getElementById("copyOut");
  const pasteBtn = document.getElementById("paste");

  const loadFileBtn = document.getElementById("loadFile");
  const fileIn = document.getElementById("fileIn");
  const downloadBtn = document.getElementById("download");
  const downloadOutputBtn = document.getElementById("downloadOutput");

  const indentSelect = document.getElementById("indent");

  // ===== Beautify =====
  beautifyBtn.addEventListener("click", () => {
    const indent = parseInt(indentSelect.value, 10);
    let sql = input.value;
    if (!sql.trim()) return;

    sql = sql
      .replace(/\s+/g, " ")
      .replace(
        /(SELECT|FROM|WHERE|AND|OR|GROUP BY|ORDER BY|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM)/gi,
        "\n$1"
      )
      .split("\n")
      .map(line => " ".repeat(indent) + line.trim())
      .join("\n")
      .trim();

    output.textContent = sql;
  });

  // ===== Minify =====
  minifyBtn.addEventListener("click", () => {
    output.textContent = input.value.replace(/\s+/g, " ").trim();
  });

  // ===== Uppercase =====
  uppercaseBtn.addEventListener("click", () => {
    output.textContent = input.value.replace(
      /\b(select|from|where|and|or|insert|into|values|update|set|delete|join|on|group by|order by|limit|offset)\b/gi,
      m => m.toUpperCase()
    );
  });

  // ===== Clipboard =====
  copyIn.addEventListener("click", () => navigator.clipboard.writeText(input.value));
  copyOut.addEventListener("click", () => navigator.clipboard.writeText(output.textContent));

  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      input.value = text;
    } catch (err) {
      console.error("Clipboard読み込みエラー:", err);
    }
  });

  clearIn.addEventListener("click", () => input.value = "");
  clearOut.addEventListener("click", () => output.textContent = "");

  // ===== File load =====
  loadFileBtn.addEventListener("click", () => fileIn.click());
  fileIn.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => input.value = ev.target.result;
    reader.readAsText(file);
  });

  // ===== Download Input =====
  downloadBtn.addEventListener("click", () => {
    const blob = new Blob([input.value], { type: "text/sql" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "input.sql";
    a.click();
  });

  // ===== Download Output =====
  downloadOutputBtn.addEventListener("click", () => {
    const blob = new Blob([output.textContent], { type: "text/sql" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "formatted.sql";
    a.click();
  });
});
