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
      document.body.style.overflow = 'hidden'; // 背景スクロール防止
    }
  });
});

// モーダル閉じる（背景クリック or 画像クリック）
modal.addEventListener('click', e => {
  if (e.target === modal || e.target === modalImg) {
    closeModal();
  }
});

function closeModal() {
  modal.classList.remove('show');
  document.body.style.overflow = ''; // スクロール復帰
}

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

// === キーボード操作 ===
document.addEventListener('keydown', e => {
  if (!modal.classList.contains('show')) return;

  // ← / → キーで画像切替
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
    modalImg.src = currentGallery[currentIndex].src;
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    currentIndex = (currentIndex + 1) % currentGallery.length;
    modalImg.src = currentGallery[currentIndex].src;
  } 
  // Escキーで閉じる
  else if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
  }
  // Ctrl / Cmd + キーで「別タブやショートカット」防止（ただしコピーは除外）
  else if (e.ctrlKey || e.metaKey) {
    const blockedKeys = ['s', 't', 'w', 'n', 'r']; 
    // ⬆ Ctrl+S / T / W / N / R → 保存, 新タブ, 閉じる, 新ウィンドウ, 再読込
    if (blockedKeys.includes(e.key.toLowerCase())) {
      e.preventDefault();
    }
  }
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
