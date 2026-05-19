// ── timer.js ── Pomodoro Timer

const MODES = {
  focus: { label: 'FOCUS SESSION',    minutes: 25, color: '#a855f7' },
  short: { label: 'SHORT BREAK',      minutes: 5,  color: '#06b6d4' },
  long:  { label: 'LONG BREAK',       minutes: 15, color: '#3b82f6' },
};

let timerState = {
  mode:        'focus',
  seconds:     25 * 60,
  totalSecs:   25 * 60,
  running:     false,
  interval:    null,
  sessionNum:  1,       // 1–4 before long break
  doneSessions: 0,
};

// ── Initialise ──────────────────────────────────────────────
function timerInit() {
  renderTimerUI();
}

// ── Mode Switch ──────────────────────────────────────────────
function setMode(mode, btn) {
  timerState.mode      = mode;
  timerState.seconds   = MODES[mode].minutes * 60;
  timerState.totalSecs = MODES[mode].minutes * 60;
  timerState.running   = false;
  clearInterval(timerState.interval);

  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  renderTimerUI();
  updatePlayPause(false);
}

// ── Start / Pause ────────────────────────────────────────────
function timerToggle() {
  if (timerState.running) {
    timerPause();
  } else {
    timerStart();
  }
}

function timerStart() {
  timerState.running = true;
  updatePlayPause(true);
  timerState.interval = setInterval(timerTick, 1000);
}

function timerPause() {
  timerState.running = false;
  clearInterval(timerState.interval);
  updatePlayPause(false);
}

function timerReset() {
  timerPause();
  timerState.seconds   = MODES[timerState.mode].minutes * 60;
  timerState.totalSecs = MODES[timerState.mode].minutes * 60;
  renderTimerUI();
}

function timerTick() {
  if (timerState.seconds <= 0) {
    timerComplete();
    return;
  }
  timerState.seconds--;
  renderTimerUI();
}

// ── Complete ─────────────────────────────────────────────────
function timerComplete() {
  timerPause();
  playBell();

  const isFocus = timerState.mode === 'focus';
  const mins    = MODES[timerState.mode].minutes;

  // Log entry
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  Storage.addLog({
    type:    isFocus ? 'Focus' : 'Break',
    minutes: mins,
    time:    timeStr,
    isBreak: !isFocus,
  });

  if (isFocus) {
    // Update stats
    const stats = Storage.getTodayStats();
    stats.focusMinutes += mins;
    stats.sessions++;
    Storage.saveTodayStats(stats);

    // All-time
    const at = Storage.getAllTime();
    at.totalMinutes  += mins;
    at.totalSessions += 1;
    Storage.saveAllTime(at);

    // Streak
    const streak = Storage.updateStreak();
    at.bestStreak = Math.max(at.bestStreak, streak.count);
    Storage.saveAllTime(at);

    timerState.doneSessions++;
    timerState.sessionNum = (timerState.doneSessions % 4) + 1;

    showToast(`✅ Focus session complete! +${mins} minutes logged.`);
  } else {
    showToast('☕ Break over — back to it!');
  }

  // Auto-switch mode
  if (isFocus) {
    const nextMode = timerState.doneSessions % 4 === 0 ? 'long' : 'short';
    setMode(nextMode, document.getElementById(nextMode === 'long' ? 'modeLong' : 'modeShort'));
  } else {
    setMode('focus', document.getElementById('modeFocus'));
  }

  // Refresh everything
  refreshDashboard();
  renderSessionLog();
  renderDots();
  updateTimerUI();
}

function skipSession() {
  timerComplete();
}

// ── Render Helpers ────────────────────────────────────────────
function renderTimerUI() {
  const { seconds, totalSecs, mode } = timerState;
  const m   = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s   = String(seconds % 60).padStart(2, '0');
  const pct = 1 - seconds / totalSecs;
  const circumBig  = 2 * Math.PI * 130;  // r=130
  const circumMini = 2 * Math.PI * 52;   // r=52

  // Big timer
  el('bigTimerDisplay').textContent = `${m}:${s}`;
  el('bigModeLabel').textContent    = MODES[mode].label;
  const bigOffset = circumBig * (1 - pct);
  el('bigRingProg').style.strokeDashoffset = bigOffset;

  // Mini timer (dashboard)
  el('dbTimerDisplay').textContent = `${m}:${s}`;
  el('dbTimerLabel').textContent   = timerState.running ? 'Running…' : (seconds === totalSecs ? 'Ready' : 'Paused');
  el('dbModeBadge').textContent    = mode.toUpperCase();
  const miniOffset = circumMini - (circumMini * pct);
  el('dbRingProg').style.strokeDashoffset = miniOffset;

  // Dashboard play button icon
  el('dbPlayBtn').textContent = timerState.running ? '⏸' : '▶';
}

function updateTimerUI() {
  // Re-render after mode switch
  renderTimerUI();
  renderDots();
}

function updatePlayPause(running) {
  const playIcon  = el('playIcon');
  const pauseIcon = el('pauseIcon');
  if (playIcon && pauseIcon) {
    playIcon.style.display  = running ? 'none'  : 'block';
    pauseIcon.style.display = running ? 'block' : 'none';
  }
  el('dbPlayBtn').textContent = running ? '⏸' : '▶';
  el('dbTimerLabel').textContent = running ? 'Running…' : 'Paused';
}

function renderDots() {
  for (let i = 0; i < 4; i++) {
    const dot = el(`dot${i}`);
    dot.className = 'dot';
    if (i < timerState.doneSessions % 4) dot.classList.add('done');
    if (i === (timerState.doneSessions % 4) && timerState.mode === 'focus') dot.classList.add('active');
  }
  el('currentSessionNum').textContent = (timerState.doneSessions % 4) + 1;
}

function renderSessionLog() {
  const log     = Storage.getLog();
  const logList = el('sessionLog');
  if (!log.length) { logList.innerHTML = '<div class="empty-state">Complete a session to see it here.</div>'; return; }
  logList.innerHTML = log.map(e => `
    <div class="log-entry ${e.isBreak ? 'break' : ''}">
      <span class="log-type">${e.type} · ${e.minutes}m</span>
      <span class="log-time">${e.time}</span>
    </div>`).join('');
}

function clearLog() {
  Storage.clearLog();
  renderSessionLog();
}

function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
    osc.start(); osc.stop(ctx.currentTime + 1);
  } catch(e) {}
}
