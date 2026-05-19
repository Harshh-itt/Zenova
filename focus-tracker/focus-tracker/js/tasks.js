// ── tasks.js ── Task Management

let currentFilter = 'all';

function tasksInit() {
  renderAllTasks();
  renderMiniTasks();
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
