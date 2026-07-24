export const launchBalloons = () => {
  const balloonCount = 30;
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  const colors = [
    'hue-rotate(0deg)', // red
    'hue-rotate(90deg)', // green-ish
    'hue-rotate(180deg)', // blue-ish
    'hue-rotate(270deg)', // purple-ish
    'hue-rotate(45deg)', // orange/yellow
    'hue-rotate(300deg)' // pink
  ];

  for (let i = 0; i < balloonCount; i++) {
    const balloon = document.createElement('div');
    balloon.innerText = '🎈';
    balloon.style.position = 'absolute';
    
    const size = Math.random() * 3 + 2; // 2rem to 5rem
    balloon.style.fontSize = `${size}rem`;
    
    const filter = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.filter = filter;
    
    // Random start position at the bottom
    const startX = Math.random() * 100;
    balloon.style.left = `${startX}vw`;
    balloon.style.bottom = `-${size + 2}rem`;

    container.appendChild(balloon);

    // Animate
    const duration = Math.random() * 4000 + 4000; // 4 to 8 seconds
    const delay = Math.random() * 2000; // 0 to 2 seconds delay
    const swayAmount = (Math.random() - 0.5) * 20; // -10vw to +10vw sway

    balloon.animate([
      { transform: 'translateY(0) rotate(0deg) translateX(0)', opacity: 0 },
      { opacity: 1, offset: 0.1 },
      { transform: `translateY(-120vh) rotate(${swayAmount}deg) translateX(${swayAmount}vw)`, opacity: 0.8, offset: 1 }
    ], {
      duration: duration,
      delay: delay,
      easing: 'cubic-bezier(0.37, 0, 0.63, 1)',
      fill: 'forwards'
    });
  }

  // Cleanup after all animations are definitely done
  setTimeout(() => {
    container.remove();
  }, 12000);
};
