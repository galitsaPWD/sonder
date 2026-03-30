// --- Task List Functionality ---
let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
const newTaskInput = document.getElementById('new-task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const completedCount = document.getElementById('completed-count');

function addTask(text) {
  if (!text.trim()) return;
  const task = {
    id: Date.now(),
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString()
  };
  tasks.unshift(task);
  saveTasks();
  renderTasks();
  
  // Track task creation for stats
  if (typeof trackTaskCompletion === 'function') {
    trackTaskCompletion(text.trim(), false);
  }
}
function toggleTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    
    // Track task completion for stats
    if (typeof trackTaskCompletion === 'function') {
      trackTaskCompletion(task.text, task.completed);
    }
  }
}
function deleteTask(taskId) {
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  if (taskIndex !== -1) {
    tasks.splice(taskIndex, 1);
    saveTasks();
    renderTasks();
  }
}
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Auto-save tasks periodically
setInterval(() => {
  saveTasks();
}, 30000); // Save every 30 seconds

// Save tasks when window is about to close
window.addEventListener('beforeunload', () => {
  saveTasks();
});

// Save tasks when page becomes hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveTasks();
  }
});

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach(task => {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
    const checkbox = document.createElement('div');
    checkbox.className = `task-checkbox ${task.completed ? 'checked' : ''}`;
    checkbox.onclick = () => toggleTask(task.id);
    const taskText = document.createElement('div');
    taskText.className = 'task-text';
    taskText.textContent = task.text;
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-delete';
    deleteBtn.innerHTML = '✖';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteTask(task.id);
    };
    taskItem.appendChild(checkbox);
    taskItem.appendChild(taskText);
    taskItem.appendChild(deleteBtn);
    taskList.appendChild(taskItem);
  });
  updateTaskStats();
}
function updateTaskStats() {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  taskCount.textContent = `${totalTasks} task${totalTasks !== 1 ? 's' : ''}`;
  completedCount.textContent = `${completedTasks} completed`;
  const clearCompletedBtn = document.getElementById('clear-completed-btn');
  if (clearCompletedBtn) {
    clearCompletedBtn.disabled = completedTasks === 0;
  }
}
function clearCompletedTasks() {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
}
addTaskBtn.addEventListener('click', () => {
  const text = newTaskInput.value.trim();
  if (text) {
    addTask(text);
    newTaskInput.value = '';
  }
});
newTaskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const text = newTaskInput.value.trim();
    if (text) {
      addTask(text);
      newTaskInput.value = '';
    }
  }
});
document.getElementById('clear-completed-btn').addEventListener('click', clearCompletedTasks);
renderTasks();
