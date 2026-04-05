// ============================================================
// 副業収入の税金計算ツール - script.js
// 2024年度税率に基づく概算計算
// ============================================================

// --- 給与所得控除（年収ベース）---
function calcEmploymentDeduction(gross) {
  if (gross <= 1625000) return 550000;
  if (gross <= 1800000) return Math.floor(gross * 0.4 - 100000);
  if (gross <= 3600000) return Math.floor(gross * 0.3 + 80000);
  if (gross <= 6600000) return Math.floor(gross * 0.2 + 440000);
  if (gross <= 8500000) return Math.floor(gross * 0.1 + 1100000);
  return 1950000;
}

// --- 所得税（累進課税）---
function calcIncomeTax(taxableIncome) {
  if (taxableIncome <= 0) return 0;
  const brackets = [
    [1950000,   0.05, 0],
    [3300000,   0.10, 97500],
    [6950000,   0.20, 427500],
    [9000000,   0.23, 636000],
    [18000000,  0.33, 1536000],
    [40000000,  0.40, 2796000],
    [Infinity,  0.45, 4796000],
  ];
  for (const [limit, rate, deduction] of brackets) {
    if (taxableIncome <= limit) return Math.max(0, Math.floor(taxableIncome * rate - deduction));
  }
  return 0;
}

// --- 社会保険料の概算（本業会社員）---
function calcSocialInsurance(mainIncome, age) {
  const monthly       = mainIncome / 12;
  const HEALTH_RATE   = 0.0499;
  const NURSING_RATE  = 0.0091;
  const PENSION_RATE  = 0.0915;
  const PENSION_CAP   = 650000;
  const EMPLOY_RATE   = 0.006;

  const cappedH = Math.min(monthly, 1390000);
  const health  = Math.floor(cappedH * HEALTH_RATE) * 12;
  const nursing = age >= 40 ? Math.floor(cappedH * NURSING_RATE) * 12 : 0;

  const cappedP  = Math.min(monthly, PENSION_CAP);
  const pension  = Math.floor(cappedP * PENSION_RATE) * 12;
  const employ   = Math.floor(mainIncome * EMPLOY_RATE);

  return health + nursing + pension + employ;
}

// --- 税金を計算（本業のみ or 本業+副業）---
function calcTaxBurden(totalIncome, socialIns, spouseDeduction, dependents) {
  const empDeduction   = calcEmploymentDeduction(totalIncome);
  const netIncome      = Math.max(0, totalIncome - empDeduction);

  const basicDed       = 480000;
  const spouseAmt      = spouseDeduction * 380000;
  const depAmt         = dependents * 380000;
  const totalDed       = basicDed + spouseAmt + depAmt + socialIns;

  const taxableIT      = Math.max(0, netIncome - totalDed);
  const incomeTax      = calcIncomeTax(taxableIT);
  const reconTax       = Math.floor(incomeTax * 0.021);
  const totalIT        = incomeTax + reconTax;

  // 住民税
  const basicRes       = 430000;
  const spouseRes      = spouseDeduction * 330000;
  const depRes         = dependents * 330000;
  const totalDedRes    = basicRes + spouseRes + depRes + socialIns;
  const taxableRes     = Math.max(0, netIncome - totalDedRes);
  const residenceTax   = Math.max(0, Math.floor(taxableRes * 0.10) + 5000);

  return {
    netIncome, taxableIT, taxableRes,
    incomeTax: totalIT, residenceTax,
    totalTax: totalIT + residenceTax,
  };
}

// --- 数値フォーマット ---
function fmt(n) {
  return Math.round(n).toLocaleString('ja-JP') + ' 円';
}

// ============================================================
// メイン計算
// ============================================================
function calculate() {
  const mainIncome      = parseFloat(document.getElementById('main-income').value) || 0;
  const sideIncome      = parseFloat(document.getElementById('side-income').value) || 0;
  const sideExpenses    = parseFloat(document.getElementById('side-expenses').value) || 0;
  const incomeType      = document.getElementById('income-type').value;
  const age             = parseInt(document.getElementById('age').value) || 35;
  const spouseDeduction = parseInt(document.getElementById('spouse-deduction').value) || 0;
  const dependents      = parseInt(document.getElementById('dependents').value) || 0;

  if (mainIncome <= 0) {
    alert('本業年収を入力してください。');
    return;
  }
  if (sideIncome <= 0) {
    alert('副業収入を入力してください。');
    return;
  }

  const sideProfit = Math.max(0, sideIncome - sideExpenses);

  // 社会保険料（本業会社員分）
  const socialIns = calcSocialInsurance(mainIncome, age);

  // 本業のみの税負担
  const mainOnly = calcTaxBurden(mainIncome, socialIns, spouseDeduction, dependents);

  // 本業＋副業の税負担
  // 注: 副業収入は雑所得/事業所得として合算（給与所得控除は本業分のみ適用済み、副業は純利益で加算）
  // 実際は「給与所得 + 雑所得（純利益）」を合算した「総所得金額」で計算
  const combinedGrossForCalc = mainIncome + sideProfit;

  // 合算の場合の計算（副業分は所得控除の対象外の部分で計算）
  // より正確に: 給与所得 + 副業純利益 の合計所得に基づく
  const combinedWithSide = calcTaxBurdenWithSideIncome(
    mainIncome, sideProfit, socialIns, spouseDeduction, dependents
  );

  // 増加分
  const addIncomeTax   = Math.max(0, combinedWithSide.incomeTax - mainOnly.incomeTax);
  const addResidenceTax = Math.max(0, combinedWithSide.residenceTax - mainOnly.residenceTax);
  const totalAddTax    = addIncomeTax + addResidenceTax;

  // 実質手取り副業収入
  const sideNet = Math.max(0, sideProfit - totalAddTax);

  // 実効税率（副業収入に対する）
  const effectiveRate = sideIncome > 0 ? (totalAddTax / sideIncome * 100).toFixed(1) : '0.0';

  // ===========================
  // 表示
  // ===========================
  document.getElementById('result-placeholder').style.display = 'none';
  document.getElementById('result-content').style.display = 'block';

  // 確定申告バナー
  const filingBanner = document.getElementById('filing-banner');
  if (sideProfit > 200000) {
    filingBanner.className = 'filing-banner required-filing';
    filingBanner.innerHTML = `
      <span class="badge-large">🔴</span>
      <div>
        <div>確定申告が<strong>必要</strong>です</div>
        <div style="font-size:0.85rem;font-weight:400;margin-top:0.3rem">
          副業の純利益（${Math.round(sideProfit).toLocaleString('ja-JP')} 円）が20万円を超えています。翌年3月15日までに確定申告を行ってください。
        </div>
      </div>
    `;
  } else {
    filingBanner.className = 'filing-banner not-required';
    filingBanner.innerHTML = `
      <span class="badge-large">🟢</span>
      <div>
        <div>所得税の確定申告は<strong>不要</strong>（年末調整で完結）</div>
        <div style="font-size:0.85rem;font-weight:400;margin-top:0.3rem">
          副業の純利益（${Math.round(sideProfit).toLocaleString('ja-JP')} 円）が20万円以下のため、所得税の確定申告は不要です。
          ただし住民税の申告は別途必要な場合があります。
        </div>
      </div>
    `;
  }

  // サマリー
  document.getElementById('side-profit').textContent    = fmt(sideProfit);
  document.getElementById('add-income-tax').textContent = fmt(addIncomeTax);
  document.getElementById('add-residence-tax').textContent = fmt(addResidenceTax);
  document.getElementById('total-add-tax').textContent  = fmt(totalAddTax);
  document.getElementById('side-net').textContent       = fmt(sideNet);
  document.getElementById('effective-rate').textContent = effectiveRate + '%';

  // 詳細テーブル
  const detailRows = [
    {
      label: '給与所得（本業）',
      main: mainOnly.netIncome,
      with: combinedWithSide.mainNetIncome,
      diff: null,
      cls: ''
    },
    {
      label: '副業純利益（雑所得/事業所得）',
      main: 0,
      with: sideProfit,
      diff: null,
      cls: ''
    },
    {
      label: '課税所得（所得税）',
      main: mainOnly.taxableIT,
      with: combinedWithSide.taxableIT,
      diff: combinedWithSide.taxableIT - mainOnly.taxableIT,
      cls: ''
    },
    {
      label: '所得税（復興特別含む）',
      main: mainOnly.incomeTax,
      with: combinedWithSide.incomeTax,
      diff: addIncomeTax,
      cls: 'row-increase'
    },
    {
      label: '課税所得（住民税）',
      main: mainOnly.taxableRes,
      with: combinedWithSide.taxableRes,
      diff: combinedWithSide.taxableRes - mainOnly.taxableRes,
      cls: ''
    },
    {
      label: '住民税',
      main: mainOnly.residenceTax,
      with: combinedWithSide.residenceTax,
      diff: addResidenceTax,
      cls: 'row-increase'
    },
    {
      label: '合計税負担',
      main: mainOnly.totalTax,
      with: combinedWithSide.totalTax,
      diff: totalAddTax,
      cls: 'row-total'
    },
  ];

  const tbody = document.getElementById('detail-tbody');
  tbody.innerHTML = '';
  for (const row of detailRows) {
    const tr = document.createElement('tr');
    if (row.cls) tr.className = row.cls;
    const diffCell = row.diff !== null
      ? `+${Math.round(row.diff).toLocaleString('ja-JP')} 円`
      : '―';
    tr.innerHTML = `
      <td>${row.label}</td>
      <td>${Math.round(row.main).toLocaleString('ja-JP')} 円</td>
      <td>${Math.round(row.with).toLocaleString('ja-JP')} 円</td>
      <td style="color:${row.diff > 0 ? '#dc2626' : '#555'};font-weight:${row.diff > 0 ? '700' : '400'}">${diffCell}</td>
    `;
    tbody.appendChild(tr);
  }

  // アドバイス
  renderAdvice(sideProfit, incomeType, sideExpenses, totalAddTax, effectiveRate);
}

// 本業+副業の合算税計算（給与所得+雑所得 正確版）
function calcTaxBurdenWithSideIncome(mainGross, sideProfit, socialIns, spouseDeduction, dependents) {
  // 給与所得
  const empDeduction = calcEmploymentDeduction(mainGross);
  const mainNetIncome = Math.max(0, mainGross - empDeduction);

  // 総所得金額 = 給与所得 + 副業純利益
  const totalIncome = mainNetIncome + sideProfit;

  const basicDed   = 480000;
  const spouseAmt  = spouseDeduction * 380000;
  const depAmt     = dependents * 380000;
  const totalDed   = basicDed + spouseAmt + depAmt + socialIns;

  const taxableIT  = Math.max(0, totalIncome - totalDed);
  const incomeTax  = calcIncomeTax(taxableIT);
  const reconTax   = Math.floor(incomeTax * 0.021);
  const totalIT    = incomeTax + reconTax;

  // 住民税
  const basicRes   = 430000;
  const spouseRes  = spouseDeduction * 330000;
  const depRes     = dependents * 330000;
  const totalDedRes = basicRes + spouseRes + depRes + socialIns;
  const taxableRes = Math.max(0, totalIncome - totalDedRes);
  const residenceTax = Math.max(0, Math.floor(taxableRes * 0.10) + 5000);

  return {
    mainNetIncome, taxableIT, taxableRes,
    incomeTax: totalIT, residenceTax,
    totalTax: totalIT + residenceTax,
  };
}

function renderAdvice(sideProfit, incomeType, expenses, totalAddTax, effectiveRate) {
  const container = document.getElementById('advice-content');
  const advices = [];

  // 経費計上アドバイス
  if (expenses === 0 && sideProfit > 0) {
    advices.push({
      icon: '📦',
      title: '経費を積極的に計上しましょう',
      text: '副業に関わる費用（通信費・交通費・機材・書籍・ソフトウェア代など）は経費として計上できます。経費が増えると課税所得が下がり、税負担を減らすことができます。',
    });
  }

  // 青色申告アドバイス
  if (incomeType === 'business') {
    advices.push({
      icon: '📋',
      title: '青色申告で最大65万円の控除を受けましょう',
      text: '事業所得として申告する場合、青色申告を選択すると最大65万円（e-Tax利用時）の特別控除を受けられます。事前に「青色申告承認申請書」の提出が必要です。',
    });
  }

  // iDeCo（個人型確定拠出年金）
  advices.push({
    icon: '💼',
    title: 'iDeCo（個人型確定拠出年金）で節税',
    text: '会社員でも加入できるiDeCoは掛金が全額所得控除。月最大2.3万円（会社に企業型DCがない場合）の掛金が節税になります。老後資金の積立と節税を同時に実現できます。',
  });

  // NISA
  advices.push({
    icon: '📈',
    title: '新NISAで運用益を非課税に',
    text: '新NISAの成長投資枠・つみたて投資枠を活用すると、株式・投資信託の利益が非課税に。副業で得た収入の一部を投資に回す際に有効な制度です。',
  });

  // 高税率の場合
  if (parseFloat(effectiveRate) >= 30) {
    advices.push({
      icon: '🧾',
      title: '税理士に相談することも検討を',
      text: `実効税率が${effectiveRate}%と高めです。副業の規模が大きくなってきた場合、税理士への相談で合法的な節税策を見つけられることがあります。初回相談は無料の事務所も多いです。`,
    });
  }

  // 住民税の特別徴収
  advices.push({
    icon: '🏛️',
    title: '住民税の「普通徴収」を選択して副業を会社に知られにくく',
    text: '確定申告時に「住民税の徴収方法」で「自分で納付（普通徴収）」を選ぶと、副業分の住民税が給与からではなく自宅に直接請求されます。会社に副業収入を知られにくくなります。',
  });

  container.innerHTML = advices.map(a => `
    <div class="advice-item">
      <div class="advice-icon">${a.icon}</div>
      <div class="advice-text">
        <strong>${a.title}</strong>
        ${a.text}
      </div>
    </div>
  `).join('');
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') calculate();
});
