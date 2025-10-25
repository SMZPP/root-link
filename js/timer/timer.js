const hInput = document.getElementById('hours');
const mInput = document.getElementById('minutes');
const sInput = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const display = document.getElementById('display');
const note = document.getElementById('note');
const status = document.getElementById('status');
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
function playEndBell(){ playTone(600,350,'sine',0.28); setTimeout(()=>playTone(720,200,'sine',0.22),380); }

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

function tick(){
  if(remaining <= 0){
    clearInterval(timerId); timerId = null; running = false;
    status.textContent = '終了';
    note.textContent = '時間になりました';
    playEndBell();
    try{ if(navigator.vibrate) navigator.vibrate([300,100,300]); }catch(e){}
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
  status.textContent = '動作中';
  note.textContent = 'タイマーが動いています';
  timerId = setInterval(tick, 1000);
  try{ if(audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }catch(e){}
}

function pauseTimer(){
  if(timerId) clearInterval(timerId);
  timerId = null; running = false;
  status.textContent = '一時停止';
  note.textContent = '停止中';
  document.title = '⏸ タイマー';
}

function resetTimer(){
  if(timerId) clearInterval(timerId);
  timerId = null; running = false;
  totalSeconds = 0; remaining = 0;
  status.textContent = '';
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