const WORDS = [
  "apple","bread","chair","dance","eagle","flame","grape","house","jelly","knife",
"light","magic","night","ocean","plant","queen","river","smile","table","uncle",
"vivid","water","xenon","young","zebra","audio","crisp","dwarf","brave","cloud",
"drink","earth","fresh","giant","happy","ideal","joker","lemon","metal","noble",
"olive","piano","quick","round","sweet","tiger","urban","value","whale","youth",
"angel","beach","candy","dream","elite","frost","glory","heart","ivory","judge",
"karma","laser","march","nurse","orbit","peace","quiet","ranch","shine","toast",
"unity","visit","world","xylol","yield","zesty","adore","blink","crown","delay",
"enjoy","faith","grind","honey","inbox","jolly","kneel","lucky","mirth","novel"
];

const KEYBOARD_ROWS = [
  ['q','w','e','r','t','y','u','i','o','p'],
  ['a','s','d','f','g','h','j','k','l','⌫'],
  ['z','x','c','v','b','n','m','Enter']
];

let secret, board, currentRow, currentCol, gameOver;

/* ── Welcome Screen ── */
(function initWelcome() {
  const canvas = document.getElementById('space-canvas');
  const ctx = canvas.getContext('2d');

  const particles = [];
  const COUNT = 160;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.6 + 0.3,
      speed: Math.random() * 0.25 + 0.05,
      opacity: Math.random() * 0.7 + 0.3,
      twinkle: Math.random() * Math.PI * 2
    });
  }

  // A few glowing "planets"
  const planets = [
    { x: 0.15, y: 0.2,  r: 28, color: '#a78bfa', glow: '#7c3aed' },
    { x: 0.82, y: 0.72, r: 18, color: '#60a5fa', glow: '#2563eb' },
    { x: 0.65, y: 0.12, r: 10, color: '#f472b6', glow: '#db2777' },
  ];

  function drawPlanets() {
    planets.forEach(p => {
      const px = p.x * canvas.width;
      const py = p.y * canvas.height;
      const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r * 2.5);
      grad.addColorStop(0, p.color);
      grad.addColorStop(0.5, p.glow + '88');
      grad.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(px, py, p.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frame++;

    drawPlanets();

    particles.forEach(p => {
      p.y -= p.speed;
      p.twinkle += 0.03;
      if (p.y < -2) { p.y = canvas.height + 2; p.x = Math.random() * canvas.width; }
      const alpha = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 200, 255, ${alpha})`;
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }
  animate();

  document.getElementById('start-btn').addEventListener('click', () => {
    const welcome = document.getElementById('welcome');
    welcome.classList.add('fade-out');
    setTimeout(() => welcome.classList.add('hidden'), 700);
  });

  document.getElementById('how-btn').addEventListener('click', () => {
    document.getElementById('htp-modal').classList.remove('hidden');
  });

  document.getElementById('htp-close').addEventListener('click', () => {
    document.getElementById('htp-modal').classList.add('hidden');
  });
})();

/* ── Game ── */
function init() {
  secret     = WORDS[Math.floor(Math.random() * WORDS.length)];
  board      = Array.from({ length: 6 }, () => Array(5).fill(''));
  currentRow = 0;
  currentCol = 0;
  gameOver   = false;

  renderBoard();
  renderKeyboard();
  document.getElementById('modal').classList.add('hidden');
  hideMessage();
}

function renderBoard() {
  const el = document.getElementById('board');
  el.innerHTML = '';
  for (let r = 0; r < 6; r++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.id = `row-${r}`;
    for (let c = 0; c < 5; c++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `tile-${r}-${c}`;
      row.appendChild(tile);
    }
    el.appendChild(row);
  }
}

function renderKeyboard() {
  KEYBOARD_ROWS.forEach((keys, i) => {
    const row = document.getElementById(`row${i + 1}`);
    row.innerHTML = '';
    keys.forEach(k => {
      const btn = document.createElement('button');
      btn.className = 'key' + (k.length > 1 ? ' wide' : '');
      btn.textContent = k;
      btn.dataset.key = k;
      btn.addEventListener('click', () => handleKey(k));
      row.appendChild(btn);
    });
  });
}

function handleKey(key) {
  if (gameOver) return;
  if (key === '⌫' || key === 'Backspace') deleteLetter();
  else if (key === 'Enter') submitGuess();
  else if (/^[a-zA-Z]$/.test(key)) addLetter(key.toLowerCase());
}

function addLetter(letter) {
  if (currentCol >= 5) return;
  board[currentRow][currentCol] = letter;
  const tile = getTile(currentRow, currentCol);
  tile.textContent = letter;
  tile.classList.add('filled');
  currentCol++;
}

function deleteLetter() {
  if (currentCol <= 0) return;
  currentCol--;
  board[currentRow][currentCol] = '';
  const tile = getTile(currentRow, currentCol);
  tile.textContent = '';
  tile.classList.remove('filled');
}

function submitGuess() {
  if (currentCol < 5) { shakeRow(); showMessage('Not enough letters'); return; }

  const guess = board[currentRow].join('');
  const result = evaluate(guess);

  revealRow(currentRow, result, () => {
    updateKeyboard(guess, result);
    if (result.every(r => r === 'correct')) {
      gameOver = true;
      setTimeout(() => showModal('🎉 Brilliant!'), 300);
      return;
    }
    currentRow++;
    currentCol = 0;
    if (currentRow === 6) {
      gameOver = true;
      setTimeout(() => showModal('💀 Game Over'), 300);
    }
  });
}

function evaluate(guess) {
  const result = Array(5).fill('absent');
  const sCount = {};
  const used   = Array(5).fill(false);

  for (let i = 0; i < 5; i++) {
    if (guess[i] === secret[i]) {
      result[i] = 'correct';
      used[i] = true;
    } else {
      sCount[secret[i]] = (sCount[secret[i]] || 0) + 1;
    }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    if (sCount[guess[i]] > 0) {
      result[i] = 'present';
      sCount[guess[i]]--;
    }
  }
  return result;
}

function revealRow(row, result, onDone) {
  result.forEach((state, col) => {
    const tile = getTile(row, col);
    setTimeout(() => {
      tile.classList.add('flip');
      setTimeout(() => tile.classList.add(state), 250);
    }, col * 300);
  });
  setTimeout(onDone, 5 * 300 + 300);
}

function updateKeyboard(guess, result) {
  const priority = { correct: 3, present: 2, absent: 1 };
  guess.split('').forEach((letter, i) => {
    const btn = document.querySelector(`.key[data-key="${letter}"]`);
    if (!btn) return;
    const cur = priority[btn.dataset.state] || 0;
    if (priority[result[i]] > cur) {
      btn.classList.remove('correct', 'present', 'absent');
      btn.classList.add(result[i]);
      btn.dataset.state = result[i];
    }
  });
}

function shakeRow() {
  const row = document.getElementById(`row-${currentRow}`);
  row.querySelectorAll('.tile').forEach(t => {
    t.classList.remove('shake');
    void t.offsetWidth;
    t.classList.add('shake');
  });
}

function showMessage(text, duration = 1800) {
  const el = document.getElementById('message');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), duration);
}

function hideMessage() {
  document.getElementById('message').classList.remove('show');
}

function showModal(text) {
  document.getElementById('modal-text').textContent = text;
  document.getElementById('modal-word').textContent = `The word was: ${secret.toUpperCase()}`;
  document.getElementById('modal').classList.remove('hidden');
}

function getTile(r, c) {
  return document.getElementById(`tile-${r}-${c}`);
}

document.addEventListener('keydown', e => handleKey(e.key === 'Backspace' ? 'Backspace' : e.key));
document.getElementById('restart-btn').addEventListener('click', init);

init();
