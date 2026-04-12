/* ===================================================
   中国語学習アプリ  script.js
   =================================================== */

// ===== Language Config =====
const LANG = {
  wordKey: 'word',
  readingKey: 'reading',
  name: '中国語',
  colHeader: '中国語',
  readingLabel: 'ピンイン',
  searchPlaceholder: '検索（中国語・日本語）…',
};

// ===== Default Words =====
const DEFAULT_WORDS = [
  { word: '你好',   reading: 'nǐ hǎo',   japanese: 'こんにちは',     example: '你好！很高兴认识你。',   notes: '挨拶',  mastered: false },
  { word: '谢谢',   reading: 'xièxie',   japanese: 'ありがとう',     example: '谢谢你的帮助。',         notes: '挨拶',  mastered: false },
  { word: '再见',   reading: 'zàijiàn',  japanese: 'さようなら',     example: '明天见！再见！',           notes: '挨拶',  mastered: false },
  { word: '对不起', reading: 'duìbuqǐ',  japanese: 'すみません',     example: '对不起，我来晚了。',       notes: '挨拶',  mastered: false },
  { word: '是',     reading: 'shì',      japanese: 'はい・〜です',   example: '我是日本人。',             notes: '基本',  mastered: false },
  { word: '我',     reading: 'wǒ',       japanese: '私',             example: '我叫山田太郎。',           notes: '代名詞', mastered: false },
  { word: '你',     reading: 'nǐ',       japanese: 'あなた',         example: '你叫什么名字？',           notes: '代名詞', mastered: false },
  { word: '好',     reading: 'hǎo',      japanese: '良い・元気',     example: '今天天气很好。',           notes: '形容詞', mastered: false },
  { word: '吃',     reading: 'chī',      japanese: '食べる',         example: '我想吃饺子。',             notes: '動詞',  mastered: false },
  { word: '去',     reading: 'qù',       japanese: '行く',           example: '我去学校。',               notes: '動詞',  mastered: false },
];

// ===== Storage =====
const STORAGE_KEYS = {
  WORDS: 'chinese_words',
  QUIZ_HISTORY: 'chinese_quiz_history',
};

function loadWords() {
  const raw = localStorage.getItem(STORAGE_KEYS.WORDS);
  if (raw) return JSON.parse(raw);
  const seeded = DEFAULT_WORDS.map((w, i) => ({
    id: Date.now() + i,
    word: w.word,
    reading: w.reading || '',
    japanese: w.japanese,
    example: w.example || '',
    notes: w.notes || '',
    mastered: w.mastered,
    createdAt: Date.now() + i,
  }));
  saveWords(seeded);
  return seeded;
}

function saveWords(words) {
  localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
}

function loadQuizHistory() {
  const raw = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY);
  return raw ? JSON.parse(raw) : [];
}

function saveQuizHistory(history) {
  localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(history));
}

// ===== State =====
let words = loadWords();
let quizHistory = loadQuizHistory();

// ===== Tab Navigation =====
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + target).classList.add('active');
    if (target === 'flashcard') initFlashcard();
    if (target === 'stats') renderStats();
  });
});

/* ====================================================
   単語帳 TAB
   ==================================================== */
const searchInput  = document.getElementById('search-input');
const sortSelect   = document.getElementById('sort-select');
const wordTbody    = document.getElementById('word-tbody');
const noWordsMsg   = document.getElementById('no-words-msg');
const btnAddWord   = document.getElementById('btn-add-word');

// Modal elements
const wordModal    = document.getElementById('word-modal');
const modalTitle   = document.getElementById('modal-title');
const wordForm     = document.getElementById('word-form');
const editIdInput  = document.getElementById('edit-id');
const formWord     = document.getElementById('form-word');
const formReading  = document.getElementById('form-reading');
const formJapanese = document.getElementById('form-japanese');
const formExample  = document.getElementById('form-example');
const formNotes    = document.getElementById('form-notes');
const formMastered = document.getElementById('form-mastered');
const modalCancel  = document.getElementById('modal-cancel');

// Delete modal
const deleteModal    = document.getElementById('delete-modal');
const deleteWordName = document.getElementById('delete-word-name');
const confirmDelete  = document.getElementById('confirm-delete');
const cancelDelete   = document.getElementById('cancel-delete');
let pendingDeleteId  = null;

function getSortedFilteredWords() {
  const q = searchInput.value.trim().toLowerCase();
  let list = words.filter(w =>
    w[LANG.wordKey].toLowerCase().includes(q) ||
    w.japanese.includes(q) ||
    (w[LANG.readingKey] || '').toLowerCase().includes(q)
  );
  const sort = sortSelect.value;
  if (sort === 'date-desc') list.sort((a, b) => b.createdAt - a.createdAt);
  else if (sort === 'date-asc') list.sort((a, b) => a.createdAt - b.createdAt);
  else if (sort === 'alpha-asc') list.sort((a, b) => a[LANG.wordKey].localeCompare(b[LANG.wordKey]));
  else if (sort === 'alpha-desc') list.sort((a, b) => b[LANG.wordKey].localeCompare(a[LANG.wordKey]));
  return list;
}

function renderWordTable() {
  const list = getSortedFilteredWords();
  wordTbody.innerHTML = '';
  if (list.length === 0) {
    noWordsMsg.style.display = 'block';
    return;
  }
  noWordsMsg.style.display = 'none';
  list.forEach(w => {
    const tr = document.createElement('tr');
    const readingHtml = w[LANG.readingKey]
      ? `<span class="word-reading">${escHtml(w[LANG.readingKey])}</span>`
      : '';
    tr.innerHTML = `
      <td><strong>${escHtml(w[LANG.wordKey])}</strong>${readingHtml}</td>
      <td>${escHtml(w.japanese)}</td>
      <td class="text-ellipsis" title="${escHtml(w.example)}">${escHtml(w.example) || '<span style="color:var(--text-muted)">—</span>'}</td>
      <td class="text-ellipsis" title="${escHtml(w.notes)}">${escHtml(w.notes) || '<span style="color:var(--text-muted)">—</span>'}</td>
      <td>${w.mastered
        ? '<span class="mastered-badge">✓ 習得</span>'
        : '<span class="unmastered-badge">未習得</span>'}</td>
      <td>
        <div class="action-btns">
          <button class="btn-edit" data-id="${w.id}">編集</button>
          <button class="btn-del" data-id="${w.id}">削除</button>
        </div>
      </td>`;
    wordTbody.appendChild(tr);
  });
  wordTbody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  wordTbody.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

function openAddModal() {
  modalTitle.textContent = '単語を追加';
  editIdInput.value = '';
  wordForm.reset();
  wordModal.style.display = 'flex';
  formWord.focus();
}

function openEditModal(id) {
  const w = words.find(x => x.id == id);
  if (!w) return;
  modalTitle.textContent = '単語を編集';
  editIdInput.value = w.id;
  formWord.value     = w[LANG.wordKey];
  formReading.value  = w[LANG.readingKey] || '';
  formJapanese.value = w.japanese;
  formExample.value  = w.example;
  formNotes.value    = w.notes;
  formMastered.checked = w.mastered;
  wordModal.style.display = 'flex';
  formWord.focus();
}

function openDeleteModal(id) {
  const w = words.find(x => x.id == id);
  if (!w) return;
  pendingDeleteId = id;
  deleteWordName.textContent = `「${w[LANG.wordKey]}」(${w.japanese})`;
  deleteModal.style.display = 'flex';
}

function closeWordModal() { wordModal.style.display = 'none'; }
function closeDeleteModal() { deleteModal.style.display = 'none'; pendingDeleteId = null; }

btnAddWord.addEventListener('click', openAddModal);
modalCancel.addEventListener('click', closeWordModal);
wordModal.addEventListener('click', e => { if (e.target === wordModal) closeWordModal(); });

wordForm.addEventListener('submit', e => {
  e.preventDefault();
  const wordVal   = formWord.value.trim();
  const readingVal = formReading.value.trim();
  const jpn       = formJapanese.value.trim();
  if (!wordVal || !jpn) return;

  const id = editIdInput.value;
  if (id) {
    const w = words.find(x => x.id == id);
    if (w) {
      w[LANG.wordKey]     = wordVal;
      w[LANG.readingKey]  = readingVal;
      w.japanese  = jpn;
      w.example   = formExample.value.trim();
      w.notes     = formNotes.value.trim();
      w.mastered  = formMastered.checked;
    }
  } else {
    words.push({
      id: Date.now(),
      [LANG.wordKey]: wordVal,
      [LANG.readingKey]: readingVal,
      japanese: jpn,
      example: formExample.value.trim(),
      notes: formNotes.value.trim(),
      mastered: formMastered.checked,
      createdAt: Date.now(),
    });
  }
  saveWords(words);
  closeWordModal();
  renderWordTable();
});

cancelDelete.addEventListener('click', closeDeleteModal);
deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });

confirmDelete.addEventListener('click', () => {
  if (pendingDeleteId == null) return;
  words = words.filter(w => w.id != pendingDeleteId);
  saveWords(words);
  closeDeleteModal();
  renderWordTable();
});

searchInput.addEventListener('input', renderWordTable);
sortSelect.addEventListener('change', renderWordTable);

renderWordTable();

/* ====================================================
   フラッシュカード TAB
   ==================================================== */
let fcDeck   = [];
let fcIndex  = 0;
let fcFilter = 'all';

const fcCardInner   = document.getElementById('fc-card-inner');
const fcWord        = document.getElementById('fc-word');
const fcReading     = document.getElementById('fc-reading');
const fcMeaning     = document.getElementById('fc-meaning');
const fcExample     = document.getElementById('fc-example');
const fcNote        = document.getElementById('fc-note');
const fcProgress    = document.getElementById('fc-progress');
const fcEmpty       = document.getElementById('fc-empty');
const fcArea        = document.getElementById('fc-area');
const fcCard        = document.getElementById('fc-card');
const fcActions     = document.getElementById('fc-actions');
const fcPrev        = document.getElementById('fc-prev');
const fcNext        = document.getElementById('fc-next');
const fcShuffle     = document.getElementById('fc-shuffle');
const fcMasteredBtn = document.getElementById('fc-mastered');
const fcAgainBtn    = document.getElementById('fc-again');

function buildDeck() {
  if (fcFilter === 'unmastered') {
    fcDeck = words.filter(w => !w.mastered);
  } else {
    fcDeck = [...words];
  }
  fcIndex = 0;
  renderCard();
}

function renderCard() {
  fcCardInner.classList.remove('flipped');

  if (fcDeck.length === 0) {
    fcCard.style.display = 'none';
    fcEmpty.style.display = 'block';
    fcActions.style.display = 'none';
    fcProgress.textContent = '0 / 0';
    fcPrev.disabled = true;
    fcNext.disabled = true;
    return;
  }
  fcCard.style.display = 'block';
  fcEmpty.style.display = 'none';
  fcActions.style.display = 'flex';

  const w = fcDeck[fcIndex];
  fcWord.textContent    = w[LANG.wordKey];
  if (fcReading) fcReading.textContent = w[LANG.readingKey] || '';
  fcMeaning.textContent = w.japanese;
  fcExample.textContent = w.example || '';
  fcNote.textContent    = w.notes ? `📝 ${w.notes}` : '';
  fcProgress.textContent = `${fcIndex + 1} / ${fcDeck.length}`;
  fcPrev.disabled = fcIndex === 0;
  fcNext.disabled = fcIndex === fcDeck.length - 1;
}

function initFlashcard() {
  fcFilter = document.querySelector('input[name="fc-filter"]:checked').value;
  buildDeck();
}

document.querySelectorAll('input[name="fc-filter"]').forEach(radio => {
  radio.addEventListener('change', () => {
    fcFilter = radio.value;
    buildDeck();
  });
});

fcCard.addEventListener('click', () => {
  if (fcDeck.length === 0) return;
  fcCardInner.classList.toggle('flipped');
});

fcPrev.addEventListener('click', () => {
  if (fcIndex > 0) { fcIndex--; renderCard(); }
});
fcNext.addEventListener('click', () => {
  if (fcIndex < fcDeck.length - 1) { fcIndex++; renderCard(); }
});

fcShuffle.addEventListener('click', () => {
  for (let i = fcDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fcDeck[i], fcDeck[j]] = [fcDeck[j], fcDeck[i]];
  }
  fcIndex = 0;
  renderCard();
});

fcMasteredBtn.addEventListener('click', () => {
  if (fcDeck.length === 0) return;
  const w = fcDeck[fcIndex];
  const orig = words.find(x => x.id === w.id);
  if (orig) { orig.mastered = true; saveWords(words); w.mastered = true; }
  if (fcIndex < fcDeck.length - 1) fcIndex++;
  renderCard();
  renderWordTable();
});

fcAgainBtn.addEventListener('click', () => {
  if (fcIndex < fcDeck.length - 1) fcIndex++;
  renderCard();
});

/* ====================================================
   クイズ TAB
   ==================================================== */
const quizStartScreen  = document.getElementById('quiz-start-screen');
const quizPlayScreen   = document.getElementById('quiz-play-screen');
const quizResultScreen = document.getElementById('quiz-result-screen');
const quizCountSelect  = document.getElementById('quiz-count-select');
const quizStartBtn     = document.getElementById('quiz-start-btn');
const quizQnum         = document.getElementById('quiz-qnum');
const quizScoreLive    = document.getElementById('quiz-score-live');
const quizStreakEl     = document.getElementById('quiz-streak');
const quizWordEl       = document.getElementById('quiz-word');
const quizWordReading  = document.getElementById('quiz-word-reading');
const quizExampleHint  = document.getElementById('quiz-example-hint');
const quizOptionsEl    = document.getElementById('quiz-options');
const quizFeedback     = document.getElementById('quiz-feedback');
const resultScoreNum   = document.getElementById('result-score-num');
const resultDetails    = document.getElementById('result-details');
const quizRetryBtn     = document.getElementById('quiz-retry-btn');
const quizBackBtn      = document.getElementById('quiz-back-btn');

let quizQuestions = [];
let quizCurrent   = 0;
let quizScore     = 0;
let quizStreak    = 0;
let quizTotal     = 0;

function showQuizScreen(name) {
  quizStartScreen.style.display  = 'none';
  quizPlayScreen.style.display   = 'none';
  quizResultScreen.style.display = 'none';
  document.getElementById('quiz-' + name + '-screen').style.display = 'block';
}

function buildQuizQuestions() {
  if (words.length < 4) return [];
  const pool = shuffle([...words]);
  const countVal = quizCountSelect.value;
  const count = countVal === 'all' ? pool.length : Math.min(parseInt(countVal), pool.length);
  return pool.slice(0, count).map(w => {
    const wrongs = shuffle(words.filter(x => x.id !== w.id)).slice(0, 3).map(x => x.japanese);
    const options = shuffle([w.japanese, ...wrongs]);
    return { word: w, answer: w.japanese, options };
  });
}

function renderQuizQuestion() {
  const q = quizQuestions[quizCurrent];
  quizQnum.textContent      = `問題 ${quizCurrent + 1} / ${quizTotal}`;
  quizScoreLive.textContent = `スコア: ${quizScore}`;
  quizStreakEl.textContent  = `🔥 ${quizStreak}`;
  quizWordEl.textContent    = q.word[LANG.wordKey];
  if (quizWordReading) {
    quizWordReading.textContent = q.word[LANG.readingKey] || '';
  }
  quizExampleHint.textContent = q.word.example ? `例: ${q.word.example}` : '';
  quizFeedback.style.display  = 'none';

  quizOptionsEl.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(opt, btn));
    quizOptionsEl.appendChild(btn);
  });
}

function handleAnswer(selected, btn) {
  const q = quizQuestions[quizCurrent];
  const correct = selected === q.answer;

  quizOptionsEl.querySelectorAll('.quiz-option').forEach(b => {
    b.disabled = true;
    if (b.textContent === q.answer) b.classList.add('correct');
    else if (b === btn && !correct) b.classList.add('wrong');
  });

  if (correct) {
    quizScore++;
    quizStreak++;
    showFeedback(true, '正解！ 🎉');
  } else {
    quizStreak = 0;
    showFeedback(false, `不正解… 正解は「${q.answer}」`);
  }

  quizScoreLive.textContent = `スコア: ${quizScore}`;
  quizStreakEl.textContent  = `🔥 ${quizStreak}`;

  setTimeout(() => {
    quizCurrent++;
    if (quizCurrent >= quizTotal) {
      endQuiz();
    } else {
      renderQuizQuestion();
    }
  }, 1200);
}

function showFeedback(correct, msg) {
  quizFeedback.textContent = msg;
  quizFeedback.className   = 'quiz-feedback ' + (correct ? 'correct' : 'wrong');
  quizFeedback.style.display = 'block';
}

function endQuiz() {
  const pct = Math.round((quizScore / quizTotal) * 100);
  resultScoreNum.textContent = `${quizScore} / ${quizTotal}`;
  resultDetails.textContent  = `正解率: ${pct}%`;

  quizHistory.unshift({
    score: quizScore,
    total: quizTotal,
    pct,
    date: new Date().toLocaleString('ja-JP'),
  });
  if (quizHistory.length > 20) quizHistory.length = 20;
  saveQuizHistory(quizHistory);

  showQuizScreen('result');
}

quizStartBtn.addEventListener('click', () => {
  if (words.length < 4) {
    alert('クイズには最低4つの単語が必要です。単語帳に単語を追加してください。');
    return;
  }
  quizQuestions = buildQuizQuestions();
  quizCurrent   = 0;
  quizScore     = 0;
  quizStreak    = 0;
  quizTotal     = quizQuestions.length;
  showQuizScreen('play');
  renderQuizQuestion();
});

quizRetryBtn.addEventListener('click', () => {
  quizQuestions = buildQuizQuestions();
  quizCurrent   = 0;
  quizScore     = 0;
  quizStreak    = 0;
  quizTotal     = quizQuestions.length;
  showQuizScreen('play');
  renderQuizQuestion();
});

quizBackBtn.addEventListener('click', () => {
  showQuizScreen('start');
});

/* ====================================================
   統計 TAB
   ==================================================== */
function renderStats() {
  const total      = words.length;
  const mastered   = words.filter(w => w.mastered).length;
  const unmastered = total - mastered;
  const pct        = total === 0 ? 0 : Math.round((mastered / total) * 100);

  document.getElementById('stat-total').textContent      = total;
  document.getElementById('stat-mastered').textContent   = mastered;
  document.getElementById('stat-unmastered').textContent = unmastered;
  document.getElementById('stat-pct').textContent        = pct + '%';

  const donut = document.getElementById('donut-chart');
  const masteredDeg = total === 0 ? 0 : (mastered / total) * 360;
  donut.style.background = `conic-gradient(var(--primary) 0deg ${masteredDeg}deg, var(--border) ${masteredDeg}deg 360deg)`;

  const historyList = document.getElementById('quiz-history-list');
  if (quizHistory.length === 0) {
    historyList.innerHTML = '<li class="empty-msg">まだクイズの記録がありません。</li>';
    return;
  }
  historyList.innerHTML = quizHistory.slice(0, 10).map(h => `
    <li>
      <span>${h.date}</span>
      <span class="history-score">${h.score} / ${h.total}（${h.pct}%）</span>
    </li>`).join('');
}

/* ====================================================
   単語集インポート
   ==================================================== */
const importModal        = document.getElementById('import-modal');
const importCancelBtn    = document.getElementById('import-cancel-btn');
const importConfirmBtn   = document.getElementById('import-confirm-btn');
const importModeRow      = document.getElementById('import-mode-row');
const importPreview      = document.getElementById('import-preview');
const importPreviewList  = document.getElementById('import-preview-list');
const importPreviewTitle = document.getElementById('import-preview-title');
const importPreviewCount = document.getElementById('import-preview-count');

let selectedLevel = null;

document.getElementById('btn-import-set').addEventListener('click', () => {
  selectedLevel = null;
  importConfirmBtn.disabled = true;
  importModeRow.style.display = 'none';
  importPreview.style.display = 'none';
  document.querySelectorAll('.level-card').forEach(c => c.classList.remove('selected'));
  Object.keys(WORD_SETS).forEach(key => {
    const el = document.getElementById('import-count-' + key);
    if (el) el.textContent = WORD_SETS[key].words.length + '語';
  });
  importModal.style.display = 'flex';
});

document.querySelectorAll('.level-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.level-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedLevel = card.dataset.level;

    const set = WORD_SETS[selectedLevel];
    importPreviewTitle.textContent = set.label + ' — プレビュー（最初の10語）';
    importPreviewCount.textContent = `全 ${set.words.length} 語`;
    importPreviewList.innerHTML = set.words.slice(0, 10).map(w =>
      `<div class="preview-word-row">
        <span class="preview-en">${escHtml(w.word)}<span class="word-reading">${escHtml(w.reading || '')}</span></span>
        <span class="preview-jp">${escHtml(w.japanese)}</span>
        <span class="preview-note">${escHtml(w.notes || '')}</span>
      </div>`
    ).join('') + (set.words.length > 10 ? `<div class="preview-more">… 他 ${set.words.length - 10} 語</div>` : '');

    importModeRow.style.display = 'flex';
    importPreview.style.display = 'block';
    importConfirmBtn.disabled = false;
  });
});

importConfirmBtn.addEventListener('click', () => {
  if (!selectedLevel) return;
  const set  = WORD_SETS[selectedLevel];
  const mode = document.querySelector('input[name="import-mode"]:checked').value;
  const newWords = set.words.map((w, i) => ({
    id: Date.now() + i,
    word: w.word,
    reading: w.reading || '',
    japanese: w.japanese,
    example: w.example || '',
    notes: w.notes || '',
    mastered: false,
    createdAt: Date.now() + i,
  }));

  if (mode === 'replace') {
    words = newWords;
  } else {
    const existingWords = new Set(words.map(w => w.word));
    const toAdd = newWords.filter(w => !existingWords.has(w.word));
    words.push(...toAdd);
    const skipped = newWords.length - toAdd.length;
    if (skipped > 0) {
      alert(`${toAdd.length}語を追加しました。（重複 ${skipped}語はスキップ）`);
    } else {
      alert(`${toAdd.length}語を追加しました。`);
    }
  }

  saveWords(words);
  importModal.style.display = 'none';
  renderWordTable();
  if (mode === 'replace') alert(`${set.label}の${newWords.length}語をインポートしました。`);
});

importCancelBtn.addEventListener('click', () => { importModal.style.display = 'none'; });
importModal.addEventListener('click', e => { if (e.target === importModal) importModal.style.display = 'none'; });

/* ====================================================
   Utilities
   ==================================================== */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
