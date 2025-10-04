function drawNode(svg, x, y, name, gender) {
  if (gender === 'male') {
    svg.innerHTML += `<rect x="${x-40}" y="${y-20}" width="80" height="40" fill="#add8e6" stroke="black"/>`;
  } else {
    svg.innerHTML += `<circle cx="${x}" cy="${y}" r="25" fill="#f4cccc" stroke="black"/>`;
  }
  // テキスト中央寄せ
  svg.innerHTML += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" class="node-text">${name}</text>`;
}

function drawTree() {
  const svg = document.getElementById('familyTree');
  svg.setAttribute("viewBox", "0 0 1000 800");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "600");

  svg.innerHTML = '';

  const meName = document.getElementById('meName').value;
  const meGender = document.getElementById('meGender').value;

  const spouseName = document.getElementById('spouseName').value;
  const spouseGender = document.getElementById('spouseGender').value;

  const parents = Array.from(document.querySelectorAll('.parent-name')).map((input, i) => ({
    name: input.value,
    gender: document.querySelectorAll('.parent-gender')[i].value
  }));
  const children = Array.from(document.querySelectorAll('.child-name')).map((input, i) => ({
    name: input.value,
    gender: document.querySelectorAll('.child-gender')[i].value
  }));
  const spouseParents = Array.from(document.querySelectorAll('.spouseParent-name')).map((input, i) => ({
    name: input.value,
    gender: document.querySelectorAll('.spouseParent-gender')[i].value
  }));

  const centerX = 500; // SVG中央を基準
  const centerY = 400;
  const spouseX = centerX + 200;

  // 自分と配偶者
  drawNode(svg, centerX, centerY, meName, meGender);
  drawNode(svg, spouseX, centerY, spouseName, spouseGender);

  // 結婚線
  svg.innerHTML += `<line x1="${centerX+40}" y1="${centerY}" x2="${spouseX-40}" y2="${centerY}" stroke="black"/>`;

  // 親（自分側）
  parents.forEach((p, i) => {
    const px = centerX - (parents.length - 1) * 120 / 2 + i * 120;
    const py = centerY - 200;
    drawNode(svg, px, py, p.name, p.gender);
    svg.innerHTML += `<line x1="${centerX}" y1="${centerY-20}" x2="${px}" y2="${py+20}" stroke="black"/>`;
  });

  // 配偶者の親
  spouseParents.forEach((p, i) => {
    const px = spouseX - (spouseParents.length - 1) * 120 / 2 + i * 120;
    const py = centerY - 200;
    drawNode(svg, px, py, p.name, p.gender);
    svg.innerHTML += `<line x1="${spouseX}" y1="${centerY-20}" x2="${px}" y2="${py+20}" stroke="black"/>`;
  });

  // 子供
  const midX = (centerX + spouseX) / 2;
  children.forEach((c, i) => {
    const cx = midX - (children.length - 1) * 120 / 2 + i * 120;
    const cy = centerY + 200;
    drawNode(svg, cx, cy, c.name, c.gender);
    svg.innerHTML += `<line x1="${midX}" y1="${centerY+20}" x2="${cx}" y2="${cy-30}" stroke="black"/>`;
  });
}

function addMember(type) {
  const container = document.getElementById(type + 'Inputs');
  const idx = container.children.length + 1;
  const div = document.createElement('div');
  div.innerHTML = `
    続柄: <input type="text" class="${type}-name" value="${type}${idx}" />
    性別: <select class="${type}-gender">
      <option value="male">男性</option>
      <option value="female">女性</option>
    </select>
  `;
  container.appendChild(div);
}

const accordionBtn = document.querySelector('.accordion-btn');
const accordionContent = document.querySelector('.accordion-content');

accordionBtn.addEventListener('click', () => {
  accordionBtn.classList.toggle('active');
  accordionContent.classList.toggle('open');
  
  if(accordionContent.style.maxHeight){
    accordionContent.style.maxHeight = null;
  } else {
    accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
  }
});

document.getElementById('printBtn').addEventListener('click', function() {
  const svg = document.getElementById('familyTree');
  if (!svg) return;

  // SVG を含む HTML を生成
  const svgHtml = `<html>
    <head>
      <title>家族関係図 印刷</title>
      <style>
        body { margin: 0; padding: 0; display: flex; justify-content: center; }
        svg { width: 100%; height: auto; }
      </style>
    </head>
    <body>
      ${svg.outerHTML}
    </body>
  </html>`;

  // 新しいウィンドウを開く
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.open();
  printWindow.document.write(svgHtml);
  printWindow.document.close();

  // 印刷
  printWindow.focus();
  printWindow.print();
  printWindow.close();
});

const showMoreBtn = document.getElementById('showMoreBtn');
const hiddenArticles = document.querySelector('.hidden-articles');

showMoreBtn.addEventListener('click', () => {
  hiddenArticles.classList.toggle('show');
  if(hiddenArticles.classList.contains('show')) {
    showMoreBtn.textContent = "閉じる";
  } else {
    showMoreBtn.textContent = "続きを見る";
  }
});