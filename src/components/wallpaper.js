import { getStorage, setStorage, onStorageChange } from '../services/storage.js';

const DEFAULT_PRESETS = [
  { id: 'preset-1', name: 'Deep Indigo', class: 'wallpaper-default-1', url: null },
  { id: 'preset-2', name: 'Emerald Forest', class: 'wallpaper-default-2', url: null },
  { id: 'preset-3', name: 'Warm Amber', class: 'wallpaper-default-3', url: null }
];

/**
 * Initializes the wallpaper renderer component
 */
export async function initWallpaper() {
  const backdropEl = document.getElementById('wallpaper-backdrop');
  const overlayEl = document.getElementById('wallpaper-overlay');

  if (!backdropEl || !overlayEl) return;

  const storage = await getStorage('wallpaper');
  applyWallpaperState(backdropEl, overlayEl, storage);

  // Subscribe to storage changes for reactive wallpaper updates
  onStorageChange((changes) => {
    if (changes.wallpaper) {
      applyWallpaperState(backdropEl, overlayEl, changes.wallpaper.newValue);
    }
  });
}

function applyWallpaperState(backdropEl, overlayEl, wallpaperState) {
  if (!wallpaperState) return;

  // Clear existing preset classes
  backdropEl.className = '';

  if (wallpaperState.type === 'custom' && wallpaperState.customUrl) {
    backdropEl.style.backgroundImage = `url("${wallpaperState.customUrl}")`;
  } else {
    backdropEl.style.backgroundImage = '';
    const presetClass = wallpaperState.presetClass || 'wallpaper-default-1';
    backdropEl.classList.add(presetClass);
  }

  // Trigger scale transition
  requestAnimationFrame(() => {
    backdropEl.classList.add('loaded');
  });

  // Apply overlay opacity
  if (overlayEl && wallpaperState.overlayOpacity !== undefined) {
    overlayEl.style.backgroundColor = `rgba(11, 15, 25, ${wallpaperState.overlayOpacity})`;
  }
}

/**
 * Upload custom image file and set as wallpaper
 */
export async function uploadCustomWallpaper(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid image file'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      const currentWallpaper = await getStorage('wallpaper');
      const updatedState = {
        ...currentWallpaper,
        type: 'custom',
        customUrl: dataUrl
      };
      await setStorage('wallpaper', updatedState);
      resolve(updatedState);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Select preset wallpaper
 */
export async function selectPresetWallpaper(presetClass) {
  const currentWallpaper = await getStorage('wallpaper');
  const updatedState = {
    ...currentWallpaper,
    type: 'default',
    customUrl: null,
    presetClass
  };
  await setStorage('wallpaper', updatedState);
}
