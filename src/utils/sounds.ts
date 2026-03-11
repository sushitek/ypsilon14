// Sound utilities using MP3 samples from public/sounds/
// Files expected: public/sounds/click.mp3, public/sounds/loading.mp3

let loadingAudio: HTMLAudioElement | null = null;

// Play click.mp3 once on link interaction
export const playClick = (): void => {
    try {
        const audio = new Audio('/sounds/click.mp3');
        audio.play().catch(() => {});
    } catch (_) {}
};

// Start looping loading.mp3 during teletype animation
export const startLoading = (): void => {
    try {
        if (loadingAudio) return; // already playing
        loadingAudio = new Audio('/sounds/loading.mp3');
        loadingAudio.loop = true;
        loadingAudio.play().catch(() => {});
    } catch (_) {}
};

// Stop the loading sound
export const stopLoading = (): void => {
    try {
        if (!loadingAudio) return;
        loadingAudio.pause();
        loadingAudio.currentTime = 0;
        loadingAudio = null;
    } catch (_) {}
};
