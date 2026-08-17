import { fetchStationById } from '../hooks/useStations';
import { showToast } from './toast';

const btn = document.getElementById('play-pause-btn');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const audio = document.getElementById('main-audio-player') as HTMLAudioElement;

const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const loadIcon = document.getElementById('loading-icon');
const errorOverlay = document.getElementById('player-error-overlay');

if (btnPrev) {
  btnPrev.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('request-play-prev'));
  });
}

if (btnNext) {
  btnNext.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('request-play-next'));
  });
}

if (btn && audio) {
  // Toggle play/pause on click
  btn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play().catch(() => { }); // Catch error to prevent unhandled rejection in console
    } else {
      audio.pause();
    }
  });

  // Audio state event listeners for robust UI updates
  audio.addEventListener('loadstart', () => {
    if (playIcon) playIcon.classList.add('hidden');
    if (pauseIcon) pauseIcon.classList.add('hidden');
    if (loadIcon) loadIcon.classList.remove('hidden');
    if (errorOverlay) errorOverlay.classList.remove('opacity-100');
    setVisualizerActive(false);
  });

  audio.addEventListener('waiting', () => {
    if (playIcon) playIcon.classList.add('hidden');
    if (pauseIcon) pauseIcon.classList.add('hidden');
    if (loadIcon) loadIcon.classList.remove('hidden');
    setVisualizerActive(false);
  });

  audio.addEventListener('playing', () => {
    if (playIcon) playIcon.classList.add('hidden');
    if (loadIcon) loadIcon.classList.add('hidden');
    if (pauseIcon) pauseIcon.classList.remove('hidden');
    if (errorOverlay) errorOverlay.classList.remove('opacity-100');
    setVisualizerActive(true);
  });

  audio.addEventListener('pause', () => {
    if (pauseIcon) pauseIcon.classList.add('hidden');
    if (loadIcon) loadIcon.classList.add('hidden');
    if (playIcon) playIcon.classList.remove('hidden');
    setVisualizerActive(false);
  });

  audio.addEventListener('error', () => {
    // Revert icon to play
    if (pauseIcon) pauseIcon.classList.add('hidden');
    if (loadIcon) loadIcon.classList.add('hidden');
    if (playIcon) playIcon.classList.remove('hidden');
    // Show error overlay
    if (errorOverlay) errorOverlay.classList.add('opacity-100');
    setVisualizerActive(false);
  });
}

function setVisualizerActive(active: boolean) {
  const visualizer = document.getElementById('audio-visualizer');
  const livePing = document.getElementById('live-indicator-ping');
  const liveDot = document.getElementById('live-indicator-dot');

  if (active) {
    visualizer?.classList.add('playing');
    visualizer?.classList.replace('opacity-30', 'opacity-100');
    livePing?.classList.remove('hidden');
    liveDot?.classList.remove('bg-slate-300', 'dark:bg-zinc-700');
    liveDot?.classList.add('bg-error');
  } else {
    visualizer?.classList.remove('playing');
    visualizer?.classList.replace('opacity-100', 'opacity-30');
    livePing?.classList.add('hidden');
    liveDot?.classList.remove('bg-error');
    liveDot?.classList.add('bg-slate-300', 'dark:bg-zinc-700');
  }
}

let currentStationId: string | null = null;

// Listen for cross-component play-station events
window.addEventListener('play-station', async (e: any) => {
  const { id, name, category, logo } = e.detail;

  // Prevent refetching if the user clicks the station that is already playing
  if (currentStationId === id) {
    showToast(`Already playing ${name}`);

    // If they paused it, resume playing instead of doing a full reload
    if (audio && audio.paused) {
      audio.play().catch(() => { });
    }
    return;
  }

  currentStationId = id;

  const emptyState = document.getElementById('empty-state-container');
  const playerContainer = document.getElementById('player-container');

  if (emptyState) emptyState.classList.add('hidden');
  if (playerContainer) {
    playerContainer.classList.remove('hidden');
    playerContainer.classList.add('flex');
  }

  const titleEl = document.getElementById('now-playing-title');
  const categoryEl = document.getElementById('now-playing-category');
  const logoEl = document.getElementById('now-playing-logo') as HTMLImageElement;
  const sourceEl = audio?.querySelector('source');

  if (titleEl) titleEl.textContent = name;
  if (categoryEl) categoryEl.textContent = category;
  if (logoEl) {
    // Dynamically request Astro Image Optimization
    logoEl.src = logo ? `/_image?href=${encodeURIComponent(logo)}&w=400&h=400&f=webp` : '';
  }

  // Show loading state while fetching stream url securely
  if (playIcon) playIcon.classList.add('hidden');
  if (pauseIcon) pauseIcon.classList.add('hidden');
  if (loadIcon) loadIcon.classList.remove('hidden');
  setVisualizerActive(false);

  try {
    const gridEl = document.getElementById('radio-grid');
    const token = gridEl?.dataset.token || '';

    const stationInfo = await fetchStationById(id, token);

    if (stationInfo && audio && sourceEl) {
      sourceEl.src = stationInfo.stream_url;
      audio.load(); // Required to load the new source
      audio.play().catch(() => { });
    } else {
      throw new Error("Failed to secure fetch station stream");
    }
  } catch (err: any) {
    if (err.message === "BANNED") {
        showToast("Banned for spamming. Please wait 1 hour for a new token.");
        window.location.reload();
    } else {
        console.error(err);
    }
    if (loadIcon) loadIcon.classList.add('hidden');
    if (playIcon) playIcon.classList.remove('hidden');
    if (errorOverlay) errorOverlay.classList.add('opacity-100');
        
    // Reset current ID so they can try clicking it again if it failed
    currentStationId = null;
  }
});
