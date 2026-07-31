import { startPomodoro, resetPomodoro, MODES } from './pomodoroEngine.js';
import { enableFocusMode, disableFocusMode } from './blocklistService.js';
import { playTrack, pauseAudio } from './audioEngine.js';
import { getStorage, setStorage } from './storage.js';

/**
 * Deep Focus Orchestrator Service
 * One-click workflow triggering Pomodoro, Focus Mode DNR blocking, and ambient music simultaneously.
 */

export async function startDeepFocus() {
  console.log('[Deep Focus] Launching integrated Deep Focus session...');

  // 1. Start Pomodoro Focus Session (25 min default)
  const pomoState = await startPomodoro(MODES.FOCUS);

  // 2. Enable Focus Mode Website Blocking
  await enableFocusMode();

  // 3. Initiate Ambient Sound Playback (if enabled in settings/audio state)
  const audioState = await getStorage('ambientAudioState') || {};
  if (audioState.autoPlayOnDeepFocus !== false) {
    const track = audioState.currentTrack || 'RAIN';
    await playTrack(track);
  }

  // 4. Update Deep Focus Session State in Storage
  const sessionState = {
    active: true,
    startTime: Date.now(),
    pomoMode: pomoState.mode
  };
  await setStorage('deepFocusState', sessionState);

  return sessionState;
}

export async function stopDeepFocus() {
  console.log('[Deep Focus] Stopping Deep Focus session...');

  // 1. Reset Pomodoro Timer
  await resetPomodoro();

  // 2. Disable Website Blocking
  await disableFocusMode();

  // 3. Pause Ambient Audio
  await pauseAudio();

  // 4. Reset Storage Session State
  const resetState = {
    active: false,
    startTime: null
  };
  await setStorage('deepFocusState', resetState);

  return resetState;
}

export async function isDeepFocusActive() {
  const state = await getStorage('deepFocusState');
  return !!(state && state.active);
}
