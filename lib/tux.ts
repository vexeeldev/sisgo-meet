export const launchTux = () => {
  const tux = document.createElement('img');
  
  tux.src = '/tux.gif?v=' + Date.now(); 
  tux.style.position = 'fixed';
  tux.style.bottom = '10px';
  tux.style.left = '-200px';
  tux.style.height = '150px';
  tux.style.zIndex = '9999';
  tux.style.pointerEvents = 'none';
  
  document.body.appendChild(tux);

  const duration = 12000; // 12 seconds (penguins waddle slowly)

  // Horizontal movement (Left to Right)
  tux.animate([
    { left: '-200px' },
    { left: '110vw' } 
  ], {
    duration: duration,
    easing: 'linear',
    fill: 'forwards'
  });

  setTimeout(() => {
    tux.remove();
  }, duration + 500);
};
