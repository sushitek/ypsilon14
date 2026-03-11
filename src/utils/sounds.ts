// Sound utilities using Web Audio API for zero-latency playback
// Files expected: public/sounds/click.mp3, public/sounds/loading.mp3

let ctx: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;
let loadingBuffer: AudioBuffer | null = null;
let loadingSource: AudioBufferSourceNode | null = null;
let loadingGain: GainNode | null = null;

// Fallback HTMLAudioElement for click before AudioBuffer is ready
const clickFallback = new Audio('/sounds/click.mp3');
clickFallback.preload = 'auto';

const getCtx = (): AudioContext => {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
};

const fetchBuffer = async (url: string): Promise<AudioBuffer> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return getCtx().decodeAudioData(arrayBuffer);
};

// Call once after first user gesture to decode and cache both sounds
export const initSounds = async (): Promise<void> => {
    try {
        const context = getCtx();
        if (context.state === 'suspended') await context.resume();
        [clickBuffer, loadingBuffer] = await Promise.all([
            fetchBuffer('/sounds/click.mp3'),
            fetchBuffer('/sounds/loading.mp3'),
        ]);
    } catch (_) {}
};

// Play click — use decoded buffer if ready, fall back to HTMLAudio
export const playClick = (): void => {
    try {
        if (clickBuffer) {
            const context = getCtx();
            const source = context.createBufferSource();
            source.buffer = clickBuffer;
            source.connect(context.destination);
            source.start(0);
        } else {
            clickFallback.currentTime = 0;
            clickFallback.play().catch(() => {});
        }
    } catch (_) {}
};

// Start looping loading sound
export const startLoading = (): void => {
    try {
        if (!loadingBuffer || loadingSource) return;
        const context = getCtx();
        loadingGain = context.createGain();
        loadingGain.connect(context.destination);
        loadingSource = context.createBufferSource();
        loadingSource.buffer = loadingBuffer;
        loadingSource.loop = true;
        loadingSource.connect(loadingGain);
        loadingSource.start(0);
    } catch (_) {}
};

// Stop the loading sound
export const stopLoading = (): void => {
    try {
        if (!loadingSource) return;
        loadingSource.stop();
        loadingSource.disconnect();
        loadingSource = null;
        loadingGain = null;
    } catch (_) {}
};
