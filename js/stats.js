// --- Stats Dashboard ---
let statsData = {
  pomodoros: [],
  tasks: [],
  moods: [],
  activities: []
};
function initStatsDashboard() {
  loadStatsData();
  syncExistingData();
  updateStatsDisplay();
  updateActivityLog();
  setupExportButton();
  
  // Auto-save data periodically
  setInterval(() => {
    saveStatsData();
  }, 30000); // Save every 30 seconds
  
  // Save data when window is about to close
  window.addEventListener('beforeunload', () => {
    saveStatsData();
  });
  
  // Save data when page becomes hidden (user switches tabs or minimizes)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      saveStatsData();
    }
  });
}
function loadStatsData() {
  const savedStats = localStorage.getItem('moodbyte_stats');
  if (savedStats) {
    try {
      const parsed = JSON.parse(savedStats);
      statsData = {
        pomodoros: Array.isArray(parsed.pomodoros) ? parsed.pomodoros : [],
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        moods: Array.isArray(parsed.moods) ? parsed.moods : [],
        activities: Array.isArray(parsed.activities) ? parsed.activities : []
      };
    } catch (e) {
      statsData = { pomodoros: [], tasks: [], moods: [], activities: [] };
    }
  } else {
    statsData = { pomodoros: [], tasks: [], moods: [], activities: [] };
  }
}
function saveStatsData() {
  localStorage.setItem('moodbyte_stats', JSON.stringify(statsData));
}
function addActivity(type, description) {
  const now = new Date();
  const activity = {
    type,
    description,
    timestamp: now.toISOString()
  };
  if (!Array.isArray(statsData.activities)) statsData.activities = [];
  statsData.activities.unshift(activity);
  if (statsData.activities.length > 20) {
    statsData.activities = statsData.activities.slice(0, 20);
  }
  saveStatsData();
  updateActivityLog();
}
function updateActivityLog() {
  const activityList = document.getElementById('recent-activity');
  if (!Array.isArray(statsData.activities) || statsData.activities.length === 0) {
    activityList.innerHTML = `<div class="activity-item"><div class="activity-icon"><i class="fas fa-chart-bar"></i></div><div class="activity-text">No recent activity</div><div class="activity-time">-</div></div>`;
    return;
  }
  activityList.innerHTML = statsData.activities.slice(0, 5).map(activity => {
    const icons = { 
      'pomodoro': 'fas fa-clock', 
      'task': 'fas fa-check-circle', 
      'mood': 'fas fa-smile', 
      'note': 'fas fa-sticky-note' 
    };
    const time = new Date(activity.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `<div class="activity-item"><div class="activity-icon"><i class="${icons[activity.type] || 'fas fa-chart-bar'}"></i></div><div class="activity-text">${activity.description}</div><div class="activity-time">${time}</div></div>`;
  }).join('');
}
function getThemeEmoji(type) {
  const theme = (localStorage.getItem('theme') || 'night');
  const themeEmojis = {
    chill: { pomodoro: '🌿', task: '📝', mood: '😊' },
    rainy: { pomodoro: '🌧️', task: '☔', mood: '😕' },
    night: { pomodoro: '🦉', task: '🌙', mood: '😴' },
    productive: { pomodoro: '💡', task: '✅', mood: '😎' }
  };
  return (themeEmojis[theme] && themeEmojis[theme][type]) || '🌙';
}
function updateStatsDisplay() {
  if (!statsData || !statsData.pomodoros || !statsData.tasks || !statsData.moods) return;
  
  // Update stat card icons
  const statIcons = document.querySelectorAll('.stat-icon');
  if (statIcons.length >= 3) {
    statIcons[0].textContent = getThemeEmoji('pomodoro');
    statIcons[1].textContent = getThemeEmoji('task');
    statIcons[2].textContent = getThemeEmoji('mood');
  }
  
  // Update stat values
  const totalPomodorosEl = document.getElementById('total-pomodoros');
  const tasksCompletedEl = document.getElementById('tasks-completed');
  if (totalPomodorosEl) totalPomodorosEl.textContent = statsData.pomodoros.length;
  if (tasksCompletedEl) tasksCompletedEl.textContent = statsData.tasks.filter(t => t.completed).length;
  
  // Avg mood emoji (theme-appropriate)
  if (statsData.moods.length > 0) {
    const moodScores = { 'great': 5, 'good': 4, 'okay': 3, 'meh': 2, 'bad': 1, 'angry': 0 };
    const avgScore = statsData.moods.reduce((sum, mood) => sum + moodScores[mood.mood], 0) / statsData.moods.length;
    const avgMood = Math.round(avgScore);
    const avgMoodEl = document.getElementById('avg-mood');
    // Use Font Awesome icon like mood journal
    const moodIcons = {
      5: 'fa-star',
      4: 'fa-smile',
      3: 'fa-meh',
      2: 'fa-frown',
      1: 'fa-sad-tear',
      0: 'fa-angry'
    };
    const moodIcon = moodIcons[avgMood] || 'fa-meh';
    if (avgMoodEl) avgMoodEl.innerHTML = `<i class="fas ${moodIcon}"></i>`;
  }
  
  // Task completion rate
  const totalTasks = statsData.tasks.length;
  const completedTasks = statsData.tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const completionPercentageEl = document.getElementById('completion-percentage');
  const completedTasksEl = document.getElementById('completed-tasks');
  const totalTasksEl = document.getElementById('total-tasks');
  
  if (completionPercentageEl) completionPercentageEl.textContent = completionRate + '%';
  
  // Update completion rate details
  if (completedTasksEl) {
    const rateDetails = completedTasksEl.closest('.rate-details');
    if (rateDetails) {
      rateDetails.innerHTML = `
        <div class="rate-stat">
          <span>${completedTasks}</span> completed
        </div>
        <div class="rate-stat">
          <span>${totalTasks}</span> total
        </div>
      `;
    }
  }
  
  // Update completion circle
  updateCompletionCircle(completionRate);
  
  // Update productivity chart
  updateProductivityChart();
}
function updateCompletionCircle(percentage) {
  const circle = document.querySelector('.rate-circle');
  if (!circle) return;

  const degrees = (percentage / 100) * 360;
  const lightColor = '#a391f0';
  const darkColor = 'rgba(163, 145, 240, 0.10)';
  // Feather the edge by blending for 2 degrees
  const feather = 2;
  circle.style.background = `
    conic-gradient(
      from 0deg,
      ${lightColor} 0deg,
      ${lightColor} ${degrees - feather}deg,
      ${darkColor} ${degrees}deg,
      ${darkColor} 360deg
    ),
    radial-gradient(circle at 60% 40%, rgba(163,145,240,0.12) 60%, transparent 100%)
  `;
}
function updateProductivityChart() {
  const canvas = document.getElementById('productivity-chart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayPomodoros = statsData.pomodoros.filter(p => p.date === dateStr).length;
    last7Days.push({ date: date.toLocaleDateString([], { weekday: 'short' }), pomodoros: dayPomodoros });
  }
  
  const maxPomodoros = Math.max(...last7Days.map(d => d.pomodoros), 1);
  const barWidth = canvas.width / last7Days.length - 10;
  const maxBarHeight = canvas.height - 40;
  
  ctx.fillStyle = '#a391f0';
  ctx.font = '12px Inter';
  ctx.textAlign = 'center';
  
  last7Days.forEach((day, index) => {
    const x = index * (barWidth + 10) + barWidth / 2;
    const barHeight = (day.pomodoros / maxPomodoros) * maxBarHeight;
    const y = canvas.height - 30 - barHeight;
    
    ctx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
    ctx.fillStyle = '#c0b4f8';
    ctx.fillText(day.date, x, canvas.height - 10);
    ctx.fillStyle = '#a391f0';
  });
}
function setupExportButton() {
  document.getElementById('export-stats').addEventListener('click', exportStatsData);
}
function exportStatsData() {
  const exportData = {
    exportDate: new Date().toISOString(),
    stats: statsData,
    summary: {
      totalPomodoros: statsData.pomodoros.length,
      totalTasks: statsData.tasks.length,
      completedTasks: statsData.tasks.filter(t => t.completed).length,
      totalMoods: statsData.moods.length
    }
  };
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `moodbyte-stats-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}

function trackPomodoroCompletion() {
  const now = new Date();
  const pomodoroEntry = {
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),
    mode: currentMode || 'pomodoro'
  };
  if (!Array.isArray(statsData.pomodoros)) statsData.pomodoros = [];
  statsData.pomodoros.unshift(pomodoroEntry);
  if (statsData.pomodoros.length > 100) {
    statsData.pomodoros = statsData.pomodoros.slice(0, 100);
  }
  saveStatsData();
  updateStatsDisplay();
  addActivity('pomodoro', `Completed ${pomodoroEntry.mode} session`);
}

function trackTaskCompletion(taskText, completed) {
  const now = new Date();
  const taskEntry = {
    text: taskText,
    completed: completed,
    timestamp: now.toISOString()
  };
  if (!Array.isArray(statsData.tasks)) statsData.tasks = [];
  statsData.tasks.unshift(taskEntry);
  if (statsData.tasks.length > 100) {
    statsData.tasks = statsData.tasks.slice(0, 100);
  }
  saveStatsData();
  updateStatsDisplay();
  addActivity('task', `${completed ? 'Completed' : 'Added'} task: ${taskText.substring(0, 30)}${taskText.length > 30 ? '...' : ''}`);
}

function trackMoodEntry(mood, reflection) {
  const now = new Date();
  const moodEntry = {
    mood: mood,
    reflection: reflection,
    timestamp: now.toISOString()
  };
  if (!Array.isArray(statsData.moods)) statsData.moods = [];
  statsData.moods.unshift(moodEntry);
  if (statsData.moods.length > 50) {
    statsData.moods = statsData.moods.slice(0, 50);
  }
  saveStatsData();
  updateStatsDisplay();
  addActivity('mood', `Logged ${mood} mood`);
}

function trackNoteCreation() {
  addActivity('note', 'Created a new note');
}

function syncExistingData() {
  // Sync existing pomodoros from localStorage
  const completedPomodoros = parseInt(localStorage.getItem('completedPomodoros') || '0');
  if (completedPomodoros > 0 && statsData.pomodoros.length === 0) {
    // Add placeholder entries for existing pomodoros
    for (let i = 0; i < completedPomodoros; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
      const pomodoroEntry = {
        date: date.toISOString().split('T')[0],
        timestamp: date.toISOString(),
        mode: 'pomodoro'
      };
      statsData.pomodoros.push(pomodoroEntry);
    }
  }
  
  // Sync existing tasks from localStorage
  const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  if (existingTasks.length > 0 && statsData.tasks.length === 0) {
    existingTasks.forEach(task => {
      const taskEntry = {
        text: task.text,
        completed: task.completed,
        timestamp: task.createdAt || new Date().toISOString()
      };
      statsData.tasks.push(taskEntry);
    });
  }
  
  // Sync existing moods from localStorage
  const existingMoods = JSON.parse(localStorage.getItem('moodHistory') || '[]');
  if (existingMoods.length > 0 && statsData.moods.length === 0) {
    existingMoods.forEach(mood => {
      const moodEntry = {
        mood: mood.mood,
        reflection: mood.reflection || '',
        timestamp: mood.timestamp
      };
      statsData.moods.push(moodEntry);
    });
  }
  
  saveStatsData();
}

initStatsDashboard();
