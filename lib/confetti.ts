import confetti from 'canvas-confetti';

export const launchConfetti = () => {
  const duration = 4 * 1000;
  const animationEnd = Date.now() + duration;

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    // High intensity particles
    const particleCount = 150 * (timeLeft / duration);

    // Left heavy cannon
    confetti({
      particleCount: particleCount / 2,
      angle: 60,
      spread: 80,
      origin: { x: -0.1, y: 0.8 },
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
      zIndex: 9999,
      startVelocity: 70,
    });
    
    // Right heavy cannon
    confetti({
      particleCount: particleCount / 2,
      angle: 120,
      spread: 80,
      origin: { x: 1.1, y: 0.8 },
      colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
      zIndex: 9999,
      startVelocity: 70,
    });
    
    // Center fireworks popping everywhere
    confetti({
      particleCount: particleCount,
      spread: 360,
      startVelocity: 40,
      ticks: 100,
      origin: { x: randomInRange(0.1, 0.9), y: randomInRange(0.1, 0.5) },
      colors: ['#ffc0cb', '#ffd700', '#ff69b4', '#8a2be2', '#00ff7f', '#ffffff'],
      zIndex: 9999,
    });
  }, 250);
};
