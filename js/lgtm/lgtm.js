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

modal.addEventListener('click', () => modal.classList.remove('show'));

document.querySelectorAll('.gallery').forEach(gallery => {
  gallery.addEventListener('click', e => {
    if (e.target.tagName === 'IMG') {
      modalImg.src = e.target.src;
      modal.classList.add('show');
    }
  });
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
