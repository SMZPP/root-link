/* =====================================================
   通学路図作成ツール - script.js
   Fully client-side SVG route diagram editor
===================================================== */

'use strict';

// ─── Constants ────────────────────────────────────────

const NODE_TYPES = {
  home:         { emoji: '🏠', label: '自宅',   defaultColor: '#fef9c3' },
  school:       { emoji: '🏫', label: '学校',   defaultColor: '#dbeafe' },
  station:      { emoji: '🚉', label: '駅',     defaultColor: '#e0e7ff' },
  busstop:      { emoji: '🚌', label: 'バス停', defaultColor: '#d1fae5' },
  intersection: { emoji: '⚠️', label: '交差点', defaultColor: '#fee2e2' },
  landmark:     { emoji: '📍', label: '地点',   defaultColor: '#fce7f3' },
};

const NODE_RADIUS = 26;
const SVG_NS = 'http://www.w3.org/2000/svg';

// ─── State ────────────────────────────────────────────

const state = {
  nodes: [],
  paths: [],
  texts: [],
  idCounter: 0,
  currentTool: 'select',
  currentNodeType: 'home',
  selectedId: null,
  selectedType: null,   // 'node' | 'path' | 'text'
  // addPath mode state
  pathSource: null,
  // drag state
  dragging: false,
  dragNode: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  // print scale
  printScale: 1,
  // pending text placement
  pendingTextX: null,
  pendingTextY: null,
};

// ─── DOM References ───────────────────────────────────

const svg        = document.getElementById('main-svg');
const pathsLayer = document.getElementById('paths-layer');
const nodesLayer = document.getElementById('nodes-layer');
const textsLayer = document.getElementById('texts-layer');
const pathPreview = document.getElementById('path-preview');

const panelNode    = document.getElementById('panel-node');
const panelPath    = document.getElementById('panel-path');
const panelText    = document.getElementById('panel-text');
const panelDefault = document.getElementById('panel-default');

const propNodeName  = document.getElementById('prop-node-name');
const propNodeType  = document.getElementById('prop-node-type');
const propNodeColor = document.getElementById('prop-node-color');

const propPathLabel = document.getElementById('prop-path-label');
const propPathStyle = document.getElementById('prop-path-style');
const propPathArrow = document.getElementById('prop-path-arrow');
const propPathColor = document.getElementById('prop-path-color');
const propPathWidth = document.getElementById('prop-path-width');
const propPathWidthVal = document.getElementById('prop-path-width-val');

const propTextContent = document.getElementById('prop-text-content');
const propTextColor   = document.getElementById('prop-text-color');
const propTextSize    = document.getElementById('prop-text-size');
const propTextSizeVal = document.getElementById('prop-text-size-val');

const textDialog       = document.getElementById('text-dialog');
const textDialogInput  = document.getElementById('text-dialog-input');
const textDialogOk     = document.getElementById('text-dialog-ok');
const textDialogCancel = document.getElementById('text-dialog-cancel');

// ─── ID Generator ─────────────────────────────────────

function nextId() {
  return 'el-' + (++state.idCounter);
}

// ─── SVG Helpers ──────────────────────────────────────

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, v);
  }
  return el;
}

function getSVGPoint(evt) {
  const rect = svg.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top,
  };
}

// ─── Node Rendering ───────────────────────────────────

function renderNode(node) {
  // Remove existing SVG group if any
  const existing = document.getElementById('node-' + node.id);
  if (existing) existing.remove();

  const typeInfo = NODE_TYPES[node.type] || NODE_TYPES.landmark;

  const g = svgEl('g', {
    id: 'node-' + node.id,
    class: 'node-group',
    transform: `translate(${node.x},${node.y})`,
  });

  // Shadow circle
  const shadow = svgEl('circle', {
    cx: 2, cy: 3,
    r: NODE_RADIUS,
    fill: 'rgba(0,0,0,0.12)',
  });

  // Main circle
  const circle = svgEl('circle', {
    cx: 0, cy: 0,
    r: NODE_RADIUS,
    fill: node.color || typeInfo.defaultColor,
    stroke: '#888',
    'stroke-width': '1.5',
    class: 'node-circle',
  });

  // Emoji text
  const emoji = svgEl('text', {
    x: 0, y: 0,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-size': '18',
    class: 'node-emoji',
    style: 'user-select:none',
    'pointer-events': 'none',
  });
  emoji.textContent = typeInfo.emoji;

  // Label below
  const label = svgEl('text', {
    x: 0, y: NODE_RADIUS + 13,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-size': '11',
    fill: '#333',
    'font-family': 'Hiragino Kaku Gothic ProN, Meiryo, sans-serif',
    style: 'user-select:none',
    'pointer-events': 'none',
  });
  label.textContent = node.name || typeInfo.label;

  g.appendChild(shadow);
  g.appendChild(circle);
  g.appendChild(emoji);
  g.appendChild(label);

  // Selection indicator
  if (state.selectedId === node.id && state.selectedType === 'node') {
    g.classList.add('selected');
  }

  // Event listeners
  g.addEventListener('mousedown', (e) => onNodeMouseDown(e, node.id));
  g.addEventListener('click', (e) => onNodeClick(e, node.id));

  nodesLayer.appendChild(g);
}

// ─── Path Rendering ───────────────────────────────────

function renderPath(path) {
  const existing = document.getElementById('path-' + path.id);
  if (existing) existing.remove();

  const sourceNode = state.nodes.find(n => n.id === path.sourceId);
  const targetNode = state.nodes.find(n => n.id === path.targetId);
  if (!sourceNode || !targetNode) return;

  // Compute endpoints (edge of circles)
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  const x1 = sourceNode.x + ux * NODE_RADIUS;
  const y1 = sourceNode.y + uy * NODE_RADIUS;
  const x2 = targetNode.x - ux * NODE_RADIUS;
  const y2 = targetNode.y - uy * NODE_RADIUS;

  const g = svgEl('g', {
    id: 'path-' + path.id,
    class: 'path-group',
  });

  // Hit area (invisible wide line for easy clicking)
  const hit = svgEl('line', {
    x1, y1, x2, y2,
    class: 'path-hit',
  });

  // Visible line
  const strokeDash = path.lineStyle === 'dashed' ? '8,5' : 'none';
  let markerEnd = '';
  let markerStart = '';
  if (path.arrow === 'end' || path.arrow === 'both') markerEnd = 'url(#arrowhead)';
  if (path.arrow === 'both') markerStart = 'url(#arrowhead-start)';

  const line = svgEl('line', {
    x1, y1, x2, y2,
    stroke: path.color || '#555',
    'stroke-width': path.width || 2,
    'stroke-dasharray': strokeDash,
    'stroke-linecap': 'round',
    class: 'path-line',
  });
  if (markerEnd) line.setAttribute('marker-end', 'url(#arrowhead)');
  if (markerStart) line.setAttribute('marker-start', 'url(#arrowhead-start)');

  g.appendChild(hit);
  g.appendChild(line);

  // Label
  if (path.label) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const lbl = svgEl('text', {
      x: mx,
      y: my - 6,
      'text-anchor': 'middle',
      'font-size': '10',
      fill: path.color || '#555',
      'font-family': 'Hiragino Kaku Gothic ProN, Meiryo, sans-serif',
      style: 'user-select:none',
      'pointer-events': 'none',
    });
    lbl.textContent = path.label;
    g.appendChild(lbl);
  }

  if (state.selectedId === path.id && state.selectedType === 'path') {
    g.classList.add('selected');
  }

  g.addEventListener('click', (e) => onPathClick(e, path.id));

  // Insert behind nodes
  pathsLayer.appendChild(g);
}

// ─── Text Rendering ───────────────────────────────────

function renderText(txt) {
  const existing = document.getElementById('text-' + txt.id);
  if (existing) existing.remove();

  const el = svgEl('text', {
    id: 'text-' + txt.id,
    x: txt.x,
    y: txt.y,
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-size': txt.size || 13,
    fill: txt.color || '#333',
    'font-family': 'Hiragino Kaku Gothic ProN, Meiryo, sans-serif',
    class: 'text-el',
    style: 'user-select:none',
  });
  el.textContent = txt.content;

  if (state.selectedId === txt.id && state.selectedType === 'text') {
    el.classList.add('selected');
  }

  el.addEventListener('click', (e) => onTextClick(e, txt.id));

  textsLayer.appendChild(el);
}

// ─── Full Re-render ───────────────────────────────────

function renderAll() {
  pathsLayer.innerHTML = '';
  nodesLayer.innerHTML = '';
  textsLayer.innerHTML = '';
  state.paths.forEach(renderPath);
  state.nodes.forEach(renderNode);
  state.texts.forEach(renderText);
}

// ─── Selection ────────────────────────────────────────

function selectItem(id, type) {
  state.selectedId = id;
  state.selectedType = type;
  renderAll();
  updatePropertiesPanel();
}

function deselect() {
  state.selectedId = null;
  state.selectedType = null;
  renderAll();
  updatePropertiesPanel();
}

// ─── Properties Panel ─────────────────────────────────

function updatePropertiesPanel() {
  panelDefault.classList.add('hidden');
  panelNode.classList.add('hidden');
  panelPath.classList.add('hidden');
  panelText.classList.add('hidden');

  if (state.selectedType === 'node') {
    const node = state.nodes.find(n => n.id === state.selectedId);
    if (!node) { panelDefault.classList.remove('hidden'); return; }
    panelNode.classList.remove('hidden');
    propNodeName.value  = node.name || '';
    propNodeType.value  = node.type;
    propNodeColor.value = node.color || NODE_TYPES[node.type].defaultColor;
  } else if (state.selectedType === 'path') {
    const path = state.paths.find(p => p.id === state.selectedId);
    if (!path) { panelDefault.classList.remove('hidden'); return; }
    panelPath.classList.remove('hidden');
    propPathLabel.value = path.label || '';
    propPathStyle.value = path.lineStyle || 'solid';
    propPathArrow.value = path.arrow || 'none';
    propPathColor.value = path.color || '#555555';
    propPathWidth.value = path.width || 2;
    propPathWidthVal.textContent = (path.width || 2) + 'px';
  } else if (state.selectedType === 'text') {
    const txt = state.texts.find(t => t.id === state.selectedId);
    if (!txt) { panelDefault.classList.remove('hidden'); return; }
    panelText.classList.remove('hidden');
    propTextContent.value = txt.content || '';
    propTextColor.value   = txt.color || '#333333';
    propTextSize.value    = txt.size || 13;
    propTextSizeVal.textContent = (txt.size || 13) + 'px';
  } else {
    panelDefault.classList.remove('hidden');
  }
}

// ─── Tool Switching ───────────────────────────────────

function setTool(tool) {
  state.currentTool = tool;
  state.pathSource = null;
  pathPreview.setAttribute('opacity', '0');

  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  });

  // Update cursor
  svg.className.baseVal = '';
  if (tool === 'addNode' || tool === 'addPath' || tool === 'addText') {
    svg.classList.add('cursor-crosshair');
  } else if (tool === 'delete') {
    svg.classList.add('cursor-delete');
  }
}

// ─── SVG Events ───────────────────────────────────────

svg.addEventListener('click', onSvgClick);
svg.addEventListener('mousemove', onSvgMouseMove);
svg.addEventListener('mouseup', onSvgMouseUp);

function onSvgClick(e) {
  if (state.dragging) return;
  if (e.target === svg || e.target.id === 'main-svg') {
    // Clicked on empty canvas
    if (state.currentTool === 'addNode') {
      const pt = getSVGPoint(e);
      addNode(pt.x, pt.y);
    } else if (state.currentTool === 'addText') {
      const pt = getSVGPoint(e);
      openTextDialog(pt.x, pt.y);
    } else if (state.currentTool === 'select') {
      if (state.pathSource) {
        state.pathSource = null;
        pathPreview.setAttribute('opacity', '0');
      } else {
        deselect();
      }
    } else if (state.currentTool === 'addPath') {
      state.pathSource = null;
      pathPreview.setAttribute('opacity', '0');
    }
  }
}

function onSvgMouseMove(e) {
  // Path preview
  if (state.currentTool === 'addPath' && state.pathSource) {
    const pt = getSVGPoint(e);
    const src = state.nodes.find(n => n.id === state.pathSource);
    if (src) {
      pathPreview.setAttribute('x1', src.x);
      pathPreview.setAttribute('y1', src.y);
      pathPreview.setAttribute('x2', pt.x);
      pathPreview.setAttribute('y2', pt.y);
      pathPreview.setAttribute('opacity', '1');
    }
  }

  // Drag
  if (state.dragging && state.dragNode) {
    const pt = getSVGPoint(e);
    const node = state.nodes.find(n => n.id === state.dragNode);
    if (node) {
      node.x = pt.x - state.dragOffsetX;
      node.y = pt.y - state.dragOffsetY;
      // Clamp to SVG bounds
      node.x = Math.max(NODE_RADIUS + 2, Math.min(700 - NODE_RADIUS - 2, node.x));
      node.y = Math.max(NODE_RADIUS + 2, Math.min(500 - NODE_RADIUS - 14, node.y));
      renderAll();
    }
  }
}

function onSvgMouseUp(e) {
  if (state.dragging) {
    state.dragging = false;
    state.dragNode = null;
  }
}

// ─── Node Events ──────────────────────────────────────

function onNodeMouseDown(e, nodeId) {
  if (state.currentTool === 'select') {
    e.stopPropagation();
    const pt = getSVGPoint(e);
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return;
    state.dragging = true;
    state.dragNode = nodeId;
    state.dragOffsetX = pt.x - node.x;
    state.dragOffsetY = pt.y - node.y;
  }
}

function onNodeClick(e, nodeId) {
  e.stopPropagation();

  if (state.currentTool === 'delete') {
    deleteNode(nodeId);
    return;
  }

  if (state.currentTool === 'addPath') {
    if (!state.pathSource) {
      state.pathSource = nodeId;
      const src = state.nodes.find(n => n.id === nodeId);
      if (src) {
        pathPreview.setAttribute('x1', src.x);
        pathPreview.setAttribute('y1', src.y);
        pathPreview.setAttribute('x2', src.x);
        pathPreview.setAttribute('y2', src.y);
        pathPreview.setAttribute('opacity', '1');
      }
    } else {
      if (state.pathSource !== nodeId) {
        addPath(state.pathSource, nodeId);
      }
      state.pathSource = null;
      pathPreview.setAttribute('opacity', '0');
    }
    return;
  }

  if (state.currentTool === 'select') {
    selectItem(nodeId, 'node');
    return;
  }

  if (state.currentTool === 'addNode') {
    // Clicking an existing node in addNode mode: just select it
    selectItem(nodeId, 'node');
  }
}

// ─── Path Events ──────────────────────────────────────

function onPathClick(e, pathId) {
  e.stopPropagation();
  if (state.currentTool === 'delete') {
    deletePath(pathId);
    return;
  }
  if (state.currentTool === 'select' || state.currentTool === 'addPath') {
    selectItem(pathId, 'path');
  }
}

// ─── Text Events ──────────────────────────────────────

function onTextClick(e, textId) {
  e.stopPropagation();
  if (state.currentTool === 'delete') {
    deleteText(textId);
    return;
  }
  if (state.currentTool === 'select') {
    selectItem(textId, 'text');
  }
}

// ─── Add / Delete ─────────────────────────────────────

function addNode(x, y) {
  const type = state.currentNodeType;
  const typeInfo = NODE_TYPES[type];
  const node = {
    id: nextId(),
    type,
    name: typeInfo.label,
    x,
    y,
    color: typeInfo.defaultColor,
  };
  state.nodes.push(node);
  renderAll();
  selectItem(node.id, 'node');
}

function addPath(sourceId, targetId) {
  const path = {
    id: nextId(),
    sourceId,
    targetId,
    label: '',
    lineStyle: 'solid',
    arrow: 'end',
    color: '#555555',
    width: 2,
  };
  state.paths.push(path);
  renderAll();
  selectItem(path.id, 'path');
}

function addTextElement(x, y, content) {
  const txt = {
    id: nextId(),
    x, y,
    content,
    color: '#333333',
    size: 13,
  };
  state.texts.push(txt);
  renderAll();
  selectItem(txt.id, 'text');
}

function deleteNode(nodeId) {
  state.nodes = state.nodes.filter(n => n.id !== nodeId);
  // Remove connected paths
  state.paths = state.paths.filter(p => p.sourceId !== nodeId && p.targetId !== nodeId);
  if (state.selectedId === nodeId) {
    state.selectedId = null;
    state.selectedType = null;
  }
  renderAll();
  updatePropertiesPanel();
}

function deletePath(pathId) {
  state.paths = state.paths.filter(p => p.id !== pathId);
  if (state.selectedId === pathId) {
    state.selectedId = null;
    state.selectedType = null;
  }
  renderAll();
  updatePropertiesPanel();
}

function deleteText(textId) {
  state.texts = state.texts.filter(t => t.id !== textId);
  if (state.selectedId === textId) {
    state.selectedId = null;
    state.selectedType = null;
  }
  renderAll();
  updatePropertiesPanel();
}

function deleteSelected() {
  if (!state.selectedId) return;
  if (state.selectedType === 'node') deleteNode(state.selectedId);
  else if (state.selectedType === 'path') deletePath(state.selectedId);
  else if (state.selectedType === 'text') deleteText(state.selectedId);
}

// ─── Text Dialog ──────────────────────────────────────

function openTextDialog(x, y) {
  state.pendingTextX = x;
  state.pendingTextY = y;
  textDialogInput.value = '';
  textDialog.classList.remove('hidden');
  textDialogInput.focus();
}

textDialogOk.addEventListener('click', () => {
  const content = textDialogInput.value.trim();
  if (content) {
    addTextElement(state.pendingTextX, state.pendingTextY, content);
  }
  textDialog.classList.add('hidden');
});

textDialogCancel.addEventListener('click', () => {
  textDialog.classList.add('hidden');
});

textDialogInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') textDialogOk.click();
  if (e.key === 'Escape') textDialogCancel.click();
});

// ─── Keyboard Shortcuts ───────────────────────────────

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteSelected();
  }
  if (e.key === 'Escape') {
    setTool('select');
    deselect();
  }
});

// ─── Toolbar Listeners ────────────────────────────────

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => setTool(btn.dataset.tool));
});

document.querySelectorAll('.node-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.currentNodeType = btn.dataset.type;
    document.querySelectorAll('.node-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Auto-switch to addNode tool
    if (state.currentTool !== 'addNode') {
      setTool('addNode');
    }
  });
});

// ─── Property Panel Listeners ─────────────────────────

propNodeName.addEventListener('input', () => {
  const node = state.nodes.find(n => n.id === state.selectedId);
  if (!node) return;
  node.name = propNodeName.value;
  renderAll();
});

propNodeType.addEventListener('change', () => {
  const node = state.nodes.find(n => n.id === state.selectedId);
  if (!node) return;
  node.type = propNodeType.value;
  // Only update color if it's still the default of the old type
  node.color = NODE_TYPES[node.type].defaultColor;
  propNodeColor.value = node.color;
  renderAll();
});

propNodeColor.addEventListener('input', () => {
  const node = state.nodes.find(n => n.id === state.selectedId);
  if (!node) return;
  node.color = propNodeColor.value;
  renderAll();
});

propPathLabel.addEventListener('input', () => {
  const path = state.paths.find(p => p.id === state.selectedId);
  if (!path) return;
  path.label = propPathLabel.value;
  renderAll();
});

propPathStyle.addEventListener('change', () => {
  const path = state.paths.find(p => p.id === state.selectedId);
  if (!path) return;
  path.lineStyle = propPathStyle.value;
  renderAll();
});

propPathArrow.addEventListener('change', () => {
  const path = state.paths.find(p => p.id === state.selectedId);
  if (!path) return;
  path.arrow = propPathArrow.value;
  renderAll();
});

propPathColor.addEventListener('input', () => {
  const path = state.paths.find(p => p.id === state.selectedId);
  if (!path) return;
  path.color = propPathColor.value;
  renderAll();
});

propPathWidth.addEventListener('input', () => {
  const path = state.paths.find(p => p.id === state.selectedId);
  if (!path) return;
  path.width = parseInt(propPathWidth.value, 10);
  propPathWidthVal.textContent = path.width + 'px';
  renderAll();
});

propTextContent.addEventListener('input', () => {
  const txt = state.texts.find(t => t.id === state.selectedId);
  if (!txt) return;
  txt.content = propTextContent.value;
  renderAll();
});

propTextColor.addEventListener('input', () => {
  const txt = state.texts.find(t => t.id === state.selectedId);
  if (!txt) return;
  txt.color = propTextColor.value;
  renderAll();
});

propTextSize.addEventListener('input', () => {
  const txt = state.texts.find(t => t.id === state.selectedId);
  if (!txt) return;
  txt.size = parseInt(propTextSize.value, 10);
  propTextSizeVal.textContent = txt.size + 'px';
  renderAll();
});

// ─── Print Size ───────────────────────────────────────

document.querySelectorAll('input[name="printSize"]').forEach(radio => {
  radio.addEventListener('change', () => {
    state.printScale = parseFloat(radio.value) / 100;
    document.documentElement.style.setProperty('--print-scale', state.printScale);
  });
});

// ─── Export: PNG ──────────────────────────────────────

document.getElementById('btn-png').addEventListener('click', exportPNG);

function exportPNG() {
  const svgEl2 = document.getElementById('main-svg');
  const svgData = new XMLSerializer().serializeToString(svgEl2);

  // Embed fonts and emoji as best effort
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width  = 700;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 700, 500);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const a = document.createElement('a');
    a.download = '通学路図.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };
  img.onerror = () => {
    alert('PNG の生成に失敗しました。ブラウザがSVGの直接エクスポートをサポートしていない場合があります。');
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

// ─── Export: PDF ──────────────────────────────────────

document.getElementById('btn-pdf').addEventListener('click', exportPDF);

function exportPDF() {
  if (typeof html2pdf === 'undefined') {
    alert('html2pdf.js が読み込まれていません。インターネット接続を確認してください。');
    return;
  }

  const wrapper = document.getElementById('canvas-wrapper');
  const opt = {
    margin:       [10, 10, 10, 10],
    filename:     '通学路図.pdf',
    image:        { type: 'png', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
  };
  html2pdf().set(opt).from(wrapper).save();
}

// ─── Print ────────────────────────────────────────────

document.getElementById('btn-print').addEventListener('click', () => {
  window.print();
});

// ─── Initial Sample Data ──────────────────────────────

function loadSampleData() {
  // Nodes
  const home1 = { id: nextId(), type: 'home', name: '自宅', x: 120, y: 250, color: NODE_TYPES.home.defaultColor };
  const cross  = { id: nextId(), type: 'intersection', name: '交差点A', x: 300, y: 160, color: NODE_TYPES.intersection.defaultColor };
  const station = { id: nextId(), type: 'station', name: '○○駅', x: 500, y: 160, color: NODE_TYPES.station.defaultColor };
  const school  = { id: nextId(), type: 'school', name: '○○小学校', x: 490, y: 330, color: NODE_TYPES.school.defaultColor };
  const bus     = { id: nextId(), type: 'busstop', name: 'バス停', x: 310, y: 330, color: NODE_TYPES.busstop.defaultColor };

  state.nodes.push(home1, cross, station, school, bus);

  // Paths
  state.paths.push({
    id: nextId(), sourceId: home1.id, targetId: cross.id,
    label: '徒歩5分', lineStyle: 'solid', arrow: 'end', color: '#d97706', width: 3,
  });
  state.paths.push({
    id: nextId(), sourceId: cross.id, targetId: station.id,
    label: '徒歩8分', lineStyle: 'solid', arrow: 'end', color: '#2563eb', width: 2,
  });
  state.paths.push({
    id: nextId(), sourceId: home1.id, targetId: bus.id,
    label: '徒歩3分', lineStyle: 'dashed', arrow: 'end', color: '#16a34a', width: 2,
  });
  state.paths.push({
    id: nextId(), sourceId: bus.id, targetId: school.id,
    label: 'バス15分', lineStyle: 'solid', arrow: 'end', color: '#16a34a', width: 2,
  });
  state.paths.push({
    id: nextId(), sourceId: station.id, targetId: school.id,
    label: '徒歩12分', lineStyle: 'solid', arrow: 'end', color: '#2563eb', width: 2,
  });

  // Labels
  state.texts.push({
    id: nextId(), x: 350, y: 460, content: '※ 点線はバス利用ルート', color: '#555', size: 12,
  });

  renderAll();
}

// ─── Bootstrap ────────────────────────────────────────

setTool('select');
loadSampleData();
