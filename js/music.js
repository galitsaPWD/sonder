// --- Music Player ---
let musicPlaylist = [];
let currentTrack = 0;
let isMusicPlaying = false;
let loopMode = 1; // 0: no loop, 1: loop all, 2: loop one
let shuffleMode = false;
let shuffledOrder = [];

// --- IndexedDB for Music Storage ---
let db = null;
const DB_NAME = 'MoodByteMusicDB';
const DB_VERSION = 1;
const STORE_NAME = 'musicFiles';

function initMusicDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }
    };
  });
}

async function saveMusicFile(file) {
  if (!db) await initMusicDB();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const musicData = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      name: file.name.replace(/\.[^/.]+$/, ""),
      originalName: file.name,
      data: dataUrl,
      type: file.type,
      size: file.size,
      addedAt: new Date().toISOString()
    };
    const request = store.add(musicData);
    request.onsuccess = () => resolve(musicData);
    request.onerror = () => reject(request.error);
  });
}

async function loadMusicFile(id) {
  if (!db) await initMusicDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllSavedMusic() {
  if (!db) await initMusicDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteMusicFile(id) {
  if (!db) await initMusicDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function clearAllMusic() {
  if (!db) await initMusicDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => {
      musicPlaylist = [];
      currentTrack = 0;
      isMusicPlaying = false;
      localStorage.removeItem('moodbyte_playlist');
      loadTrack(0);
      updateDeleteButtonVisibility();
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// Make clearAllMusic available globally for testing
window.clearAllMusic = clearAllMusic;

// Add function to check music database status
async function checkMusicDBStatus() {
  if (!db) await initMusicDB();
  const savedMusic = await getAllSavedMusic();
  console.log('Music database status:', {
    totalTracks: savedMusic.length,
    tracks: savedMusic.map(m => ({ name: m.name, size: m.size, type: m.type }))
  });
  return savedMusic;
}

window.checkMusicDBStatus = checkMusicDBStatus;

// Add function to check current loop mode
function checkLoopMode() {
  console.log('Current loop mode:', loopMode, '(', ['No Loop', 'Loop All', 'Loop One'][loopMode], ')');
  return loopMode;
}

window.checkLoopMode = checkLoopMode;

// Global functions for debugging
window.checkMusicStatus = function() {
  console.log('🎵 Music Status Debug:');
  console.log('🎵 Loop mode:', loopMode, '(0=no loop, 1=loop all, 2=loop one)');
  console.log('🎵 Current track:', currentTrack);
  console.log('🎵 Playlist length:', musicPlaylist.length);
  console.log('🎵 Is music playing:', isMusicPlaying);
  console.log('🎵 Current track name:', musicPlaylist[currentTrack] ? musicPlaylist[currentTrack].name : 'None');
  
  const music = document.getElementById('music');
  if (music) {
    console.log('🎵 Audio element duration:', music.duration);
    console.log('🎵 Audio element current time:', music.currentTime);
    console.log('🎵 Audio element ended event listeners:', music.onended ? 'Has onended' : 'No onended');
  }
  
  return {
    loopMode,
    currentTrack,
    playlistLength: musicPlaylist.length,
    isPlaying: isMusicPlaying,
    currentTrackName: musicPlaylist[currentTrack] ? musicPlaylist[currentTrack].name : 'None'
  };
};

function shuffleArray(array) {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getCurrentOrder() {
  return shuffleMode ? shuffledOrder : [...Array(musicPlaylist.length).keys()];
}

function applyShuffle() {
  if (shuffleMode) {
    shuffledOrder = shuffleArray([...Array(musicPlaylist.length).keys()]);
    // Ensure current track stays at the same index
    const idx = shuffledOrder.indexOf(currentTrack);
    if (idx > 0) {
      [shuffledOrder[0], shuffledOrder[idx]] = [shuffledOrder[idx], shuffledOrder[0]];
    }
    currentTrack = 0;
  } else {
    shuffledOrder = [];
  }
}

function toggleShuffleMode() {
  shuffleMode = !shuffleMode;
  applyShuffle();
  updateShuffleButton();
}

function updateShuffleButton() {
  const shuffleBtn = document.getElementById('shuffle-btn');
  if (!shuffleBtn) return;
  shuffleBtn.classList.toggle('selected', shuffleMode);
  shuffleBtn.title = shuffleMode ? 'Shuffle On' : 'Shuffle Off';
}

async function initializeMusicPlayer() {
  const addMusicBtn = document.getElementById('add-music-btn');
  const addMusicInput = document.getElementById('add-music-input');
  if(addMusicBtn && addMusicInput) {
    addMusicBtn.addEventListener('click', () => addMusicInput.click());
    addMusicInput.addEventListener('change', handleMusicUpload);
  }
  
  // Wait for playlist to load
  await loadPlaylist();
  
  if (musicPlaylist.length > 0) {
    loadTrack(currentTrack);
  } else {
    document.getElementById('track-name').textContent = 'No music available';
    document.getElementById('track-time').textContent = '0:00 / 0:00';
  }
  
  document.getElementById('play-music').addEventListener('click', togglePlay);
  document.getElementById('prev-track').addEventListener('click', prevTrack);
  document.getElementById('next-track').addEventListener('click', nextTrack);
  document.getElementById('music-progress').addEventListener('input', setProgress);
  document.getElementById('music-volume').addEventListener('input', setVolume);
  const deleteTrackBtn = document.getElementById('delete-track');
  if (deleteTrackBtn) {
    deleteTrackBtn.addEventListener('click', deleteCurrentTrack);
  }
  
  // Initialize loop mode
  const loopBtn = document.getElementById('loop-btn');
  if (loopBtn) {
    loopBtn.addEventListener('click', toggleLoopMode);
    updateLoopButton();
  }
  
  // Initialize shuffle mode
  const shuffleBtn = document.getElementById('shuffle-btn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', toggleShuffleMode);
    updateShuffleButton();
  }
}

function deleteCurrentTrack() {
  if (musicPlaylist.length <= 1) return;
  const trackToDelete = musicPlaylist[currentTrack];
  if (trackToDelete.isUploaded && trackToDelete.id) {
    deleteMusicFile(trackToDelete.id);
  }
  musicPlaylist.splice(currentTrack, 1);
  if (currentTrack >= musicPlaylist.length) currentTrack = 0;
  savePlaylist();
  loadTrack(currentTrack);
  if (isMusicPlaying) playMusic();
  updateDeleteButtonVisibility();
}

async function loadPlaylist() {
  musicPlaylist = [];
  const savedMusic = await getAllSavedMusic();
  savedMusic.forEach(musicData => {
    const track = {
      name: musicData.name,
      src: musicData.data,
      id: musicData.id,
      isUploaded: true
    };
    musicPlaylist.push(track);
  });
  savePlaylist();
  updateDeleteButtonVisibility();
}

function savePlaylist() {
  const playlistToSave = musicPlaylist.filter(track => !track.isUploaded);
  localStorage.setItem('moodbyte_playlist', JSON.stringify(playlistToSave));
  updateDeleteButtonVisibility();
}

async function handleMusicUpload(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('audio/')) {
    try {
      console.log('Uploading music file:', file.name, 'Size:', file.size, 'Type:', file.type);
      const musicData = await saveMusicFile(file);
      console.log('Music saved successfully:', musicData);
      
      const newTrack = {
        name: musicData.name,
        src: musicData.data,
        id: musicData.id,
        isUploaded: true
      };
      musicPlaylist.push(newTrack);
      currentTrack = musicPlaylist.length - 1;
      savePlaylist();
      loadTrack(currentTrack);
      // Remove auto-play to prevent issues
      // playMusic();
      event.target.value = '';
      updateDeleteButtonVisibility();
      
      // Show success message
      if (typeof showSnackbar === 'function') {
        showSnackbar(`Added "${musicData.name}" to playlist`, 'Success');
      }
    } catch (error) {
      console.error('Error uploading music:', error);
      if (typeof showSnackbar === 'function') {
        showSnackbar(`Failed to upload "${file.name}": ${error.message}`, 'Error');
      }
    }
  } else {
    console.error('Invalid file type:', file ? file.type : 'No file');
    if (typeof showSnackbar === 'function') {
      showSnackbar('Please select a valid audio file', 'Error');
    }
  }
}

function loadTrack(trackIndex) {
  const music = document.getElementById('music');
  const trackName = document.getElementById('track-name');
  const trackTime = document.getElementById('track-time');
  const musicProgress = document.getElementById('music-progress');
  
  if (musicPlaylist.length === 0) {
    trackName.textContent = 'No music available';
    trackTime.textContent = '0:00 / 0:00';
    music.src = '';
    musicProgress.value = 0;
    updateDeleteButtonVisibility();
    return;
  }
  if (musicPlaylist[trackIndex]) {
    const track = musicPlaylist[trackIndex];
    
    // Remove previous ended event listener to prevent duplicates
    music.removeEventListener('ended', handleTrackEnd);
    
    music.src = track.src;
    updateTrackNameDisplay(track.name);
    trackTime.textContent = '0:00 / 0:00';
    musicProgress.value = 0;
    
    // Add new ended event listener
    music.addEventListener('ended', handleTrackEnd);
    console.log('🎵 Added ended event listener for track:', track.name);
    music.load();
  } else {
    trackName.textContent = 'No track available';
    trackTime.textContent = '0:00 / 0:00';
    musicProgress.value = 0;
  }
  updateDeleteButtonVisibility();
}

function handleTrackError(e) {
  const track = musicPlaylist[currentTrack];
  showSnackbar(`Failed to load "${track.name}"`, 'error');
  setTimeout(() => {
    if (isMusicPlaying) nextTrack();
  }, 1000);
}

function handleTrackLoaded() {
  if (isMusicPlaying) playMusic();
}

function togglePlay() {
  if (isMusicPlaying) {
    pauseMusic();
  } else {
    playMusic();
  }
}

function playMusic() {
  const music = document.getElementById('music');
  isMusicPlaying = true;
  document.getElementById('play-music').innerHTML = '<i class="fas fa-pause"></i>';
  
  // Enable track name scrolling animation
  const trackNameElement = document.getElementById('track-name');
  if (trackNameElement && trackNameElement.classList.contains('scrolling')) {
    trackNameElement.classList.add('playing');
  }
  
  music.play().catch(error => {
    console.error('Music play error:', error);
    isMusicPlaying = false;
    document.getElementById('play-music').innerHTML = '<i class="fas fa-play"></i>';
    
    // Disable track name scrolling animation on error
    if (trackNameElement && trackNameElement.classList.contains('scrolling')) {
      trackNameElement.classList.remove('playing');
    }
  });
  
  // Update ambient audio based on music state
  if (typeof window.updateAmbientForMusic === 'function') {
    window.updateAmbientForMusic();
  }
  
  // Start progress updates
  if (!window.progressInterval) {
    window.progressInterval = setInterval(updateProgress, 100);
  }
}

function pauseMusic() {
  const music = document.getElementById('music');
  isMusicPlaying = false;
  music.pause();
  document.getElementById('play-music').innerHTML = '<i class="fas fa-play"></i>';
  
  // Disable track name scrolling animation
  const trackNameElement = document.getElementById('track-name');
  if (trackNameElement && trackNameElement.classList.contains('scrolling')) {
    trackNameElement.classList.remove('playing');
  }
  
  // Update ambient audio based on music state
  if (typeof window.updateAmbientForMusic === 'function') {
    window.updateAmbientForMusic();
  }
  
  // Stop progress updates
  if (window.progressInterval) {
    clearInterval(window.progressInterval);
    window.progressInterval = null;
  }
}

function prevTrack() {
  if (window.progressInterval) {
    clearInterval(window.progressInterval);
    window.progressInterval = null;
  }
  let order = getCurrentOrder();
  let idx = order.indexOf(currentTrack);
  idx = (idx - 1 + order.length) % order.length;
  currentTrack = order[idx];
  loadTrack(currentTrack);
  if (isMusicPlaying) {
    playMusic();
  }
}

function nextTrack() {
  if (window.progressInterval) {
    clearInterval(window.progressInterval);
    window.progressInterval = null;
  }
  let order = getCurrentOrder();
  let idx = order.indexOf(currentTrack);
  idx = (idx + 1) % order.length;
  currentTrack = order[idx];
  loadTrack(currentTrack);
  if (isMusicPlaying) {
    playMusic();
  }
}

function updateProgress() {
  const music = document.getElementById('music');
  const musicProgress = document.getElementById('music-progress');
  const trackTime = document.getElementById('track-time');
  const { duration, currentTime } = music;
  if (duration) {
    const progressPercent = (currentTime / duration) * 100;
    musicProgress.value = progressPercent;
    trackTime.textContent = `${formatMusicTime(currentTime)} / ${formatMusicTime(duration)}`;
    
    // Check if track has reached the end (within 0.1 seconds)
    if (currentTime >= duration - 0.1 && isMusicPlaying) {
      console.log('🎵 Track reached end during playback - triggering auto-next');
      handleTrackEnd();
    }
  }
}

function setProgress() {
  const music = document.getElementById('music');
  const musicProgress = document.getElementById('music-progress');
  const { duration } = music;
  if (duration) {
    const newTime = (musicProgress.value * duration) / 100;
    music.currentTime = newTime;
    
    // Check if user dragged to the end (within 0.5 seconds of the end)
    if (newTime >= duration - 0.5 && isMusicPlaying) {
      console.log('🎵 User dragged to end of track - triggering auto-next');
      // Small delay to ensure the currentTime is set before checking
      setTimeout(() => {
        if (music.currentTime >= duration - 0.5) {
          handleTrackEnd();
        }
      }, 50);
    }
  }
}

function setVolume() {
  const music = document.getElementById('music');
  const musicVolume = document.getElementById('music-volume');
  music.volume = musicVolume.value;
  updateVolumeIcon();
  
  // Update ambient audio based on music volume
  if (typeof window.updateAmbientForMusic === 'function') {
    window.updateAmbientForMusic();
  }
}

function updateVolumeIcon() {
  const music = document.getElementById('music');
  const volumeIcon = document.getElementById('volume-icon');
  if (music.volume === 0) {
    volumeIcon.innerHTML = SVG_ICONS.volumeMute;
  } else if (music.volume < 0.5) {
    volumeIcon.innerHTML = SVG_ICONS.volumeLow;
  } else {
    volumeIcon.innerHTML = SVG_ICONS.volumeHigh;
  }
}

function formatMusicTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function updateDeleteButtonVisibility() {
  const deleteTrackBtn = document.getElementById('delete-track');
  if (deleteTrackBtn) {
    deleteTrackBtn.style.display = musicPlaylist.length > 1 ? 'inline-block' : 'none';
  }
}

function updateTrackNameDisplay(name) {
  const trackNameElement = document.getElementById('track-name');
  if (trackNameElement) {
    // Update the text directly
    trackNameElement.textContent = name;
    
    // Trigger scrolling update immediately
    updateTrackNameScrolling();
  }
}

function updateTrackNameScrolling() {
  const trackNameElement = document.getElementById('track-name');
  if (!trackNameElement) return;
  
  // Remove existing classes and reset
  trackNameElement.classList.remove('scrolling', 'smooth', 'playing');
  trackNameElement.removeAttribute('data-text');
  
  // Check if text is overflowing
  const isOverflowing = trackNameElement.scrollWidth > trackNameElement.clientWidth;
  
  if (isOverflowing) {
    // Set up scrolling immediately without delays
    trackNameElement.setAttribute('data-text', trackNameElement.textContent);
    trackNameElement.classList.add('scrolling', 'smooth');
    
    // Only add playing class if music is actually playing
    if (isMusicPlaying) {
      trackNameElement.classList.add('playing');
    }
  }
}

function handleTrackEnd() {
  console.log('🎵 Track ended!');
  console.log('🎵 Loop mode:', loopMode, '(0=no loop, 1=loop all, 2=loop one)');
  console.log('🎵 Current track:', currentTrack);
  console.log('🎵 Playlist length:', musicPlaylist.length);
  console.log('🎵 Is music playing:', isMusicPlaying);
  
  if (loopMode === 0) {
    // No loop - stop playing
    console.log('🎵 No loop mode - stopping playback');
    isMusicPlaying = false;
    document.getElementById('play-music').innerHTML = '<i class="fas fa-play"></i>';
    
    // Stop progress updates
    if (window.progressInterval) {
      clearInterval(window.progressInterval);
      window.progressInterval = null;
    }
    
    // Update ambient audio when music stops
    if (typeof window.updateAmbientForMusic === 'function') {
      window.updateAmbientForMusic();
    }
  } else if (loopMode === 1) {
    // Loop all - go to next track
    console.log('🎵 Loop all mode - going to next track');
    nextTrack();
  } else if (loopMode === 2) {
    // Loop one - restart current track
    console.log('🎵 Loop one mode - restarting current track');
    const music = document.getElementById('music');
    music.currentTime = 0;
    music.play().catch(error => {
      console.error('Failed to restart track:', error);
      isMusicPlaying = false;
      document.getElementById('play-music').innerHTML = '<i class="fas fa-play"></i>';
      
      // Update ambient audio if music fails to restart
      if (typeof window.updateAmbientForMusic === 'function') {
        window.updateAmbientForMusic();
      }
    });
  }
}

function toggleLoopMode() {
  loopMode = (loopMode + 1) % 3;
  updateLoopButton();
}

function updateLoopButton() {
  const loopBtn = document.getElementById('loop-btn');
  if (!loopBtn) return;
  // Use different icons for each mode
  const icons = ['fas fa-redo', 'fas fa-sync-alt', 'fas fa-redo-alt'];
  const titles = ['No Loop', 'Loop All', 'Loop One'];
  loopBtn.innerHTML = `<i class="${icons[loopMode]}"></i>`;
  loopBtn.title = titles[loopMode];
  loopBtn.classList.toggle('selected', loopMode > 0);
}

// Initialize music player on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => await initializeMusicPlayer());
} else {
  (async () => await initializeMusicPlayer())();
}
