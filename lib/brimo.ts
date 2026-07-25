/**
 * Play Join / Notification Sound Effect
 * @param durationMs Duration in milliseconds (default: 4000ms / 4 seconds)
 * @param audioPath Path to audio file (default: '/join.mp3')
 */
export const playSound = (durationMs: number = 4000, audioPath: string = '/join.mp3') => {
  try {
    const audio = new Audio(`${audioPath}?v=${Date.now()}`);
    audio.currentTime = 0;
    audio.volume = 1.0;

    // Use Web Audio API for volume boost
    if (typeof window !== 'undefined') {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const source = ctx.createMediaElementSource(audio);
          const gainNode = ctx.createGain();
          gainNode.gain.value = 5.0; // Boost volume 2x
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
        }
      } catch (e) {
        // Fallback to standard audio playback
      }
    }

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Playback error:', err);
      });
    }

    // Stop audio after durationMs
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, durationMs);
  } catch (error) {
    console.error('Error playing join sound:', error);
  }
};
