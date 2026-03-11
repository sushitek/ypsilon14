// Sound utilities using MP3 samples from public/sounds/
// Files expected: public/sounds/click.mp3, public/sounds/loading.mp3

// Preload both sounds at module load time so they are ready instantly
const clickAudio = new Audio('/sounds/click.mp3');
clickAudio.preload = 'auto';

const loadingAudio = new Audio('/sounds/loading.mp3');
loadingAudio.preload = 'auto';
loadingAudio.loop = true;

// Play click.mp3 once on link interaction
export const playClick = (): void => {
    try {
        clickAudio.currentTime = 0;
        clickAudio.play().catch(() => {});
    } catch (_) {}
};

// Start looping loading.mp3 during teletype animation
export const startLoading = (): void => {
    try {
        if (!loadingAudio.paused) return; // already playing
        loadingAudio.currentTime = 0;
        loadingAudio.play().catch(() => {});
    } catch (_) {}
};

// Stop the loading sound
export const stopLoading = (): void => {
    try {
        loadingAudio.pause();
        loadingAudio.currentTime = 0;
    } catch (_) {}
};
