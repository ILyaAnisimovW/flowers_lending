/* =========================================================
   MOUSE TRAIL — маленькие лепестки, которые появляются вслед за
   курсором: рождаются в точке движения, разлетаются в случайную
   сторону, крутятся и растворяются за неполную секунду. Тематически
   это тот же язык, что и preloader-mark/about-visual — лепестки
   вокруг бутона, только теперь буквально "осыпаются" за курсором.

   Включается только при точном указателе (мышь) — на тач-экранах
   это бессмысленно, там нет курсора, который "летает" по экрану.
   Уважает prefers-reduced-motion: при нём эффект просто не запускается.
   ========================================================= */

const PETAL_COLORS = ['#E8412C', '#E8A9C4', '#D9748F', '#FAF9F5'];
const MIN_DISTANCE = 14;  // px между соседними лепестками -- иначе будет сплошная "простыня"
const MIN_INTERVAL = 40;  // ms -- доп. троттлинг на случай очень плавного движения мыши
const MAX_PETALS   = 40;  // защитный потолок одновременно живых лепестков на странице
const LIFETIME     = 900; // ms -- должно совпадать с transition-duration в mouse-trail.css

export function initMouseTrail(){
  if (!matchMedia('(pointer:fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const layer = document.createElement('div');
  layer.className = 'mouse-trail-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  let lastX = null, lastY = null, lastT = 0;
  let liveCount = 0;

  function spawnPetal(x, y){
    if (liveCount >= MAX_PETALS) return;
    liveCount++;

    const petal = document.createElement('span');
    petal.className = 'mouse-trail-petal';

    const color = PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0];
    const size  = 8 + Math.random() * 8;
    const rot   = Math.random() * 360;
    const drift = (Math.random() - .5) * 70;   // случайный снос по X
    const fall  = 40 + Math.random() * 45;     // всегда вниз по Y, как настоящий лепесток
    const spin  = (Math.random() - .5) * 220;  // доп. вращение поверх начального угла

    petal.style.left   = x + 'px';
    petal.style.top    = y + 'px';
    petal.style.width  = size + 'px';
    petal.style.height = (size * 1.3) + 'px';
    petal.style.background = color;
    petal.style.setProperty('--rot',   rot   + 'deg');
    petal.style.setProperty('--drift', drift + 'px');
    petal.style.setProperty('--fall',  fall  + 'px');
    petal.style.setProperty('--spin',  spin  + 'deg');

    layer.appendChild(petal);

    // рефлоу перед добавлением класса -- иначе браузер схлопнет
    // "создание в начальном состоянии" и "переход в конечное" в один
    // кадр, и transition просто не сыграет
    requestAnimationFrame(() => petal.classList.add('is-animating'));

    setTimeout(() => {
      petal.remove();
      liveCount--;
    }, LIFETIME);
  }

  window.addEventListener('mousemove', e => {
    const now = performance.now();
    if (lastX !== null){
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist < MIN_DISTANCE || now - lastT < MIN_INTERVAL) return;
    }
    lastX = e.clientX; lastY = e.clientY; lastT = now;
    spawnPetal(e.clientX, e.clientY);
  });
}