// --- Notification Permission Global ---
let notificationPermission = false;

function initNotifications() {
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      notificationPermission = true;
    }
  }
  updateNotificationButtonState();
}

function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        notificationPermission = true;
      } else {
        notificationPermission = false;
      }
      updateNotificationButtonState();
    });
  }
}

function showNotification(title, options = {}) {
  // Play complete.wav sound effect for all notifications
  const sfxComplete = document.getElementById('sfx-add-note');
  if (sfxComplete) {
    sfxComplete.currentTime = 0;
    sfxComplete.volume = 0.7;
    sfxComplete.play().catch(e => {});
  }
  const container = document.getElementById('notification-container');
  if (!container) return;
  const notificationId = `notif-${Date.now()}`;
  const notification = document.createElement('div');
  notification.className = 'in-app-notification';
  notification.id = notificationId;
  const body = options.body || '';
  notification.innerHTML = `
    <div class="in-app-notification-content">
      <h4>${title}</h4>
      <p>${body}</p>
    </div>
    <button class="in-app-notification-close">&times;</button>
  `;
  container.prepend(notification);
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  const close = () => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 500);
  };
  const autoCloseTimeout = setTimeout(close, 5000);
  notification.querySelector('.in-app-notification-close').addEventListener('click', () => {
    clearTimeout(autoCloseTimeout);
    close();
  });
}

function showTimerCompleteNotification() {
  const mode = currentMode;
  let title, body;
  switch (mode) {
    case 'pomodoro':
      title = '🍅 Pomodoro Complete!';
      body = 'Great work! Time for a break. Take 5 minutes to recharge.';
      break;
    case 'short-break':
      title = '☕ Break Complete!';
      body = 'Break time is over. Ready to focus again?';
      break;
    case 'long-break':
      title = '🌴 Long Break Complete!';
      body = 'You\'ve earned this rest! Time to get back to work.';
      break;
    default:
      title = '⏰ Timer Complete!';
      body = 'Your timer has finished.';
  }
  showNotification(title, { body: body, requireInteraction: true, tag: 'timer-complete' });
}

function showTaskReminderNotification() {
  const incompleteTasks = tasks.filter(task => !task.completed);
  if (incompleteTasks.length > 0) {
    const title = '📋 Task Reminder';
    const body = `You have ${incompleteTasks.length} incomplete task${incompleteTasks.length > 1 ? 's' : ''}. Keep up the good work!`;
    showNotification(title, { body: body, tag: 'task-reminder' });
  }
}

function showMoodReminderNotification() {
  const today = new Date().toDateString();
  const todayMoods = moodHistory.filter(entry => new Date(entry.timestamp).toDateString() === today);
  if (todayMoods.length === 0) {
    const title = '😊 Mood Check-in';
    const body = 'How are you feeling today? Take a moment to reflect on your mood.';
    showNotification(title, { body: body, tag: 'mood-reminder' });
  }
}

function showAchievementNotification(achievement) {
  const achievements = {
    'first-pomodoro': {
      title: '🎉 First Pomodoro!',
      body: 'Congratulations! You\'ve completed your first Pomodoro session.'
    },
    'pomodoro-streak': {
      title: '🔥 Pomodoro Streak!',
      body: 'You\'re on fire! 5 Pomodoros in a row!'
    },
    'task-master': {
      title: '✅ Task Master!',
      body: 'You\'ve completed 10 tasks! Keep up the momentum!'
    },
    'mood-tracker': {
      title: '😊 Mood Tracker!',
      body: 'You\'ve logged your mood for 7 days in a row!'
    }
  };
  const achievementData = achievements[achievement];
  if (achievementData) {
    showNotification(achievementData.title, { body: achievementData.body, requireInteraction: true, tag: `achievement-${achievement}` });
  }
}

function setupNotificationButton() {
  const notificationBtn = document.getElementById('notification-toggle');
  if (!notificationBtn) return;
  updateNotificationButtonState();
  notificationBtn.addEventListener('click', function() {
    if (notificationPermission) {
      showNotification('🔔 Test Notification', { body: 'Notifications are working perfectly!', tag: 'test' });
    } else {
      requestNotificationPermission();
    }
  });
}

function updateNotificationButtonState() {
  const btn = document.getElementById('notification-toggle');
  if (!btn) return;
  if (notificationPermission) {
    btn.classList.add('enabled');
    btn.title = 'Notifications enabled (click to test)';
  } else {
    btn.classList.remove('enabled');
    btn.title = 'Enable notifications';
  }
}

function scheduleReminders() {
  setInterval(() => {
    if (notificationPermission) {
      showTaskReminderNotification();
    }
  }, 30 * 60 * 1000);
  const now = new Date();
  const sixPM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
  if (now > sixPM) sixPM.setDate(sixPM.getDate() + 1);
  const timeUntilSixPM = sixPM.getTime() - now.getTime();
  setTimeout(() => {
    if (notificationPermission) {
      showMoodReminderNotification();
    }
    setInterval(() => {
      if (notificationPermission) {
        showMoodReminderNotification();
      }
    }, 24 * 60 * 60 * 1000);
  }, timeUntilSixPM);
}

function checkPomodoroAchievements() {
  const completedPomodoros = parseInt(localStorage.getItem('completedPomodoros') || '0');
  const pomodoroStreak = parseInt(localStorage.getItem('pomodoroStreak') || '0');
  
  // First pomodoro achievement
  if (completedPomodoros === 1) {
    showAchievementNotification('first-pomodoro');
  }
  
  // Pomodoro streak achievement
  if (pomodoroStreak >= 5) {
    showAchievementNotification('pomodoro-streak');
  }
}

initNotifications();
setupNotificationButton();
scheduleReminders();
