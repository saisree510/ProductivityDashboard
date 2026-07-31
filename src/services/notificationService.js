import { pauseAudio } from './audioEngine.js';

let audioCtx = null;

/**
 * Synthesizes a soft, pleasant 3-note harmonic completion chime (C5 - E5 - G5)
 */
export function playCompletionChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    audioCtx = new AudioCtx();
    const now = audioCtx.currentTime;

    const notes = [
      { freq: 523.25, time: now },       // C5
      { freq: 659.25, time: now + 0.15 }, // E5
      { freq: 783.99, time: now + 0.3 }   // G5
    ];

    notes.forEach(note => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, note.time);

      gain.gain.setValueAtTime(0, note.time);
      gain.gain.linearRampToValueAtTime(0.2, note.time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, note.time + 0.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(note.time);
      osc.stop(note.time + 0.85);
    });
  } catch (err) {
    console.warn('[Notification Service] Chime audio error:', err);
  }
}

/**
 * Triggers full completion experience (chime, music fade-out, Chrome notification, and modal trigger)
 */
export async function triggerSessionCompletion(isFocusSession = true) {
  // 1. Play Soft Harmonic Chime Melody
  playCompletionChime();

  // 2. Fade Out Ambient Music
  try {
    await pauseAudio();
  } catch (e) {
    // Ignore audio pause errors
  }

  // 3. Trigger Native Chrome Notification
  if (typeof chrome !== 'undefined' && chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'index.html',
      title: isFocusSession ? 'Focus Session Complete! 🍅' : 'Break Time Complete! 🔔',
      message: isFocusSession ? 'Great job! Time to take a well-deserved break.' : 'Ready to resume your deep focus?',
      priority: 2
    });
  }

  // 4. Dispatch Event for Completion Modal UI
  window.dispatchEvent(new CustomEvent('pomodoro-completed', {
    detail: { isFocusSession }
  }));
}
