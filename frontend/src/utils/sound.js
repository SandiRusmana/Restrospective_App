// frontend/src/utils/sound.js
// Audio notification utility with browser Autoplay Policy unlock support

let audioCtx = null;

/**
 * Lazily initialize and return a shared AudioContext instance
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

/**
 * Proactively unlock AudioContext on user interaction (pointerdown, click, touch, keydown)
 * so subsequent programmatic chimes (like timer end) can play seamlessly without being suspended.
 */
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch {
      // Ignore initial interaction unlock errors
    }
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
  };

  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

/**
 * Check if sound preference is enabled in localStorage
 */
export const isSoundEnabled = () => {
  try {
    return localStorage.getItem('retro_pref_sound') !== 'false';
  } catch {
    return true;
  }
};

/**
 * Play a synthesized chime using Web Audio API
 * @param {'timer' | 'preview' | 'test' | 'icebreaker' | 'alert'} type
 */
export const playChime = async (type = 'timer') => {
  if (!isSoundEnabled() && type !== 'test' && type !== 'preview') {
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.6, now);
    masterGain.connect(ctx.destination);

    if (type === 'timer') {
      // Pleasant 3-tone notification chime: E5 (659.25Hz) -> G#5 (830.61Hz) -> B5 (987.77Hz)
      const notes = [
        { freq: 659.25, time: 0, duration: 0.45 },
        { freq: 830.61, time: 0.16, duration: 0.5 },
        { freq: 987.77, time: 0.34, duration: 0.9 },
      ];

      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        // Smooth attack and decay envelope
        noteGain.gain.setValueAtTime(0.0001, now + time);
        noteGain.gain.linearRampToValueAtTime(0.4, now + time + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });
    } else if (type === 'preview' || type === 'test') {
      // Harmonious two-tone ding-dong: D5 (587.33Hz) -> A5 (880Hz)
      const notes = [
        { freq: 587.33, time: 0, duration: 0.35 },
        { freq: 880.0, time: 0.15, duration: 0.7 },
      ];

      notes.forEach(({ freq, time, duration }) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        noteGain.gain.setValueAtTime(0.0001, now + time);
        noteGain.gain.linearRampToValueAtTime(0.4, now + time + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + time + duration);

        osc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(now + time);
        osc.stop(now + time + duration);
      });
    } else if (type === 'icebreaker') {
      // Fun ascending chime
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3); // C6

      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch (err) {
    console.warn('[Sound] Gagal memutar efek suara:', err);
  }
};
