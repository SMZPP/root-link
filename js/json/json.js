
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const beautifyBtn = document.getElementById('beautify');
    const minifyBtn = document.getElementById('minify');
    const validateBtn = document.getElementById('validate');
    const clearBtn = document.getElementById('clear');
    const indentSelect = document.getElementById('indent');
    const message = document.getElementById('message');
    const fileInput = document.getElementById('fileInput');

    const copyInput = document.getElementById('copyInput');
    const downloadInput = document.getElementById('downloadInput');
    const pasteClipboard = document.getElementById('pasteClipboard');

    const copyOutput = document.getElementById('copyOutput');
    const downloadOutput = document.getElementById('downloadOutput');
    const clearOutput = document.getElementById('clearOutput');

    function setMessage(msg, isError=false){
      message.textContent = msg; message.style.color = isError ? '#b91c1c' : '#1f2937';
      if(msg){ setTimeout(()=>{ message.textContent = '' }, 3500); }
    }

    function tryParseJSON(text){
      try{ return {ok:true, value: JSON.parse(text)} }catch(e){ return {ok:false, error:e} }
    }

    function formatJSON(text, indent){
      const res = tryParseJSON(text);
      if(!res.ok) throw res.error;
      const n = Number(indent);
      return n === 0 ? JSON.stringify(res.value) : JSON.stringify(res.value, null, n);
    }

    beautifyBtn.addEventListener('click', ()=>{
      const indent = indentSelect.value;
      try{
        const formatted = formatJSON(input.value, indent);
        output.textContent = formatted;
        setMessage('整形しました ✔');
      }catch(e){ setMessage('構文エラー: ' + e.message, true); }
    });

    minifyBtn.addEventListener('click', ()=>{
      try{
        const res = tryParseJSON(input.value);
        if(!res.ok) throw res.error;
        output.textContent = JSON.stringify(res.value);
        setMessage('Minifyしました ✔');
      }catch(e){ setMessage('構文エラー: ' + e.message, true); }
    });

    validateBtn.addEventListener('click', ()=>{
      const res = tryParseJSON(input.value);
      if(res.ok) setMessage('Valid JSON ✅');
      else setMessage('構文エラー: ' + res.error.message, true);
    });

    clearBtn.addEventListener('click', ()=>{ input.value = ''; setMessage('入力をクリアしました'); });

    // copy / download helpers
    async function copyToClipboard(text){
      try{ await navigator.clipboard.writeText(text); setMessage('コピーしました ✔'); }
      catch(e){ setMessage('コピーに失敗しました', true); }
    }

    copyInput.addEventListener('click', ()=> copyToClipboard(input.value));
    copyOutput.addEventListener('click', ()=> copyToClipboard(output.textContent));

    function downloadText(filename, text){
      const a = document.createElement('a');
      const blob = new Blob([text], {type:'application/json'});
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
    }

    downloadInput.addEventListener('click', ()=> downloadText('input.json', input.value || '{}'));
    downloadOutput.addEventListener('click', ()=> downloadText('output.json', output.textContent || '{}'));

    clearOutput.addEventListener('click', ()=>{ output.textContent = ''; setMessage('出力をクリアしました'); });

    // Paste from clipboard into input (permission may be required)
    pasteClipboard.addEventListener('click', async ()=>{
      try{
        const text = await navigator.clipboard.readText();
        input.value = text;
        setMessage('クリップボードから貼り付けました');
      }catch(e){ setMessage('クリップボードの読み取りに失敗しました', true); }
    });

    // File upload
    fileInput.addEventListener('change', e=>{
      const f = e.target.files[0];
      if(!f) return;
      const reader = new FileReader();
      reader.onload = ()=>{ input.value = reader.result; setMessage('ファイルを読み込みました: ' + f.name); }
      reader.onerror = ()=> setMessage('ファイルの読み込みに失敗しました', true);
      reader.readAsText(f, 'utf-8');
    });

    // drag & drop onto input area
    input.addEventListener('dragover', e=>{ e.preventDefault(); input.style.boxShadow='0 6px 18px rgba(3,102,255,0.12)'; });
    input.addEventListener('dragleave', e=>{ input.style.boxShadow=''; });
    input.addEventListener('drop', e=>{
      e.preventDefault(); input.style.boxShadow='';
      const f = e.dataTransfer.files && e.dataTransfer.files[0];
      if(!f) { setMessage('ドロップされた内容はファイルではありません', true); return; }
      const reader = new FileReader();
      reader.onload = ()=>{ input.value = reader.result; setMessage('ファイルを読み込みました: ' + f.name); }
      reader.onerror = ()=> setMessage('ファイルの読み込みに失敗しました', true);
      reader.readAsText(f, 'utf-8');
    });

    // keyboard shortcut: Ctrl/Cmd+Enter -> Beautify, Shift+Enter -> Minify
    input.addEventListener('keydown', e=>{
      if ((e.ctrlKey||e.metaKey) && e.key === 'Enter') { e.preventDefault(); beautifyBtn.click(); }
      else if (e.shiftKey && e.key === 'Enter') { e.preventDefault(); minifyBtn.click(); }
    });

    // 初期サンプル
    input.value = '{\n  "message": "Hello JSON",\n  "items": [1,2,3]\n}';
    beautifyBtn.click();
