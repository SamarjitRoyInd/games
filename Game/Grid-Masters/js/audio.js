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
  let _pageActive   = true;
  const _activeSfx  = new Set();

  /* ── Private: sync everything to _muted flag ──────── */
  function _apply() {
    _syncPlayback();
    _updateMuteUI();
    localStorage.setItem(MUTE_KEY, _muted);
  }

  function _canPlayAudio() {
    return !_muted && _pageActive;
  }

  function _syncPlayback() {
    if (_canPlayAudio() && _musicStarted) {
      _music.play().catch(() => {});
      return;
    }
    _music.pause();
    _pauseLineSfx();
  }

  function _pauseLineSfx() {
    _activeSfx.forEach((node) => {
      node.pause();
      node.currentTime = 0;
    });
    _activeSfx.clear();
  }

  function _setPageActive(active) {
    if (_pageActive === active) return;
    _pageActive = active;
    _syncPlayback();
  }

  function _refreshPageActive() {
    _setPageActive(!document.hidden);
  }

  function _updateMuteUI() {
    const icon = document.getElementById('mute-icon');
    if (icon) icon.textContent = _muted ? 'volume_off' : 'volume_up';
  }

  /* ── Public API ─────────────────────────────────────── */

  /** Start background music (call on first user interaction). */
  function playMusic() {
    _musicStarted = true;
    _syncPlayback();
  }

  /** Stop background music (e.g. game ends). */
  function stopMusic() {
    _music.pause();
    _musicStarted = false;
  }

  /** Play the line-draw sound effect. */
  function playLineSfx() {
    if (!_canPlayAudio()) return;
    // Clone node to allow rapid overlapping plays on fast moves
    const clone = _sfx.cloneNode();
    clone.volume = _sfx.volume;
    _activeSfx.add(clone);
    clone.addEventListener('ended', () => _activeSfx.delete(clone), { once: true });
    clone.addEventListener('error', () => _activeSfx.delete(clone), { once: true });
    clone.play().catch(() => _activeSfx.delete(clone));
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
  document.addEventListener('DOMContentLoaded', () => {
    _updateMuteUI();
    _refreshPageActive();
  });

  /* ── Retry music on any user interaction if blocked ── */
  document.addEventListener('click', () => {
    if (_musicStarted && _canPlayAudio() && _music.paused) {
      _music.play().catch(() => {});
    }
  }, { passive: true });

  /* ── Stop audio whenever the game is not foregrounded ─ */
  document.addEventListener('visibilitychange', () => {
    _setPageActive(!document.hidden);
  });
  window.addEventListener('focus', _refreshPageActive);
  window.addEventListener('blur', () => _setPageActive(false));
  window.addEventListener('pagehide', () => _setPageActive(false));
  window.addEventListener('pageshow', _refreshPageActive);
  document.addEventListener('freeze', () => _setPageActive(false));
  document.addEventListener('resume', _refreshPageActive);

  /* ── window.GridMasters external API ────────────────── */
  window.GridMasters = {
    toggleMute: () => toggleMute(),
    mute:       () => mute(),
    unmute:     () => unmute(),
    isMuted:    () => isMuted(),
  };

  return { playMusic, stopMusic, playLineSfx, toggleMute, mute, unmute, isMuted };
})();
