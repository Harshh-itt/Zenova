import Chart from 'chart.js/auto';

// ── storage.js ── All localStorage read/write helpers

const KEYS = {
  tasks:     'ff_tasks',
  stats:     'ff_stats',
  sessions:  'ff_sessions',
  streak:    'ff_streak',
  log:       'ff_log',
  allTime:   'ff_alltime',
};

const Storage = {
  // Tasks
  getTasks() {
    return JSON.parse(localStorage.getItem(KEYS.tasks) || '[]');
  },
  saveTasks(tasks) {
    localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
  },

  // Daily Stats { date, focusMinutes, sessions, tasksCompleted }
  getTodayStats() {
    const today = new Date().toISOString().slice(0, 10);
    const all   = JSON.parse(localStorage.getItem(KEYS.stats) || '{}');
    return all[today] || { date: today, focusMinutes: 0, sessions: 0, tasksCompleted: 0 };
  },
  saveTodayStats(stats) {
    const today = new Date().toISOString().slice(0, 10);
    const all   = JSON.parse(localStorage.getItem(KEYS.stats) || '{}');
    all[today]  = { ...stats, date: today };
    localStorage.setItem(KEYS.stats, JSON.stringify(all));
  },
  getWeekStats() {
    const all  = JSON.parse(localStorage.getItem(KEYS.stats) || '{}');
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d   = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(all[key] || { date: key, focusMinutes: 0, sessions: 0, tasksCompleted: 0 });
    }
    return days;
  },
  getAllStats() {
    return JSON.parse(localStorage.getItem(KEYS.stats) || '{}');
  },

  // Streak
  getStreak() {
    return JSON.parse(localStorage.getItem(KEYS.streak) || '{"count":0,"lastDate":""}');
  },
  updateStreak() {
    const today  = new Date().toISOString().slice(0, 10);
    const streak = this.getStreak();
    if (streak.lastDate === today) return streak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yd = yesterday.toISOString().slice(0, 10);
    if (streak.lastDate === yd) {
      streak.count++;
    } else if (streak.lastDate !== today) {
      streak.count = 1;
    }
    streak.lastDate = today;
    localStorage.setItem(KEYS.streak, JSON.stringify(streak));
    return streak;
  },

  // Session log
  getLog() {
    return JSON.parse(localStorage.getItem(KEYS.log) || '[]');
  },
  addLog(entry) {
    const log = this.getLog();
    log.unshift(entry);
    if (log.length > 50) log.pop();
    localStorage.setItem(KEYS.log, JSON.stringify(log));
  },
  clearLog() {
    localStorage.removeItem(KEYS.log);
  },

  // All-time
  getAllTime() {
    return JSON.parse(localStorage.getItem(KEYS.allTime) || '{"totalMinutes":0,"totalSessions":0,"totalTasks":0,"bestStreak":0}');
  },
  saveAllTime(data) {
    localStorage.setItem(KEYS.allTime, JSON.stringify(data));
  },
};


// ── tasks.js ── Task Management

let currentFilter = 'all';

function tasksInit() {
  renderAllTasks();
  renderMiniTasks();
}

const el = (id) => document.getElementById(id);

function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
}
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');

  el('liveClock').textContent = `${h}:${m}`;

  const hour = now.getHours();
  let greeting = 'Good Evening';

  if (hour < 12) greeting = 'Good Morning';
  else if (hour < 17) greeting = 'Good Afternoon';

  el('greetingText').textContent = greeting;
}

function switchPanel(btn, name) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  el(`panel-${name}`).classList.add('active');

  if (btn) btn.classList.add('active');

  if (name === 'analytics') initAllAnalytics();

  if (name === 'dashboard') {
    initWeeklyChart();
    refreshDashboard();
  }
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function refreshDashboard() {
  const stats = Storage.getTodayStats();
  const streak = Storage.getStreak();

  const fm = stats.focusMinutes || 0;

  el('statFocusTime').textContent =
    fm >= 60
      ? `${Math.floor(fm / 60)}h ${fm % 60}m`
      : `${fm}m`;

  el('fillFocusTime').style.width = Math.min(fm / 3, 100) + '%';

  const tasks = Storage.getTasks();
  const done = tasks.filter(t => t.done).length;

  el('statTasksDone').textContent = done;
  el('fillTasks').style.width = Math.min(done * 10, 100) + '%';

  const s = stats.sessions || 0;

  el('statSessions').textContent = s;
  el('fillSessions').style.width = Math.min(s * 25, 100) + '%';

  el('statStreak').textContent = streak.count;
  el('sideStreak').textContent = streak.count;
  el('fillStreak').style.width = Math.min(streak.count * 10, 100) + '%';

  recalcFocusScore();
  renderMiniTasks();
  initWeeklyChart();
}

function recalcFocusScore() {
  const stats = Storage.getTodayStats();
  const tasks = Storage.getTasks();
  const streak = Storage.getStreak();

  const focusPts = Math.min(stats.focusMinutes / 1.5, 40);
  const sessionPts = Math.min(stats.sessions * 5, 30);
  const taskPts = Math.min(
    tasks.filter(t => t.done).length * 5,
    20
  );
  const streakPts = Math.min(streak.count * 2, 10);

  const score = Math.round(
    focusPts + sessionPts + taskPts + streakPts
  );

  el('topFocusScore').textContent = score;
  el('scoreDisplay').textContent = score;

  const circumference = 2 * Math.PI * 58;
  const offset =
    circumference - (score / 100) * circumference;

  el('scoreRingFill').style.strokeDashoffset = offset;

  const levels = [
    [90, 'Flow State 🚀'],
    [70, 'In the Zone ⚡'],
    [50, 'Building Momentum 💪'],
    [25, 'Warming Up 🌅'],
    [0, 'Just Starting 🌱']
  ];

  const lv = levels.find(([min]) => score >= min);

  el('scoreLevelLabel').textContent =
    lv ? lv[1] : 'Just Starting 🌱';
}
// ── Add ──────────────────────────────────────────────────────
function addTask() {
  const input    = el('taskInputMain');
  const priority = el('taskPriority').value;
  const text     = input.value.trim();
  if (!text) return;

  const task = {
    id:       Date.now(),
    text,
    priority,
    done:     false,
    created:  new Date().toISOString(),
  };

  const tasks = Storage.getTasks();
  tasks.unshift(task);
  Storage.saveTasks(tasks);
  input.value = '';

  renderAllTasks();
  renderMiniTasks();
  updateTaskStats();
}

function quickAddTask() {
  const input = el('quickTaskInput');
  const text  = input.value.trim();
  if (!text) return;

  const task = { id: Date.now(), text, priority: 'med', done: false, created: new Date().toISOString() };
  const tasks = Storage.getTasks();
  tasks.unshift(task);
  Storage.saveTasks(tasks);
  input.value = '';

  renderAllTasks();
  renderMiniTasks();
  updateTaskStats();
  showToast('Task added! 🎯');
}

// ── Toggle Done ───────────────────────────────────────────────
function toggleTask(id) {
  const tasks = Storage.getTasks();
  const task  = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  Storage.saveTasks(tasks);

  // Update today's stats
  const stats = Storage.getTodayStats();
  stats.tasksCompleted = tasks.filter(t => t.done).length;
  Storage.saveTodayStats(stats);

  // All-time
  if (task.done) {
    const at = Storage.getAllTime();
    at.totalTasks = (at.totalTasks || 0) + 1;
    Storage.saveAllTime(at);
  }

  renderAllTasks();
  renderMiniTasks();
  updateTaskStats();
  refreshDashboard();
}

// ── Delete ────────────────────────────────────────────────────
function deleteTask(id) {
  const tasks = Storage.getTasks().filter(t => t.id !== id);
  Storage.saveTasks(tasks);
  renderAllTasks();
  renderMiniTasks();
  updateTaskStats();
}

// ── Filter ────────────────────────────────────────────────────
function filterTasks(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAllTasks();
}

// ── Render Main List ──────────────────────────────────────────
function renderAllTasks() {
  const all   = Storage.getTasks();
  const tasks = all.filter(t => {
    if (currentFilter === 'active') return !t.done;
    if (currentFilter === 'done')   return  t.done;
    return true;
  });

  const list = el('mainTaskList');
  if (!tasks.length) {
    list.innerHTML = '<div class="empty-state">No tasks here yet. Add one above! ✨</div>';
  } else {
    list.innerHTML = tasks.map(t => `
      <div class="task-item ${t.done ? 'done' : ''}" id="task-${t.id}">
        <div class="task-check" onclick="toggleTask(${t.id})"></div>
        <span class="task-item-txt">${escHtml(t.text)}</span>
        <span class="priority-tag ${t.priority}">${priorityLabel(t.priority)}</span>
        <button class="delete-btn" onclick="deleteTask(${t.id})">×</button>
      </div>`).join('');
  }

  // Progress
  const total = all.length;
  const done  = all.filter(t => t.done).length;
  el('taskProgressText').textContent = `${done} / ${total}`;
  el('taskProgressFill').style.width = total ? `${(done/total)*100}%` : '0%';
}

// ── Render Mini List (Dashboard) ─────────────────────────────
function renderMiniTasks() {
  const tasks = Storage.getTasks().slice(0, 5);
  const list  = el('taskMiniList');
  const count = Storage.getTasks().filter(t => !t.done).length;
  el('taskCountBadge').textContent = count;

  if (!tasks.length) {
    list.innerHTML = '<div class="empty-state">No tasks yet. Add some! 👇</div>';
    return;
  }
  list.innerHTML = tasks.map(t => `
    <div class="task-mini-item ${t.done ? 'done' : ''}" onclick="toggleTask(${t.id})">
      <div class="mini-check"></div>
      <span class="task-mini-txt">${escHtml(t.text)}</span>
    </div>`).join('');
}

// ── Stats ─────────────────────────────────────────────────────
function updateTaskStats() {
  const tasks = Storage.getTasks();
  const done  = tasks.filter(t => t.done).length;
  el('statTasksDone').textContent = done;
  const pct = Math.min(done * 10, 100);
  el('fillTasks').style.width = pct + '%';
  recalcFocusScore();
}

// ── Helpers ───────────────────────────────────────────────────
function priorityLabel(p) {
  return p === 'high' ? '🔴 High' : p === 'med' ? '🟡 Med' : '🟢 Low';
}
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


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


// ── analytics.js ── Charts & Analytics

let charts = {};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(15,15,30,0.9)', titleColor: '#f0f0ff', bodyColor: '#9090b0', borderColor: 'rgba(168,85,247,0.3)', borderWidth: 1, padding: 10, cornerRadius: 8 } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#5a5a7a', font: { family: "'DM Sans'" } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false }, ticks: { color: '#5a5a7a', font: { family: "'DM Sans'" } }, beginAtZero: true },
  },
};

function getWeekLabels() {
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return days[d.getDay()];
  });
}

// ── Weekly Chart (Dashboard) ─────────────────────────────────
function initWeeklyChart() {
  const canvas = el('weeklyChart');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const data = Storage.getWeekStats();

  if (charts.weekly) charts.weekly.destroy();
  charts.weekly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: getWeekLabels(),
      datasets: [{
        data: data.map(d => +(d.focusMinutes / 60).toFixed(1)),
        backgroundColor: 'rgba(168,85,247,0.25)',
        borderColor: '#a855f7',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: 'rgba(168,85,247,0.45)',
      }],
    },
    options: { ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins } },
  });
}

// ── Analytics: 7-day line chart ───────────────────────────────
function initAnaWeekChart() {
  const canvas = el('anaWeekChart');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const data = Storage.getWeekStats();

  if (charts.anaWeek) charts.anaWeek.destroy();

  const grad = ctx.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0, 'rgba(168,85,247,0.35)');
  grad.addColorStop(1, 'rgba(168,85,247,0.01)');

  charts.anaWeek = new Chart(ctx, {
    type: 'line',
    data: {
      labels: getWeekLabels(),
      datasets: [
        {
          label: 'Focus',
          data: data.map(d => +(d.focusMinutes / 60).toFixed(2)),
          borderColor: '#a855f7',
          backgroundColor: grad,
          borderWidth: 2.5,
          pointBackgroundColor: '#a855f7',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Target',
          data: Array(7).fill(2),
          borderColor: 'rgba(59,130,246,0.4)',
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          tension: 0,
        },
      ],
    },
    options: { ...CHART_DEFAULTS },
  });
}

// ── Analytics: Session doughnut ───────────────────────────────
function initSessionChart() {
  const canvas = el('sessionChart');
  if (!canvas) return;
  const ctx   = canvas.getContext('2d');
  const stats = Storage.getTodayStats();
  const f = stats.sessions || 0;
  const b = Math.max(f - 1, 0);

  if (charts.session) charts.session.destroy();
  charts.session = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Focus', 'Break'],
      datasets: [{
        data: [f || 1, b || 0],
        backgroundColor: ['rgba(168,85,247,0.8)', 'rgba(6,182,212,0.6)'],
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      cutout: '72%',
      plugins: { legend: { display: true, position: 'bottom', labels: { color: '#9090b0', font: { family: "'DM Sans'" }, boxWidth: 10, padding: 12 } }, tooltip: CHART_DEFAULTS.plugins.tooltip },
    },
  });
}

// ── Analytics: Task completion bar ───────────────────────────
function initTaskChart() {
  const canvas = el('taskChart');
  if (!canvas) return;
  const ctx  = canvas.getContext('2d');
  const data = Storage.getWeekStats();

  if (charts.task) charts.task.destroy();
  charts.task = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: getWeekLabels(),
      datasets: [{
        data: data.map(d => d.tasksCompleted || 0),
        backgroundColor: 'rgba(34,197,94,0.3)',
        borderColor: '#22c55e',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: { ...CHART_DEFAULTS },
  });
}

// ── Consistency grid ─────────────────────────────────────────
function renderConsistencyGrid() {
  const all  = Storage.getAllStats();
  const grid = el('consistencyGrid');
  const cells = [];
  for (let i = 27; i >= 0; i--) {
    const d   = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const s   = all[key];
    const mins = s ? s.focusMinutes : 0;
    let level = 'l0';
    if (mins >= 120) level = 'l4';
    else if (mins >= 60) level = 'l3';
    else if (mins >= 25) level = 'l2';
    else if (mins > 0)  level = 'l1';
    cells.push(`<div class="cg-cell ${level}" title="${key}: ${mins}m"></div>`);
  }
  grid.innerHTML = cells.join('');
}

// ── Peak hours ────────────────────────────────────────────────
function renderPeakHours() {
  const slots  = ['6–9am','9–12','12–3','3–6pm'];
  const values = [0.3, 0.85, 0.5, 0.7]; // demo distribution
  el('peakHours').innerHTML = slots.map((s, i) => `
    <div class="peak-hour-bar">
      <div class="phb-bar-wrap"><div class="phb-fill" style="height:${values[i]*100}%"></div></div>
      <span class="phb-label">${s}</span>
    </div>`).join('');
}

// ── All-time stats ─────────────────────────────────────────────
function renderAllTimeStats() {
  const at     = Storage.getAllTime();
  const streak = Storage.getStreak();
  const rows   = [
    { label: 'Total Focus',   val: `${Math.floor(at.totalMinutes / 60)}h ${at.totalMinutes % 60}m` },
    { label: 'Total Sessions', val: at.totalSessions },
    { label: 'Tasks Completed', val: at.totalTasks || 0 },
    { label: 'Best Streak',   val: `${at.bestStreak || 0} days` },
    { label: 'Current Streak', val: `${streak.count} days` },
  ];
  el('allTimeStats').innerHTML = rows.map(r => `
    <div class="at-row">
      <span class="at-label">${r.label}</span>
      <span class="at-val">${r.val}</span>
    </div>`).join('');
}

function initAllAnalytics() {
  initAnaWeekChart();
  initSessionChart();
  initTaskChart();
  renderConsistencyGrid();
  renderPeakHours();
  renderAllTimeStats();
}



// --- React/Vite initialization bridge ---
function zenovaInit() {

  updateClock();
  window.__zenovaClockInterval = setInterval(updateClock, 30000);

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

}



function setupMusic() {
  const open = document.getElementById('musicOpenBtn');
  const modal = document.getElementById('musicModal');
  const close = document.getElementById('closeMusic');
  const audio = document.getElementById('audioPlayer');
  const play = document.getElementById('playBtn');
  const pause = document.getElementById('pauseBtn');
  if (!open || !modal) return;
  const onOpen = () => modal.classList.add('show');
  const onClose = () => modal.classList.remove('show');
  const onPlay = () => audio?.play();
  const onPause = () => audio?.pause();
  open.addEventListener('click', onOpen);
  close?.addEventListener('click', onClose);
  play?.addEventListener('click', onPlay);
  pause?.addEventListener('click', onPause);
  return () => {
    open.removeEventListener('click', onOpen);
    close?.removeEventListener('click', onClose);
    play?.removeEventListener('click', onPlay);
    pause?.removeEventListener('click', onPause);
  };
}

function exposeGlobals() {
  Object.assign(window, {
    el, showToast, updateClock, switchPanel, toggleSidebar, refreshDashboard,
    recalcFocusScore, timerInit, setMode, timerToggle, timerStart, timerPause,
    timerReset, timerTick, timerComplete, skipSession, renderTimerUI,
    updateTimerUI, updatePlayPause, renderDots, renderSessionLog, clearLog,
    tasksInit, addTask, quickAddTask, toggleTask, deleteTask, filterTasks,
    renderAllTasks, renderMiniTasks, updateTaskStats, priorityLabel,
    initWeeklyChart, initAnaWeekChart, initSessionChart, initTaskChart,
    renderConsistencyGrid, renderPeakHours, renderAllTimeStats, initAllAnalytics,
    Storage
  });
}

export function initZenovaRuntime() {
  exposeGlobals();
  zenovaInit();
  const musicCleanup = setupMusic();
  return () => {
    musicCleanup?.();
    if (window.__zenovaClockInterval) clearInterval(window.__zenovaClockInterval);
  };
}
