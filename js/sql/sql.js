document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("input");
  const output = document.getElementById("output");

  const beautifyBtn = document.getElementById("beautify");
  const minifyBtn = document.getElementById("minify");
  const validateBtn = document.getElementById("validate");

  const clearBtn = document.getElementById("clear");
  const clearOutputBtn = document.getElementById("clearOutput");

  const copyInputBtn = document.getElementById("copyInput");
  const copyOutputBtn = document.getElementById("copyOutput");
  const pasteClipboardBtn = document.getElementById("pasteClipboard");

  const fileInput = document.getElementById("fileInput");
  const downloadInputBtn = document.getElementById("downloadInput");
  const downloadOutputBtn = document.getElementById("downloadOutput");

  const indentSelect = document.getElementById("indent");
  const message = document.getElementById("message");

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
    message.textContent = "整形完了 ✅";
  });

  // ===== Minify =====
  minifyBtn.addEventListener("click", () => {
    output.textContent = input.value.replace(/\s+/g, " ").trim();
    message.textContent = "圧縮完了 ✅";
  });

  // ===== Validate =====
  validateBtn.addEventListener("click", () => {
    const sql = input.value;
    const result = validateSQL(sql);
    message.textContent = result;
  });

  // ===== Copy / Paste =====
  copyInputBtn.addEventListener("click", () => navigator.clipboard.writeText(input.value));
  copyOutputBtn.addEventListener("click", () => navigator.clipboard.writeText(output.textContent));

  pasteClipboardBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      input.value = text;
    } catch (err) {
      console.error("Clipboard読み込みエラー:", err);
    }
  });

  // ===== Clear =====
  clearBtn.addEventListener("click", () => (input.value = ""));
  clearOutputBtn.addEventListener("click", () => (output.textContent = ""));

  // ===== File Upload =====
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => (input.value = ev.target.result);
    reader.readAsText(file);
  });

  // ===== Download Input =====
  downloadInputBtn.addEventListener("click", () => {
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

  // ===== Validate function =====
  function validateSQL(sql) {
    if (!sql.trim()) return "SQLが空です";
    const forbidden = sql.match(/(DROP\s+DATABASE|DELETE\s+FROM\s+\w+)/i);
    if (forbidden) return "⚠️ 注意: データ破壊系コマンドが含まれています";
    return "基本構文チェック完了 ✅";
  }
});
