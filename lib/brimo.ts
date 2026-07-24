/**
 * Play BRI Mo Sound Effect Prank
 * @param durationMs Duration in milliseconds (default: 2000ms / 2 seconds)
 * @param audioPath Path to audio file (default: '/sayaakanlawan.mp3')
 */
export const playSound = (durationMs: number = 2000, audioPath: string = '/brimo.mp3') => {
  try {
    const audio = new Audio(`${audioPath}?v=${Date.now()}`);
    audio.currentTime = 0;
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Playback error:', err);
      });
    }

    // Stop audio after durationMs (default 2 seconds)
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, durationMs);
  } catch (error) {
    console.error('Error playing BRI Mo prank sound:', error);
  }
};
