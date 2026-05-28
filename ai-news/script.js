/* ===================================================
   AI News Page Script
   =================================================== */

const CATEGORY_COLORS = {
  'LLM': '#7c3aed',
  '画像生成': '#db2777',
  '製品': '#0891b2',
  '研究': '#16a34a',
  '規制': '#dc2626',
  'ビジネス': '#d97706',
  'その他': '#64748b',
};

const CAT_ICONS = {
  'LLM': '🧠', '画像生成': '🎨', '製品': '📦',
  '研究': '🔬', '規制': '⚖️', 'ビジネス': '💼', 'その他': '📌',
};

let allArticles = [];
let currentCat = 'all';
let currentDays = 3;

// ===== データ取得 =====
async function loadArticles() {
  try {
    const res = await fetch('data/articles.json?t=' + Date.now());
    const data = await res.json();
    allArticles = data.articles || [];

    const upd = new Date(data.updated);
    document.getElementById('header-updated').textContent =
      '最終更新: ' + upd.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    renderAll();
    loadArchive();
  } catch (e) {
    document.getElementById('articles-container').innerHTML =
      '<div class="empty-state"><div class="empty-icon">😕</div>記事の読み込みに失敗しました。しばらく経ってから再度お試しください。</div>';
  }
}

async function loadArchive() {
  try {
    const res = await fetch('data/archive.json?t=' + Date.now());
    const archive = await res.json();
    renderArchive(archive);
  } catch (e) { /* ignore */ }
}

// ===== フィルタリング =====
function getFilteredArticles() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - currentDays);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return allArticles.filter((a) => {
    const catOk = currentCat === 'all' || a.category === currentCat;
    const dateOk = a.date >= cutoffStr;
    return catOk && dateOk;
  });
}

// ===== レンダリング =====
function renderAll() {
  renderArticles();
  renderCatStats();
}

function renderArticles() {
  const articles = getFilteredArticles();
  const container = document.getElementById('articles-container');

  if (articles.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div>該当する記事がありません。</div>';
    return;
  }

  // 日付でグループ化
  const byDate = {};
  articles.forEach((a) => {
    if (!byDate[a.date]) byDate[a.date] = [];
    byDate[a.date].push(a);
  });

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let html = '';
  Object.keys(byDate).sort((a, b) => b.localeCompare(a)).forEach((date) => {
    const arts = byDate[date];
    let dateLabel = date;
    if (date === today) dateLabel = `${date}（今日）`;
    else if (date === yesterday) dateLabel = `${date}（昨日）`;

    html += `
      <div class="date-group" data-date="${date}">
        <div class="date-group-header">
          <span class="date-group-title">📅 ${dateLabel}</span>
          <span class="date-group-count">${arts.length}件</span>
        </div>
        <div class="articles-grid">
          ${arts.map((a) => articleCardHTML(a)).join('')}
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

function articleCardHTML(a) {
  const badgeClass = 'badge-' + a.category;
  const icon = CAT_ICONS[a.category] || '📌';
  const timeStr = a.datetime ? new Date(a.datetime).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  }) : '';

  return `
    <article class="article-card" itemscope itemtype="https://schema.org/NewsArticle">
      <div class="article-card-top">
        <span class="category-badge ${badgeClass}">${icon} ${escHtml(a.category)}</span>
        <span class="article-source">${escHtml(a.source)}</span>
        ${timeStr ? `<span class="article-date-time">${timeStr}</span>` : ''}
      </div>
      <h2 class="article-title" itemprop="headline">
        <a href="${escHtml(a.url)}" target="_blank" rel="noopener noreferrer" itemprop="url">${escHtml(a.title)}</a>
      </h2>
      <p class="article-summary" itemprop="description">${escHtml(a.summary)}</p>
      <a href="${escHtml(a.url)}" target="_blank" rel="noopener noreferrer" class="article-read-btn">
        記事を読む →
      </a>
    </article>`;
}

function renderCatStats() {
  const articles = allArticles;
  const counts = {};
  articles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
  const max = Math.max(...Object.values(counts), 1);

  const catOrder = ['LLM', '画像生成', '製品', '研究', '規制', 'ビジネス', 'その他'];
  const list = document.getElementById('cat-stat-list');
  list.innerHTML = catOrder.map((cat) => {
    const n = counts[cat] || 0;
    const pct = Math.round((n / max) * 100);
    const color = CATEGORY_COLORS[cat] || '#64748b';
    const icon = CAT_ICONS[cat] || '📌';
    return `
      <li class="cat-stat-item" data-cat="${cat}" onclick="filterByCategory('${cat}')">
        <span class="cat-stat-name">${icon} ${cat}</span>
        <div class="cat-stat-bar-wrap">
          <div class="cat-stat-bar" style="width:${pct}%;background:${color}"></div>
        </div>
        <span class="cat-stat-num">${n}</span>
      </li>`;
  }).join('');
}

function renderArchive(archive) {
  const list = document.getElementById('archive-list');
  if (!archive || archive.length === 0) {
    list.innerHTML = '<li style="color:var(--text-muted);font-size:0.85rem">記録がありません</li>';
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  list.innerHTML = archive.slice(0, 14).map((item) => {
    let label = item.date;
    if (item.date === today) label += ' (今日)';
    else if (item.date === yesterday) label += ' (昨日)';
    return `
      <li>
        <a onclick="jumpToDate('${item.date}')">${label}</a>
        <span class="archive-count">${item.count}件</span>
      </li>`;
  }).join('');
}

// ===== イベント処理 =====
function filterByCategory(cat) {
  currentCat = cat;
  document.querySelectorAll('.cat-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  renderArticles();
}

function setDateRange(days) {
  const parsedDays = Number.parseInt(days, 10);
  if (Number.isNaN(parsedDays)) return;

  currentDays = parsedDays;
  document.querySelectorAll('.date-nav-btn').forEach((b) => {
    b.classList.toggle('active', Number.parseInt(b.dataset.days, 10) === currentDays);
  });
  renderArticles();
}

function jumpToDate(date) {
  // 表示期間を広げて該当日を表示
  const today = new Date().toISOString().slice(0, 10);
  const diffDays = Math.ceil((new Date(today) - new Date(date)) / 86400000) + 1;
  currentDays = Math.max(currentDays, diffDays);

  // date-nav ボタンの active 更新
  document.querySelectorAll('.date-nav-btn').forEach((b) => {
    b.classList.toggle('active', Number.parseInt(b.dataset.days, 10) === currentDays);
  });

  renderArticles();

  // スクロール
  setTimeout(() => {
    const el = document.querySelector(`.date-group[data-date="${date}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

// ===== イベントリスナー登録 =====
document.getElementById('category-filter').addEventListener('click', (e) => {
  const btn = e.target.closest('.cat-btn');
  if (!btn) return;
  filterByCategory(btn.dataset.cat);
});

document.getElementById('date-nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.date-nav-btn');
  if (!btn) return;
  setDateRange(btn.dataset.days);
});

// 一部環境で親要素委譲が効かないケース向けのフォールバック
document.querySelectorAll('.date-nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => setDateRange(btn.dataset.days));
});

// ===== ユーティリティ =====
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== 初期化 =====
loadArticles();
