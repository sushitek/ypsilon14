// Sound utilities using Web Audio API for zero-latency playback
// Files expected: public/sounds/click.mp3, public/sounds/loading.mp3

let ctx: AudioContext | null = null;
let clickBuffer: AudioBuffer | null = null;
let loadingBuffer: AudioBuffer | null = null;
let loadingSource: AudioBufferSourceNode | null = null;
let pendingLoadingStart: boolean = false;

// Fallback HTMLAudioElement for click before AudioBuffer is ready
const clickFallback = new Audio('/sounds/click.mp3');
clickFallback.preload = 'auto';

const getCtx = (): AudioContext => {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctx;
};

const fetchAndDecode = async (url: string): Promise<AudioBuffer> => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    // Use a temporary context just for decoding if main ctx not yet created
    const context = getCtx();
    return context.decodeAudioData(arrayBuffer);
};

// Fetch and decode both buffers immediately at module load (no gesture needed for fetch)
(async () => {
    try {
        [clickBuffer, loadingBuffer] = await Promise.all([
            fetchAndDecode('/sounds/click.mp3'),
            fetchAndDecode('/sounds/loading.mp3'),
        ]);
        // If startLoading was called before buffers were ready, start now
        if (pendingLoadingStart) {
            pendingLoadingStart = false;
            startLoading();
        }
    } catch (_) {}
})();

// Call on first user gesture to resume AudioContext (required by iOS/Safari)
export const initSounds = (): void => {
    try {
        const context = getCtx();
        if (context.state === 'suspended') context.resume().catch(() => {});
    } catch (_) {}
};

// Play click — use decoded buffer if ready, fall back to HTMLAudio
export const playClick = (): void => {
    try {
        if (clickBuffer && ctx && ctx.state === 'running') {
            const source = ctx.createBufferSource();
            source.buffer = clickBuffer;
            source.connect(ctx.destination);
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
        if (loadingSource) return; // already playing
        if (!loadingBuffer || !ctx || ctx.state !== 'running') {
            // Buffer not ready or context not resumed yet — flag to start when ready
            pendingLoadingStart = true;
            return;
        }
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        loadingSource = ctx.createBufferSource();
        loadingSource.buffer = loadingBuffer;
        loadingSource.loop = true;
        loadingSource.connect(gain);
        loadingSource.start(0);
    } catch (_) {}
};

// Stop the loading sound
export const stopLoading = (): void => {
    try {
        pendingLoadingStart = false;
        if (!loadingSource) return;
        loadingSource.stop();
        loadingSource.disconnect();
        loadingSource = null;
    } catch (_) {}
};
