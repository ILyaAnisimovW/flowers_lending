import './style.css';
import { initBrandBanner } from './brand-banner.js';
import { initContactPanel } from './contact-panel.js';
import { initMobileNav } from './nav-mobile.js';
if (typeof gsap === 'undefined') {
  console.warn('GSAP не загрузился — анимации отключены, но контент должен отрисоваться.');
  window.gsap = {
    to: () => {},
    timeline: () => ({ to: () => ({ set: () => ({ to: () => {} }) }), set: () => ({ to: () => {} }) }),
    set: () => {},
  };
}
/* ================= CUSTOM CURSOR (same as main page) ================= */
const cursor = document.getElementById('cursor');
if (matchMedia('(pointer:fine)').matches) {
  window.addEventListener('mousemove', e => {
    gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: .15, ease: 'power2.out' });
  });
  document.addEventListener('mouseover', e => {
    if (e.target.closest('a,button')) gsap.to(cursor, { width: 56, height: 56, duration: .25 });
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('a,button')) gsap.to(cursor, { width: 34, height: 34, duration: .25 });
  });
} else if (cursor) {
  cursor.style.display = 'none';
}

/* ================= MAGNETIC BUTTONS (same as main page) ================= */
document.querySelectorAll('.btn-primary, .btn-ghost, .btn-ghost-dark, .nav-cta').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    gsap.to(btn, { x: x * .3, y: y * .3, duration: .3, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: .4, ease: 'elastic.out(1,0.4)' });
  });
});

/* ================= REVIEW DATA (tiled across the wall, on loop) ================= */
const reviews = [
  { name:'Анна К.',       initials:'АК', order:'«Ромашковое облако»', rating:5, quote:'Заказывала маме на день рождения — привезли ровно то, что было на фото.' },
  { name:'Дмитрий М.',    initials:'ДМ', order:'«Полевой букет»',     rating:5, quote:'Курьер написал за 15 минут раньше срока. Простоял почти две недели.' },
  { name:'Елена С.',      initials:'ЕС', order:'«Утренний персик»',   rating:5, quote:'Разбор состава на сайте — гениальная штука, видно за что платишь.' },
  { name:'Мария В.',      initials:'МВ', order:'«Нежный флирт»',      rating:5, quote:'Заказала вслепую по фото и не пожалела — очень нежно и стильно.' },
  { name:'Игорь П.',      initials:'ИП', order:'«Тихий шёпот»',       rating:4, quote:'Красиво, но один бутон подвял на второй день. В остальном супер.' },
  { name:'Ольга Т.',      initials:'ОТ', order:'«Ромашковое облако»', rating:5, quote:'Огромный, воздушный, простоял почти три недели без потерь.' },
  { name:'Сергей Н.',     initials:'СН', order:'«Полевой букет»',     rating:5, quote:'Собрал сам через сайт за пару минут — удобно и быстро.' },
  { name:'Виктория Л.',   initials:'ВЛ', order:'«Утренний персик»',   rating:5, quote:'Открытка от руки — маленькая деталь, а трогает больше всего.' },
  { name:'Артём Ф.',      initials:'АФ', order:'«Нежный флирт»',      rating:5, quote:'Доставили за 40 минут, хотя обещали час. Приятно удивлён.' },
  { name:'Кристина Р.',   initials:'КР', order:'«Тихий шёпот»',       rating:4, quote:'Красивый, но хотелось бы больше зелени внутри.' },
  { name:'Павел Д.',      initials:'ПД', order:'«Ромашковое облако»', rating:5, quote:'Жена в восторге — говорит, лучший букет за все годы.' },
  { name:'Наталья Ж.',    initials:'НЖ', order:'«Полевой букет»',     rating:5, quote:'Пахнет настоящим летом, а не магазином. Очень живой букет.' },
  { name:'Алексей Б.',    initials:'АБ', order:'«Утренний персик»',   rating:5, quote:'Заказывал три раза подряд — состав каждый раз новый, но всегда красиво.' },
  { name:'Юлия К.',       initials:'ЮК', order:'«Нежный флирт»',      rating:5, quote:'Курьер прислал фото у двери — удобно, когда получателя нет дома.' },
  { name:'Роман С.',      initials:'РС', order:'«Тихий шёпот»',       rating:5, quote:'Оформление без лишней мишуры — прямо мой вкус.' },
  { name:'Дарья М.',      initials:'ДМ', order:'«Ромашковое облако»', rating:5, quote:'Заказывала на свадьбу подруге — все гости спрашивали, откуда цветы.' },
  { name:'Владимир Т.',   initials:'ВТ', order:'«Полевой букет»',     rating:4, quote:'Хорошо, но привезли на 20 минут позже обещанного.' },
  { name:'Екатерина Н.',  initials:'ЕН', order:'«Утренний персик»',   rating:5, quote:'Абонемент на месяц — теперь получаю букет каждую пятницу, красота.' },
];

/* ================= INFINITE FISHEYE-LENS WALL =================
   Two things changed from the previous version:

   1. INFINITE PAN. Instead of a finite grid clamped to its own edges,
      the grid is only ever built slightly larger than the viewport,
      and the drag offset is applied to it modulo one tile pitch. Since
      the offset wraps back into the same [-pitch, 0) range no matter
      how far you've dragged, the pattern just keeps recycling forever
      -- true infinite scroll, without ever creating (or needing) more
      DOM nodes than fit on screen plus a one-tile buffer.

   2. HONEST "ACTIVE" CARD. The old version relied on native
      mouseenter/mouseleave -- which breaks here, because the lens
      itself pushes the card out from under the cursor the instant it
      starts reacting, so the hover state flickers or never sticks.
      Instead, every frame we simply find whichever card's center is
      currently closest to the (smoothed) cursor position and treat
      *that* one as active -- it stops being pushed away, grows the
      most, gets a border/glow and top z-index, while its neighbours
      still part around it. That's independent of the DOM's own hover
      tracking, so it can't desync from what the cursor is actually
      sitting on. */
function initReviewWall(){
  const stage = document.getElementById('wallStage');
  const grid  = document.getElementById('wallGrid');
  const panel = document.getElementById('reviewDetailPanel');
  if (!stage || !grid) return;

  const canHover = matchMedia('(pointer:fine)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let cards = [];
  let cellW, cellH, pitchW, pitchH;
  let panX = 0, panY = 0;                  // unbounded logical pan
  let mouseX = -9999, mouseY = -9999;      // raw, stage-local
  let lensX = -9999, lensY = -9999;        // smoothed toward mouse
  let dragging = false;
  let dragMoved = false;
  let dragStartX = 0, dragStartY = 0;
  let panStartX = 0, panStartY = 0;
  let activeCard = null;

  const LENS_RADIUS = 300;   // px influence radius of the lens
  const MAX_SCALE    = 0.4;  // extra scale for cards inside the lens
  const ACTIVE_SCALE = 0.85; // extra scale for the one active card
  const MAX_PUSH     = 46;   // px radial push at the very center
  const MAX_TILT     = 10;   // deg

  const wrap = (v, m) => ((v % m) + m) % m;

  function renderPanel(r){
    if (!panel) return;
    panel.innerHTML = `
      <div class="review-detail-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
      <p class="review-detail-quote">${r.quote}</p>
      <div class="review-detail-person">
        <span class="review-detail-avatar">${r.initials}</span>
        <div>
          <div class="review-detail-name">${r.name}</div>
          <div class="review-detail-order">${r.order}</div>
        </div>
      </div>`;
  }

  function build(){
    grid.innerHTML = '';
    activeCard = null;
    const narrow = window.innerWidth < 700;

    cellW = narrow ? 128 : 178;
    cellH = narrow ? 100 : 138;
    const gap = narrow ? 12 : 18;
    pitchW = cellW + gap;
    pitchH = cellH + gap;

    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;

    // Enough tiles to cover the viewport plus a one-tile buffer on every
    // side -- that buffer is exactly what the modulo wrap needs to never
    // show a gap, no matter where the wrapped offset currently sits.
    const cols = Math.ceil(stageW / pitchW) + 2;
    const rows = Math.ceil(stageH / pitchH) + 2;

    cards = [];
    let n = 0;
    for (let row = 0; row < rows; row++){
      for (let col = 0; col < cols; col++, n++){
        const r = reviews[n % reviews.length];
        const baseX = col * pitchW;
        const baseY = row * pitchH;
        const bobSeed = Math.random() * Math.PI * 2;

        const el = document.createElement('div');
        el.className = 'wall-card';
        el.style.width = cellW + 'px';
        el.style.height = cellH + 'px';
        el.style.left = baseX + 'px';
        el.style.top = baseY + 'px';
        el.innerHTML = `
          <div class="wall-card-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
          <p class="wall-card-quote">${r.quote}</p>
          <div class="wall-card-person">
            <span class="wall-card-avatar">${r.initials}</span>
            <div>
              <div class="wall-card-name">${r.name}</div>
              <div class="wall-card-order">${r.order}</div>
            </div>
          </div>`;
        grid.appendChild(el);

        const card = { el, data: r, baseX, baseY, bobSeed };

        if (!canHover){
          // Touch: no cursor to chase, so tapping a card is what selects it.
          el.addEventListener('click', () => {
            const wasActive = card === activeCard;
            if (activeCard) activeCard.el.classList.remove('is-active');
            activeCard = wasActive ? null : card;
            if (activeCard){
              activeCard.el.classList.add('is-active');
              renderPanel(activeCard.data);
              if (panel) panel.classList.add('is-visible');
            } else if (panel){
              panel.classList.remove('is-visible');
            }
          });
        }

        cards.push(card);
      }
    }
  }

  let t = 0;
  function frame(){
    t++;
    lensX += (mouseX - lensX) * .16;
    lensY += (mouseY - lensY) * .16;

    const dpX = wrap(panX, pitchW) - pitchW;
    const dpY = wrap(panY, pitchH) - pitchH;
    grid.style.transform = `translate(${dpX}px, ${dpY}px)`;

    // Pass 1: who is actually closest to the cursor right now?
    if (canHover){
      let nearest = null, nearestDist = Infinity;
      cards.forEach(c => {
        const cx = c.baseX + cellW / 2 + dpX;
        const cy = c.baseY + cellH / 2 + dpY;
        const d = Math.hypot(cx - lensX, cy - lensY);
        if (d < nearestDist){ nearestDist = d; nearest = c; }
      });
      const ACTIVE_THRESHOLD = Math.min(cellW, cellH) * 0.62;
      const newActive = (nearest && nearestDist < ACTIVE_THRESHOLD) ? nearest : null;
      if (newActive !== activeCard){
        if (activeCard) activeCard.el.classList.remove('is-active');
        activeCard = newActive;
        if (activeCard){
          activeCard.el.classList.add('is-active');
          renderPanel(activeCard.data);
          if (panel) panel.classList.add('is-visible');
        } else if (panel){
          panel.classList.remove('is-visible');
        }
      }
    }

    // Pass 2: position/color every card for this frame.
    cards.forEach(c => {
      const cx = c.baseX + cellW / 2 + dpX;
      const cy = c.baseY + cellH / 2 + dpY;
      const dx = cx - lensX;
      const dy = cy - lensY;
      const dist = Math.hypot(dx, dy);
      const bob = reduceMotion ? 0 : Math.sin(t * 0.012 + c.bobSeed) * 2.5;
      const isActive = c === activeCard;

      let scale, pushX, pushY, rotX, rotY;

      if (isActive){
        // The star of the show: stops running away from the cursor,
        // grows the most, stays flat and readable.
        scale = 1 + MAX_SCALE + ACTIVE_SCALE;
        pushX = 0;
        pushY = bob;
        rotX = 0; rotY = 0;
      } else {
        let factor = 0;
        if (dist < LENS_RADIUS){
          const linear = 1 - dist / LENS_RADIUS;
          factor = linear * linear * (3 - 2 * linear); // smoothstep falloff
        }
        const push = factor * MAX_PUSH;
        const nx = dist > 0.01 ? dx / dist : 0;
        const ny = dist > 0.01 ? dy / dist : 0;
        scale = 1 + factor * MAX_SCALE;
        pushX = nx * push;
        pushY = ny * push + bob;
        rotY = -nx * factor * MAX_TILT;
        rotX =  ny * factor * MAX_TILT;

        const warmth = Math.min(factor * 1.3, 1);
        c.el.style.filter = `grayscale(${(1 - warmth).toFixed(2)}) brightness(${(0.66 + warmth * 0.4).toFixed(2)})`;
        c.el.style.zIndex = Math.round(100 + factor * 300);
      }

      c.el.style.transform =
        `translate(${pushX.toFixed(1)}px, ${pushY.toFixed(1)}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;

      if (isActive){
        c.el.style.filter = 'grayscale(0) brightness(1.08) saturate(1.15)';
        c.el.style.zIndex = 1000;
      }
    });

    requestAnimationFrame(frame);
  }

  build();
  requestAnimationFrame(frame);

  if (canHover){
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect();
      mouseX = e.clientX - r.left;
      mouseY = e.clientY - r.top;
    });
    stage.addEventListener('mouseleave', () => {
      mouseX = -9999; mouseY = -9999;
    });
  }

  // Drag to pan -- no clamping, the wrap in frame() makes any offset valid.
  stage.addEventListener('pointerdown', e => {
    dragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
  });
  function endDrag(){ dragging = false; }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => {
    clearTimeout(stage._resizeTimer);
    stage._resizeTimer = setTimeout(build, 200);
  });
}
initReviewWall();
initBrandBanner();
initContactPanel();
initMobileNav();
/* ================= NAV: stays solid on this page (single dark section
   above a light footer, no need for the scroll-hide dance used on the
   home page) -- nothing to wire up here, nav--solid is set in the HTML. */