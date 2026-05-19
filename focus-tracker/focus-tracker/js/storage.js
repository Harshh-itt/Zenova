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
