// ============================================================
// 履歴書メーカー - Main Script
// ============================================================

let eduEntries  = [];
let workEntries = [];
let certEntries = [];
let photoDataUrl = null;

// ============================================================
// Utilities
// ============================================================
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getVal(name) {
  const el = document.querySelector(`[name="${name}"]`);
  return el ? el.value.trim() : '';
}

// 西暦 → 和暦変換
function toWareki(year, month, day) {
  year = parseInt(year); month = parseInt(month);
  if (!year || !month) return '';

  let era, eraYear;
  if (year > 2019 || (year === 2019 && month >= 5)) {
    era = '令和'; eraYear = year - 2018;
  } else if (year > 1989 || (year === 1989 && month > 1) ||
             (year === 1989 && month === 1 && day && parseInt(day) >= 8)) {
    era = '平成'; eraYear = year - 1988;
  } else if (year > 1926 || (year === 1926 && month >= 12)) {
    era = '昭和'; eraYear = year - 1925;
  } else {
    era = '大正'; eraYear = year - 1911;
  }

  const yearStr = eraYear === 1 ? '元' : String(eraYear);
  return day ? `${era}${yearStr}年${month}月${parseInt(day)}日` : `${era}${yearStr}年${month}月`;
}

// date input string → 和暦
function dateToWareki(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return toWareki(parts[0], parts[1], parts[2]);
}

// date input → 年齢計算
function calcAge(birthDateStr) {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

// date input → 作成日 (和暦)
function formatCreatedDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return toWareki(d.getFullYear(), d.getMonth() + 1, d.getDate()) + '現在';
}

// ============================================================
// Tab Navigation
// ============================================================
function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const content = document.getElementById('tab-' + tabName);
  const btn = document.querySelector(`[data-tab="${tabName}"]`);
  if (content) content.classList.add('active');
  if (btn) btn.classList.add('active');
  const tc = document.querySelector('.tab-contents');
  if (tc) tc.scrollTop = 0;
}

// ============================================================
// Photo
// ============================================================
function handlePhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    photoDataUrl = e.target.result;
    renderPhotoPreview();
    updatePreview();
  };
  reader.readAsDataURL(file);
}

function removePhoto() {
  photoDataUrl = null;
  document.getElementById('photo-input').value = '';
  renderPhotoPreview();
  updatePreview();
}

function renderPhotoPreview() {
  const box = document.getElementById('photo-preview');
  const btn = document.getElementById('btn-remove-photo');
  if (photoDataUrl) {
    box.innerHTML = `<img src="${photoDataUrl}" alt="証明写真">`;
    if (btn) btn.style.display = 'inline-block';
  } else {
    box.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>写真をクリックして追加</span>`;
    if (btn) btn.style.display = 'none';
  }
}

// ============================================================
// Contact address toggle
// ============================================================
function toggleDiffContact() {
  const cb = document.querySelector('[name="hasDiffContact"]');
  const sec = document.getElementById('diff-contact-section');
  if (sec) sec.style.display = cb.checked ? 'block' : 'none';
  updatePreview();
}

// ============================================================
// YM Entry Renderer (generic for edu / work / cert)
// ============================================================
function renderYmEntries(containerId, entries, placeholder) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = entries.map(entry => `
    <div class="ym-row" data-id="${entry.id}">
      <input type="number" name="ym_year_${entry.id}" placeholder="2020"
        min="1900" max="2099" oninput="updatePreview()">
      <input type="number" name="ym_month_${entry.id}" class="month-input"
        placeholder="4" min="1" max="12" oninput="updatePreview()">
      <input type="text" name="ym_content_${entry.id}" placeholder="${placeholder}"
        style="flex:1" oninput="updatePreview()">
      <button type="button" class="btn-remove-sm"
        onclick="removeEntry('${containerId}', '${entry.id}')">×</button>
    </div>
  `).join('');
}

function removeEntry(containerId, id) {
  if (containerId === 'edu-entries')  eduEntries  = eduEntries.filter(e => e.id !== id);
  if (containerId === 'work-entries') workEntries = workEntries.filter(e => e.id !== id);
  if (containerId === 'cert-entries') certEntries = certEntries.filter(e => e.id !== id);
  renderYmEntries(containerId,
    containerId === 'edu-entries'  ? eduEntries  :
    containerId === 'work-entries' ? workEntries : certEntries,
    containerId === 'cert-entries' ? '普通自動車第一種運転免許 取得' : '');
  updatePreview();
}

function addEduEntry() {
  const id = generateId();
  eduEntries.push({ id });
  renderYmEntries('edu-entries', eduEntries, '〇〇高等学校 卒業');
}

function addWorkEntry() {
  const id = generateId();
  workEntries.push({ id });
  renderYmEntries('work-entries', workEntries, '株式会社〇〇 入社');
}

function addCertEntry() {
  const id = generateId();
  certEntries.push({ id });
  renderYmEntries('cert-entries', certEntries, '普通自動車第一種運転免許 取得');
}

// ============================================================
// Get YM entries as array
// ============================================================
function getYmEntries(entries) {
  return entries.map(entry => ({
    year:    getVal(`ym_year_${entry.id}`),
    month:   getVal(`ym_month_${entry.id}`),
    content: getVal(`ym_content_${entry.id}`)
  })).filter(e => e.content || e.year);
}

// ============================================================
// Preview Update
// ============================================================
function updatePreview() {
  const preview = document.getElementById('resume-preview');
  if (!preview) return;

  // Read values
  const createdDate = getVal('createdDate');
  const name        = getVal('name');
  const nameKana    = getVal('nameKana');
  const birthDate   = getVal('birthDate');
  const gender      = getVal('gender');
  const zip1        = getVal('zip1');
  const address1    = getVal('address1');
  const address1b   = getVal('address1b');
  const phone       = getVal('phone');
  const email       = getVal('email');
  const hasDiff     = document.querySelector('[name="hasDiffContact"]')?.checked;
  const zip2        = hasDiff ? getVal('zip2')     : '';
  const address2    = hasDiff ? getVal('address2') : '';
  const phone2      = hasDiff ? getVal('phone2')   : '';

  const motivation  = getVal('motivation');
  const commuteH    = getVal('commuteH');
  const commuteM    = getVal('commuteM');
  const dependents  = getVal('dependents');
  const spouse      = getVal('spouse');
  const spouseSupport = getVal('spouseSupport');
  const hobbies     = getVal('hobbies');
  const preferences = getVal('preferences');

  const hasContent = name || birthDate || address1 || eduEntries.length > 0 || workEntries.length > 0;

  if (!hasContent) {
    preview.innerHTML = `
      <div class="p-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
          <line x1="9" y1="9" x2="9" y2="21"/>
        </svg>
        <p>左側のフォームに入力すると<br>ここにプレビューが表示されます</p>
      </div>`;
    return;
  }

  // Format dates
  const createdStr = formatCreatedDate(createdDate);
  const birthWareki = dateToWareki(birthDate);
  const age = calcAge(birthDate);
  const birthDisplay = birthWareki
    ? birthWareki + (age !== null ? `（満${age}歳）` : '')
    : '';

  const addr1Full = [zip1 ? `〒${zip1}` : '', address1, address1b].filter(Boolean).join('　');
  const addr2Full = [zip2 ? `〒${zip2}` : '', address2].filter(Boolean).join('　');

  // Edu/Work/Cert entries
  const eduList  = getYmEntries(eduEntries);
  const workList = getYmEntries(workEntries);
  const certList = getYmEntries(certEntries);

  // Commute string
  const commuteStr = (commuteH || commuteM)
    ? `${commuteH ? commuteH + '時間' : ''}${commuteM ? commuteM + '分' : ''}`
    : '';

  // Build HTML
  let html = `
    <div class="r-title-row">
      <div class="r-title">履　歴　書</div>
      <div class="r-date">${escapeHtml(createdStr)}</div>
    </div>

    <table class="r-table">
      <!-- ふりがな + 写真 -->
      <tr>
        <td class="r-label" style="width:55px;white-space:nowrap">ふりがな</td>
        <td colspan="3" style="font-size:11px">${escapeHtml(nameKana)}</td>
        <td rowspan="3" style="width:92px;padding:0;vertical-align:top;text-align:center;border:1px solid #666">
          ${photoDataUrl
            ? `<img src="${photoDataUrl}" style="display:block;width:90px;height:120px;object-fit:cover;object-position:center top">`
            : `<div style="width:90px;height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#f5f5f5;color:#aaa;font-size:9px;text-align:center;line-height:2;gap:4px">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                写真貼付
               </div>`}
        </td>
      </tr>
      <!-- 氏名 -->
      <tr>
        <td class="r-label">氏名</td>
        <td colspan="3" style="font-size:16px;font-weight:700;padding:4px 6px;letter-spacing:0.05em">
          ${escapeHtml(name)}
        </td>
      </tr>
      <!-- 生年月日 + 性別 -->
      <tr>
        <td class="r-label" style="white-space:nowrap;font-size:9px">生年月日</td>
        <td colspan="3" style="font-size:11px">
          ${escapeHtml(birthDisplay)}
          ${gender ? `　${escapeHtml(gender)}` : ''}
        </td>
      </tr>

      <!-- 現住所 -->
      <tr>
        <td class="r-label" rowspan="2" style="vertical-align:middle;text-align:center">現住所</td>
        <td colspan="3" style="font-size:9.5px">
          <span class="r-info-label">〒・住所</span>
          ${escapeHtml(addr1Full)}
        </td>
        <td class="r-label" style="font-size:9px;white-space:nowrap;text-align:center">電話</td>
      </tr>
      <tr>
        <td colspan="3" style="font-size:9.5px">
          <span class="r-info-label">メールアドレス</span>
          ${escapeHtml(email)}
        </td>
        <td style="font-size:10px">${escapeHtml(phone)}</td>
      </tr>

      <!-- 連絡先 -->
      <tr>
        <td class="r-label" rowspan="2" style="vertical-align:middle;text-align:center;font-size:9px">連絡先</td>
        <td colspan="3" style="font-size:9.5px">
          <span class="r-info-label">〒・住所</span>
          ${hasDiff && addr2Full
            ? escapeHtml(addr2Full)
            : '<span style="color:#888;font-size:9.5px">現住所に同じ</span>'}
        </td>
        <td class="r-label" style="font-size:9px;white-space:nowrap;text-align:center">電話</td>
      </tr>
      <tr>
        <td colspan="3" style="font-size:9.5px">
          <span class="r-info-label">メールアドレス</span>
          <span style="display:block;font-size:9.5px"></span>
        </td>
        <td style="font-size:10px">${hasDiff ? escapeHtml(phone2) : ''}</td>
      </tr>

      <!-- 学歴・職歴 見出し -->
      <tr class="r-section-header">
        <td class="r-ym-year r-center">年</td>
        <td class="r-ym-month r-center">月</td>
        <td colspan="3" style="text-align:center">学　歴　・　職　歴</td>
      </tr>

      <!-- 学歴 header -->
      <tr>
        <td class="r-ym-year"></td>
        <td class="r-ym-month"></td>
        <td colspan="3" style="font-weight:700;text-align:center;font-size:11px">学　歴</td>
      </tr>
      ${eduList.map(e => `
      <tr>
        <td class="r-ym-year r-center">${escapeHtml(e.year)}</td>
        <td class="r-ym-month r-center">${escapeHtml(e.month)}</td>
        <td colspan="3">${escapeHtml(e.content)}</td>
      </tr>`).join('')}

      <!-- 職歴 header -->
      <tr>
        <td class="r-ym-year"></td>
        <td class="r-ym-month"></td>
        <td colspan="3" style="font-weight:700;text-align:center;font-size:11px">職　歴</td>
      </tr>
      ${workList.map(e => `
      <tr>
        <td class="r-ym-year r-center">${escapeHtml(e.year)}</td>
        <td class="r-ym-month r-center">${escapeHtml(e.month)}</td>
        <td colspan="3">${escapeHtml(e.content)}</td>
      </tr>`).join('')}

      <!-- 以上 -->
      <tr>
        <td class="r-ym-year"></td>
        <td class="r-ym-month"></td>
        <td colspan="3" style="text-align:right;font-size:11px">以上</td>
      </tr>

      <!-- 空白行 -->
      <tr style="height:18px">
        <td></td><td></td><td colspan="3"></td>
      </tr>

      <!-- 資格・免許 見出し -->
      <tr class="r-section-header">
        <td class="r-ym-year r-center">年</td>
        <td class="r-ym-month r-center">月</td>
        <td colspan="3" style="text-align:center">免　許　・　資　格</td>
      </tr>
      ${certList.length > 0
        ? certList.map(e => `
          <tr>
            <td class="r-ym-year r-center">${escapeHtml(e.year)}</td>
            <td class="r-ym-month r-center">${escapeHtml(e.month)}</td>
            <td colspan="3">${escapeHtml(e.content)}</td>
          </tr>`).join('')
        : `<tr style="height:18px"><td></td><td></td><td colspan="3"></td></tr>
           <tr style="height:18px"><td></td><td></td><td colspan="3"></td></tr>`}

      <!-- 空白行 -->
      <tr style="height:14px"><td></td><td></td><td colspan="3"></td></tr>

      <!-- 志望動機 -->
      <tr>
        <td class="r-label" colspan="2" style="text-align:center;background:#f0f0f0;vertical-align:top;padding-top:6px">
          志望の動機、特技、好きな学科、<br>アピールポイントなど
        </td>
        <td colspan="3" class="r-textarea-cell" style="min-height:80px">
          ${escapeHtml(motivation).replace(/\n/g, '<br>')}
        </td>
      </tr>

      <!-- 通勤・扶養・配偶者 -->
      <tr>
        <td class="r-label" colspan="2" style="text-align:center;font-size:9px">通勤時間</td>
        <td style="text-align:center;font-size:11px">
          ${escapeHtml(commuteStr)}
        </td>
        <td class="r-label" style="text-align:center;font-size:9px;white-space:nowrap">扶養家族数<br><span style="font-size:8px">(配偶者除く)</span></td>
        <td style="text-align:center;font-size:11px">
          ${dependents !== '' ? escapeHtml(dependents) + '人' : ''}
        </td>
      </tr>
      <tr>
        <td class="r-label" colspan="2" style="text-align:center;font-size:9px">配偶者</td>
        <td style="text-align:center;font-size:11px">${escapeHtml(spouse)}</td>
        <td class="r-label" style="text-align:center;font-size:9px;white-space:nowrap">配偶者の<br>扶養義務</td>
        <td style="text-align:center;font-size:11px">${escapeHtml(spouseSupport)}</td>
      </tr>

      <!-- 趣味・特技 -->
      <tr>
        <td class="r-label" colspan="2" style="text-align:center;font-size:9px">趣味・特技</td>
        <td colspan="3" style="font-size:11px">${escapeHtml(hobbies).replace(/\n/g,'<br>')}</td>
      </tr>

      <!-- 本人希望 -->
      <tr>
        <td class="r-label" colspan="2" style="text-align:center;font-size:9px">
          本人希望記入欄<br><span style="font-size:7.5px;word-break:break-all;white-space:normal;display:block">(給料・職種・勤務時間・勤務地などの希望)</span>
        </td>
        <td colspan="3" class="r-textarea-cell" style="min-height:50px">
          ${escapeHtml(preferences).replace(/\n/g,'<br>')}
        </td>
      </tr>

    </table>
  `;

  preview.innerHTML = html;
}

// ============================================================
// Print & PDF
// ============================================================
function printResume() {
  window.print();
}

function downloadPDF() {
  const element = document.getElementById('resume-preview');
  if (!element) return;

  if (typeof html2pdf === 'undefined') {
    alert('PDF生成ライブラリの読み込みに失敗しました。印刷機能（Ctrl+P）をご利用ください。');
    return;
  }

  const nameVal = getVal('name') || '履歴書';
  const filename = `${nameVal}_履歴書.pdf`;

  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  const btns = document.querySelectorAll('.btn-pdf-h, .btn-pdf-t');
  btns.forEach(btn => { btn.disabled = true; btn.style.opacity = '0.6'; });

  html2pdf().set(opt).from(element).save().then(() => {
    btns.forEach(btn => { btn.disabled = false; btn.style.opacity = ''; });
  }).catch(err => {
    console.error(err);
    btns.forEach(btn => { btn.disabled = false; btn.style.opacity = ''; });
    alert('PDF生成に失敗しました。印刷機能（Ctrl+P）をご利用ください。');
  });
}

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // 今日の日付をデフォルト設定
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.querySelector('[name="createdDate"]');
  if (dateInput) dateInput.value = today;

  // 初期エントリー追加
  addEduEntry();
  addEduEntry();
  addWorkEntry();
  addCertEntry();

  switchTab('basic');

  // Static inputs
  const staticFields = [
    'createdDate','name','nameKana','birthDate','gender',
    'zip1','address1','address1b','phone','email',
    'zip2','address2','phone2',
    'motivation','commuteH','commuteM',
    'dependents','spouse','spouseSupport','hobbies','preferences'
  ];
  staticFields.forEach(name => {
    const el = document.querySelector(`[name="${name}"]`);
    if (el) {
      el.addEventListener('input', updatePreview);
      el.addEventListener('change', updatePreview);
    }
  });

  updatePreview();
});
