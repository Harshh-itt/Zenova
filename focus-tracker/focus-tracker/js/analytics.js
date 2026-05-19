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
  const ctx  = el('weeklyChart').getContext('2d');
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
  const ctx  = el('anaWeekChart').getContext('2d');
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
  const ctx   = el('sessionChart').getContext('2d');
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
  const ctx  = el('taskChart').getContext('2d');
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
