/**
 * main.js - Screen routing, setup form, result display, confetti
 */
const Main = (() => {

  const config = {
    gridSize:      5,
    playerName:    'Player 1',
    player2Name:   'Player 2',
    botDifficulty: 'smart',
    twoPlayer:     false,
  };

  let confettiAnim = null;

  /* -- Init -------------------------------------------------- */

  function init() {
    _initConfetti();
    _setupMenu();
    _setupForm();
    _setupGameScreen();
    _setupResultScreen();
    _setupMuteButton();
    _refreshResumeButton();
  }

  /* -- Confetti ---------------------------------------------- */

  function _initConfetti() {
    if (typeof lottie === 'undefined') return;
    try {
      confettiAnim = lottie.loadAnimation({
        container: document.getElementById('confetti-container'),
        renderer:  'svg',
        loop:      false,
        autoplay:  false,
        path:      'assets/confetti.json',
      });
    } catch (e) { confettiAnim = null; }
  }

  function _playConfetti() {
    _playCSSConfetti();
    const overlay = document.getElementById('confetti-overlay');
    if (overlay && confettiAnim) {
      overlay.style.opacity = '1';
      confettiAnim.goToAndPlay(0, true);
      confettiAnim.addEventListener('complete', () => {
        overlay.style.opacity = '0';
      }, { once: true });
    }
  }

  function _playCSSConfetti() {
    const container = document.getElementById('css-confetti');
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = '';

    const COLORS = ['#ff6a00','#75bdd1','#A4DE02','#FFD700','#ff4081','#00e5ff','#ff9800','#8bc34a'];
    for (let i = 0; i < 80; i++) {
      const span     = document.createElement('span');
      const color    = COLORS[Math.floor(Math.random() * COLORS.length)];
      const size     = 7 + Math.random() * 9;
      const isCircle = Math.random() > 0.5;
      span.style.cssText = [
        'left:'          + Math.random() * 100 + 'vw',
        'width:'         + size + 'px',
        'height:'        + size + 'px',
        'background:'    + color,
        'border-radius:' + (isCircle ? '50%' : '2px'),
        'animation:confetti-fall ' + (2.5 + Math.random() * 2) + 's '
          + (Math.random() * 1.2) + 's linear forwards',
      ].join(';');
      container.appendChild(span);
    }
    setTimeout(() => { container.style.display = 'none'; container.innerHTML = ''; }, 5500);
  }

  /* -- Menu screen ------------------------------------------- */

  function _setupMenu() {
    document.getElementById('btn-play').addEventListener('click', () => {
      Audio.playMusic();
      showScreen('screen-setup');
    });
    document.getElementById('btn-resume').addEventListener('click', () => {
      Audio.playMusic();
      showScreen('screen-game');
      Game.resume();
    });
  }

  function _refreshResumeButton() {
    const btn = document.getElementById('btn-resume');
    if (!btn) return;
    Game.hasSave() ? btn.classList.remove('hidden') : btn.classList.add('hidden');
  }

  /* -- Setup form -------------------------------------------- */

  function _setupForm() {
    document.getElementById('btn-back-menu').addEventListener('click', () => {
      showScreen('screen-menu');
      _refreshResumeButton();
    });

    // Player 1 name
    const nameInput = document.getElementById('player-name');
    nameInput.addEventListener('input', () => {
      config.playerName = nameInput.value.trim() || 'Player 1';
    });

    // Player 2 name
    const name2Input = document.getElementById('player2-name');
    name2Input.addEventListener('input', () => {
      config.player2Name = name2Input.value.trim() || 'Player 2';
    });

    // Mode toggle (vs Bot / vs Friend)
    document.querySelectorAll('#mode-toggle .toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#mode-toggle .toggle-btn')
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        config.twoPlayer = btn.dataset.value === 'friend';
        _updateSetupVisibility();
      });
    });

    // Difficulty toggle
    document.querySelectorAll('#difficulty-toggle .toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#difficulty-toggle .toggle-btn')
          .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        config.botDifficulty = btn.dataset.value;
      });
    });

    // Board size stepper
    _setupSizeStepper();

    // Start
    document.getElementById('btn-start').addEventListener('click', () => {
      Game.clearSave();
      showScreen('screen-game');
      Game.start({ ...config });
    });
  }

  function _updateSetupVisibility() {
    const secDifficulty = document.getElementById('section-difficulty');
    const secP2         = document.getElementById('section-player2');
    const label1        = document.getElementById('label-player1');

    if (config.twoPlayer) {
      // vs Friend
      secDifficulty.style.display = 'none';
      secP2.style.removeProperty('display');   // remove the !important none
      secP2.style.display = 'flex';
      if (label1) label1.textContent = 'Player 1 Name';
    } else {
      // vs Bot
      secDifficulty.style.display = '';
      secP2.style.display = 'none';
      if (label1) label1.textContent = 'Your Name';
    }
  }

  function _setupSizeStepper() {
    const decBtn  = document.getElementById('size-dec');
    const incBtn  = document.getElementById('size-inc');
    const display = document.getElementById('size-display');
    const preview = document.getElementById('preview-svg');
    const MIN = 2, MAX = 12;

    function update() {
      display.innerHTML = config.gridSize + ' &times; ' + config.gridSize;
      decBtn.disabled   = config.gridSize <= MIN;
      incBtn.disabled   = config.gridSize >= MAX;
      Board.renderPreview(preview, config.gridSize);
    }

    decBtn.addEventListener('click', () => { if (config.gridSize > MIN) { config.gridSize--; update(); } });
    incBtn.addEventListener('click', () => { if (config.gridSize < MAX) { config.gridSize++; update(); } });
    update();
  }

  /* -- Game screen ------------------------------------------- */

  function _setupGameScreen() {
    document.getElementById('btn-quit').addEventListener('click', () => {
      showScreen('screen-menu');
      _refreshResumeButton();
    });
  }

  /* -- Result screen ----------------------------------------- */

  function _setupResultScreen() {
    document.getElementById('btn-play-again').addEventListener('click', () => {
      Game.clearSave();
      showScreen('screen-game');
      Game.start({ ...config });
    });
    document.getElementById('btn-change-settings').addEventListener('click', () => {
      showScreen('screen-setup');
    });
    document.getElementById('btn-result-menu').addEventListener('click', () => {
      Game.clearSave();
      showScreen('screen-menu');
      _refreshResumeButton();
    });
  }

  /* -- Mute -------------------------------------------------- */

  function _setupMuteButton() {
    const btn = document.getElementById('btn-mute');
    if (btn) btn.addEventListener('click', () => Audio.toggleMute());
  }

  /* -- showResult (called by game.js) ------------------------ */

  function showResult(state) {
    const [ps, bs] = state.scores;
    const p1Won    = ps > bs;
    const p2Won    = bs > ps;

    // Names
    const p1Name = state.playerName;
    const p2Name = state.twoPlayer ? state.player2Name : 'Bot';

    document.getElementById('result-player-name').textContent  = p1Name;
    document.getElementById('result-player2-name').textContent = p2Name;
    document.getElementById('result-player-score').textContent = ps;
    document.getElementById('result-bot-score').textContent    = bs;

    // Card styling
    const p1Card = document.getElementById('result-player-card');
    const p2Card = document.getElementById('result-bot-card');
    const winBadge = document.getElementById('result-winner-badge');
    const botBadge = document.getElementById('result-bot-badge');
    const card     = document.getElementById('result-victory-card');

    p1Card.classList.remove('winner');
    p2Card.classList.remove('winner');
    winBadge.style.display = 'none';
    botBadge.style.display = 'none';
    card.style.boxShadow   = '';

    const emoji = document.getElementById('result-emoji');
    const title = document.getElementById('result-title');
    const sub   = document.getElementById('result-subtitle');

    if (p1Won) {
      emoji.textContent = '🏆';
      title.textContent = 'VICTORY!';
      title.style.color = '#ff6a00';
      if (sub) sub.textContent = p1Name + ' wins the round!';
      p1Card.classList.add('winner');
      winBadge.style.display = 'inline-block';
      card.style.boxShadow   = '0 0 48px rgba(164,222,2,0.30), 0 8px 32px rgba(0,0,0,0.12)';
    } else if (p2Won) {
      emoji.textContent = state.twoPlayer ? '🏆' : '🤖';
      title.textContent = p2Name.toUpperCase() + ' WINS!';
      title.style.color = '#0e6779';
      if (sub) sub.textContent = 'Better luck next round!';
      p2Card.classList.add('winner');
      botBadge.style.display = 'inline-block';
    } else {
      emoji.textContent = '🤝';
      title.textContent = "IT'S A TIE!";
      title.style.color = '#2C3E50';
      if (sub) sub.textContent = 'Evenly matched!';
    }

    // Re-trigger badge animation
    [winBadge, botBadge].forEach(el => {
      el.classList.remove('badge-pop'); void el.offsetWidth; el.classList.add('badge-pop');
    });

    // Card entrance animation
    card.classList.remove('victory-card-in'); void card.offsetWidth; card.classList.add('victory-card-in');

    showScreen('screen-result');

    // Confetti on any win (P1 vs Bot, P1 vs P2, P2 vs P1)
    if (p1Won || p2Won) setTimeout(_playConfetti, 400);
  }

  /* -- Screen switcher --------------------------------------- */

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }

  return { init, showResult, showScreen };
})();

document.addEventListener('DOMContentLoaded', Main.init);
