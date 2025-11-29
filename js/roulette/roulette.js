const canvas = document.getElementById("roulette");
const ctx = canvas.getContext("2d");
const itemsInput = document.getElementById("items");
const startBtn = document.getElementById("start");
const createBtn = document.getElementById("create");
const resultText = document.getElementById("result");

let items = [];
let angle = 0;        // 現在の回転角（ラジアン）
let spinning = false;
let speed = 0;

// 明るめのカラーパレット（見やすくビビッド寄り）
function colorForIndex(i) {
  const colors = [
    "#ff7f7f", // 明るい赤
    "#ffb86b", // オレンジ
    "#ffe27a", // イエロー
    "#b6f08a", // ライトグリーン
    "#7fd3ff", // ライトブルー
    "#a9baff", // ラベンダー
    "#ff9ad6", // ピンク
    "#ffd3a5", // ベージュ寄り
    "#c1ffd7", // ミント
    "#f7d6ff"  // ライトパープル
  ];
  return colors[i % colors.length];
}

// 描画関数
function drawRoulette() {
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 10;

  ctx.clearRect(0, 0, w, h);

  if (items.length === 0) {
    // プレースホルダー（項目がない場合）
    ctx.fillStyle = "#f3f4f6";
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#666";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("項目を入力して「ルーレットを作成」してください", cx, cy);
    return;
  }

  const total = items.length;
  const step = (2 * Math.PI) / total;

  for (let i = 0; i < total; i++) {
    const start = angle + i * step;
    const end = start + step;

    // セグメント
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colorForIndex(i);
    ctx.fill();
    ctx.strokeStyle = "#ffffff88";
    ctx.lineWidth = 1;
    ctx.stroke();

    // テキスト
    ctx.save();
    ctx.translate(cx, cy);
    const mid = start + step / 2;
    ctx.rotate(mid);
    ctx.textAlign = "center";
    ctx.fillStyle = "#111"; // コントラスト良く黒系
    // テキスト位置は半径の 0.62倍付近に置く（センター寄せ）
    ctx.font = "bold 14px sans-serif";
    // 長い文字列は折り返し的に複数行表示（簡易）
    const label = items[i];
    const maxWidth = radius * 0.55;
    // 短めの処理: 長ければ切る（必要なら改良可）
    let displayLabel = label;
    if (ctx.measureText(displayLabel).width > maxWidth) {
      // かなり長ければ省略
      while (ctx.measureText(displayLabel + "…").width > maxWidth && displayLabel.length > 1) {
        displayLabel = displayLabel.slice(0, -1);
      }
      displayLabel = displayLabel + "…";
    }
    ctx.fillText(displayLabel, radius * 0.62, 6);
    ctx.restore();
  }

  // 上部ポインタ（三角）
  ctx.beginPath();
  const pointerW = 22;
  ctx.moveTo(cx - pointerW / 2, 6);
  ctx.lineTo(cx + pointerW / 2, 6);
  ctx.lineTo(cx, 34);
  ctx.closePath();
  ctx.fillStyle = "#d32f2f";
  ctx.fill();
}

// 初期描画
drawRoulette();

// 項目→作成
createBtn.addEventListener("click", () => {
  const text = itemsInput.value.trim();
  if (!text) {
    alert("項目を入力してください");
    return;
  }
  items = text.split("\n").map(s => s.trim()).filter(Boolean);
  angle = 0;
  resultText.textContent = "";
  drawRoulette();
});

// スタート
startBtn.addEventListener("click", () => {
  if (items.length === 0) {
    alert("先に項目を入力してください");
    return;
  }
  if (spinning) return; // 既に回転中は無視

  spinning = true;
  // 初速はランダムにして強めに（回転感を出す）
  speed = Math.random() * 0.35 + 0.65
  // アニメーション開始
  requestAnimationFrame(animate);
});

// アニメーションループ
function animate() {
  if (!spinning) return;

  // 回転（angleはラジアン）
  angle += speed * 0.12
  // 減速（指数的に近い）
  speed *= 0.993

  drawRoulette();

  // 停止条件（速度が十分小さければ停止処理）
  if (speed < 0.002) {
    spinning = false;
    // 抜けのない位置調整（微調整してぴったり停止）
    // ここではそのまま角度を用いて結果を算出
    stopRoulette();
    return;
  }

  requestAnimationFrame(animate);
}

// 停止時の結果計算
function stopRoulette() {
  const total = items.length;
  const step = (2 * Math.PI) / total;

  // ポインタはキャンバス上部（北）＝ -PI/2
  const pointerAngle = -Math.PI / 2;

  // 条件：セグメント i は角度範囲 [angle + i*step, angle + (i+1)*step)
  // つまり pointerAngle がどの i に入るかを求める：
  // raw = (pointerAngle - angle) / step
  let raw = (pointerAngle - angle) / step;
  // 小数点以下を切り下げしてインデックス化（floor）
  let idx = Math.floor(raw);

  // モジュロで正しい範囲に収める
  idx = ((idx % total) + total) % total;

  // items 配列のインデックスに合わせる（floor した値が正しいセグメント）
  const selected = items[idx];

  resultText.textContent = `結果：${selected}`;
}
