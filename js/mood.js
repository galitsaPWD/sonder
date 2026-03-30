// --- Mood Journal ---
const MOODS = {
  great: { icon: 'fas fa-star', theme: 'productive', message: 'You\'re crushing it!' },
  good: { icon: 'fas fa-smile', theme: 'chill', message: 'Keep the good vibes going!' },
  okay: { icon: 'fas fa-meh', theme: 'chill', message: 'Steady as we go.' },
  meh: { icon: 'fas fa-frown', theme: 'rainy', message: 'Take it easy today.' },
  bad: { icon: 'fas fa-sad-tear', theme: 'night', message: 'Remember to be kind to yourself.' },
  angry: { icon: 'fas fa-angry', theme: 'night', message: 'Take a deep breath and step back.' }
};

let selectedMood = null;
let moodHistory = JSON.parse(localStorage.getItem('moodHistory') || '[]');

const moodBtns = document.querySelectorAll('.mood-btn');
const moodReflection = document.getElementById('mood-reflection');
const saveMoodBtn = document.getElementById('save-mood');
const moodEntries = document.getElementById('mood-entries');

function selectMood(mood) {
  moodBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.mood === mood);
  });
  selectedMood = mood;
  if (MOODS[mood].theme !== localStorage.getItem('theme')) {
    // Optionally show a snackbar to suggest theme switch
  }
}

function saveMoodEntry() {
  if (!selectedMood) {
    showNotification('Mood Selection Required', { 
      body: 'Please select a mood before saving your entry.',
      tag: 'mood-required'
    });
    return;
  }
  const moodName = selectedMood;
  const reflectionText = moodReflection.value.trim();
  const entry = {
    mood: selectedMood,
    reflection: reflectionText,
    timestamp: new Date().toISOString()
  };
  moodHistory.unshift(entry);
  if (moodHistory.length > 20) moodHistory.pop();
  localStorage.setItem('moodHistory', JSON.stringify(moodHistory));
  renderMoodEntries();
  moodReflection.value = '';
  moodBtns.forEach(btn => btn.classList.remove('selected'));
  
  // Track mood entry for stats
  if (typeof trackMoodEntry === 'function') {
    trackMoodEntry(moodName, reflectionText);
  }
  
  selectedMood = null;
  
  // Show success notification
  showNotification('Mood Saved! 🌟', { 
    body: `Your ${moodName} mood has been recorded.`,
    tag: 'mood-saved'
  });
}

function renderMoodEntries() {
  moodEntries.innerHTML = '';
  if (moodHistory.length === 0) {
    moodEntries.innerHTML = `
      <div class="mood-entry-empty">
        <div class="mood-empty-icon">😊</div>
        <div class="mood-empty-text">No moods recorded yet</div>
        <div class="mood-empty-subtext">Start tracking your daily mood to see your history here</div>
      </div>
    `;
    return;
  }

  // Show the most recent 5 mood entries as simple cards
  const recentMoods = moodHistory.slice(0, 5);
  
  recentMoods.forEach(entry => {
    if (!entry || !entry.mood) return; // Skip invalid entries
    
    const moodCard = document.createElement('div');
    moodCard.className = 'mood-card';
    
    const timestamp = new Date(entry.timestamp);
    const timeAgo = getTimeAgo(timestamp);
    const reflection = entry.reflection ? entry.reflection.trim() : '';
    const moodName = entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1);
    const moodIcon = MOODS[entry.mood] ? MOODS[entry.mood].icon : 'fas fa-smile';
    
    moodCard.innerHTML = `
      <div class="mood-header-row">
        <span class="mood-emoji"><i class="${moodIcon}"></i></span>
        <span class="mood-name">${moodName}</span>
        <span class="mood-time">${timeAgo}</span>
      </div>
      ${reflection ? `<div class="mood-reflection">${reflection}</div>` : ''}
    `;
    
    moodEntries.appendChild(moodCard);
  });
}

function formatReflectionText(text) {
  // Clean up the text
  let cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Limit to reasonable length (about 200 characters for larger cards)
  if (cleaned.length > 200) {
    cleaned = cleaned.substring(0, 200) + '...';
  }
  
  // Add quotes if not already present
  if (!cleaned.startsWith('"') && !cleaned.startsWith('"')) {
    cleaned = '"' + cleaned;
  }
  if (!cleaned.endsWith('"') && !cleaned.endsWith('"')) {
    cleaned = cleaned + '"';
  }
  
  return cleaned;
}

function getTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;
  
  // For very old entries, show short format like "Jan 15" or just "3mo"
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths}mo`;
  return `${Math.floor(diffInMonths / 12)}y`;
}

function getMoodEmoji(mood) {
  const emojiMap = {
    great: '⭐',
    good: '😊',
    okay: '😐',
    meh: '😕',
    bad: '😢',
    angry: '😠'
  };
  return emojiMap[mood] || '😊';
}

moodBtns.forEach(btn => {
  btn.addEventListener('click', () => selectMood(btn.dataset.mood));
});
saveMoodBtn.addEventListener('click', saveMoodEntry);

renderMoodEntries();
