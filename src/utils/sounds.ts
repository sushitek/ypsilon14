// Web Audio API sound utilities
// All sounds are generated programmatically — no audio files needed.

let audioCtx: AudioContext | null = null;

// AudioContext must be created/resumed after a user gesture
const getContext = (): AudioContext => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
};

// Short mechanical tick for teletype character output
export const playTick = (): void => {
    try {
        const ctx = getContext();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.015);

        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.015);
    } catch (_) {
        // Silently ignore if audio is unavailable
    }
};

// Short retro beep for UI interactions (link clicks)
export const playBeep = (): void => {
    try {
        const ctx = getContext();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.08);
    } catch (_) {
        // Silently ignore if audio is unavailable
    }
};
