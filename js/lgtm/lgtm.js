const folders = ['lgtm', 'goodjob', 'otsukare', 'approved'];
const timestamp = Date.now();

// === タブ切替 ===
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.gallery').forEach(g => g.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.target).classList.add('active');
  });
});

// === モーダル ===
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
let currentGallery = null;
let currentIndex = 0;

// ギャラリー画像クリックでモーダル表示
document.querySelectorAll('.gallery').forEach(gallery => {
  gallery.addEventListener('click', e => {
    if (e.target.tagName === 'IMG') {
      currentGallery = Array.from(gallery.querySelectorAll('img'));
      currentIndex = currentGallery.indexOf(e.target);
      modalImg.src = e.target.src;
      modal.classList.add('show');
    }
  });
});

// モーダル閉じる（背景クリック）
modal.addEventListener('click', e => {
  if (e.target === modal || e.target === modalImg) {
    modal.classList.remove('show');
  }
});

// 前後ボタン
document.getElementById('prev-btn').addEventListener('click', e => {
  e.stopPropagation();
  if (!currentGallery) return;
  currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  modalImg.src = currentGallery[currentIndex].src;
});

document.getElementById('next-btn').addEventListener('click', e => {
  e.stopPropagation();
  if (!currentGallery) return;
  currentIndex = (currentIndex + 1) % currentGallery.length;
  modalImg.src = currentGallery[currentIndex].src;
});

// === 各フォルダの画像読み込み ===
folders.forEach(folder => {
  fetch(`./images/${folder}/index.json?t=${timestamp}`)
    .then(res => res.json())
    .then(images => {
      const gallery = document.getElementById(folder);
      images.forEach(name => {
        const img = document.createElement('img');
        img.src = `./images/${folder}/${name}?t=${timestamp}`;
        img.alt = `${folder}カテゴリの画像`;
        gallery.appendChild(img);
      });
    })
    .catch(err => console.warn(`⚠️ ${folder}/index.json の読み込み失敗:`, err));
});
