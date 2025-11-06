const left = document.getElementById('left');
const right = document.getElementById('right');
const diffOutput = document.getElementById('diff');
const compareBtn = document.getElementById('compareBtn');
const clearBtn = document.getElementById('clearBtn');

compareBtn.addEventListener('click', () => {
  const text1 = left.value;
  const text2 = right.value;

  const diff = Diff.diffLines(text1, text2);
  diffOutput.innerHTML = '';

  diff.forEach(part => {
    const span = document.createElement('span');
    span.textContent = part.value;
    if (part.added) span.classList.add('added');
    if (part.removed) span.classList.add('removed');
    diffOutput.appendChild(span);
  });
});

clearBtn.addEventListener('click', () => {
  left.value = '';
  right.value = '';
  diffOutput.innerHTML = '';
});
