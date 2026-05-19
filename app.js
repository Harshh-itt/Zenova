// ── app.js ── Main orchestration

// ── Utility ──────────────────────────────────────────────────
function el(id) { return document.getElementById(id); }

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Clock & Greeting ─────────────────────────────────────────
function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2,'0');
  const m    = String(now.getMinutes()).padStart(2,'0');
  el('liveClock').textContent = `${h}:${m}`;

  const hour = now.getHours();
  let greeting = 'Good Evening';
  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 17) greeting = 'Good Afternoon';
  el('greetingText').textContent = greeting;
}

// ── Panel Switching ───────────────────────────────────────────
function switchPanel(btn, name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el(`panel-${name}`).classList.add('active');
  if (btn) btn.classList.add('active');

  if (name === 'analytics') initAllAnalytics();
  if (name === 'dashboard')  { initWeeklyChart(); refreshDashboard(); }
}

// ── Sidebar Toggle ─────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ── Dashboard Refresh ─────────────────────────────────────────
function refreshDashboard() {
  const stats  = Storage.getTodayStats();
  const streak = Storage.getStreak();

  // Focus time
  const fm = stats.focusMinutes || 0;
  el('statFocusTime').textContent = fm >= 60 ? `${Math.floor(fm/60)}h ${fm%60}m` : `${fm}m`;
  el('fillFocusTime').style.width = Math.min(fm / 3, 100) + '%'; // 3h = 100%

  // Tasks
  const tasks = Storage.getTasks();
  const done  = tasks.filter(t => t.done).length;
  el('statTasksDone').textContent = done;
  el('fillTasks').style.width = Math.min(done * 10, 100) + '%';

  // Sessions
  const s = stats.sessions || 0;
  el('statSessions').textContent = s;
  el('fillSessions').style.width = Math.min(s * 25, 100) + '%';

  // Streak
  el('statStreak').textContent = streak.count;
  el('sideStreak').textContent = streak.count;
  el('fillStreak').style.width = Math.min(streak.count * 10, 100) + '%';

  recalcFocusScore();
  renderMiniTasks();
  initWeeklyChart();
}

// ── Focus Score ───────────────────────────────────────────────
function recalcFocusScore() {
  const stats  = Storage.getTodayStats();
  const tasks  = Storage.getTasks();
  const streak = Storage.getStreak();

  const focusPts  = Math.min(stats.focusMinutes / 1.5, 40);  // max 40
  const sessionPts= Math.min(stats.sessions * 5, 30);         // max 30
  const taskPts   = Math.min(tasks.filter(t=>t.done).length * 5, 20); // max 20
  const streakPts = Math.min(streak.count * 2, 10);           // max 10

  const score = Math.round(focusPts + sessionPts + taskPts + streakPts);

  el('topFocusScore').textContent = score;
  el('scoreDisplay').textContent  = score;

  // Animate ring
  const circumference = 2 * Math.PI * 58; // r=58
  const offset = circumference - (score / 100) * circumference;
  el('scoreRingFill').style.strokeDashoffset = offset;

  // Level label
  const levels = [[90,'Flow State 🚀'],[70,'In the Zone ⚡'],[50,'Building Momentum 💪'],[25,'Warming Up 🌅'],[0,'Just Starting 🌱']];
  const lv = levels.find(([min]) => score >= min);
  el('scoreLevelLabel').textContent = lv ? lv[1] : 'Just Starting 🌱';
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 30000);

  timerInit();
  tasksInit();
  refreshDashboard();
  renderSessionLog();
  renderDots();
  initWeeklyChart();

  // Keyboard shortcut: Space to toggle timer
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      timerToggle();
    }
  });

  // Enter key for task inputs
  el('taskInputMain')?.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
});
