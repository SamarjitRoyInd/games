/**
 * game.js - State management and turn loop for Grid Masters
 *
 * Supports two modes:
 *   1P  (twoPlayer=false) — human vs bot; bot thinks 2-8s with countdown.
 *   2P  (twoPlayer=true)  — human vs human; both players click the board.
 *
 * Save/resume: full state serialised to localStorage.
 */
const Game = (() => {

  const SAVE_KEY = 'gm_state_v2';
  const BOT_MIN  = 2000;
  const BOT_MAX  = 8000;

  let state      = null;
  let botTimer   = null;
  let thinkTimer = null;

  /* -- Public API -------------------------------------------- */

  function start(config) {
    _cancelAll();
    state = _createState(config);
    _saveState();
    _renderBoard();
    _updateUI();
  }

  function resume() {
    _cancelAll();
    const saved = _loadState();
    if (!saved) return false;
    state = saved;
    _renderBoard();
    _updateUI();
    if (!state.twoPlayer && state.currentTurn === 1 && !state.gameOver) {
      _scheduleBotMove();
    }
    return true;
  }

  /** Called by board.js hit areas on any click (player 0 in 1P, either in 2P). */
  function handlePlayerMove(lineId) {
    if (!state || state.gameOver) return;
    // In 1P mode only accept clicks on player 0's turn
    if (!state.twoPlayer && state.currentTurn !== 0) return;
    if (state.lines.has(lineId)) return;

    _triggerMoveHaptic();

    const mover   = state.currentTurn;
    const claimed = _applyMove(lineId, mover);
    _renderBoard();
    _updateUI();

    if (!_checkGameOver()) {
      if (claimed > 0) {
        _pulseScore(mover);
        // Same player goes again — no turn switch needed
      } else {
        // Switch turns
        state.currentTurn = mover === 0 ? 1 : 0;
        if (!state.twoPlayer) {
          // 1P: it's now the bot's turn
          _updateUI();
          _scheduleBotMove();
        } else {
          // 2P: other human's turn — re-render so hit areas update
          _renderBoard();
          _updateUI();
        }
      }
    }
    _saveState();
  }

  function hasSave() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      return !!(d && !d.gameOver);
    } catch { return false; }
  }

  function clearSave() { localStorage.removeItem(SAVE_KEY); }
  function getState()  { return state; }

  /* -- Bot (1P only) ----------------------------------------- */

  function _scheduleBotMove() {
    _cancelAll();
    const delay = BOT_MIN + Math.random() * (BOT_MAX - BOT_MIN);
    _startThinkingCountdown(delay);
    botTimer = setTimeout(() => {
      _stopThinkingCountdown();
      _doBotMove();
    }, delay);
  }

  function _doBotMove() {
    if (!state || state.gameOver || state.currentTurn !== 1) return;

    const move = Bot.getMove(state);
    if (!move) { _checkGameOver(); return; }

    const claimed = _applyMove(move, 1);
    _renderBoard();
    _updateUI();

    if (!_checkGameOver()) {
      if (claimed > 0) {
        _pulseScore(1);
        _scheduleBotMove();
      } else {
        state.currentTurn = 0;
        _renderBoard();
        _updateUI();
      }
    }
    _saveState();
  }

  /* -- Thinking countdown (1P only) -------------------------- */

  function _startThinkingCountdown(totalMs) {
    const endAt = Date.now() + totalMs;

    function tick() {
      const remaining = Math.max(0, endAt - Date.now());
      const secs      = Math.ceil(remaining / 1000);
      const frame     = Math.floor(Date.now() / 350) % 4;
      const dots      = '.'.repeat(frame);

      const badge = document.getElementById('header-turn-badge');
      const label = document.getElementById('turn-label');
      const sub   = document.getElementById('turn-sublabel');
      const icon  = document.getElementById('header-turn-icon');

      if (badge) badge.dataset.state = 'bot';
      if (label) label.textContent   = 'THINKING' + dots;
      if (sub)   { sub.textContent = secs + 's'; sub.classList.remove('hidden'); }
      if (icon)  icon.textContent    = 'smart_toy';
    }

    tick();
    thinkTimer = setInterval(tick, 350);
  }

  function _stopThinkingCountdown() {
    if (thinkTimer) { clearInterval(thinkTimer); thinkTimer = null; }
    const sub = document.getElementById('turn-sublabel');
    if (sub) sub.classList.add('hidden');
  }

  function _cancelAll() {
    if (botTimer) { clearTimeout(botTimer); botTimer = null; }
    _stopThinkingCountdown();
  }

  /* -- Core game logic ---------------------------------------- */

  function _applyMove(lineId, player) {
    state.lines.add(lineId);
    state.lineOwners.set(lineId, player);

    if (typeof Audio !== 'undefined' && Audio.playLineSfx) Audio.playLineSfx();

    let claimed = 0;
    for (const [r, c] of Utils.getAffectedBoxes(lineId, state.gridSize)) {
      const boxId = 'b-' + r + '-' + c;
      if (!state.boxes.has(boxId) && Utils.countBoxSides(r, c, state.lines) === 4) {
        state.boxes.set(boxId, player);
        state.scores[player]++;
        claimed++;
      }
    }
    return claimed;
  }

  function _triggerMoveHaptic() {
    if (!window.navigator || typeof window.navigator.vibrate !== 'function') return;
    try {
      window.navigator.vibrate(12);
    } catch {
      // Ignore platforms that expose vibrate() but block it in the browser.
    }
  }

  function _checkGameOver() {
    if (state.boxes.size >= state.gridSize * state.gridSize) {
      state.gameOver = true;
      _updateUI();
      _saveState();
      setTimeout(() => Main.showResult(state), 1000);
      return true;
    }
    return false;
  }

  /* -- Rendering ---------------------------------------------- */

  function _renderBoard() {
    const svg = document.getElementById('game-svg');
    if (svg) Board.render(svg, state, handlePlayerMove);
  }

  function _updateUI() {
    if (!state) return;

    const turn0Active = state.currentTurn === 0 && !state.gameOver;
    const turn1Active = state.currentTurn === 1 && !state.gameOver;

    // Scores
    document.getElementById('score-player').textContent = state.scores[0];
    document.getElementById('score-bot').textContent    = state.scores[1];

    // P1 name
    const nameEl = document.getElementById('display-player-name');
    if (nameEl) nameEl.textContent = state.playerName;

    // P2 label (bot name or player 2 name)
    const p2El = document.getElementById('display-player2-name');
    if (p2El) p2El.textContent = state.twoPlayer ? state.player2Name : 'Bot';

    // Turn dots
    document.getElementById('dot-player').classList.toggle('lit', turn0Active);
    document.getElementById('dot-bot').classList.toggle('lit', turn1Active);

    // Score card highlight
    document.getElementById('card-player').classList.toggle('active-turn', turn0Active);
    document.getElementById('card-bot').classList.toggle('active-turn', turn1Active);

    // Header badge — only update when NOT in bot-thinking mode
    const inBotThink = !state.twoPlayer && turn1Active;
    if (!inBotThink) {
      const badge = document.getElementById('header-turn-badge');
      const label = document.getElementById('turn-label');
      const icon  = document.getElementById('header-turn-icon');
      const sub   = document.getElementById('turn-sublabel');

      if (sub) sub.classList.add('hidden');

      if (state.gameOver) {
        if (badge) badge.dataset.state = 'over';
        if (label) label.textContent   = 'GAME OVER';
        if (icon)  icon.textContent    = 'flag';
      } else if (turn0Active) {
        if (badge) badge.dataset.state = 'player';
        if (icon)  icon.textContent    = 'person';
        if (label) label.textContent   = state.twoPlayer
          ? (state.playerName.toUpperCase() + "'S TURN")
          : 'YOUR TURN';
      } else if (turn1Active && state.twoPlayer) {
        // 2P: P2's turn
        if (badge) badge.dataset.state = 'bot';  // reuse orange colour
        if (icon)  icon.textContent    = 'person';
        if (label) label.textContent   = state.player2Name.toUpperCase() + "'S TURN";
      }
    }
  }

  function _pulseScore(player) {
    const id = player === 0 ? 'score-player' : 'score-bot';
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('score-pulse');
    void el.offsetWidth;
    el.classList.add('score-pulse');
    el.addEventListener('animationend', () => el.classList.remove('score-pulse'), { once: true });
  }

  /* -- Persistence -------------------------------------------- */

  function _createState(cfg) {
    return {
      gridSize:       cfg.gridSize      || 5,
      playerName:     cfg.playerName    || 'Player 1',
      playerInitial:  (cfg.playerName   || 'P')[0].toUpperCase(),
      twoPlayer:      cfg.twoPlayer     || false,
      player2Name:    cfg.player2Name   || (cfg.twoPlayer ? 'Player 2' : 'Bot'),
      player2Initial: (cfg.player2Name  || 'P')[0].toUpperCase(),
      botDifficulty:  cfg.botDifficulty || 'smart',
      lines:          new Set(),
      lineOwners:     new Map(),
      boxes:          new Map(),
      scores:         [0, 0],
      currentTurn:    0,
      gameOver:       false,
    };
  }

  function _saveState() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        ...state,
        lines:      [...state.lines],
        lineOwners: [...state.lineOwners.entries()],
        boxes:      [...state.boxes.entries()],
      }));
    } catch { /* storage full */ }
  }

  function _loadState() {
    try {
      const d = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!d) return null;
      return {
        ...d,
        lines:      new Set(d.lines),
        lineOwners: new Map(d.lineOwners),
        boxes:      new Map(d.boxes.map(([k, v]) => [k, +v])),
        scores:     d.scores.map(Number),
      };
    } catch { return null; }
  }

  return { start, resume, handlePlayerMove, hasSave, clearSave, getState };
})();
