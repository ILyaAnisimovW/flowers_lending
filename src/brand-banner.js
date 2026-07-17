export function initBrandBanner(){
  const section = document.getElementById('brandBanner');
  const inner   = document.getElementById('brandBannerInner');
  if (!section || !inner) return;

  const base = inner.querySelector('.brand-banner-layer--base');
  const red  = inner.querySelector('.brand-banner-layer--red');
  const cyan = inner.querySelector('.brand-banner-layer--cyan');
  const layers = [base, red, cyan];

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- вписываем текст ровно в ширину контейнера ---- */
  function fit(){
    // сбрасываем на заведомо большой фиксированный размер, чтобы
    // scrollWidth измерялся стабильно, независимо от текущего vw-значения
    layers.forEach(l => { l.style.fontSize = '400px'; });
    const naturalWidth = base.scrollWidth;
    const targetWidth = section.clientWidth * 0.98; // почти впритык к краям
    const scale = targetWidth / naturalWidth;
    const size = Math.round(400 * scale);
    layers.forEach(l => { l.style.fontSize = size + 'px'; });
  }

  // мерить размер ДО того как загрузился нужный шрифт -- главная причина,
  // почему надпись получалась маленькой (scrollWidth считался по
  // системному fallback-шрифту с другой шириной букв)
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(fit);
  }
  fit(); // сразу тоже вызываем, чтобы не было пустоты до подгрузки шрифта

  window.addEventListener('resize', () => {
    clearTimeout(section._resizeTimer);
    section._resizeTimer = setTimeout(fit, 150);
  });

  if (reduceMotion) return;

  /* ---- RGB-слои следуют за курсором ---- */
  let targetX = 0, targetY = 0;
  let curX = 0, curY = 0;
  let hovering = false;

  const MAX_SHIFT = 20;

  section.addEventListener('mousemove', e => {
    hovering = true;
    const r = section.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5;
    const py = (e.clientY - r.top) / r.height - .5;
    targetX = px * MAX_SHIFT * 2;
    targetY = py * MAX_SHIFT;
  });

  section.addEventListener('mouseleave', () => {
    hovering = false;
    targetX = 0;
    targetY = 0;
  });

  function tick(){
    curX += (targetX - curX) * .18;
    curY += (targetY - curY) * .18;

    red.style.transform  = `translate(${curX}px, ${curY}px)`;
    cyan.style.transform = `translate(${-curX}px, ${-curY}px)`;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ---- редкий самопроизвольный глитч-скачок в покое ---- */
  function idleGlitch(){
    if (!hovering){
      const rx = (Math.random() - .5) * 12;
      const ry = (Math.random() - .5) * 5;
      gsap.timeline()
        .set(red,  { x: rx, y: ry })
        .set(cyan, { x: -rx, y: -ry })
        .to([red, cyan], { x: 0, y: 0, duration: .18, ease: 'power2.out' }, .06);
    }
    setTimeout(idleGlitch, 2600 + Math.random() * 3200);
  }
  idleGlitch();
}