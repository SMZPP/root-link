const hInput = document.getElementById('hours');
const mInput = document.getElementById('minutes');
const sInput = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const display = document.getElementById('display');
const note = document.getElementById('note');
const bar = document.getElementById('bar');
const soundToggle = document.getElementById('soundToggle');
const notifyHint = document.getElementById('notifyHint');

let totalSeconds = 0;
let remaining = 0;
let timerId = null;
let running = false;

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function ensureAudio(){ if(!audioCtx) audioCtx = new AudioCtx(); }

function playTone(freq, duration=200, type='sine', gain=0.2){
  if(!soundToggle.checked) return;
  try{
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    const now = audioCtx.currentTime;
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + (duration/1000));
    o.stop(now + (duration/1000) + 0.02);
  }catch(e){ console.warn('Audio failed',e); }
}

function playEndBell(){
  playTone(600, 1000, 'sine', 0.4);   // メインベル 1秒
  setTimeout(() => playTone(720, 800, 'triangle', 0.3), 1000); // 追いかけ音
}
function notify(title, body){
  if(window.Notification && Notification.permission === 'granted'){
    new Notification(title, {body});
  }
}

function formatTime(s){
  const hh = String(Math.floor(s/3600)).padStart(2,'0');
  const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
  const ss = String(s%60).padStart(2,'0');
  return `${hh}:${mm}:${ss}`;
}

function updateUI(){
  display.textContent = formatTime(remaining);
  const pct = totalSeconds ? Math.max(0, Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100)) : 0;
  bar.style.width = pct + '%';
  if(!running && remaining===0){ note.textContent = '準備完了'; }
}

function tick() {
  if (remaining <= 0) {
    clearInterval(timerId);
    timerId = null;
    running = false;
    note.textContent = '時間になりました';
    playEndBell();

    showPopup();

    try { if(navigator.vibrate) navigator.vibrate([300,100,300]); } catch(e) {}
    document.title = '⏰ 終了 - タイマー';
    notify('タイマー終了', '設定した時間が終了しました');
    return;
  }

  remaining -= 1;
  updateUI();
  document.title = formatTime(remaining) + ' - タイマー';
}

function startTimer(){
  if(running) return;
  if(totalSeconds === 0 || remaining === 0){
    const h = Math.max(0, parseInt(hInput.value || 0));
    const m = Math.max(0, parseInt(mInput.value || 0));
    const s = Math.max(0, parseInt(sInput.value || 0));
    totalSeconds = h*3600 + m*60 + s;
    remaining = totalSeconds;
    if(totalSeconds <= 0){ alert('時間を正しく入力してください。'); return; }
  }
  running = true;
  note.textContent = 'タイマーが動いています';
  timerId = setInterval(tick, 1000);
  try{ if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){}
}

function pauseTimer(){
  if(timerId) clearInterval(timerId);
  timerId = null; running = false;
  note.textContent = '停止中';
  document.title = '⏸ タイマー';
}

function resetTimer(){
  if(timerId) clearInterval(timerId);
  timerId = null; running = false;
  totalSeconds = 0; remaining = 0;
  note.textContent = 'リセットされました';
  display.textContent = '00:00:00';
  bar.style.width = '0%';
  document.title = 'シンプルタイマー';
}

startBtn.addEventListener('click', ()=>{ startTimer(); });
pauseBtn.addEventListener('click', ()=>{ pauseTimer(); });
resetBtn.addEventListener('click', ()=>{ resetTimer(); });

[hInput,mInput,sInput].forEach(inp=>inp.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') startTimer(); }));

document.addEventListener('click', function requestNotifyOnce(){
  if('Notification' in window && Notification.permission === 'default'){
    Notification.requestPermission().then(p=>{ notifyHint.textContent = p === 'granted' ? '通知許可済み' : '通知未許可'; });
  }
  document.removeEventListener('click', requestNotifyOnce);
});

resetTimer();

[mInput,sInput].forEach(i=>i.addEventListener('input', ()=>{
  if(i.value === '') return; let v = parseInt(i.value); if(isNaN(v)) v = 0; if(v<0) v = 0; if(v>59) v = 59; i.value = v;
}));

document.addEventListener('keydown', ()=>{ if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }, {once:true});


function startFireworks() {
  const canvas = document.getElementById('fireworks');
  const ctx = canvas.getContext('2d');
  canvas.hidden = false; // ← ここを追加
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];
  function random(min, max) { return Math.random() * (max - min) + min; }

  function createFirework() {
    const x = random(100, canvas.width - 100);
    const y = random(100, canvas.height / 2);
    const color = `hsl(${Math.floor(random(0, 360))},100%,60%)`;
    for (let i = 0; i < 50; i++) {
      particles.push({
        x, y,
        angle: random(0, Math.PI * 2),
        speed: random(1, 6),
        radius: 3,
        alpha: 1,
        color
      });
    }
  }

  function animate() {
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p, i) => {
      p.x += Math.cos(p.angle) * p.speed;
      p.y += Math.sin(p.angle) * p.speed;
      p.alpha -= 0.015;
      if (p.alpha <= 0) particles.splice(i, 1);
      ctx.beginPath();
      ctx.fillStyle = `${p.color}`;
      ctx.globalAlpha = p.alpha;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }

  const interval = setInterval(createFirework, 400);
  animate();

  setTimeout(() => {
    clearInterval(interval);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.hidden = true; // ← 終了後に非表示に戻す
  }, 3000);
}

function showPopup() {
  const popup = document.getElementById('popup');
  const fireworks = document.getElementById('fireworks');

  // 表示開始
  popup.style.display = 'flex';
  fireworks.style.display = 'block';

  // フェードイン
  requestAnimationFrame(() => {
    popup.style.opacity = '1';
    fireworks.style.opacity = '1';
  });

  startFireworks();

  // 3.5秒後に自動で消える
  setTimeout(() => {
    popup.style.opacity = '0';
    fireworks.style.opacity = '0';
    setTimeout(() => {
      popup.style.display = 'none';
      fireworks.style.display = 'none';
    }, 400); // フェードアウト後に完全非表示
  }, 3500);
}
