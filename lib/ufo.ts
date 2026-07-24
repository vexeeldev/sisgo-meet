export const launchUFO = () => {
  const ufo = document.createElement('img');
  
  ufo.src = '/ufo.gif?v=' + Date.now(); 
  ufo.style.position = 'fixed';
  ufo.style.top = '10%';
  ufo.style.left = '-200px';
  ufo.style.height = '120px';
  ufo.style.zIndex = '9999';
  ufo.style.pointerEvents = 'none';
  
  document.body.appendChild(ufo);

  const duration = 6000; 

  ufo.animate([
    { left: '-200px', transform: 'translateY(0px) rotate(10deg)' },
    { left: '40vw', transform: 'translateY(100px) scale(1.5) rotate(0deg)' },
    { left: '110vw', transform: 'translateY(-50px) rotate(-10deg)' }
  ], {
    duration: duration,
    easing: 'ease-in-out',
    fill: 'forwards'
  });

  setTimeout(() => {
    ufo.remove();
  }, duration + 500);
};
