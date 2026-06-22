const media = document.getElementById('media');
const mediaList = document.getElementById('mediaList');
const fileInput = document.getElementById('fileInput');
const openListBtn = document.getElementById('openListBtn');
const openMediaBtn = document.getElementById('openMediaBtn');
const bgColor = document.getElementById('bgColor');
const bgImageInput = document.getElementById('bgImageInput');
const bgImageBtn = document.getElementById('bgImageBtn');
const bgOpacity = document.getElementById('bgOpacity');
const opacityValue = document.getElementById('opacityValue');
const playerArea = document.getElementById('playerArea');
const playerOverlay = document.getElementById('playerOverlay');
const fileNameEl = document.getElementById('fileName');
const fileTypeEl = document.getElementById('fileType');
const playPauseBtn = document.getElementById('playPauseBtn');
const muteBtn = document.getElementById('muteBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const volumeBar = document.getElementById('volumeBar');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const gestureInfo = document.getElementById('gestureInfo');

let mediaFiles = [];
let currentIndex = -1;
let objectUrl = null;
let pointerState = null;

function formatTime(value) {
  if (!value || Number.isNaN(value)) return '00:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function isMediaFile(file) {
  return file.type.startsWith('video') || file.type.startsWith('audio');
}

function updatePlaybackButtons() {
  playPauseBtn.textContent = media.paused || media.ended ? 'Play' : 'Pause';
  muteBtn.textContent = media.muted || media.volume === 0 ? 'Unmute' : 'Mute';
}

function showOverlay(isVisible) {
  playerOverlay.style.opacity = isVisible ? '1' : '0';
}

function setFileDetails(file) {
  fileNameEl.textContent = file.name;
  fileTypeEl.textContent = file.type || 'Unknown';
}

function setMediaSource(file, index = 0) {
  if (!file) return;
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }
  objectUrl = URL.createObjectURL(file);
  media.src = objectUrl;
  media.load();
  setFileDetails(file);
  currentIndex = index;
  highlightActiveFile();
  showOverlay(false);
}

function highlightActiveFile() {
  document.querySelectorAll('.media-item').forEach((item) => {
    item.classList.toggle('active', Number(item.dataset.index) === currentIndex);
  });
}

function renderMediaList() {
  mediaList.innerHTML = '';
  if (mediaFiles.length === 0) {
    mediaList.innerHTML = '<p class="panel-copy">No files selected yet.</p>';
    return;
  }
  mediaFiles.forEach((file, idx) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'media-item';
    item.dataset.index = idx;
    item.innerHTML = `<strong>${file.name}</strong><small>${file.type || 'media file'}</small>`;
    item.addEventListener('click', () => setMediaSource(file, idx));
    mediaList.appendChild(item);
  });
  highlightActiveFile();
}

function handleFiles(files) {
  const picked = Array.from(files).filter((file) => isMediaFile(file));
  if (picked.length === 0) return;
  mediaFiles = mediaFiles.concat(picked);
  renderMediaList();
  if (currentIndex === -1) {
    setMediaSource(mediaFiles[0], 0);
  }
}

function setBackgroundImage(file) {
  const imageUrl = URL.createObjectURL(file);
  document.documentElement.style.setProperty('--background-image', `url('${imageUrl}')`);
}

function updateOverlayOpacity(value) {
  const alpha = Math.max(0, Math.min(1, value / 100));
  document.documentElement.style.setProperty('--bg-overlay', alpha);
  opacityValue.textContent = `${Math.round(value)}%`;
}

openListBtn.addEventListener('click', () => fileInput.click());
openMediaBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (event) => {
  handleFiles(event.target.files);
});

bgImageBtn.addEventListener('click', () => bgImageInput.click());
bgImageInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  setBackgroundImage(file);
});

bgColor.addEventListener('input', (event) => {
  document.documentElement.style.setProperty('--background-image', `radial-gradient(circle at top, ${event.target.value}22, transparent 18%), radial-gradient(circle at bottom right, ${event.target.value}20, transparent 25%), linear-gradient(180deg, ${event.target.value} 0%, #04060c 100%)`);
});

bgOpacity.addEventListener('input', (event) => updateOverlayOpacity(event.target.value));

media.addEventListener('loadedmetadata', () => {
  seekBar.max = Math.floor(media.duration) || 0;
  durationEl.textContent = formatTime(media.duration);
  currentTimeEl.textContent = formatTime(0);
  updatePlaybackButtons();
});

media.addEventListener('timeupdate', () => {
  seekBar.value = Math.floor(media.currentTime);
  currentTimeEl.textContent = formatTime(media.currentTime);
});

media.addEventListener('play', updatePlaybackButtons);
media.addEventListener('pause', updatePlaybackButtons);
media.addEventListener('volumechange', updatePlaybackButtons);

seekBar.addEventListener('input', (event) => {
  media.currentTime = Number(event.target.value);
});

volumeBar.addEventListener('input', (event) => {
  const value = Number(event.target.value);
  media.volume = value;
  if (value > 0) {
    media.muted = false;
  }
});

playPauseBtn.addEventListener('click', () => {
  if (!media.src) return;
  if (media.paused || media.ended) {
    media.play();
  } else {
    media.pause();
  }
});

muteBtn.addEventListener('click', () => {
  if (!media.src) return;
  media.muted = !media.muted;
});

fullscreenBtn.addEventListener('click', async () => {
  if (!media.src) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  } else {
    await playerArea.requestFullscreen().catch(() => {});
  }
});

function handlePointerDown(event) {
  pointerState = {
    startY: event.clientY,
    startVolume: media.volume,
  };
  gestureInfo.textContent = 'Drag up/down to change volume';
  playerArea.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (!pointerState) return;
  const delta = pointerState.startY - event.clientY;
  const nextVolume = Math.max(0, Math.min(1, pointerState.startVolume + delta / 300));
  media.volume = nextVolume;
  volumeBar.value = nextVolume;
  gestureInfo.textContent = `Volume ${Math.round(nextVolume * 100)}%`;
}

function handlePointerUp() {
  pointerState = null;
  setTimeout(() => {
    gestureInfo.textContent = 'Swipe up/down to adjust volume';
  }, 600);
}

playerArea.addEventListener('pointerdown', handlePointerDown);
playerArea.addEventListener('pointermove', handlePointerMove);
playerArea.addEventListener('pointerup', handlePointerUp);
playerArea.addEventListener('pointercancel', handlePointerUp);

function handleDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (!file) return;
  handleFiles([file]);
  playerOverlay.querySelector('.overlay-title').textContent = 'File loaded';
}

playerArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  playerOverlay.style.opacity = '1';
  playerOverlay.querySelector('.overlay-title').textContent = 'Release to drop media';
});

playerArea.addEventListener('dragleave', () => {
  if (media.src) {
    playerOverlay.style.opacity = '0';
  }
  playerOverlay.querySelector('.overlay-title').textContent = 'Drag files here';
});

playerArea.addEventListener('drop', handleDrop);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('Service Worker registered'))
      .catch((error) => console.warn('Service Worker registration failed', error));
  });
}

updateOverlayOpacity(Number(bgOpacity.value));
showOverlay(true);
