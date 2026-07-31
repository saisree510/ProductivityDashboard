import { getStorage, setStorage } from './storage.js';

export const MODES = {
  FOCUS: 'FOCUS',
  SHORT_BREAK: 'SHORT_BREAK',
  LONG_BREAK: 'LONG_BREAK'
};

export const STATES = {
  STOPPED: 'STOPPED',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED'
};

/**
 * Calculates current remaining seconds based on absolute endTime timestamp
 */
export async function getPomodoroState() {
  const current = await getStorage('pomodoroState');
  if (!current) return getDefaultState();

  const settings = await getStorage('settings');
  const defaultFocusDuration = (settings?.pomodoroDurations?.focus || 25) * 60;

  if (current.state === STATES.RUNNING && current.endTime) {
    const remaining = Math.max(0, Math.ceil((current.endTime - Date.now()) / 1000));
    if (remaining === 0 && current.remainingSeconds > 0) {
      // Session finished
      const updated = {
        ...current,
        state: STATES.STOPPED,
        remainingSeconds: 0,
        endTime: null,
        completedCount: current.mode === MODES.FOCUS ? (current.completedCount || 0) + 1 : (current.completedCount || 0)
      };
      await setStorage('pomodoroState', updated);
      return updated;
    }
    return { ...current, remainingSeconds: remaining };
  }

  return current;
}

/**
 * Starts a new Pomodoro session
 */
export async function startPomodoro(mode = MODES.FOCUS) {
  const settings = await getStorage('settings');
  const durations = settings?.pomodoroDurations || { focus: 25, shortBreak: 5, longBreak: 15 };

  let durationMinutes = durations.focus;
  if (mode === MODES.SHORT_BREAK) durationMinutes = durations.shortBreak;
  if (mode === MODES.LONG_BREAK) durationMinutes = durations.longBreak;

  const durationSeconds = durationMinutes * 60;
  const endTime = Date.now() + durationSeconds * 1000;
  const currentState = await getStorage('pomodoroState');

  const newState = {
    mode,
    state: STATES.RUNNING,
    durationSeconds,
    remainingSeconds: durationSeconds,
    endTime,
    completedCount: currentState?.completedCount || 0
  };

  await setStorage('pomodoroState', newState);
  await scheduleAlarm(endTime);
  return newState;
}

/**
 * Pauses active session
 */
export async function pausePomodoro() {
  const state = await getPomodoroState();
  if (state.state !== STATES.RUNNING) return state;

  const updated = {
    ...state,
    state: STATES.PAUSED,
    endTime: null
  };

  await setStorage('pomodoroState', updated);
  await clearAlarm();
  return updated;
}

/**
 * Resumes paused session
 */
export async function resumePomodoro() {
  const state = await getStorage('pomodoroState');
  if (state.state !== STATES.PAUSED || !state.remainingSeconds) return state;

  const endTime = Date.now() + state.remainingSeconds * 1000;
  const updated = {
    ...state,
    state: STATES.RUNNING,
    endTime
  };

  await setStorage('pomodoroState', updated);
  await scheduleAlarm(endTime);
  return updated;
}

/**
 * Skips break and starts next Focus session
 */
export async function skipBreak() {
  return await startPomodoro(MODES.FOCUS);
}

/**
 * Resets Pomodoro timer to stopped default
 */
export async function resetPomodoro() {
  const current = await getStorage('pomodoroState');
  const settings = await getStorage('settings');
  const durationSeconds = (settings?.pomodoroDurations?.focus || 25) * 60;

  const reset = {
    mode: MODES.FOCUS,
    state: STATES.STOPPED,
    durationSeconds,
    remainingSeconds: durationSeconds,
    endTime: null,
    completedCount: current?.completedCount || 0
  };

  await setStorage('pomodoroState', reset);
  await clearAlarm();
  return reset;
}

function getDefaultState() {
  return {
    mode: MODES.FOCUS,
    state: STATES.STOPPED,
    durationSeconds: 1500,
    remainingSeconds: 1500,
    endTime: null,
    completedCount: 0
  };
}

async function scheduleAlarm(endTime) {
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    await chrome.alarms.clear('pomodoro_timer_alarm');
    chrome.alarms.create('pomodoro_timer_alarm', { when: endTime });
  }
}

async function clearAlarm() {
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    await chrome.alarms.clear('pomodoro_timer_alarm');
  }
}
