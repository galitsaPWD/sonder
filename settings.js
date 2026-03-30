document.addEventListener('DOMContentLoaded', () => {
  // Custom theme controls
  const bgImageInput = document.getElementById('custom-bg-image');
  const saveCustomThemeBtn = document.getElementById('save-custom-theme');
  const customThemePreview = document.getElementById('custom-theme-preview');

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

  // Back button
  const backBtn = document.getElementById('back-btn');
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Load saved custom background
  const savedCustomTheme = JSON.parse(localStorage.getItem('customTheme') || '{}');
  if (savedCustomTheme.bgImage) {
    customThemePreview.style.backgroundImage = `url('${savedCustomTheme.bgImage}')`;
    customThemePreview.style.backgroundSize = 'cover';
  }

  // Set settings page background GIF to match main app theme
  const THEME_GIFS = {
    chill: ['assets/bg/chill1.gif', 'assets/bg/chill2.gif'],
    rainy: ['assets/bg/rainy1.gif', 'assets/bg/rainy2.gif'],
    night: ['assets/bg/night1.gif', 'assets/bg/night2.gif'],
    productive: ['assets/bg/productive1.gif', 'assets/bg/productive2.gif']
  };
  function setSettingsBgGif(theme) {
    const bg = document.getElementById('settings-animated-bg');
    if (!bg) return;
    const gifs = THEME_GIFS[theme] || [];
    if (gifs.length > 0) {
      const gif = gifs[Math.floor(Math.random() * gifs.length)];
      bg.style.background = `url('${gif}') center center/cover no-repeat`;
      bg.style.imageRendering = 'pixelated';
    }
  }
  // Only set GIF if no custom background is set
  if (!savedCustomTheme.bgImage) {
    const currentTheme = localStorage.getItem('theme') || 'night';
    setSettingsBgGif(currentTheme);
  }

  const customFileLabel = document.querySelector('.custom-file-label');
  const customFileName = document.getElementById('custom-file-name');

  // Make label open file dialog for accessibility
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
          // Always reset input so selecting the same file twice works
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

  saveCustomThemeBtn.addEventListener('click', () => {
    let bgImageData = savedCustomTheme.bgImage;
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
      const theme = {
        bgImage: bgImageData
      };
      localStorage.setItem('customTheme', JSON.stringify(theme));
      customThemePreview.style.backgroundImage = `url('${bgImageData}')`;
      customThemePreview.style.backgroundSize = 'cover';
      alert('Custom background saved!');
    }
  });

  // Load
  sfxToggle.checked = localStorage.getItem('sfxEnabled') !== 'false';
  ambientToggle.checked = JSON.parse(localStorage.getItem('ambientEnabled') || 'true');
  musicToggle.checked = localStorage.getItem('musicEnabled') !== 'false';
  defaultPomodoro.value = localStorage.getItem('defaultPomodoro') || 25;
  defaultMood.value = localStorage.getItem('defaultMood') || 'great';
  // Save
  sfxToggle.addEventListener('change', () => localStorage.setItem('sfxEnabled', sfxToggle.checked));
  ambientToggle.addEventListener('change', () => localStorage.setItem('ambientEnabled', ambientToggle.checked));
  musicToggle.addEventListener('change', () => localStorage.setItem('musicEnabled', musicToggle.checked));
  defaultPomodoro.addEventListener('input', () => localStorage.setItem('defaultPomodoro', defaultPomodoro.value));
  defaultMood.addEventListener('change', () => localStorage.setItem('defaultMood', defaultMood.value));

  // Accessibility
  fontSizeSlider.value = localStorage.getItem('fontSize') || 16;
  fontSizeValue.textContent = fontSizeSlider.value;
  highContrastToggle.checked = localStorage.getItem('highContrast') === 'true';
  fontSizeSlider.addEventListener('input', () => {
    fontSizeValue.textContent = fontSizeSlider.value;
    localStorage.setItem('fontSize', fontSizeSlider.value);
    document.body.style.fontSize = fontSizeSlider.value + 'px';
  });
  highContrastToggle.addEventListener('change', () => {
    localStorage.setItem('highContrast', highContrastToggle.checked);
    document.body.classList.toggle('high-contrast', highContrastToggle.checked);
  });

  // Data Management
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
  });
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
          alert('Data imported! Please refresh the app.');
        } catch (err) {
          alert('Invalid data file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
  clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all MoodByte data? This cannot be undone.')) {
      localStorage.clear();
      alert('All data cleared. Please refresh the app.');
    }
  });

  // About/Help
  openHelp.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Keyboard Shortcuts & Help coming soon!');
  });

  // --- Animate sections in (staggered) ---
  const sections = document.querySelectorAll('section');
  sections.forEach((section, i) => {
    setTimeout(() => section.classList.add('visible'), 200 + i * 120);
    section.addEventListener('focusin', () => section.classList.add('active'));
    section.addEventListener('focusout', () => section.classList.remove('active'));
  });
}); 