/**
 * audio.js — Grid Masters audio manager
 *
 * Background music: assets/music.mp3  (loops)
 * Line SFX:         assets/sfx.mp3    (plays on every line drawn)
 *
 * Mute/unmute works globally and persists to localStorage.
 *
 * External API (callable from outside the game):
 *   window.GridMasters.toggleMute()  → toggles; returns true if now muted
 *   window.GridMasters.mute()        → mutes
 *   window.GridMasters.unmute()      → unmutes
 *   window.GridMasters.isMuted()     → returns current mute state (boolean)
 */
const Audio = (() => {

  const MUTE_KEY = 'gm_muted';

  /* ── Audio elements ─────────────────────────────────── */
  const _music = new window.Audio('assets/music.mp3');
  _music.loop   = true;
  _music.volume = 0.35;

  const _sfx   = new window.Audio('assets/sfx.mp3');
  _sfx.volume  = 0.75;

  /* ── State ─────────────────────────────────────────── */
  let _muted        = localStorage.getItem(MUTE_KEY) === 'true';
  let _musicStarted = false;   // becomes true after first playMusic() call

  /* ── Private: sync everything to _muted flag ──────── */
  function _apply() {
    if (_muted) {
      _music.pause();
    } else if (_musicStarted) {
      _music.play().catch(() => {});
    }
    _updateMuteUI();
    localStorage.setItem(MUTE_KEY, _muted);
  }

  function _updateMuteUI() {
    const icon = document.getElementById('mute-icon');
    if (icon) icon.textContent = _muted ? 'volume_off' : 'volume_up';
  }

  /* ── Public API ─────────────────────────────────────── */

  /** Start background music (call on first user interaction). */
  function playMusic() {
    _musicStarted = true;
    if (!_muted) {
      _music.play().catch(() => {
        // Autoplay blocked — will retry on next user gesture via the
        // document click listener below.
      });
    }
  }

  /** Stop background music (e.g. game ends). */
  function stopMusic() {
    _music.pause();
    _musicStarted = false;
  }

  /** Play the line-draw sound effect. */
  function playLineSfx() {
    if (_muted) return;
    // Clone node to allow rapid overlapping plays on fast moves
    const clone = _sfx.cloneNode();
    clone.volume = _sfx.volume;
    clone.play().catch(() => {});
  }

  /** Toggle mute. Returns new muted state (true = muted). */
  function toggleMute() {
    _muted = !_muted;
    _apply();
    return _muted;
  }

  function mute()   { _muted = true;  _apply(); }
  function unmute() { _muted = false; _apply(); }
  function isMuted(){ return _muted; }

  /* ── Initialise UI to saved state ──────────────────── */
  document.addEventListener('DOMContentLoaded', _updateMuteUI);

  /* ── Retry music on any user interaction if blocked ── */
  document.addEventListener('click', () => {
    if (_musicStarted && !_muted && _music.paused) {
      _music.play().catch(() => {});
    }
  }, { passive: true });

  /* ── window.GridMasters external API ────────────────── */
  window.GridMasters = {
    toggleMute: () => toggleMute(),
    mute:       () => mute(),
    unmute:     () => unmute(),
    isMuted:    () => isMuted(),
  };

  return { playMusic, stopMusic, playLineSfx, toggleMute, mute, unmute, isMuted };
})();
