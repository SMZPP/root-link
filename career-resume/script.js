// ============================================================
// 職務経歴書メーカー - Main Script
// ============================================================

// --- Dynamic Entry State ---
let workEntries = [];
let certEntries = [];
let skillTags = [];

// --- Utility ---
function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getVal(name) {
  const el = document.querySelector(`[name="${name}"]`);
  return el ? el.value.trim() : '';
}

function formatMonth(monthStr) {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  return `${year}年${parseInt(month)}月`;
}

function calcAge(birthDate) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const diffMonth = now.getMonth() - birth.getMonth();
  if (diffMonth < 0 || (diffMonth === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
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
  // Scroll form area to top
  const tabContents = document.querySelector('.tab-contents');
  if (tabContents) tabContents.scrollTop = 0;
}

// ============================================================
// Work History
// ============================================================
function addWorkEntry() {
  const id = generateId();
  workEntries.push({ id });
  renderWorkEntries();
  // Scroll to the new entry
  setTimeout(() => {
    const container = document.getElementById('work-entries');
    if (container) {
      const cards = container.querySelectorAll('.entry-card');
      if (cards.length > 0) {
        cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, 50);
}

function removeWorkEntry(id) {
  workEntries = workEntries.filter(e => e.id !== id);
  renderWorkEntries();
  updatePreview();
}

function renderWorkEntries() {
  const container = document.getElementById('work-entries');
  if (!container) return;

  container.innerHTML = workEntries.map((entry, index) => `
    <div class="entry-card" data-id="${entry.id}">
      <div class="entry-header">
        <span class="entry-num">職歴 ${index + 1}</span>
        <button type="button" class="btn-remove" onclick="removeWorkEntry('${entry.id}')">削除</button>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>会社名</label>
          <input type="text" name="work_company_${entry.id}" placeholder="株式会社〇〇" oninput="updatePreview()">
        </div>
        <div class="form-group">
          <label>業種</label>
          <input type="text" name="work_industry_${entry.id}" placeholder="IT・インターネット" oninput="updatePreview()">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>雇用形態</label>
          <select name="work_type_${entry.id}" onchange="updatePreview()">
            <option value="正社員">正社員</option>
            <option value="契約社員">契約社員</option>
            <option value="派遣社員">派遣社員</option>
            <option value="業務委託">業務委託</option>
            <option value="アルバイト・パート">アルバイト・パート</option>
            <option value="インターン">インターン</option>
          </select>
        </div>
        <div class="form-group">
          <label>役職・職種</label>
          <input type="text" name="work_position_${entry.id}" placeholder="フロントエンドエンジニア" oninput="updatePreview()">
        </div>
      </div>

      <div class="form-row period-row">
        <div class="form-group">
          <label>入社年月</label>
          <input type="month" name="work_from_${entry.id}" oninput="updatePreview()">
        </div>
        <span class="period-sep">〜</span>
        <div class="form-group">
          <label>退社年月</label>
          <input type="month" name="work_to_${entry.id}" oninput="updatePreview()">
          <label class="checkbox-label">
            <input type="checkbox" name="work_current_${entry.id}" onchange="toggleCurrentJob('${entry.id}')">
            在職中
          </label>
        </div>
      </div>

      <div class="form-group">
        <label>業務内容</label>
        <textarea name="work_desc_${entry.id}" rows="4" placeholder="担当した業務の内容を具体的に記載してください" oninput="updatePreview()"></textarea>
      </div>

      <div class="form-group">
        <label>実績・成果（任意）</label>
        <textarea name="work_achieve_${entry.id}" rows="3" placeholder="例：〇〇の導入によりページ読み込み速度を50%改善" oninput="updatePreview()"></textarea>
      </div>
    </div>
  `).join('');
}

function toggleCurrentJob(id) {
  const checkbox = document.querySelector(`[name="work_current_${id}"]`);
  const toInput = document.querySelector(`[name="work_to_${id}"]`);
  if (!checkbox || !toInput) return;
  toInput.disabled = checkbox.checked;
  if (checkbox.checked) toInput.value = '';
  updatePreview();
}

// ============================================================
// Certifications
// ============================================================
function addCertEntry() {
  const id = generateId();
  certEntries.push({ id });
  renderCertEntries();
}

function removeCertEntry(id) {
  certEntries = certEntries.filter(e => e.id !== id);
  renderCertEntries();
  updatePreview();
}

function renderCertEntries() {
  const container = document.getElementById('cert-entries');
  if (!container) return;

  container.innerHTML = certEntries.map(() => '').join(''); // clear
  container.innerHTML = certEntries.map(entry => `
    <div class="cert-row" data-id="${entry.id}">
      <input type="month" name="cert_date_${entry.id}" oninput="updatePreview()">
      <input type="text" name="cert_name_${entry.id}" placeholder="例：基本情報技術者試験" style="flex:1" oninput="updatePreview()">
      <button type="button" class="btn-remove-sm" onclick="removeCertEntry('${entry.id}')">×</button>
    </div>
  `).join('');
}

// ============================================================
// Skills
// ============================================================
function addSkill() {
  const input = document.getElementById('skill-input');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;

  // Allow comma-separated input
  const items = raw.split(/[,、]/).map(s => s.trim()).filter(s => s);
  let changed = false;
  items.forEach(val => {
    if (val && !skillTags.includes(val)) {
      skillTags.push(val);
      changed = true;
    }
  });

  if (changed) {
    input.value = '';
    renderSkillTags();
    updatePreview();
  }
  input.focus();
}

function removeSkill(skill) {
  skillTags = skillTags.filter(s => s !== skill);
  renderSkillTags();
  updatePreview();
}

function renderSkillTags() {
  const container = document.getElementById('skill-tags');
  if (!container) return;
  if (skillTags.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = skillTags.map(skill => {
    const escaped = escapeHtml(skill);
    const jsEscaped = skill.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `<span class="skill-tag">${escaped}<button type="button" onclick="removeSkill('${jsEscaped}')">×</button></span>`;
  }).join('');
}

// ============================================================
// Preview Update
// ============================================================
function updatePreview() {
  const preview = document.getElementById('resume-preview');
  if (!preview) return;

  // Read basic info
  const name = getVal('name');
  const nameKana = getVal('nameKana');
  const birthDate = getVal('birthDate');
  const gender = getVal('gender');
  const address = getVal('address');
  const phone = getVal('phone');
  const email = getVal('email');
  const station = getVal('station');
  const summary = getVal('summary');
  const selfPR = getVal('selfPR');
  const skillDetail = getVal('skillDetail');
  const createdDate = getVal('createdDate');

  const age = calcAge(birthDate);

  // Format birth date string
  let birthStr = '';
  if (birthDate) {
    const d = new Date(birthDate);
    if (!isNaN(d)) {
      birthStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日生`;
      if (age !== null) birthStr += `（${age}歳）`;
    }
  }

  // Format created date
  const createdStr = formatDate(createdDate);

  // Check if there's any content
  const hasContent = name || birthDate || address || phone || email || summary ||
    selfPR || workEntries.length > 0 || skillTags.length > 0 || certEntries.length > 0;

  if (!hasContent) {
    preview.innerHTML = `
      <div class="p-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <p>左側のフォームに入力すると<br>ここにプレビューが表示されます</p>
      </div>
    `;
    return;
  }

  // --- Build Work History HTML ---
  const workHTML = workEntries.map(entry => {
    const company = getVal(`work_company_${entry.id}`);
    const industry = getVal(`work_industry_${entry.id}`);
    const type = getVal(`work_type_${entry.id}`);
    const position = getVal(`work_position_${entry.id}`);
    const from = getVal(`work_from_${entry.id}`);
    const to = getVal(`work_to_${entry.id}`);
    const isCurrentEl = document.querySelector(`[name="work_current_${entry.id}"]`);
    const isCurrent = isCurrentEl ? isCurrentEl.checked : false;
    const desc = getVal(`work_desc_${entry.id}`);
    const achieve = getVal(`work_achieve_${entry.id}`);

    if (!company && !desc) return '';

    const fromStr = formatMonth(from);
    const toStr = isCurrent ? '現在' : formatMonth(to);
    const periodStr = fromStr || toStr ? `${fromStr}${fromStr && toStr ? ' 〜 ' : ''}${toStr}` : '';

    const metaParts = [industry, type].filter(Boolean);

    return `
      <div class="p-work-entry">
        <div class="p-work-header">
          <div class="p-work-company">${escapeHtml(company)}</div>
          ${metaParts.length > 0 ? `<div class="p-work-meta">${escapeHtml(metaParts.join(' ／ '))}</div>` : ''}
        </div>
        ${periodStr ? `<div class="p-work-period">${escapeHtml(periodStr)}</div>` : ''}
        ${position ? `<div class="p-work-position">役職・職種：${escapeHtml(position)}</div>` : ''}
        ${desc ? `
          <div class="p-work-desc">
            <div class="p-label">業務内容</div>
            <div class="p-text">${escapeHtml(desc).replace(/\n/g, '<br>')}</div>
          </div>` : ''}
        ${achieve ? `
          <div class="p-work-achieve">
            <div class="p-label">実績・成果</div>
            <div class="p-text">${escapeHtml(achieve).replace(/\n/g, '<br>')}</div>
          </div>` : ''}
      </div>
    `;
  }).filter(Boolean).join('');

  // --- Build Certifications HTML ---
  const certRows = certEntries.map(entry => {
    const date = getVal(`cert_date_${entry.id}`);
    const certName = getVal(`cert_name_${entry.id}`);
    if (!certName) return '';
    return `<tr><td>${escapeHtml(formatMonth(date))}</td><td>${escapeHtml(certName)}</td></tr>`;
  }).filter(Boolean).join('');

  // --- Render Preview ---
  let html = '';

  // Header
  html += `
    <div class="p-header">
      ${createdStr ? `<div class="p-date">作成日：${escapeHtml(createdStr)}</div>` : ''}
      <h1 class="p-title">職務経歴書</h1>
    </div>
  `;

  // Basic Info
  const hasBasic = name || birthStr || gender || address || station || phone || email;
  if (hasBasic) {
    html += `
      <section class="p-section">
        <h2 class="p-section-title">基本情報</h2>
        <table class="p-info-table">
          ${name ? `
            <tr>
              <th>氏名</th>
              <td>
                <strong style="font-size:14px">${escapeHtml(name)}</strong>
                ${nameKana ? `<span class="p-kana">（${escapeHtml(nameKana)}）</span>` : ''}
              </td>
            </tr>` : ''}
          ${birthStr ? `
            <tr>
              <th>生年月日</th>
              <td>${escapeHtml(birthStr)}${gender ? `　${escapeHtml(gender)}` : ''}</td>
            </tr>` : ''}
          ${address ? `<tr><th>現住所</th><td>${escapeHtml(address)}</td></tr>` : ''}
          ${station ? `<tr><th>最寄り駅</th><td>${escapeHtml(station)}</td></tr>` : ''}
          ${phone ? `<tr><th>電話番号</th><td>${escapeHtml(phone)}</td></tr>` : ''}
          ${email ? `<tr><th>E-mail</th><td>${escapeHtml(email)}</td></tr>` : ''}
        </table>
      </section>
    `;
  }

  // Summary
  if (summary) {
    html += `
      <section class="p-section">
        <h2 class="p-section-title">職務要約</h2>
        <div class="p-text">${escapeHtml(summary).replace(/\n/g, '<br>')}</div>
      </section>
    `;
  }

  // Work History
  if (workHTML) {
    html += `
      <section class="p-section">
        <h2 class="p-section-title">職務経歴</h2>
        <div class="p-work-list">${workHTML}</div>
      </section>
    `;
  }

  // Skills
  if (skillTags.length > 0 || skillDetail) {
    html += `
      <section class="p-section">
        <h2 class="p-section-title">保有スキル</h2>
        ${skillTags.length > 0 ? `
          <div class="p-skills">
            ${skillTags.map(s => `<span class="p-skill-tag">${escapeHtml(s)}</span>`).join('')}
          </div>` : ''}
        ${skillDetail ? `<div class="p-skill-detail">${escapeHtml(skillDetail).replace(/\n/g, '<br>')}</div>` : ''}
      </section>
    `;
  }

  // Certifications
  if (certRows) {
    html += `
      <section class="p-section">
        <h2 class="p-section-title">資格・免許</h2>
        <table class="p-cert-table">
          <thead>
            <tr><th>取得年月</th><th>資格名・免許名</th></tr>
          </thead>
          <tbody>${certRows}</tbody>
        </table>
      </section>
    `;
  }

  // Self PR
  if (selfPR) {
    html += `
      <section class="p-section">
        <h2 class="p-section-title">自己PR</h2>
        <div class="p-text">${escapeHtml(selfPR).replace(/\n/g, '<br>')}</div>
      </section>
    `;
  }

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

  // Check if html2pdf is available
  if (typeof html2pdf === 'undefined') {
    alert('PDF生成ライブラリの読み込みに失敗しました。印刷機能（Ctrl+P）をご利用ください。');
    return;
  }

  const nameVal = getVal('name') || '職務経歴書';
  const filename = `${nameVal}_職務経歴書.pdf`;

  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true,
      logging: false
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    }
  };

  // Show loading state
  const btns = document.querySelectorAll('.btn-pdf-h, .btn-pdf-t');
  btns.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.6';
  });

  html2pdf().set(opt).from(element).save().then(() => {
    btns.forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '';
    });
  }).catch(err => {
    console.error('PDF生成エラー:', err);
    btns.forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '';
    });
    alert('PDF生成に失敗しました。印刷機能（Ctrl+P）をご利用ください。');
  });
}

// ============================================================
// Initialize
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Set default created date to today
  const today = new Date().toISOString().split('T')[0];
  const createdInput = document.querySelector('[name="createdDate"]');
  if (createdInput) createdInput.value = today;

  // Init default entries
  addWorkEntry();
  addCertEntry();

  // Active tab
  switchTab('basic');

  // Listen to static inputs (dynamic ones use inline oninput)
  const staticInputs = document.querySelectorAll(
    '[name="createdDate"], [name="name"], [name="nameKana"], [name="birthDate"], ' +
    '[name="gender"], [name="address"], [name="station"], [name="phone"], ' +
    '[name="email"], [name="summary"], [name="skillDetail"], [name="selfPR"]'
  );
  staticInputs.forEach(el => {
    el.addEventListener('input', updatePreview);
    el.addEventListener('change', updatePreview);
  });

  // Skill input: Enter key
  const skillInput = document.getElementById('skill-input');
  if (skillInput) {
    skillInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSkill();
      }
    });
  }

  // Initial preview render
  updatePreview();
});
