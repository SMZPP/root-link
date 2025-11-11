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
    const indentSize = parseInt(indentSelect.value, 10) || 2;
    const sql = input.value.trim();
    if (!sql) return;

    output.textContent = formatSQL(sql, indentSize);
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

  // ===== Download =====
  downloadInputBtn.addEventListener("click", () => downloadFile(input.value, "input.sql"));
  downloadOutputBtn.addEventListener("click", () => downloadFile(output.textContent, "formatted.sql"));

  function downloadFile(content, name) {
    const blob = new Blob([content], { type: "text/sql" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
  }

  // ===== Validate function =====
  function validateSQL(sql) {
    if (!sql.trim()) return "SQLが空です";
    const forbidden = sql.match(/(DROP\s+DATABASE|DELETE\s+FROM\s+\w+)/i);
    if (forbidden) return "⚠️ 注意: データ破壊系コマンドが含まれています";
    return "基本構文チェック完了 ✅";
  }

function formatSQL(sql, indentSize = 2) {
  const keywords = [
    "SELECT", "FROM", "WHERE", "AND", "OR",
    "GROUP BY", "ORDER BY", "HAVING",
    "LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "OUTER JOIN",
    "INSERT INTO", "VALUES", "UPDATE", "SET", "DELETE FROM",
    "ON", "IN", "AS", "LIMIT", "UNION", "CASE", "WHEN", "THEN", "ELSE", "END"
  ];

  // --- 大文字化（安全に全キーワードを変換） ---
  keywords.forEach(k => {
    const regex = new RegExp("\\b" + k.replace(" ", "\\s+") + "\\b", "gi");
    sql = sql.replace(regex, k);
  });

  // --- 改行位置を調整 ---
  sql = sql
    .replace(/\s+/g, " ") // 空白正規化
    .replace(/\s*(SELECT)\s+/gi, "\n$1\n  ")
    .replace(/\s*(FROM)\s+/gi, "\n$1\n  ")
    .replace(/\s*(INNER JOIN|LEFT JOIN|RIGHT JOIN|OUTER JOIN)\s+/gi, "\n$1\n  ")
    .replace(/\s*(ON)\s+/gi, "\n$1\n  ")
    .replace(/\s*(WHERE)\s+/gi, "\n$1\n  ")
    .replace(/\s+(AND|OR)\s+/gi, "\n$1\n  ")
    .replace(/\s*(GROUP BY|ORDER BY|HAVING|LIMIT|UNION)\s+/gi, "\n$1\n  ");

  // --- サブクエリ内のインデント処理 ---
  const indent = " ".repeat(indentSize);
  let formatted = "";
  let level = 0;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "(") {
      level++;
      formatted += "(\n" + indent.repeat(level);
    } else if (char === ")") {
      level--;
      formatted += "\n" + indent.repeat(level) + ")";
    } else if (char === "\n") {
      formatted += "\n" + indent.repeat(level);
    } else {
      formatted += char;
    }
  }

  // --- カラムやテーブル名を小文字に ---
  formatted = formatted.replace(/\b([a-z_][a-z0-9_]*)\b/gi, match => {
    if (keywords.includes(match.toUpperCase())) return match.toUpperCase();
    return match.toLowerCase();
  });

  // --- SELECT句のカラムごとに改行 ---
  formatted = formatted.replace(
    /SELECT\s+([^;]+)/gi,
    (m, cols) => {
      const parts = cols.split(/\s*,\s*/);
      return "SELECT\n" + parts.map(p => indent + p.trim()).join(",\n");
    }
  );

  return formatted
    .replace(/\n{2,}/g, "\n") // 余計な空行削除
    .trim();
}
});
