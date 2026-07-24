export const launchWalkingCat = () => {
  const cat = document.createElement('img');
  // Menggunakan GIF Tangy lokal yang sudah dihapus background putihnya (plus cache-buster)
  cat.src = '/tangy.gif?v=' + Date.now(); 
  cat.style.position = 'fixed';
  cat.style.bottom = '10px';
  cat.style.right = '-200px';
  cat.style.height = '150px';
  cat.style.zIndex = '9999';
  cat.style.pointerEvents = 'none';
  // Note: GIF provided has a solid white background, so removing drop-shadow to make it look slightly less boxy
  
  document.body.appendChild(cat);

  const duration = 8000; // 8 seconds to walk across (slower)

  // Horizontal movement
  cat.animate([
    { right: '-200px' },
    { right: '110vw' } 
  ], {
    duration: duration,
    easing: 'linear',
    fill: 'forwards'
  });

  setTimeout(() => {
    cat.remove();
  }, duration + 500);
};
