// --- Shared/Init logic ---
// Shared variables, helpers, and initialization code for MoodByte

// Sound Effects Helper
function playSound(audioElement, volume = 0.7) {
  if (audioElement && audioElement.readyState >= 2) {
    audioElement.currentTime = 0;
    audioElement.volume = volume;
    audioElement.play().catch(error => {
      console.log(`Sound effect not available: ${error.message}`);
    });
  } else {
    console.log('Sound effect not loaded or not available');
  }
}

// Specific function for click sounds with lower volume
function playClickSound(audioElement) {
  playSound(audioElement, 0.3); // Lower volume for click sounds
}

const productiveThemeBtn = document.querySelector('[data-theme="productive"]');

let currentTheme = localStorage.getItem('theme') || 'night';
let ambientAudio = null;
let ambientEnabled = JSON.parse(localStorage.getItem('ambientEnabled') || 'true');

// const NOTE_COLORS = ['#ffc', '#c2f0fc', '#d0f5c7', '#ffd6e0', '#e0e7ff', '#ffdfba'];

const THEME_LABELS = {
  chill: 'Chill',
  rainy: 'Rainy',
  night: 'Night Owl',
  productive: 'Productive',
  lofi: 'Lofi',
  space: ['assets/bg/space-1.gif', 'assets/bg/space-2.gif', 'assets/bg/space-3.gif'],
};
const THEME_ICONS = {
  chill: '🌿',
  rainy: '🌧️',
  night: '🦉',
  productive: '💡'
};
const SVG_ICONS = {
  play: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  pause: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
  volumeHigh: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
  volumeMid: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`,
  volumeLow: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>`,
  volumeMute: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`
};

// Any app-wide initialization logic can go here

// --- Ambient Sound and Keyboard Shortcuts ---
const ambientToggle = document.getElementById('ambient-toggle');
const sfxClick = document.getElementById('sfx-click');

const AMBIENT_SOUNDS = {
  chill: 'assets/ambient/chill.mp3',
  rainy: 'assets/ambient/rainy.mp3',
  night: 'assets/ambient/night.mp3',
  productive: 'assets/ambient/productive.mp3'
};

// Function to check if music is currently playing
function isMusicCurrentlyPlaying() {
  const music = document.getElementById('music');
  return music && !music.paused && music.volume > 0;
}

function playAmbient(theme) {
  console.log('🎵 playAmbient called with theme:', theme);
  console.log('🎵 ambientEnabled:', ambientEnabled);
  console.log('🎵 user-interacted class:', document.body.classList.contains('user-interacted'));
  
  stopAmbient();
  if (!ambientEnabled) {
    console.log('🎵 Ambient disabled, returning');
    return;
  }
  
  const url = AMBIENT_SOUNDS[theme] || AMBIENT_SOUNDS['chill'];
  if (!url) {
    console.log(`No ambient sound available for theme: ${theme}`);
    return;
  }
  
  console.log('🎵 Loading ambient audio from:', url);
  console.log('🎵 Theme being loaded:', theme);
  
  ambientAudio = new Audio(url);
  ambientAudio.loop = true;
  
  // Check if music is playing - if so, mute ambient
  if (isMusicCurrentlyPlaying()) {
    ambientAudio.volume = 0;
    console.log('🎵 Music is playing, ambient muted');
  } else {
    ambientAudio.volume = 0.3;
  }
  
  // Make ambient audio globally accessible
  window.ambientAudio = ambientAudio;
  
  // Handle loading and error states
  ambientAudio.addEventListener('canplaythrough', () => {
    console.log('🎵 Ambient audio can play through for theme:', theme);
    // Always try to play - let browser handle autoplay policy
    console.log('🎵 Attempting to play ambient audio for theme:', theme);
    ambientAudio.play().catch(error => {
      console.log('Ambient sound playback failed for theme:', theme, 'Error:', error.message);
      // If autoplay is blocked, set up user interaction listener
      if (error.name === 'NotAllowedError') {
        console.log('🎵 Autoplay blocked, waiting for user interaction');
        const startOnInteraction = () => {
          console.log('🎵 User interaction detected, starting ambient audio');
          ambientAudio.play().catch(e => console.log('🎵 Still failed to play:', e.message));
          document.removeEventListener('click', startOnInteraction);
        };
        document.addEventListener('click', startOnInteraction, { once: true });
      }
    });
  });
  
  ambientAudio.addEventListener('error', (error) => {
    console.log(`Failed to load ambient sound for ${theme}:`, error);
    console.log('🎵 Error details for theme:', theme, error);
    ambientAudio = null;
    window.ambientAudio = null;
  });
  
  // Add more specific error handling
  ambientAudio.addEventListener('loadstart', () => {
    console.log('🎵 Started loading ambient audio for theme:', theme);
  });
  
  ambientAudio.addEventListener('progress', () => {
    console.log('🎵 Loading progress for theme:', theme);
  });
  
  ambientAudio.addEventListener('suspend', () => {
    console.log('🎵 Loading suspended for theme:', theme);
  });
}

function stopAmbient() {
  if (ambientAudio) {
    ambientAudio.pause();
    ambientAudio.currentTime = 0;
    ambientAudio = null;
    window.ambientAudio = null;
  }
}

// Function to update ambient volume based on music state
function updateAmbientForMusic() {
  if (window.ambientAudio) {
    if (isMusicCurrentlyPlaying()) {
      window.ambientAudio.volume = 0;
      console.log('🎵 Music playing, ambient muted');
    } else {
      window.ambientAudio.volume = 0.3;
      console.log('🎵 Music stopped, ambient restored');
    }
  }
}

// Make the function globally available for music.js to call
window.updateAmbientForMusic = updateAmbientForMusic;

if (ambientToggle) {
  ambientToggle.addEventListener('click', () => {
    document.body.classList.add('user-interacted');
    ambientEnabled = !ambientEnabled;
    localStorage.setItem('ambientEnabled', JSON.stringify(ambientEnabled));
    const ambientIcon = ambientToggle.querySelector('i');
    if (ambientIcon) ambientIcon.className = ambientEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    ambientToggle.classList.toggle('on', ambientEnabled);
    if (ambientEnabled) {
      playAmbient(localStorage.getItem('theme') || 'chill');
    } else {
      stopAmbient();
    }
  });
}

function renderAmbientEffects(theme) {
  if (ambientEnabled) {
    playAmbient(theme);
  } else {
    stopAmbient();
  }
}

// --- Keyboard Shortcuts ---
const keyboardHelpBtn = document.getElementById('keyboard-help-btn');
if (keyboardHelpBtn) {
  keyboardHelpBtn.addEventListener('click', () => {
    playClickSound(sfxClick);
    showKeyboardShortcutsHelp();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.contentEditable === 'true') return;
  let handled = false;
  switch(e.key.toLowerCase()) {
    case 'n':
      const noteInput = document.getElementById('new-note-text');
      if (noteInput) noteInput.focus();
      handled = true;
      break;
    case 'l':
      const taskInput = document.getElementById('new-task-input');
      if (taskInput) taskInput.focus();
      handled = true;
      break;
    case ' ':
      if (document.activeElement === document.body && typeof togglePlay === 'function') {
        togglePlay();
        handled = true;
      }
      break;
    case 'arrowleft':
      if ((e.ctrlKey || e.metaKey) && typeof prevTrack === 'function') {
        prevTrack();
        handled = true;
      }
      break;
    case 'arrowright':
      if ((e.ctrlKey || e.metaKey) && typeof nextTrack === 'function') {
        nextTrack();
        handled = true;
      }
      break;
    case 't':
      if ((e.ctrlKey || e.metaKey) && typeof toggleTimer === 'function') {
        toggleTimer();
        handled = true;
      }
      break;
    case 'r':
      if ((e.ctrlKey || e.metaKey) && typeof resetTimer === 'function') {
        resetTimer();
        handled = true;
      }
      break;
    case 'c':
      if ((e.ctrlKey || e.metaKey)) {
        const customBtn = document.getElementById('timer-custom');
        if (customBtn) customBtn.click();
        handled = true;
      }
      break;
    case 'a':
      if ((e.ctrlKey || e.metaKey) && ambientToggle) {
        ambientToggle.click();
        handled = true;
      }
      break;
    case '1':
      if ((e.ctrlKey || e.metaKey) && typeof applyTheme === 'function') {
        applyTheme('chill');
        handled = true;
      }
      break;
    case '2':
      if ((e.ctrlKey || e.metaKey) && typeof applyTheme === 'function') {
        applyTheme('rainy');
        handled = true;
      }
      break;
    case '3':
      if ((e.ctrlKey || e.metaKey) && typeof applyTheme === 'function') {
        applyTheme('night');
        handled = true;
      }
      break;
    case '4':
      if ((e.ctrlKey || e.metaKey) && typeof applyTheme === 'function') {
        applyTheme('productive');
        handled = true;
      }
      break;
    case 'escape':
      const existingPalette = document.querySelector('.color-palette');
      if (existingPalette) {
        existingPalette.remove();
        handled = true;
      }
      break;
    case 'h':
      if ((e.ctrlKey || e.metaKey)) {
        showKeyboardShortcutsHelp();
        handled = true;
      }
      break;
  }
  if (handled) e.preventDefault();
});

function showKeyboardShortcutsHelp() {
  const shortcuts = [
    { key: 'N', description: 'Focus new note input' },
    { key: 'L', description: 'Focus task list input' },
    { key: 'Space', description: 'Play/Pause music' },
    { key: 'Ctrl/Cmd + ←', description: 'Previous track' },
    { key: 'Ctrl/Cmd + →', description: 'Next track' },
    { key: 'Ctrl/Cmd + T', description: 'Toggle Pomodoro timer' },
    { key: 'Ctrl/Cmd + R', description: 'Reset Pomodoro timer' },
    { key: 'Ctrl/Cmd + C', description: 'Custom time input' },
    { key: 'Ctrl/Cmd + A', description: 'Toggle ambient sound' },
    { key: 'Ctrl/Cmd + 1', description: 'Chill theme' },
    { key: 'Ctrl/Cmd + 2', description: 'Rainy theme' },
    { key: 'Ctrl/Cmd + 3', description: 'Night theme' },
    { key: 'Ctrl/Cmd + 4', description: 'Productive theme' },
    { key: 'Escape', description: 'Close color palette' },
    { key: 'Ctrl/Cmd + H', description: 'Show this help' }
  ];
  let helpText = '🎹 Keyboard Shortcuts:\n\n';
  shortcuts.forEach(shortcut => {
    helpText += `${shortcut.key}: ${shortcut.description}\n`;
  });
  if (typeof showSnackbar === 'function') {
    showSnackbar(helpText, 'Got it!', () => {});
  } else {
    alert(helpText);
  }
}

// Track user interaction for autoplay policy (simplified for automatic playback)
document.addEventListener('click', () => {
  if (!document.body.classList.contains('user-interacted')) {
    document.body.classList.add('user-interacted');
    console.log('🎵 User interaction detected - audio can now play');
    
    // If ambient audio is loaded but not playing due to autoplay policy, start it
    if (ambientAudio && ambientAudio.paused && ambientEnabled) {
      console.log('🎵 Starting ambient audio after user interaction');
      ambientAudio.play().catch(error => {
        console.log('🎵 Failed to start ambient audio after user interaction:', error.message);
      });
    }
  }
}, { once: true });

// --- Application Initialization ---
window.addEventListener('DOMContentLoaded', async () => {
  // Initialize sidebar animation
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    setTimeout(() => sidebar.classList.add('welcome-animate'), 100);
  }
  
  // Initialize theme
  const savedTheme = localStorage.getItem('theme') || 'chill';
  if (typeof applyTheme === 'function') {
    applyTheme(savedTheme);
  }
  
  // Initialize ambient toggle state
  if (ambientToggle) {
    ambientToggle.classList.toggle('on', ambientEnabled);
    const ambientIcon = ambientToggle.querySelector('i');
    if (ambientIcon) {
      ambientIcon.className = ambientEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
    }
  }
  
  // Test ambient sound files
  console.log('🎵 Testing ambient sound files...');
  Object.entries(AMBIENT_SOUNDS).forEach(([theme, url]) => {
    const testAudio = new Audio(url);
    testAudio.addEventListener('canplaythrough', () => {
      console.log(`🎵 ✅ ${theme} ambient sound file is accessible`);
    });
    testAudio.addEventListener('error', (e) => {
      console.log(`🎵 ❌ ${theme} ambient sound file error:`, e);
    });
  });
  
  // Start ambient sound automatically if enabled
  if (ambientEnabled) {
    const currentTheme = localStorage.getItem('theme') || 'chill';
    console.log('🎵 Starting ambient sound for theme:', currentTheme);
    renderAmbientEffects(currentTheme);
  }
  
  // Initialize widget toggles
  initializeWidgetToggles();

  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      openSettingsModal();
    });
  }
  
  // Initialize settings modal functionality
  initializeSettingsModal();
});

// --- Animated Background (floating stars) ---
function createStars(count = 30) {
  const animatedBg = document.getElementById('animated-bg');
  if (!animatedBg) return;
  
  animatedBg.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.opacity = Math.random() * 0.7 + 0.3;
    star.style.animationDuration = `${Math.random() * 8 + 6}s`;
    animatedBg.appendChild(star);
  }
}

// Initialize stars on load
window.addEventListener('load', () => {
  createStars();
});

// --- Theme System ---
const THEME_GIFS = {
  chill: ['assets/bg/chill1.gif', 'assets/bg/chill2.gif'],
  rainy: ['assets/bg/rainy1.gif', 'assets/bg/rainy2.gif'],
  night: ['assets/bg/night1.gif', 'assets/bg/night2.gif'],
  productive: ['assets/bg/productive1.gif', 'assets/bg/productive2.gif']
};

function setRandomThemeBg(theme) {
  const animatedBg = document.getElementById('animated-bg');
  if (!animatedBg) return;
  
  const gifs = THEME_GIFS[theme] || [];
  if (gifs.length > 0) {
    const gif = gifs[Math.floor(Math.random() * gifs.length)];
    animatedBg.style.background = `url('${gif}') center center/cover no-repeat`;
    animatedBg.style.imageRendering = 'pixelated';
  }
}

function applyTheme(theme) {
  document.body.className = 'theme-' + theme;
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.theme === theme);
  });
  localStorage.setItem('theme', theme);
  setRandomThemeBg(theme);
  
  // Animated background: more stars at night
  if (theme === 'night') createStars(60);
  else createStars(30);
  
  // Trigger ambient sound when switching themes (if ambient is enabled)
  if (ambientEnabled) {
    renderAmbientEffects(theme);
  }
}

// Initialize theme buttons
document.addEventListener('DOMContentLoaded', () => {
  const themeBtns = document.querySelectorAll('.theme-btn');
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (sfxClick) playClickSound(sfxClick);
      applyTheme(btn.dataset.theme);
    });
  });
});

// --- Snackbar System ---
function showSnackbar(message, actionText, action) {
  const snackbar = document.getElementById('snackbar');
  if (!snackbar) return;
  
  snackbar.textContent = message;
  snackbar.className = 'show';
  
  if (actionText && action) {
    const actionBtn = document.createElement('button');
    actionBtn.textContent = actionText;
    actionBtn.onclick = () => {
      action();
      hideSnackbar();
    };
    snackbar.appendChild(actionBtn);
  }
  
  setTimeout(hideSnackbar, 4000);
}

function hideSnackbar() {
  const snackbar = document.getElementById('snackbar');
  if (snackbar) {
    snackbar.className = '';
    snackbar.innerHTML = '';
  }
}

// --- Widget Toggle System ---
function initializeWidgetToggles() {
  const widgetHeaders = document.querySelectorAll('.widget-header');

  widgetHeaders.forEach(header => {
    const toggleBtn = header.querySelector('.widget-toggle');
    const content = header.nextElementSibling;

    if (toggleBtn && content) {
      // Remove previous event listeners by cloning
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);
      newHeader.addEventListener('click', (e) => {
        // Only toggle if not clicking on a button inside the header (e.g., future settings)
        if (e.target.closest('button') && !e.target.classList.contains('widget-toggle')) return;
        content.classList.toggle('collapsed');
        const btn = newHeader.querySelector('.widget-toggle');
        if (btn) btn.textContent = content.classList.contains('collapsed') ? '+' : '-';
      });
    }
  });
}

// Initialize widget toggles on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initializeWidgetToggles();
});

// Settings Modal Functions
function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.add('show');
    loadSettingsValues();
  }
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function initializeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const closeBtn = document.getElementById('close-settings');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSettingsModal);
  }
  
  // Close modal when clicking outside
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeSettingsModal();
      }
    });
  }
  
  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
      closeSettingsModal();
    }
  });
  
  // Initialize settings controls
  initializeSettingsControls();
}

function loadSettingsValues() {
  // Load saved values into settings form
  const sfxToggle = document.getElementById('toggle-sfx');
  const ambientToggle = document.getElementById('toggle-ambient');
  const musicToggle = document.getElementById('toggle-music');
  const defaultPomodoro = document.getElementById('default-pomodoro');
  const defaultMood = document.getElementById('default-mood');
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  const highContrastToggle = document.getElementById('high-contrast-toggle');
  
  if (sfxToggle) sfxToggle.checked = localStorage.getItem('sfxEnabled') !== 'false';
  if (ambientToggle) ambientToggle.checked = JSON.parse(localStorage.getItem('ambientEnabled') || 'true');
  if (musicToggle) musicToggle.checked = localStorage.getItem('musicEnabled') !== 'false';
  if (defaultPomodoro) defaultPomodoro.value = localStorage.getItem('defaultPomodoro') || 25;
  if (defaultMood) defaultMood.value = localStorage.getItem('defaultMood') || 'great';
  if (fontSizeSlider) {
    fontSizeSlider.value = localStorage.getItem('fontSize') || 16;
    if (fontSizeValue) fontSizeValue.textContent = fontSizeSlider.value;
  }
  if (highContrastToggle) highContrastToggle.checked = localStorage.getItem('highContrast') === 'true';
  
  // Load custom theme preview
  const savedCustomTheme = JSON.parse(localStorage.getItem('customTheme') || '{}');
  const customThemePreview = document.getElementById('custom-theme-preview');
  if (customThemePreview && savedCustomTheme.bgImage) {
    customThemePreview.style.backgroundImage = `url('${savedCustomTheme.bgImage}')`;
    customThemePreview.style.backgroundSize = 'cover';
  }
}

function initializeSettingsControls() {
  // Custom theme controls
  const bgImageInput = document.getElementById('custom-bg-image');
  const saveCustomThemeBtn = document.getElementById('save-custom-theme');
  const customThemePreview = document.getElementById('custom-theme-preview');
  const customFileLabel = document.querySelector('.custom-file-label');
  const customFileName = document.getElementById('custom-file-name');

  // Preferences
  const sfxToggle = document.getElementById('toggle-sfx');
  const ambientToggle = document.getElementById('toggle-ambient');
  const musicToggle = document.getElementById('toggle-music');
  const defaultPomodoro = document.getElementById('default-pomodoro');
  const defaultMood = document.getElementById('default-mood');

  // Accessibility
  const fontSizeSlider = document.getElementById('font-size-slider');
  const fontSizeValue = document.getElementById('font-size-value');
  const highContrastToggle = document.getElementById('high-contrast-toggle');

  // Data management
  const exportBtn = document.getElementById('export-data');
  const importBtn = document.getElementById('import-data');
  const clearBtn = document.getElementById('clear-data');

  // About/help
  const openHelp = document.getElementById('open-help');

  // Custom background file handling
  if (customFileLabel && bgImageInput) {
    customFileLabel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        bgImageInput.click();
      }
    });
  }
  
  if (bgImageInput && customFileName) {
    bgImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        customFileName.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(evt) {
          customThemePreview.style.backgroundImage = `url('${evt.target.result}')`;
          customThemePreview.style.backgroundSize = 'cover';
          bgImageInput.value = '';
        };
        reader.readAsDataURL(file);
      } else {
        customFileName.textContent = '';
        customThemePreview.style.backgroundImage = '';
        bgImageInput.value = '';
      }
    });
  }

  if (saveCustomThemeBtn) {
    saveCustomThemeBtn.addEventListener('click', () => {
      let bgImageData = JSON.parse(localStorage.getItem('customTheme') || '{}').bgImage;
      if (bgImageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(evt) {
          bgImageData = evt.target.result;
          saveTheme();
        };
        reader.readAsDataURL(bgImageInput.files[0]);
      } else {
        saveTheme();
      }
      function saveTheme() {
        const theme = { bgImage: bgImageData };
        localStorage.setItem('customTheme', JSON.stringify(theme));
        customThemePreview.style.backgroundImage = `url('${bgImageData}')`;
        customThemePreview.style.backgroundSize = 'cover';
        showSnackbar('Custom background saved!');
      }
    });
  }

  // Save settings on change
  if (sfxToggle) sfxToggle.addEventListener('change', () => localStorage.setItem('sfxEnabled', sfxToggle.checked));
  if (ambientToggle) ambientToggle.addEventListener('change', () => {
    localStorage.setItem('ambientEnabled', ambientToggle.checked);
    // Update ambient state in main app
    ambientEnabled = ambientToggle.checked;
    if (ambientEnabled) {
      playAmbient(localStorage.getItem('theme') || 'chill');
    } else {
      stopAmbient();
    }
  });
  if (musicToggle) musicToggle.addEventListener('change', () => localStorage.setItem('musicEnabled', musicToggle.checked));
  if (defaultPomodoro) defaultPomodoro.addEventListener('input', () => localStorage.setItem('defaultPomodoro', defaultPomodoro.value));
  if (defaultMood) defaultMood.addEventListener('change', () => localStorage.setItem('defaultMood', defaultMood.value));

  // Accessibility
  if (fontSizeSlider) {
    fontSizeSlider.addEventListener('input', () => {
      if (fontSizeValue) fontSizeValue.textContent = fontSizeSlider.value;
      localStorage.setItem('fontSize', fontSizeSlider.value);
      document.body.style.fontSize = fontSizeSlider.value + 'px';
    });
  }
  if (highContrastToggle) {
    highContrastToggle.addEventListener('change', () => {
      localStorage.setItem('highContrast', highContrastToggle.checked);
      document.body.classList.toggle('high-contrast', highContrastToggle.checked);
    });
  }

  // Data Management
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = {
        notes: localStorage.getItem('notesData'),
        stats: localStorage.getItem('statsData'),
        moods: localStorage.getItem('moodHistory'),
        settings: {
          customTheme: localStorage.getItem('customTheme'),
          sfxEnabled: localStorage.getItem('sfxEnabled'),
          ambientEnabled: localStorage.getItem('ambientEnabled'),
          musicEnabled: localStorage.getItem('musicEnabled'),
          defaultPomodoro: localStorage.getItem('defaultPomodoro'),
          defaultMood: localStorage.getItem('defaultMood'),
          fontSize: localStorage.getItem('fontSize'),
          highContrast: localStorage.getItem('highContrast')
        }
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'moodbyte-data.json';
      a.click();
      URL.revokeObjectURL(url);
      showSnackbar('Data exported successfully!');
    });
  }
  
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
          try {
            const data = JSON.parse(evt.target.result);
            if (data.notes) localStorage.setItem('notesData', data.notes);
            if (data.stats) localStorage.setItem('statsData', data.stats);
            if (data.moods) localStorage.setItem('moodHistory', data.moods);
            if (data.settings) {
              Object.entries(data.settings).forEach(([k, v]) => localStorage.setItem(k, v));
            }
            showSnackbar('Data imported! Please refresh the app.');
          } catch (err) {
            showSnackbar('Invalid data file.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all MoodByte data? This cannot be undone.')) {
        localStorage.clear();
        showSnackbar('All data cleared. Please refresh the app.');
      }
    });
  }
  
  if (openHelp) {
    openHelp.addEventListener('click', (e) => {
      e.preventDefault();
      showKeyboardShortcutsHelp();
    });
  }
}
