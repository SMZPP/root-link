// ============================================================
// 手取り計算ツール - script.js
// 2024年度税率・保険料率に基づく概算計算
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

// --- 所得税（累進課税） ---
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

// --- メイン計算 ---
function calculate() {
  const monthlyGross = parseFloat(document.getElementById('monthly-gross').value) || 0;
  const annualBonus  = parseFloat(document.getElementById('annual-bonus').value) || 0;
  const age          = parseInt(document.getElementById('age').value) || 35;
  const insuranceType = document.getElementById('insurance-type').value;
  const spouseDeduction = parseInt(document.getElementById('spouse-deduction').value) || 0;
  const dependents   = parseInt(document.getElementById('dependents').value) || 0;

  if (monthlyGross <= 0) {
    alert('月収（額面）を入力してください。');
    return;
  }

  const annualGross = monthlyGross * 12 + annualBonus;

  // ===========================
  // 社会保険料計算
  // ===========================
  let annualHealthIns = 0;
  let annualPension   = 0;
  let annualEmploy    = 0;
  let annualNursing   = 0;

  if (insuranceType === 'employee') {
    // 協会けんぽ（東京）2024年度
    // 健康保険料率: 9.98%（本人負担 4.99%）
    // 40歳以上は介護保険料率 1.82%追加（本人負担 0.91%）
    // 厚生年金保険料率: 18.30%（本人負担 9.15%）上限: 標準報酬月額 65万円
    // 雇用保険料: 1.2%（本人負担 0.6%）

    const HEALTH_RATE      = 0.0499;
    const NURSING_RATE     = 0.0091; // 40歳以上のみ
    const PENSION_RATE     = 0.0915;
    const PENSION_CAP_MONTHLY = 650000; // 標準報酬月額上限
    const EMPLOY_RATE      = 0.006;

    // 健康保険: 標準報酬月額に対して（賞与も対象、上限139万/月）
    const cappedMonthly = Math.min(monthlyGross, 1390000);
    annualHealthIns = Math.floor(cappedMonthly * HEALTH_RATE) * 12;
    // ボーナスからも健康保険（賞与 上限573万/回 ただし全額に適用）
    const bonusHealth = Math.floor(annualBonus * HEALTH_RATE);
    annualHealthIns += bonusHealth;

    if (age >= 40) {
      annualNursing = Math.floor(cappedMonthly * NURSING_RATE) * 12;
      annualNursing += Math.floor(annualBonus * NURSING_RATE);
    }

    // 厚生年金: 標準報酬月額上限65万円
    const cappedPension = Math.min(monthlyGross, PENSION_CAP_MONTHLY);
    annualPension = Math.floor(cappedPension * PENSION_RATE) * 12;
    // ボーナス（上限150万/回）
    const bonusPensionBase = Math.min(annualBonus, 1500000);
    annualPension += Math.floor(bonusPensionBase * PENSION_RATE);

    // 雇用保険
    annualEmploy = Math.floor(annualGross * EMPLOY_RATE);

  } else {
    // 国民健康保険（自営業）概算
    // 所得割: 前年所得 × 約10%（-43万円）, 均等割: 5万円, 上限: 87万円
    const prevIncome = Math.max(0, annualGross - 430000);
    const nhoBase = prevIncome * 0.10 + 50000;
    annualHealthIns = Math.min(Math.floor(nhoBase), 870000);

    // 国民年金: 月16,980円 × 12
    annualPension = 16980 * 12; // 203,760円

    // 雇用保険なし
    annualEmploy = 0;

    // 40歳以上の介護保険は国保に含まれる（別途加算しない）
  }

  const totalSocialIns = annualHealthIns + annualNursing + annualPension + annualEmploy;

  // ===========================
  // 所得税計算
  // ===========================
  // 給与所得控除
  const employmentDeduction = calcEmploymentDeduction(annualGross);

  // 所得控除合計
  const basicDeduction     = 480000;                     // 基礎控除
  const spouseDeductionAmt = spouseDeduction * 380000;   // 配偶者控除
  const dependentDeduction = dependents * 380000;        // 扶養控除（一般）
  const socialInsDeduction = totalSocialIns;             // 全額控除

  const totalDeductions = basicDeduction + spouseDeductionAmt + dependentDeduction + socialInsDeduction;

  // 課税所得（所得税）
  const netIncome = Math.max(0, annualGross - employmentDeduction);
  const taxableIncomeIT = Math.max(0, netIncome - totalDeductions);

  // 所得税 + 復興特別所得税 2.1%
  const incomeTax = calcIncomeTax(taxableIncomeIT);
  const reconstructionTax = Math.floor(incomeTax * 0.021);
  const totalIncomeTax = incomeTax + reconstructionTax;

  // ===========================
  // 住民税計算
  // ===========================
  // 住民税用基礎控除: 43万円
  const basicDeductionRes   = 430000;
  const spouseDeductionRes  = spouseDeduction * 330000; // 住民税の配偶者控除
  const dependentDeductRes  = dependents * 330000;      // 住民税の扶養控除
  const totalDeductionsRes  = basicDeductionRes + spouseDeductionRes + dependentDeductRes + socialInsDeduction;

  const taxableIncomeRes = Math.max(0, netIncome - totalDeductionsRes);
  const residenceTaxIncome = Math.floor(taxableIncomeRes * 0.10); // 所得割10%
  const residenceTaxFlat   = 5000; // 均等割
  const residenceTax       = Math.max(0, residenceTaxIncome + residenceTaxFlat);

  // ===========================
  // 手取り計算
  // ===========================
  const totalDeduct = totalSocialIns + totalIncomeTax + residenceTax;
  const annualNet   = Math.max(0, annualGross - totalDeduct);
  const monthlyNet  = Math.round(annualNet / 12);
  const netRatio    = annualGross > 0 ? (annualNet / annualGross * 100).toFixed(1) : '0.0';

  // ===========================
  // 結果表示
  // ===========================
  document.getElementById('result-placeholder').style.display = 'none';
  document.getElementById('result-content').style.display = 'block';

  document.getElementById('monthly-net').textContent = fmt(monthlyNet);
  document.getElementById('annual-net').textContent  = fmt(annualNet);
  document.getElementById('net-ratio').textContent   = netRatio + '%';

  // 年間内訳テーブル
  const annualRows = [
    { label: '年収（額面）', value: annualGross, cls: '' },
    { label: '　うち月収 × 12', value: monthlyGross * 12, cls: '' },
    { label: '　うち年間ボーナス', value: annualBonus, cls: '' },
    { label: '健康保険料', value: -annualHealthIns, cls: 'row-deduct' },
    ...(age >= 40 && insuranceType === 'employee' ? [{ label: '介護保険料', value: -annualNursing, cls: 'row-deduct' }] : []),
    { label: insuranceType === 'employee' ? '厚生年金保険料' : '国民年金保険料', value: -annualPension, cls: 'row-deduct' },
    ...(insuranceType === 'employee' ? [{ label: '雇用保険料', value: -annualEmploy, cls: 'row-deduct' }] : []),
    { label: '社会保険料合計', value: -totalSocialIns, cls: 'row-total' },
    { label: '所得税（復興特別含む）', value: -totalIncomeTax, cls: 'row-deduct' },
    { label: '住民税', value: -residenceTax, cls: 'row-deduct' },
    { label: '税金合計', value: -(totalIncomeTax + residenceTax), cls: 'row-total' },
    { label: '年間手取り', value: annualNet, cls: 'row-net' },
  ];

  const annualTbody = document.getElementById('annual-tbody');
  annualTbody.innerHTML = '';
  for (const row of annualRows) {
    const tr = document.createElement('tr');
    if (row.cls) tr.className = row.cls;
    const absVal = Math.abs(row.value);
    const prefix = row.value < 0 ? '−' : '';
    tr.innerHTML = `<td>${row.label}</td><td>${prefix}${Math.round(absVal).toLocaleString('ja-JP')} 円</td>`;
    annualTbody.appendChild(tr);
  }

  // 月額内訳テーブル（年間÷12）
  const monthlyRows = [
    { label: '月収（額面）', value: monthlyGross },
    { label: '健康保険料', value: -(annualHealthIns / 12), cls: 'row-deduct' },
    ...(age >= 40 && insuranceType === 'employee' ? [{ label: '介護保険料', value: -(annualNursing / 12), cls: 'row-deduct' }] : []),
    { label: insuranceType === 'employee' ? '厚生年金保険料' : '国民年金保険料', value: -(annualPension / 12), cls: 'row-deduct' },
    ...(insuranceType === 'employee' ? [{ label: '雇用保険料', value: -(annualEmploy / 12), cls: 'row-deduct' }] : []),
    { label: '所得税（概算月割）', value: -(totalIncomeTax / 12), cls: 'row-deduct' },
    { label: '住民税（概算月割）', value: -(residenceTax / 12), cls: 'row-deduct' },
    { label: '月手取り（概算）', value: monthlyNet, cls: 'row-net' },
  ];

  const monthlyTbody = document.getElementById('monthly-tbody');
  monthlyTbody.innerHTML = '';
  for (const row of monthlyRows) {
    const tr = document.createElement('tr');
    if (row.cls) tr.className = row.cls;
    const absVal = Math.abs(row.value);
    const prefix = row.value < 0 ? '−' : '';
    tr.innerHTML = `<td>${row.label}</td><td>${prefix}${Math.round(absVal).toLocaleString('ja-JP')} 円</td>`;
    monthlyTbody.appendChild(tr);
  }
}

// Enterキーでも計算
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') calculate();
});
