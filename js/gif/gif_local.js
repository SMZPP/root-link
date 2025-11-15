const fileInput = document.getElementById("images");
const preview = document.getElementById("preview");
const delayInput = document.getElementById("delay");
const resultImg = document.getElementById("result-gif");
const downloadLink = document.getElementById("download");

let images = [];

// 画像プレビュー
fileInput.addEventListener("change", () => {
  preview.innerHTML = "";
  images = [];

  [...fileInput.files].forEach(file => {
    const url = URL.createObjectURL(file);
    images.push(url);

    const img = document.createElement("img");
    img.src = url;
    preview.appendChild(img);
  });
});

// GIF生成
document.getElementById("generate").addEventListener("click", () => {
  if (images.length === 0) return alert("画像を選択してください");

  const delay = parseInt(delayInput.value);

  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: "./js/gif/gif.worker.js" // HTMLから見た相対パスを明示
  });

  let loadedCount = 0;

  images.forEach(src => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      console.log("loaded", src);
      gif.addFrame(img, { delay: delay });
      loadedCount++;
      if (loadedCount === images.length) {
        gif.render();
      }
    };
  });

  gif.on("finished", blob => {
    const url = URL.createObjectURL(blob);
    resultImg.src = url;
    resultImg.style.display = "block";
    downloadLink.href = url;
  });
});
