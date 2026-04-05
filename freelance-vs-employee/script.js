// ============================================================
// フリーランス vs 正社員 収入比較ツール - script.js
// 2024年度税率・保険料率に基づく概算計算
// ============================================================

// --- 給与所得控除（会社員：年収ベース）---
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

// --- 数値フォーマット ---
function fmt(n) {
  return Math.round(n).toLocaleString('ja-JP') + ' 円';
}
function fmtSign(n) {
  const abs = Math.abs(Math.round(n)).toLocaleString('ja-JP');
  return (n >= 0 ? '+' : '−') + abs + ' 円';
}

// ============================================================
// 正社員（協会けんぽ東京 2024年度）
// ============================================================
function calcEmployee(annualGross, age, spouseDeduction, dependents) {
  // 社会保険（月収ベースで近似：年収÷12）
  const monthlyGross = annualGross / 12;

  const HEALTH_RATE   = 0.0499; // 健康保険 本人負担
  const NURSING_RATE  = 0.0091; // 介護保険 本人負担（40歳以上）
  const PENSION_RATE  = 0.0915; // 厚生年金 本人負担
  const PENSION_CAP   = 650000; // 標準報酬月額上限
  const EMPLOY_RATE   = 0.006;  // 雇用保険

  const cappedHealth  = Math.min(monthlyGross, 1390000);
  const annualHealth  = Math.floor(cappedHealth * HEALTH_RATE) * 12;
  const annualNursing = age >= 40 ? Math.floor(cappedHealth * NURSING_RATE) * 12 : 0;

  const cappedPension = Math.min(monthlyGross, PENSION_CAP);
  const annualPension = Math.floor(cappedPension * PENSION_RATE) * 12;

  const annualEmploy  = Math.floor(annualGross * EMPLOY_RATE);

  const totalSocial = annualHealth + annualNursing + annualPension + annualEmploy;

  // 会社負担分（参考）
  // 健康保険: 会社も同額、厚生年金: 会社も同額、子育て拠出金: 0.36%
  const companyHealth  = annualHealth + annualNursing; // 同率
  const companyPension = annualPension;
  const childContrib   = Math.floor(annualGross * 0.0036);
  const companyCost    = companyHealth + companyPension + childContrib;

  // 所得控除
  const empDeduction   = calcEmploymentDeduction(annualGross);
  const basicDeduction = 480000;
  const spouseAmt      = spouseDeduction * 380000;
  const depAmt         = dependents * 380000;
  const totalDeductions = basicDeduction + spouseAmt + depAmt + totalSocial;

  const netIncome    = Math.max(0, annualGross - empDeduction);
  const taxableIT    = Math.max(0, netIncome - totalDeductions);
  const incomeTax    = calcIncomeTax(taxableIT);
  const reconTax     = Math.floor(incomeTax * 0.021);
  const totalIT      = incomeTax + reconTax;

  // 住民税
  const basicResidence = 430000;
  const spouseRes      = spouseDeduction * 330000;
  const depRes         = dependents * 330000;
  const totalDeductRes = basicResidence + spouseRes + depRes + totalSocial;
  const taxableRes     = Math.max(0, netIncome - totalDeductRes);
  const residenceTax   = Math.max(0, Math.floor(taxableRes * 0.10) + 5000);

  const totalTax = totalIT + residenceTax;
  const totalDeduct = totalSocial + totalTax;
  const annualNet = Math.max(0, annualGross - totalDeduct);

  return {
    annualGross, annualNet,
    annualHealth, annualNursing, annualPension, annualEmploy,
    totalSocial, totalIT, residenceTax, totalTax, totalDeduct,
    companyCost, empDeduction,
    taxableIT, taxableRes,
  };
}

// ============================================================
// フリーランス（国保 + 国民年金 2024年度）
// ============================================================
function calcFreelance(annualGross, age, spouseDeduction, dependents, expenses, smallBizKyosai) {
  // 国民健康保険（概算）
  const prevIncome    = Math.max(0, annualGross - expenses - 430000);
  const nhoBase       = prevIncome * 0.10 + 50000;
  const annualNHO     = Math.min(Math.floor(nhoBase), 870000);

  // 国民年金
  const annualPension = 16980 * 12; // 203,760円

  const totalSocial = annualNHO + annualPension;

  // 事業所得 = 年収 - 経費
  const businessIncome = Math.max(0, annualGross - expenses);

  // 所得控除
  const basicDeduction  = 480000;
  const spouseAmt       = spouseDeduction * 380000;
  const depAmt          = dependents * 380000;
  const kyosaiAmt       = Math.min(smallBizKyosai, 840000);
  const totalDeductions = basicDeduction + spouseAmt + depAmt + totalSocial + kyosaiAmt;

  const taxableIT   = Math.max(0, businessIncome - totalDeductions);
  const incomeTax   = calcIncomeTax(taxableIT);
  const reconTax    = Math.floor(incomeTax * 0.021);
  const totalIT     = incomeTax + reconTax;

  // 住民税
  const basicResidence = 430000;
  const spouseRes      = spouseDeduction * 330000;
  const depRes         = dependents * 330000;
  const totalDeductRes = basicResidence + spouseRes + depRes + totalSocial + kyosaiAmt;
  const taxableRes     = Math.max(0, businessIncome - totalDeductRes);
  const residenceTax   = Math.max(0, Math.floor(taxableRes * 0.10) + 5000);

  const totalTax    = totalIT + residenceTax;
  const totalDeduct = expenses + totalSocial + totalTax;
  const annualNet   = Math.max(0, annualGross - totalDeduct);

  return {
    annualGross, annualNet, businessIncome, expenses,
    annualNHO, annualPension, totalSocial,
    totalIT, residenceTax, totalTax,
    kyosaiAmt, taxableIT,
  };
}

// ============================================================
// メイン計算
// ============================================================
function calculate() {
  const annualGross     = parseFloat(document.getElementById('annual-income').value) || 0;
  const age             = parseInt(document.getElementById('age').value) || 35;
  const spouseDeduction = parseInt(document.getElementById('spouse-deduction').value) || 0;
  const dependents      = parseInt(document.getElementById('dependents').value) || 0;
  const expenses        = parseFloat(document.getElementById('expenses').value) || 0;
  const smallBizKyosai  = parseFloat(document.getElementById('small-biz-kyosai').value) || 0;

  if (annualGross <= 0) {
    alert('年収（額面）を入力してください。');
    return;
  }

  const emp = calcEmployee(annualGross, age, spouseDeduction, dependents);
  const fl  = calcFreelance(annualGross, age, spouseDeduction, dependents, expenses, smallBizKyosai);

  // 表示
  document.getElementById('result-placeholder').style.display = 'none';
  document.getElementById('result-content').style.display = 'block';

  // 差額バナー
  const diff = fl.annualNet - emp.annualNet;
  const banner = document.getElementById('diff-banner');
  if (diff > 0) {
    banner.className = 'diff-banner fl-wins';
    banner.innerHTML = `💻 フリーランスの方が年間 <strong>${Math.abs(Math.round(diff)).toLocaleString('ja-JP')} 円</strong> 手取りが多い<br>
      <span style="font-size:0.85rem;font-weight:400">（経費 ${expenses.toLocaleString('ja-JP')}円・共済 ${smallBizKyosai.toLocaleString('ja-JP')}円 の節税効果を含む）</span>`;
  } else if (diff < 0) {
    banner.className = 'diff-banner emp-wins';
    banner.innerHTML = `🏢 正社員の方が年間 <strong>${Math.abs(Math.round(diff)).toLocaleString('ja-JP')} 円</strong> 手取りが多い<br>
      <span style="font-size:0.85rem;font-weight:400">社会保険の会社負担や厚生年金の将来受給額も考慮するとさらに有利な場合があります</span>`;
  } else {
    banner.className = 'diff-banner emp-wins';
    banner.innerHTML = `手取り額は <strong>ほぼ同じ</strong> です`;
  }

  // 正社員
  document.getElementById('emp-net').textContent     = fmt(emp.annualNet);
  document.getElementById('emp-monthly').textContent = fmt(emp.annualNet / 12);
  document.getElementById('emp-company-cost').textContent = fmt(emp.companyCost);

  const empRows = [
    { label: '年収（額面）', val: emp.annualGross },
    { label: '健康保険料', val: -emp.annualHealth, cls: 'row-deduct' },
    ...(age >= 40 ? [{ label: '介護保険料', val: -emp.annualNursing, cls: 'row-deduct' }] : []),
    { label: '厚生年金保険料', val: -emp.annualPension, cls: 'row-deduct' },
    { label: '雇用保険料', val: -emp.annualEmploy, cls: 'row-deduct' },
    { label: '社会保険料合計', val: -emp.totalSocial, cls: 'row-total' },
    { label: '所得税（復興特別含む）', val: -emp.totalIT, cls: 'row-deduct' },
    { label: '住民税', val: -emp.residenceTax, cls: 'row-deduct' },
    { label: '年間手取り', val: emp.annualNet, cls: 'row-net' },
  ];
  renderTable('emp-tbody', empRows);

  // フリーランス
  document.getElementById('fl-net').textContent     = fmt(fl.annualNet);
  document.getElementById('fl-monthly').textContent = fmt(fl.annualNet / 12);

  const flRows = [
    { label: '年収（売上）', val: fl.annualGross },
    { label: '年間経費', val: -fl.expenses, cls: 'row-deduct' },
    { label: '事業所得', val: fl.businessIncome, cls: 'row-total' },
    { label: '国民健康保険料', val: -fl.annualNHO, cls: 'row-deduct' },
    { label: '国民年金保険料', val: -fl.annualPension, cls: 'row-deduct' },
    ...(fl.kyosaiAmt > 0 ? [{ label: '小規模企業共済', val: -fl.kyosaiAmt, cls: 'row-deduct' }] : []),
    { label: '社会保険等合計', val: -(fl.totalSocial + fl.kyosaiAmt), cls: 'row-total' },
    { label: '所得税（復興特別含む）', val: -fl.totalIT, cls: 'row-deduct' },
    { label: '住民税', val: -fl.residenceTax, cls: 'row-deduct' },
    { label: '年間手取り', val: fl.annualNet, cls: 'row-net' },
  ];
  renderTable('fl-tbody', flRows);
}

function renderTable(tbodyId, rows) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';
  for (const row of rows) {
    const tr = document.createElement('tr');
    if (row.cls) tr.className = row.cls;
    const absVal = Math.abs(row.val || 0);
    const prefix = (row.val || 0) < 0 ? '−' : '';
    tr.innerHTML = `<td>${row.label}</td><td>${prefix}${Math.round(absVal).toLocaleString('ja-JP')} 円</td>`;
    tbody.appendChild(tr);
  }
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') calculate();
});
