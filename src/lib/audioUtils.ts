// Shared AudioContext singleton (lazy-initialized, reused across VAD + audio cues)
let audioCtx: AudioContext | null = null;

export function getOrCreateAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('AudioContext is not supported in this environment');
    }
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Two ascending tones (~200ms) — played when listening starts.
 * C5 (523Hz) 80ms → E5 (659Hz) 80ms, sine wave, quick gain envelope.
 */
export function playListeningChime(): void {
  try {
    const ctx = getOrCreateAudioContext();
    const now = ctx.currentTime;

    // First tone: C5
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 523;
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain1.gain.linearRampToValueAtTime(0, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.1);

    // Second tone: E5
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 659;
    gain2.gain.setValueAtTime(0, now + 0.1);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.11);
    gain2.gain.linearRampToValueAtTime(0, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.22);
  } catch (error) {
    console.debug('Failed to play listening chime:', error);
  }
}

/**
 * Single descending note (~150ms) — played when silence detected / recording stops.
 * G4 (392Hz) → E4 (330Hz) slide, softer gain.
 */
export function playConfirmationTone(): void {
  try {
    const ctx = getOrCreateAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392, now);
    osc.frequency.linearRampToValueAtTime(330, now + 0.15);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  } catch (error) {
    console.debug('Failed to play confirmation tone:', error);
  }
}
