// ================= CONFIGURAÇÃO DAS FASES =================
// ralphs: quantos Ralphs aparecem ao mesmo tempo
// felix: chance (0 a 1) de aparecer o Félix (não pode acertar!)
// bonus: chance de aparecer item bônus (tempo ou vida)
const LEVELS = [
  { name: "Fase 1",           time: 40, goal: 10, speed: 1000, ralphs: 1, felix: 0,    bonus: 0    },
  { name: "Fase 2",           time: 40, goal: 18, speed: 850,  ralphs: 1, felix: 0,    bonus: 0.08 },
  { name: "Fase 3",           time: 45, goal: 28, speed: 800,  ralphs: 2, felix: 0,    bonus: 0.1  },
  { name: "Fase 4",           time: 45, goal: 36, speed: 750,  ralphs: 2, felix: 0.5,  bonus: 0.1  },
  { name: "Fase 5 - Chefão",  time: 50, goal: 50, speed: 600,  ralphs: 2, felix: 0.6,  bonus: 0.12 },
];
const MAX_LIVES = 5;
const START_LIVES = 3;

const state = {
  view: {
    squares: document.querySelectorAll(".square"),
    timeLeft: document.querySelector("#time-left"),
    score: document.querySelector("#score"),
    xp: document.querySelector("#xp"),
    level: document.querySelector("#level"),
    goal: document.querySelector("#goal-progress"),
    combo: document.querySelector("#combo"),
    best: document.querySelector("#best"),
    pauseButton: document.querySelector("#pause-button"),
    overlay: document.querySelector("#overlay"),
    overlayTitle: document.querySelector("#overlay-title"),
    overlayText: document.querySelector("#overlay-text"),
    overlayButton: document.querySelector("#overlay-button"),
  },
  values: {
    levelIndex: 0,
    timeLeft: 0,
    score: 0,
    levelStartScore: 0,
    levelHits: 0,
    lives: START_LIVES,
    combo: 0,
    best: 0,
    cells: {},      // id do quadrado -> "ralph" | "felix" | "time" | "life"
    running: false,
  },
  timers: { spawn: null, clock: null },
  onOverlayClick: null,
};

// ================= UTILIDADES =================
function playSound(name) {
  // Só "hit.m4a" existe hoje. Os outros são opcionais: se o arquivo não existir, nada acontece.
  try {
    const audio = new Audio(`./src/sounds/${name}.m4a`);
    audio.volume = 0.2;
    audio.play().catch(() => {});
  } catch (e) {}
}

function currentLevel() { return LEVELS[state.values.levelIndex]; }

function loadBest() {
  try { state.values.best = Number(localStorage.getItem("detona-ralph-best")) || 0; } catch (e) {}
  state.view.best.textContent = state.values.best;
}
function saveBest() {
  if (state.values.score > state.values.best) {
    state.values.best = state.values.score;
    try { localStorage.setItem("detona-ralph-best", String(state.values.best)); } catch (e) {}
  }
  state.view.best.textContent = state.values.best;
}

function updateHud() {
  const v = state.values, view = state.view;
  view.timeLeft.textContent = v.timeLeft;
  view.score.textContent = v.score;
  view.xp.textContent = "x" + v.lives;
  view.level.textContent = v.levelIndex + 1;
  view.goal.textContent = v.levelHits + "/" + currentLevel().goal;
  view.combo.textContent = "x" + comboMultiplier();
}

function comboMultiplier() { return 1 + Math.floor(state.values.combo / 5); }

function flash(square, cls) {
  square.classList.remove("acerto", "erro");
  void square.offsetWidth; // reinicia a animação
  square.classList.add(cls);
}

function showOverlay(title, text, buttonLabel, onClick) {
  const v = state.view;
  v.overlayTitle.textContent = title;
  v.overlayText.textContent = text;
  v.overlayButton.textContent = buttonLabel;
  state.onOverlayClick = onClick;
  v.overlay.classList.remove("hidden");
  v.overlayButton.focus();
}
function hideOverlay() { state.view.overlay.classList.add("hidden"); }

// ================= LOOP DO JOGO =================
function clearBoard() {
  state.view.squares.forEach((sq) => sq.classList.remove("enemy", "felix", "bonus-time", "bonus-life"));
  state.values.cells = {};
}

function spawn() {
  if (!state.values.running) return;
  const lvl = currentLevel();
  clearBoard();

  // sorteia posições diferentes
  const ids = [...state.view.squares].map((s) => s.id).sort(() => Math.random() - 0.5);
  const place = (type, cls) => {
    const id = ids.pop();
    if (!id) return;
    state.values.cells[id] = type;
    document.getElementById(id).classList.add(cls);
  };

  for (let i = 0; i < lvl.ralphs; i++) place("ralph", "enemy");
  if (Math.random() < lvl.felix) place("felix", "felix");
  if (Math.random() < lvl.bonus) {
    Math.random() < 0.6 ? place("time", "bonus-time") : place("life", "bonus-life");
  }

  state.timers.spawn = setTimeout(spawn, lvl.speed);
}

function tick() {
  if (!state.values.running) return;
  state.values.timeLeft--;
  updateHud();
  if (state.values.timeLeft <= 0) loseLevel("Acabou o tempo!");
}

function startLevel() {
  const v = state.values, lvl = currentLevel();
  v.timeLeft = lvl.time;
  v.levelHits = 0;
  v.combo = 0;
  v.levelStartScore = v.score;
  v.running = true;
  clearBoard();
  updateHud();
  hideOverlay();
  clearTimeout(state.timers.spawn);
  clearInterval(state.timers.clock);
  state.timers.spawn = setTimeout(spawn, 400);
  state.timers.clock = setInterval(tick, 1000);
  state.view.pauseButton.textContent = "Pausar";
}

function stopLoops() {
  state.values.running = false;
  clearTimeout(state.timers.spawn);
  clearInterval(state.timers.clock);
  clearBoard();
}

// ================= FIM DE FASE / JOGO =================
function winLevel() {
  stopLoops();
  saveBest();
  const v = state.values;
  if (v.levelIndex >= LEVELS.length - 1) {
    showOverlay("Você venceu!",
      "Ralph foi detonado em todas as fases!\nPontuação final: " + v.score + (v.score >= v.best ? "\nNovo recorde!" : ""),
      "Jogar de novo", newGame);
    return;
  }
  const next = LEVELS[v.levelIndex + 1];
  showOverlay("Fase concluída!",
    "Pontos: " + v.score + "\nPróxima: " + next.name + "\nMeta: " + next.goal + " acertos",
    "Próxima fase", () => { v.levelIndex++; startLevel(); });
}

function loseLevel(reason) {
  stopLoops();
  const v = state.values;
  if (v.lives <= 0) {
    saveBest();
    showOverlay("Game Over", reason + "\nPontuação: " + v.score + "\nRecorde: " + v.best, "Tentar de novo", newGame);
  } else {
    v.score = v.levelStartScore; // refaz a fase sem os pontos dela
    updateHud();
    showOverlay("Quase!", reason + "\nVocê tem " + v.lives + " vida(s).\nVamos repetir a " + currentLevel().name + ".", "Tentar a fase", startLevel);
  }
}

function newGame() {
  const v = state.values;
  v.levelIndex = 0;
  v.score = 0;
  v.lives = START_LIVES;
  startLevel();
}

// ================= CLIQUES =================
function onHit(square) {
  const v = state.values;
  if (!v.running) return;
  const type = v.cells[square.id];

    if (!type) { // clicou em quadrado vazio: perde uma vida
    v.lives--;
    v.combo = 0;
    flash(square, "erro");
    playSound("erro");
    updateHud();
    if (v.lives <= 0) loseLevel("Você errou o clique!");
    return;
  }

  delete v.cells[square.id];
  square.classList.remove("enemy", "felix", "bonus-time", "bonus-life");

  if (type === "ralph") {
    v.combo++;
    v.score += comboMultiplier();
    v.levelHits++;
    flash(square, "acerto");
    playSound("hit");
  } else if (type === "felix") {
    v.lives--;
    v.combo = 0;
    flash(square, "erro");
    playSound("erro");
  } else if (type === "time") {
    v.timeLeft += 5;
    flash(square, "acerto");
    playSound("bonus");
  } else if (type === "life") {
    v.lives = Math.min(MAX_LIVES, v.lives + 1);
    flash(square, "acerto");
    playSound("bonus");
  }

  updateHud();
  if (v.lives <= 0) loseLevel("Você acertou o Félix!");
  else if (v.levelHits >= currentLevel().goal) winLevel();
}

function addListenerHitBox() {
  state.view.squares.forEach((square) => {
    // pointerdown funciona com mouse e toque (celular)
    square.addEventListener("pointerdown", (e) => { e.preventDefault(); onHit(square); });
  });
}

// ================= PAUSA =================
function togglePause() {
  const v = state.values;
  if (v.running) {
    v.running = false;
    clearTimeout(state.timers.spawn);
    clearInterval(state.timers.clock);
    showOverlay("Pausado", "O tempo está parado.", "Continuar", resume);
  }
}
function resume() {
  const v = state.values;
  hideOverlay();
  v.running = true;
  state.timers.spawn = setTimeout(spawn, 300);
  state.timers.clock = setInterval(tick, 1000);
}

// ================= INÍCIO =================
function initializeGame() {
  loadBest();
  addListenerHitBox();
  state.view.overlayButton.addEventListener("click", () => state.onOverlayClick && state.onOverlayClick());
  state.view.pauseButton.addEventListener("click", togglePause);
  document.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P" || e.key === "Escape") togglePause();
  });
  updateHud();
  showOverlay("Detona Ralph",
    "Clique no Ralph antes que ele fuja!\nNão acerte o Félix 🔨 nem quadrados vazios:\ncada erro custa uma vida!\n⏱️ = +5s   ❤️ = +1 vida\nAcertos seguidos aumentam o combo.\n\n5 fases. Boa sorte!",
    "Começar", newGame);
}

initializeGame();
