/* ── State ─────────────────────────────────────────────────────── */
let images = [];          // Array of { id, file, dataUrl, name, size }
let pdfBlob = null;       // Generated PDF blob
let nextId = 0;

/* ── DOM refs ──────────────────────────────────────────────────── */
const dropZone       = document.getElementById('dropZone');
const dropZoneInner  = document.getElementById('dropZoneInner');
const fileInput      = document.getElementById('fileInput');
const fileInputMore  = document.getElementById('fileInputMore');
const imageList      = document.getElementById('imageList');
const addMore        = document.getElementById('addMore');
const stats          = document.getElementById('stats');
const generateBtn    = document.getElementById('generateBtn');
const downloadBtn    = document.getElementById('downloadBtn');
const printBtn       = document.getElementById('printBtn');
const statusMessage  = document.getElementById('statusMessage');
const printArea      = document.getElementById('printArea');

/* ── Helpers ───────────────────────────────────────────────────── */
function formatSize(bytes) {
  if (bytes < 1024)       return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showStatus(msg, type = 'loading') {
  statusMessage.textContent = msg;
  statusMessage.className = 'status-message show ' + type;
}

function hideStatus() {
  statusMessage.className = 'status-message';
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}

/* ── Render ────────────────────────────────────────────────────── */
function updateUI() {
  const hasImages = images.length > 0;

  // Show/hide drop zone
  dropZone.classList.toggle('visible', !hasImages);

  // Show/hide add-more bar
  addMore.hidden = !hasImages;

  // Update stats
  const totalSize = images.reduce((sum, img) => sum + img.file.size, 0);
  stats.textContent = `${images.length} 枚  |  ${formatSize(totalSize)}`;

  // Enable/disable generate button
  generateBtn.disabled = !hasImages;

  // Reset PDF state whenever the list changes
  pdfBlob = null;
  downloadBtn.disabled = true;
  printBtn.disabled = true;

  renderList();
}

function renderList() {
  imageList.innerHTML = '';
  images.forEach((img, index) => {
    const li = document.createElement('li');
    li.className = 'image-item';
    li.draggable = true;
    li.dataset.id = img.id;
    li.innerHTML = `
      <span class="item-number">${index + 1}</span>
      <img class="item-thumb" src="${img.dataUrl}" alt="${img.name}" />
      <div class="item-info">
        <div class="item-name" title="${img.name}">${img.name}</div>
        <div class="item-size">${formatSize(img.file.size)}</div>
      </div>
      <div class="item-actions">
        <button class="icon-btn" data-action="up" data-id="${img.id}" title="上に移動" ${index === 0 ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button class="icon-btn" data-action="down" data-id="${img.id}" title="下に移動" ${index === images.length - 1 ? 'disabled' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button class="icon-btn delete" data-action="delete" data-id="${img.id}" title="削除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;

    // Row-level drag events
    li.addEventListener('dragstart', onItemDragStart);
    li.addEventListener('dragover',  onItemDragOver);
    li.addEventListener('dragleave', onItemDragLeave);
    li.addEventListener('drop',      onItemDrop);
    li.addEventListener('dragend',   onItemDragEnd);

    imageList.appendChild(li);
  });
}

/* ── Add images ────────────────────────────────────────────────── */
async function addFiles(files) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const valid = Array.from(files).filter(f => allowed.includes(f.type));
  if (!valid.length) return;

  showStatus('読み込み中...', 'loading');

  try {
    const newEntries = await Promise.all(valid.map(async file => {
      const dataUrl = await readFileAsDataUrl(file);
      return { id: nextId++, file, dataUrl, name: file.name, size: file.size };
    }));
    images.push(...newEntries);
    updateUI();
    hideStatus();
  } catch (err) {
    showStatus(err.message, 'error');
  }
}

/* ── File input / drop ─────────────────────────────────────────── */
fileInput.addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });
fileInputMore.addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; });

// dropZoneInner のクリックは label[for="fileInput"] が処理するため不要
// (二重クリックでダイアログがキャンセルされるため削除)

['dragenter', 'dragover'].forEach(evt => {
  dropZone.addEventListener(evt, e => {
    e.preventDefault();
    dropZone.classList.add('dragging');
  });
});
dropZone.addEventListener('dragleave', e => {
  e.preventDefault();
  dropZone.classList.remove('dragging');
});
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  e.stopPropagation(); // document の drop イベントへの伝播を止めて重複防止
  dropZone.classList.remove('dragging');
  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
});

// リスト表示中もドロップできるよう document にも登録
// ただし dropZone からの伝播は stopPropagation で防いでいるため重複しない
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
});

/* ── List action buttons (up / down / delete) ──────────────────── */
imageList.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const id  = Number(btn.dataset.id);
  const idx = images.findIndex(img => img.id === id);
  if (idx === -1) return;

  switch (btn.dataset.action) {
    case 'up':
      if (idx > 0) { [images[idx - 1], images[idx]] = [images[idx], images[idx - 1]]; updateUI(); }
      break;
    case 'down':
      if (idx < images.length - 1) { [images[idx], images[idx + 1]] = [images[idx + 1], images[idx]]; updateUI(); }
      break;
    case 'delete':
      images.splice(idx, 1);
      updateUI();
      break;
  }
});

/* ── Clear all ─────────────────────────────────────────────────── */
document.getElementById('clearAll').addEventListener('click', () => {
  if (!confirm('すべての画像を削除しますか？')) return;
  images = [];
  updateUI();
  hideStatus();
});

/* ── Drag-and-drop reorder (HTML5 drag API) ────────────────────── */
let dragSourceId = null;

function onItemDragStart(e) {
  dragSourceId = Number(this.dataset.id);
  this.classList.add('dragging-item');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSourceId); // required for Firefox
}

function onItemDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const targetId = Number(this.dataset.id);
  if (targetId !== dragSourceId) this.classList.add('drag-over');
}

function onItemDragLeave() {
  this.classList.remove('drag-over');
}

function onItemDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const targetId = Number(this.dataset.id);
  if (targetId === dragSourceId) return;

  const srcIdx = images.findIndex(img => img.id === dragSourceId);
  const dstIdx = images.findIndex(img => img.id === targetId);
  if (srcIdx === -1 || dstIdx === -1) return;

  const [moved] = images.splice(srcIdx, 1);
  images.splice(dstIdx, 0, moved);
  updateUI();
}

function onItemDragEnd() {
  this.classList.remove('dragging-item');
  document.querySelectorAll('.image-item').forEach(el => el.classList.remove('drag-over'));
  dragSourceId = null;
}

/* ── Settings helpers ──────────────────────────────────────────── */
function getOrientation() {
  return document.querySelector('input[name="orientation"]:checked').value;
}
function getFitMode() {
  return document.querySelector('input[name="fitMode"]:checked').value;
}
function getPageSize() {
  return document.getElementById('pageSize').value;
}
function getMarginMm() {
  return Number(document.getElementById('margin').value);
}

/* ── Page dimensions (mm) ──────────────────────────────────────── */
const PAGE_DIMS = {
  a4:     { w: 210, h: 297 },
  a3:     { w: 297, h: 420 },
  letter: { w: 215.9, h: 279.4 },
};

function getImageDimensions(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = dataUrl;
  });
}

function resolveOrientation(settingOrientation, imgW, imgH) {
  if (settingOrientation === 'portrait')  return 'portrait';
  if (settingOrientation === 'landscape') return 'landscape';
  // auto: match image aspect ratio
  return imgW >= imgH ? 'landscape' : 'portrait';
}

/* ── Compute placement (fit / fill) ────────────────────────────── */
function computePlacement(imgW, imgH, pageWmm, pageHmm, marginMm, fitMode) {
  const availW = pageWmm - marginMm * 2;
  const availH = pageHmm - marginMm * 2;
  const imgAspect  = imgW / imgH;
  const pageAspect = availW / availH;

  let drawW, drawH;
  if (fitMode === 'fit') {
    // Fit entirely inside the available area
    if (imgAspect > pageAspect) {
      drawW = availW;
      drawH = availW / imgAspect;
    } else {
      drawH = availH;
      drawW = availH * imgAspect;
    }
  } else {
    // Fill: cover the entire available area (may crop in PDF terms, but jsPDF clips)
    if (imgAspect > pageAspect) {
      drawH = availH;
      drawW = availH * imgAspect;
    } else {
      drawW = availW;
      drawH = availW / imgAspect;
    }
  }

  // Center within the available area
  const x = marginMm + (availW - drawW) / 2;
  const y = marginMm + (availH - drawH) / 2;
  return { x, y, w: drawW, h: drawH };
}

/* ── PDF generation ────────────────────────────────────────────── */
generateBtn.addEventListener('click', async () => {
  if (!images.length) return;

  generateBtn.disabled = true;
  showStatus('PDF を生成中...', 'loading');

  try {
    const { jsPDF } = window.jspdf;
    const pageSize        = getPageSize();
    const orientSetting   = getOrientation();
    const fitMode         = getFitMode();
    const marginMm        = getMarginMm();
    const baseDims        = PAGE_DIMS[pageSize];

    let pdf = null;

    for (let i = 0; i < images.length; i++) {
      const img   = images[i];
      const dims  = await getImageDimensions(img.dataUrl);
      const orient = resolveOrientation(orientSetting, dims.w, dims.h);

      // Page dimensions in mm, accounting for orientation
      const pageWmm = orient === 'landscape' ? baseDims.h : baseDims.w;
      const pageHmm = orient === 'landscape' ? baseDims.w : baseDims.h;

      if (!pdf) {
        pdf = new jsPDF({ orientation: orient, unit: 'mm', format: pageSize });
      } else {
        pdf.addPage(pageSize, orient);
      }

      const { x, y, w, h } = computePlacement(dims.w, dims.h, pageWmm, pageHmm, marginMm, fitMode);

      // Determine format hint from mime type
      const mimeType = img.file.type;
      let fmt = 'JPEG';
      if (mimeType === 'image/png')  fmt = 'PNG';
      if (mimeType === 'image/webp') fmt = 'WEBP';
      if (mimeType === 'image/gif')  fmt = 'GIF';

      pdf.addImage(img.dataUrl, fmt, x, y, w, h);
    }

    pdfBlob = pdf.output('blob');
    showStatus('PDF の生成が完了しました。', 'success');
    downloadBtn.disabled = false;
    printBtn.disabled    = false;
  } catch (err) {
    showStatus('エラー: ' + err.message, 'error');
    pdfBlob = null;
  } finally {
    generateBtn.disabled = images.length === 0;
  }
});

/* ── Download PDF ──────────────────────────────────────────────── */
downloadBtn.addEventListener('click', () => {
  if (!pdfBlob) return;
  const url = URL.createObjectURL(pdfBlob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = 'converted.pdf';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
});

/* ── Print ─────────────────────────────────────────────────────── */
printBtn.addEventListener('click', () => {
  // Populate the print-only area with all images
  printArea.innerHTML = '';
  images.forEach(img => {
    const el = document.createElement('img');
    el.src = img.dataUrl;
    el.alt = img.name;
    printArea.appendChild(el);
  });
  window.print();
});

/* ── Initial render ────────────────────────────────────────────── */
updateUI();
