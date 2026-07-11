import './style.css';
import { initFAQ } from './faq.js';

gsap.registerPlugin(ScrollTrigger);

/* Layout keeps shifting after this script first runs -- late-loading web
   fonts change text metrics (hence section heights), and the preloader's
   own removal flips body from a locked/hidden-overflow state back to
   normal, both of which move where every section actually starts/ends on
   the page. Any ScrollTrigger created before those settle is working off
   stale coordinates -- which is exactly what causes a scroll-linked
   effect to "sometimes" not fire: the trigger's start/end no longer
   matches where the element really is by the time the person scrolls
   there. Forcing a refresh once things stabilize keeps every trigger
   accurate. */
window.addEventListener('load', () => ScrollTrigger.refresh());
if (document.fonts && document.fonts.ready){
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

document.body.classList.add('is-loading');

/* ================= PRELOADER ================= */
const counterNum = document.getElementById('counterNum');
const counterBar = document.getElementById('counterBar');
const preloader = document.getElementById('preloader');
const preloaderStack = document.getElementById('preloaderStack');

/* build a small overlapping stack of bouquet cards, fanned with slight rotation */
const stackImages = [
  '/images/bouquet-flirt.png',
  '/images/bouquet-field.png',
  '/images/bouquet-peach.png',
  '/images/bouquet-cloud.png',
  '/images/bouquet-whisper.png',
];
const stackRot   = [-11, 7, -5, 12, -3];
const stackShift = [[-7,-5], [6,-3], [-4,6], [8,3], [-2,-8]];

stackImages.forEach(src => {
  const card = document.createElement('div');
  card.className = 'preloader-card';
  card.innerHTML = `<img src="${src}" alt="">`;
  preloaderStack.appendChild(card);
});

const cards = preloaderStack.querySelectorAll('.preloader-card');

gsap.set(cards, { opacity: 0, scale: .3, y: 26, rotate: 0 });
gsap.to(cards, {
  opacity: 1,
  scale: 1,
  y: (i) => stackShift[i][1],
  x: (i) => stackShift[i][0],
  rotate: (i) => stackRot[i],
  duration: .5,
  stagger: .07,
  ease: 'back.out(2.2)',
  delay: .05
});

const counterObj = { val: 0 };
gsap.to(counterObj, {
  val: 100,
  duration: 1.35,
  delay: .15,
  ease: 'power1.inOut',
  onUpdate: () => {
    const v = Math.round(counterObj.val);
    counterNum.textContent = v;
    counterBar.style.width = v + '%';
  },
  onComplete: runIntro
});

function runIntro(){
  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      document.body.classList.remove('is-loading');
      ScrollTrigger.refresh(); // body just went from overflow:hidden/locked back to normal -- section positions may have shifted
    }
  });

  tl.to(cards, {
      opacity: 0, scale: .35, y: '-=18',
      duration: .3, stagger: .025, ease: 'power3.in'
    })
    .to('.preloader-meta, .preloader-bar, .preloader-label', {
      opacity: 0, y: -6, duration: .25, ease: 'power2.in'
    }, '<')
    .to('.preloader', { opacity: 0, duration: .3, ease: 'power2.out' }, '-=.12')
    .add(playHero, '-=.2');
}

/* ================= SHOWCASE ENTRANCE (fires after preloader) ================= */
function playHero(){
  gsap.from('.showcase-tags, .showcase-title, .showcase-desc, .showcase-meta, .showcase-see-all', {
    opacity: 0, y: 26, duration: .8, stagger: .08, ease: 'power3.out', delay: .1
  });
  gsap.from('.showcase-media', { opacity: 0, scale: .92, duration: 1, ease: 'power2.out', delay: .18 });
  gsap.delayedCall(1.1, startShowcase);
}

/* ================= SHOWCASE (rotating hits, apechain-style glitch swap) ================= */
const showcaseItems = [
  { name:'Нежный флирт',      desc:'Розовые и белые альстромерии в нежной упаковке',       price:'2 800 ₽', img:'/images/bouquet-flirt.png',    cat:'Хит недели'  },
  { name:'Полевой букет',     desc:'Ромашки, зелень и полевые травы',                       price:'2 400 ₽', img:'/images/bouquet-field.png',    cat:'Бестселлер'  },
  { name:'Утренний персик',   desc:'Пионовидные розы, ромашки и гвоздика',                  price:'3 100 ₽', img:'/images/bouquet-peach.png',    cat:'Новинка'     },
  { name:'Ромашковое облако', desc:'Огромная шапка хризантем с гипсофилой',                 price:'4 500 ₽', img:'/images/bouquet-cloud.png',    cat:'Премиум'     },
  { name:'Тихий шёпот',       desc:'Эустома, гвоздика и пастельные тона',                   price:'2 200 ₽', img:'/images/bouquet-whisper.png',  cat:'Топ подарок' },
];

const showcaseTitle   = document.getElementById('showcaseTitle');
const showcaseDesc    = document.getElementById('showcaseDesc');
const showcasePrice   = document.getElementById('showcasePrice');
const showcaseCat     = document.getElementById('showcaseCat');
const showcaseImg     = document.getElementById('showcaseImg');
const showcaseDotsEl  = document.getElementById('showcaseDots');
const showcasePrev    = document.getElementById('showcasePrev');
const showcaseNext    = document.getElementById('showcaseNext');
const showcaseSection = document.getElementById('showcase');

let showcaseIndex = 0;
let showcaseTimer = null;

showcaseItems.forEach((_, i) => {
  const dot = document.createElement('span');
  dot.className = 'showcase-dot' + (i === 0 ? ' active' : '');
  dot.addEventListener('click', () => goToShowcase(i));
  showcaseDotsEl.appendChild(dot);
});
const showcaseDotEls = showcaseDotsEl.querySelectorAll('.showcase-dot');

const SCRAMBLE_CHARS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789*+×';
function scrambleText(el, newText){
  clearInterval(el._scrambleTimer);
  const len = newText.length;
  const totalFrames = 11;
  let frame = 0;
  el._scrambleTimer = setInterval(() => {
    frame++;
    let out = '';
    for (let i = 0; i < len; i++){
      const revealAt = (i / len) * totalFrames;
      if (newText[i] === ' ' || frame >= revealAt + 3) out += newText[i];
      else out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
    }
    el.textContent = out;
    if (frame >= totalFrames + 3){
      clearInterval(el._scrambleTimer);
      el.textContent = newText;
    }
  }, 28);
}

function renderShowcase(i){
  const item = showcaseItems[i];

  scrambleText(showcaseTitle, item.name.toUpperCase());
  showcaseCat.textContent = item.cat.toUpperCase();

  gsap.to(showcaseDesc, { opacity: 0, y: -6, duration: .18, onComplete: () => {
    showcaseDesc.textContent = item.desc;
    gsap.to(showcaseDesc, { opacity: 1, y: 0, duration: .3 });
  }});
  gsap.to(showcasePrice, { opacity: 0, duration: .15, onComplete: () => {
    showcasePrice.textContent = item.price;
    gsap.to(showcasePrice, { opacity: 1, duration: .25 });
  }});

  gsap.to(showcaseImg, { opacity: 0, scale: 1.04, duration: .22, ease: 'power2.in', onComplete: () => {
    showcaseImg.src = item.img;
    gsap.fromTo(showcaseImg, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: .5, ease: 'power2.out' });
  }});
  gsap.fromTo('.showcase-glow', { opacity: .35 }, { opacity: .85, duration: .25, yoyo: true, repeat: 1 });

  showcaseDotEls.forEach((d, idx) => d.classList.toggle('active', idx === i));
}

function goToShowcase(i){
  showcaseIndex = (i + showcaseItems.length) % showcaseItems.length;
  renderShowcase(showcaseIndex);
  resetShowcaseTimer();
}

function resetShowcaseTimer(){
  clearInterval(showcaseTimer);
  showcaseTimer = setInterval(() => goToShowcase(showcaseIndex + 1), 4200);
}

function startShowcase(){
  renderShowcase(0);
  resetShowcaseTimer();
}

showcasePrev.addEventListener('click', () => goToShowcase(showcaseIndex - 1));
showcaseNext.addEventListener('click', () => goToShowcase(showcaseIndex + 1));
showcaseSection.addEventListener('mouseenter', () => clearInterval(showcaseTimer));
showcaseSection.addEventListener('mouseleave', resetShowcaseTimer);

/* ================= BOUQUET DATA (real photos) ================= */
const bouquets = [
  { name:'Нежный флирт',      desc:'Розовые и белые альстромерии в нежной упаковке', price:'2 800 ₽', img:'/images/bouquet-flirt.png',   accent:'#D9748F' },
  { name:'Полевой букет',     desc:'Ромашки, зелень и полевые травы',                price:'2 400 ₽', img:'/images/bouquet-field.png',   accent:'#7DAE5C' },
  { name:'Утренний персик',   desc:'Пионовидные розы, ромашки и гвоздика',           price:'3 100 ₽', img:'/images/bouquet-peach.png',   accent:'#E39A5D' },
  { name:'Ромашковое облако', desc:'Огромная шапка хризантем с гипсофилой',          price:'4 500 ₽', img:'/images/bouquet-cloud.png',   accent:'#E8A9C4' },
  { name:'Тихий шёпот',       desc:'Эустома, гвоздика и пастельные тона',            price:'2 200 ₽', img:'/images/bouquet-whisper.png', accent:'#D98CA3' },
];

initCarousel3D(bouquets);

/* ---- Coverflow: cards sit side by side, offset from the centered one by
   translateX + rotateY + a push back on Z. This is what apechain-style
   showcases actually are -- flat tilted panels receding to each side, not
   a full 360 ring. A ring only shows neighbours if the radius is huge
   relative to card size; with 5 items that either hides them behind the
   front card or shrinks everything. Coverflow shows exactly as many
   neighbours as you want, at a size you control directly. ---- */
function initCarousel3D(items){
  const wrap    = document.getElementById('carousel3dWrap');
  const ring    = document.getElementById('carousel3d');
  const ribbons = document.getElementById('carousel3dRibbons');
  const selectWrap = document.getElementById('carousel3dSelect');
  const capName = document.getElementById('carouselCaptionName');
  const capPrice= document.getElementById('carouselCaptionPrice');
  const capDesc = document.getElementById('carouselCaptionDesc');
  const n = items.length;
  const half = n / 2;

  const narrow = window.innerWidth < 700;
  const wrapH  = wrap.getBoundingClientRect().height || 500;
  const cardW  = Math.round(narrow ? window.innerWidth * .58 : Math.min(520, window.innerWidth * .28));
  const cardH  = Math.round(wrapH * .74);

  const SPACING = Math.round(cardW * (narrow ? .5 : .6)); // px shift per step -- controls how much of a neighbour peeks out
  const TILT    = 34;   // deg rotateY per step away from center
  const DEPTH   = 110;  // px pushed back (negative Z) per step away from center

  wrap.style.perspective = '1700px';
  ring.style.setProperty('--card-w', cardW + 'px');
  ring.style.setProperty('--card-h', cardH + 'px');

  const cardEls = [];
  let hoveredIndex = -1;
  let dragMoved = false;
  const hoverLocal = { x: 0, y: 0 }; // cursor position within the hovered card, -0.5..0.5

  items.forEach((b, i) => {
    const card = document.createElement('div');
    card.className = 'carousel3d-item';
    card.innerHTML = `<img src="${b.img}" alt="${b.name}" loading="lazy" draggable="false">`;
    ring.appendChild(card);
    cardEls.push({ el: card, img: card.querySelector('img'), index: i });

    card.addEventListener('mouseenter', () => { hoveredIndex = i; });
    card.addEventListener('mouseleave', () => {
      if (hoveredIndex === i) hoveredIndex = -1;
      hoverLocal.x = 0; hoverLocal.y = 0;
    });
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      hoverLocal.x = (e.clientX - r.left) / r.width - .5;
      hoverLocal.y = (e.clientY - r.top) / r.height - .5;
    });
    // click any card (front or side) to bring it to center -- ignored if
    // the click was actually the tail end of a drag
    card.addEventListener('click', () => {
      if (dragMoved) return;
      goTo(i);
    });
  });

  const selectBtns = items.map((b, i) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<img src="${b.img}" alt="${b.name}" loading="lazy">`;
    btn.setAttribute('aria-label', b.name);
    btn.addEventListener('click', () => goTo(i));
    selectWrap.appendChild(btn);
    return btn;
  });

  function goTo(i){
    targetPosition = i;
    paused = true; clearTimeout(wrap._autoTimer);
    clearTimeout(wrap._resumeTimer);
    wrap._resumeTimer = setTimeout(() => { paused = false; scheduleAutoAdvance(); }, 2200);
  }

  let position = 0;         // continuous "current index" (float, eased)
  let targetPosition = 0;
  let dragBasePosition = 0;
  let paused = false;
  let dragging = false;
  let dragStartX = 0;
  let t = 0;

  let ribbonX = 0, ribbonTargetX = 0;   // background ribbons drift slightly with the cursor
  let ribbonY = 0, ribbonTargetY = 0;

  let frontIndex = -1;
  function updateCaption(i){
    const item = items[((i % n) + n) % n];
    scrambleText(capName, item.name.toUpperCase());
    scrambleText(capPrice, item.price);
    scrambleText(capDesc, item.desc);

    ribbons.style.setProperty('--ribbon-color', item.accent);

    selectBtns.forEach((b, idx) => b.classList.toggle('active', idx === i));
  }

  // shortest signed distance from `position` to index i, wrapped around n
  function wrappedOffset(i){
    let off = i - position;
    while (off > half)  off -= n;
    while (off < -half) off += n;
    return off;
  }

  function tick(){
    t++;
    position += (targetPosition - position) * (dragging ? 1 : .12);
    ribbonX += (ribbonTargetX - ribbonX) * .06;
    ribbonY += (ribbonTargetY - ribbonY) * .06;
    ribbons.style.transform = `translate(${ribbonX}px, ${ribbonY}px)`;

    const wobble = dragging ? 0 : Math.sin(t * 0.015) * .05;

    cardEls.forEach(({ el, img, index }) => {
      const offset = wrappedOffset(index) + wobble;
      const abs = Math.abs(offset);

      let x = offset * SPACING;
      let z = -abs * DEPTH;
      let rotY = -offset * TILT;
      let rotX = 0;
      let scale = Math.max(1 - abs * .16, .5);
      let opacity = Math.max(1 - abs * .38, 0);
      // the closer a card sits to dead center, the more colour it keeps --
      // fully colour at abs=0, fully grayscale by the time it's a step away
      let grayscale = Math.min(abs / .85, 1);
      let brightness = Math.max(1 - abs * .3, .55);

      if (index === hoveredIndex){
        // hovered card: full colour, a touch bigger, nudged toward the
        // cursor position within it (a light magnetic/parallax tilt)
        scale += .1;
        x += hoverLocal.x * 26 + 10;   // +10 = the small constant rightward nudge on hover
        const yShift = hoverLocal.y * 16;
        rotY += hoverLocal.x * 12;
        rotX = hoverLocal.y * -10;
        z += 40;
        opacity = 1;
        brightness = 1;
        grayscale = 0;
        el.style.transform =
          `translateX(${x}px) translateY(${yShift}px) translateZ(${z}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`;
      } else {
        el.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg) scale(${scale})`;
      }

      el.style.opacity = opacity;
      el.style.zIndex = index === hoveredIndex ? 999 : Math.round((10 - abs) * 10);
      img.style.filter = `grayscale(${grayscale}) contrast(1.1) brightness(${brightness.toFixed(2)})`;
    });

    const rounded = ((Math.round(position) % n) + n) % n;
    if (rounded !== frontIndex){
      frontIndex = rounded;
      updateCaption(rounded);
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  updateCaption(0);

  function step(dir){
    targetPosition += dir;
  }

  /* auto-advance: waits 7s, then steps one card, then waits again --
     any interaction resets the clock */
  function scheduleAutoAdvance(){
    clearTimeout(wrap._autoTimer);
    wrap._autoTimer = setTimeout(() => {
      if (!paused && !dragging) step(1);
      scheduleAutoAdvance();
    }, 7000);
  }
  scheduleAutoAdvance();

  wrap.addEventListener('mouseenter', () => {
    paused = true;
    clearTimeout(wrap._autoTimer);
  });
  wrap.addEventListener('mouseleave', () => {
    paused = false; dragging = false;
    ribbonTargetX = 0; ribbonTargetY = 0;
    scheduleAutoAdvance();
  });
  wrap.addEventListener('mousemove', (e) => {
    const r = wrap.getBoundingClientRect();
    ribbonTargetX = ((e.clientX - r.left) / r.width - .5) * 44;
    ribbonTargetY = ((e.clientY - r.top) / r.height - .5) * 26;
  });

  // Ignore drags that start on the arrow buttons -- setPointerCapture below
  // would otherwise swallow their click event entirely.
  wrap.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault(); // stops the browser's own "drag this image" / text-selection gesture
    dragging = true;
    dragMoved = false;
    dragStartX = e.clientX;
    dragBasePosition = position;
    wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    if (Math.abs(e.clientX - dragStartX) > 6) dragMoved = true;
    position = dragBasePosition - (e.clientX - dragStartX) / SPACING;
    targetPosition = position;
  });
  function endDrag(){
    if (!dragging) return;
    dragging = false;
    const frac = position - dragBasePosition;
    targetPosition = Math.abs(frac) >= 1 / 3
      ? Math.round(dragBasePosition + frac)
      : Math.round(dragBasePosition);
    scheduleAutoAdvance();
  }
  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);

  function clickStep(dir){
    step(dir);
    paused = true; clearTimeout(wrap._autoTimer);
    clearTimeout(wrap._resumeTimer);
    wrap._resumeTimer = setTimeout(() => { paused = false; scheduleAutoAdvance(); }, 2200);
  }
  document.getElementById('carouselPrev').addEventListener('click', () => clickStep(-1));
  document.getElementById('carouselNext').addEventListener('click', () => clickStep(1));
}

/* ================= CUSTOM CURSOR ================= */
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
} else {
  cursor.style.display = 'none';
}

/* ================= SCROLL REVEALS ================= */
document.querySelectorAll('.reveal').forEach(el => {
  if (el.closest('#story')) return; // story gets its own faster fly-in below
  gsap.to(el, {
    opacity: 1, y: 0, duration: .9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

/* Story content flies in via its own independent scroll trigger. Since
   the curtain jumps the scroll position straight to #story's top while
   the tiles are fully covering the screen, this trigger fires right as
   the tiles start opening -- so the content is already rising into
   place by the time the mosaic reveals it. Shorter duration, steeper
   ease, bigger starting offset than the rest of the page's reveals, so
   it reads as "flying up" into frame rather than gently fading in. */
document.querySelectorAll('#story .reveal').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: .45, ease: 'power4.out', delay: i * .05,
    scrollTrigger: { trigger: el, start: 'top 95%' }
  });
});

/* ================= MAGNETIC BUTTONS ================= */
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

/* ================= DISTRICTS LIST (letters ripple outward from 1-2 dots INSIDE the word) =================
   For every district name: split into letters, then pick 1 seed letter
   (short words) or 2 seed letters (longer words, roughly at the 30%/70%
   mark) and mark those with a .seed-dot sitting on top of them, in the
   middle of the word -- not before it. Nothing is visible at load; the
   whole row only starts once it's scrolled to roughly the middle of the
   screen (ScrollTrigger start: 'top 60%').

   Sequence: the seed dot(s) pop in together, then fade out right as the
   letters nearest them begin to grow -- and every other letter follows in
   order of its distance from the nearest seed, so the word visibly builds
   outward from the dot(s) toward both edges rather than left-to-right.
   Each letter's growth uses ease:'steps(5)' instead of a smooth tween, so
   it snaps through five discrete sizes as it lands, reading as a chunky
   jump rather than a glide. */
function initDistrictsReveal(){
  const rows = document.querySelectorAll('.districts-row');
  if (!rows.length || !window.gsap) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  rows.forEach(row => {
    const nameEl = row.querySelector('.districts-name');
    const timeEl = row.querySelector('.districts-time');
    if (!nameEl) return;

    const text = nameEl.textContent.trim();
    const chars = text.split('');
    const letterCount = chars.filter(ch => ch !== ' ').length;

    // 1 seed for short words, 2 for longer ones -- positions given as an
    // index among LETTERS only (spaces don't count), roughly a third and
    // two-thirds of the way through for the 2-seed case.
    const seedPositions = letterCount <= 6
      ? [ Math.floor(letterCount / 2) ]
      : [ Math.round(letterCount * 0.32), Math.round(letterCount * 0.68) ];

    let letterPos = 0;
    nameEl.innerHTML = chars.map(ch => {
      if (ch === ' ') return ' ';
      const isSeed = seedPositions.includes(letterPos);
      const markup = `<span class="letter" data-pos="${letterPos}"><span class="letter-text">${ch}</span>${isSeed ? '<span class="seed-dot"></span>' : ''}</span>`;
      letterPos++;
      return markup;
    }).join('');

    const letterEls = [...nameEl.querySelectorAll('.letter')].map(el => ({
      el,
      textEl: el.querySelector('.letter-text'),
      pos: Number(el.dataset.pos),
      distance: Math.min(...seedPositions.map(s => Math.abs(Number(el.dataset.pos) - s))),
    }));
    const seedDots = nameEl.querySelectorAll('.seed-dot');
    const maxDistance = Math.max(...letterEls.map(l => l.distance), 0);

    if (reduceMotion){
      gsap.set(seedDots, { opacity: 0, scale: 0 });
      gsap.set(letterEls.map(l => l.textEl), { opacity: 1, scale: 1 });
      if (timeEl) gsap.set(timeEl, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(seedDots, { opacity: 0, scale: 0 });
    gsap.set(letterEls.map(l => l.textEl), { opacity: 0, scale: .15 });
    if (timeEl) gsap.set(timeEl, { opacity: 0, y: 6 });

    const RIPPLE_STEP = .05; // seconds added per unit of distance from the nearest seed

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: row,
        start: 'top 60%',
        toggleActions: 'play none none none',
      }
    });

    tl.to(seedDots, { opacity: 1, scale: 1, duration: .22, ease: 'back.out(3)' }, 0)
      .to(seedDots, { opacity: 0, scale: 0, duration: .18, ease: 'power1.in' }, .16);

    letterEls.forEach(({ textEl, distance }) => {
      tl.to(textEl, {
        opacity: 1, scale: 1,
        duration: .32,
        ease: 'steps(5)',
      }, .16 + distance * RIPPLE_STEP);
    });

    if (timeEl){
      tl.to(timeEl, { opacity: 1, y: 0, duration: .4, ease: 'power2.out' }, .16 + maxDistance * RIPPLE_STEP + .28);
    }
  });
}
initDistrictsReveal();

/* ================= FAQ (glass strips, scramble + scroll-invert) ================= */
initFAQ();

/* ================= STORY HOTSPOTS (bouquet breakdown) ================= */

/* Clip a segment (x1,y1)-(x2,y2) against an axis-aligned rectangle and
   return the point where it enters the rectangle (closest to point 1).
   Uses the Liang-Barsky algorithm. Returns null if the segment never
   touches the rectangle. All coordinates are in the same space (here:
   viewport px). */
function intersectSegmentWithRect(x1, y1, x2, y2, rx1, ry1, rx2, ry2){
  const dx = x2 - x1, dy = y2 - y1;
  let tMin = 0, tMax = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rx1, rx2 - x1, y1 - ry1, ry2 - y1];
  for (let i = 0; i < 4; i++){
    if (p[i] === 0){
      if (q[i] < 0) return null; // parallel and outside
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0){
        if (t > tMax) return null;
        if (t > tMin) tMin = t;
      } else {
        if (t < tMin) return null;
        if (t < tMax) tMax = t;
      }
    }
  }
  return { x: x1 + tMin * dx, y: y1 + tMin * dy };
}

/* Recompute every SVG line so it starts at the dot and stops right at the
   edge of its label's bounding box (plus a small gap) -- this guarantees
   the line never overlaps the label text, regardless of text length,
   font, or viewport width. Runs on load and on resize. Desktop only --
   on mobile the lines are hidden entirely (legend list is used instead). */
function updateStoryLines(){
  const stage = document.getElementById('story');
  if (!stage) return;
  if (window.matchMedia('(max-width:880px)').matches) return;

  const stageRect = stage.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) return;

  const GAP = 10; // px breathing room between line end and label box

  stage.querySelectorAll('.story-line').forEach(line => {
    const idx = line.dataset.index;
    const dot   = stage.querySelector(`.story-dot[data-index="${idx}"]`);
    const label = stage.querySelector(`.story-labels-col .story-label[data-index="${idx}"]`);
    if (!dot || !label) return;

    const dotRect   = dot.getBoundingClientRect();
    const labelRect = label.getBoundingClientRect();

    const dotX = dotRect.left + dotRect.width / 2;
    const dotY = dotRect.top + dotRect.height / 2;
    const labelCX = labelRect.left + labelRect.width / 2;
    const labelCY = labelRect.top + labelRect.height / 2;

    const hit = intersectSegmentWithRect(
      dotX, dotY, labelCX, labelCY,
      labelRect.left - GAP, labelRect.top - GAP,
      labelRect.right + GAP, labelRect.bottom + GAP
    );
    const end = hit || { x: labelCX, y: labelCY };

    const x1 = (dotX - stageRect.left) / stageRect.width * 100;
    const y1 = (dotY - stageRect.top) / stageRect.height * 100;
    const x2 = (end.x - stageRect.left) / stageRect.width * 100;
    const y2 = (end.y - stageRect.top) / stageRect.height * 100;

    line.setAttribute('x1', x1.toFixed(2));
    line.setAttribute('y1', y1.toFixed(2));
    line.setAttribute('x2', x2.toFixed(2));
    line.setAttribute('y2', y2.toFixed(2));
  });
}

/* ================= STORY SHAPES (traced outlines, not circles) =================
   Each entry is one label's set of outline(s), as percentages of the RAW
   photo file (bouquet-story.png) -- exactly what the shape-picker tool
   exports. Эвкалипт has several disconnected leaf clusters, so it's an
   array of several point-strings; everything else is a single outline.
   Розы (index 0 и 2) currently share one combined outline since tracing
   each rose individually was impractical -- both labels light up the
   same area until/unless they're split into two separate traces. */
const STORY_SHAPES = {
  0: [ // Пионовидные розы (shared outline, see note above)
    "57.1,60.6 46.7,58.3 38.1,56.6 35.8,53.4 31.4,53.7 25.7,53.4 21.7,50.5 18.4,46.5 19.9,42.0 23.0,37.8 27.0,33.1 32.5,33.1 37.4,30.0 40.9,28.7 44.9,28.6 49.1,31.1 52.0,28.9 55.8,30.7 57.1,32.4 60.8,31.8 65.7,33.1 64.6,34.9 69.0,36.0 70.8,37.8 71.2,40.1 75.7,42.0 76.5,44.7 77.7,47.0 75.9,51.7 72.8,53.4 69.2,53.7 68.1,56.3 64.2,58.3 58.8,60.4"
  ],
  1: [ // Эвкалипт -- 6 отдельных пучков листьев
    "38.3,44.2 38.1,46.2 36.1,45.6 33.8,46.2 35.6,44.2 31.9,43.8 32.5,42.9 30.5,41.6 28.8,40.0 25.2,40.0 22.1,40.4 20.4,38.9 23.9,37.8 27.2,38.6 33.2,40.4 35.4,40.4 38.1,42.7",
    "27.2,35.8 23.7,36.9 22.6,35.1 26.3,32.4 27.2,30.8 32.1,28.8 34.5,30.4 36.7,31.5 33.8,32.2 33.2,34.6 31.0,34.9 29.9,32.6 27.2,33.1",
    "42.0,40.5 40.0,40.0 40.0,38.4 37.8,37.8 41.4,36.9 43.6,38.0 43.4,36.6 41.2,34.0 43.1,32.8 41.4,31.5 42.5,28.9 45.6,30.6 46.9,31.3 47.6,33.7 48.2,35.5 51.8,36.9 50.0,38.6 46.7,37.5 44.2,38.4",
    "62.4,32.0 63.9,30.2 67.9,29.1 69.2,30.4 63.3,32.8",
    "58.4,40.4 61.5,38.9 64.8,39.6 61.7,41.1 58.6,41.1",
    "70.4,33.8 68.4,36.7 69.2,39.6 67.7,40.9 69.0,44.2 67.7,46.3 62.8,47.4 60.4,46.3 57.7,48.5 54.9,48.3 54.6,51.4 57.7,51.1 60.4,49.4 63.9,50.9 67.3,50.1 68.8,48.7 70.8,49.1 70.4,51.8 72.6,52.3 73.9,50.3 71.9,48.5 72.1,47.4 73.5,47.2 76.8,46.9 77.2,44.9 73.0,43.8 72.6,42.5 71.7,40.5 69.9,39.5 70.6,37.5 75.2,38.2 78.5,38.4 81.6,37.3 79.6,35.5 75.7,35.5 74.1,36.9"
  ],
  2: [ // Кустовые розы (тот же контур, что и index 0 -- см. примечание выше)
    "57.1,60.6 46.7,58.3 38.1,56.6 35.8,53.4 31.4,53.7 25.7,53.4 21.7,50.5 18.4,46.5 19.9,42.0 23.0,37.8 27.0,33.1 32.5,33.1 37.4,30.0 40.9,28.7 44.9,28.6 49.1,31.1 52.0,28.9 55.8,30.7 57.1,32.4 60.8,31.8 65.7,33.1 64.6,34.9 69.0,36.0 70.8,37.8 71.2,40.1 75.7,42.0 76.5,44.7 77.7,47.0 75.9,51.7 72.8,53.4 69.2,53.7 68.1,56.3 64.2,58.3 58.8,60.4"
  ],
  3: [ // Упаковка
    "62.8,90.8 63.1,89.2 62.8,86.5 62.4,83.8 61.7,80.3 60.4,77.1 59.7,74.3 58.4,72.5 61.3,71.8 67.7,69.8 70.6,65.5 76.8,62.6 81.0,44.3 78.8,40.1 76.1,38.1 72.3,35.8 71.5,37.4 74.3,40.5 77.2,44.3 78.8,49.0 73.7,54.6 66.8,58.2 57.7,60.4 49.6,58.6 43.4,58.2 38.9,58.4 33.4,57.3 26.5,54.8 22.1,52.4 18.8,49.3 17.7,42.3 15.0,46.4 19.0,53.9 22.1,59.7 25.7,64.0 27.2,65.8 30.3,67.5 28.5,68.0 21.7,80.5 21.0,85.8 24.3,88.7 28.5,90.8 28.5,93.0 49.6,95.5 52.4,95.2 55.3,94.1 56.6,91.2 59.1,90.7"
  ],
  4: [ // Лента
    "57.1,82.1 59.1,78.9 56.6,72.7 54.9,72.9 45.1,72.5 38.3,70.5 35.0,68.9 31.2,72.0 27.7,78.9 28.1,81.6 32.1,74.3 36.3,70.4 38.7,70.5 36.5,73.4 39.8,74.7 41.4,73.6 41.2,76.0 40.0,78.7 43.8,82.1 45.4,79.1 46.2,74.9 45.6,73.4 50.4,73.4 54.2,74.5 56.0,76.9 57.3,79.8"
  ]
};

/* Turns a closed loop of points into a smooth SVG path (cubic Beziers via
   Catmull-Rom), instead of the straight-line segments a raw polygon draws
   between hand-traced points -- removes the "zig-zag" look without
   needing to re-trace with more/fewer points. */
function smoothClosedPath(points, tension = 6){
  const n = points.length;
  if (n < 3) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)} `;
  for (let i = 0; i < n; i++){
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / tension;
    const c1y = p1.y + (p2.y - p0.y) / tension;
    const c2x = p2.x - (p3.x - p1.x) / tension;
    const c2y = p2.y - (p3.y - p1.y) / tension;
    d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} `;
  }
  return d + 'Z';
}

function initStoryHotspots(){
  const stage = document.getElementById('story');
  const photoFrame = document.getElementById('storyPhotoFrame');
  if (!stage || !photoFrame) return;

  const dots   = stage.querySelectorAll('.story-dot');
  const lines  = stage.querySelectorAll('.story-line');
  const labels = stage.querySelectorAll('.story-labels-col .story-label');
  const legendItems = document.querySelectorAll('.story-legend-item');

  /* ---- build the outline <path> elements once, one per traced shape
     (eucalyptus needs several) -- their "d" gets filled in by
     updateStoryShapes() once we know the photo's real render box ---- */
  const shapesSvg = document.getElementById('storyShapes');
  const shapePolys = [];
  if (shapesSvg){
    Object.keys(STORY_SHAPES).forEach(idx => {
      STORY_SHAPES[idx].forEach((_, shapeIdx) => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('shape-poly');
        path.dataset.index = idx;
        path.dataset.shapeIdx = String(shapeIdx);
        shapesSvg.appendChild(path);
        shapePolys.push(path);
      });
    });
  }
  let shapeFrameCoords = {}; // cache: index -> [ [ {xPct,yPct}, ... ], ... ] in FRAME percentage

  /* Converts the raw-photo percentages in STORY_SHAPES into percentages of
     the visibly rendered frame, replicating exactly what
     object-fit:cover; object-position:center 20% does to the image --
     otherwise outlines would drift off their real target since cover
     crops part of the photo away. Recomputed on load/resize since the
     crop depends on the frame's current on-screen aspect ratio. */
  function updateStoryShapes(){
    const photo = photoFrame.querySelector('.story-photo:not(.story-photo-color)');
    if (!photo || !photo.naturalWidth) return;

    const frameRect = photoFrame.getBoundingClientRect();
    const Fw = frameRect.width, Fh = frameRect.height;
    if (!Fw || !Fh) return;

    const W = photo.naturalWidth, H = photo.naturalHeight;
    const scale = Math.max(Fw / W, Fh / H);
    const Ws = W * scale, Hs = H * scale;
    const offsetX = (Fw - Ws) / 2;     // object-position: center (horizontal)
    const offsetY = (Fh - Hs) * 0.20;  // object-position: 20% (vertical)

    shapeFrameCoords = {};
    Object.keys(STORY_SHAPES).forEach(idx => {
      shapeFrameCoords[idx] = STORY_SHAPES[idx].map(pointsStr =>
        pointsStr.trim().split(/\s+/).map(pair => {
          const [px, py] = pair.split(',').map(Number);
          const fx = offsetX + (px / 100 * W) * scale;
          const fy = offsetY + (py / 100 * H) * scale;
          return { xPct: fx / Fw * 100, yPct: fy / Fh * 100 };
        })
      );
    });

    shapePolys.forEach(path => {
      const coords = shapeFrameCoords[path.dataset.index]?.[Number(path.dataset.shapeIdx)];
      if (!coords) return;
      path.setAttribute('d', smoothClosedPath(coords.map(c => ({ x: c.xPct, y: c.yPct }))));
    });
  }

  /* Cuts the colour reveal layer to the same traced shape(s) as the
     active label, in on-screen pixels (clip-path needs px, not %) --
     smoothed the same way as the visible outline so both match. */
  function applyClipPath(index){
    const colorLayer = photoFrame.querySelector('.story-photo-color');
    const shapes = shapeFrameCoords[index];
    if (!colorLayer || !shapes || !shapes.length) return;

    const frameRect = photoFrame.getBoundingClientRect();
    const Fw = frameRect.width, Fh = frameRect.height;

    const pathStr = shapes.map(coords =>
      smoothClosedPath(coords.map(c => ({ x: c.xPct / 100 * Fw, y: c.yPct / 100 * Fh })))
    ).join(' ');

    colorLayer.style.clipPath = `path('${pathStr}')`;
  }

  function setActive(index){
    updateStoryShapes(); // recompute fresh -- layout may have shifted since last calc (e.g. web fonts swapping in)
    dots.forEach(el => el.classList.toggle('is-active', el.dataset.index === index));
    lines.forEach(el => el.classList.toggle('is-active', el.dataset.index === index));
    labels.forEach(el => el.classList.toggle('is-active', el.dataset.index === index));
    legendItems.forEach(el => el.classList.toggle('is-active', el.dataset.index === index));
    shapePolys.forEach(el => el.classList.toggle('is-active', el.dataset.index === index));

    applyClipPath(index);
    photoFrame.classList.add('is-spotlight');
  }

  function clearActive(){
    dots.forEach(el => el.classList.remove('is-active'));
    lines.forEach(el => el.classList.remove('is-active'));
    labels.forEach(el => el.classList.remove('is-active'));
    legendItems.forEach(el => el.classList.remove('is-active'));
    shapePolys.forEach(el => el.classList.remove('is-active'));
    photoFrame.classList.remove('is-spotlight');
  }

  const groups = [...dots, ...labels, ...legendItems];
  groups.forEach(el => {
    el.addEventListener('mouseenter', () => setActive(el.dataset.index));
    el.addEventListener('mouseleave', clearActive);
    el.addEventListener('click', () => setActive(el.dataset.index));
    el.addEventListener('focus', () => setActive(el.dataset.index));
    el.addEventListener('blur', clearActive);
  });

  // initial placement + keep in sync with layout changes
  updateStoryLines();
  updateStoryShapes();
  window.addEventListener('load', () => { updateStoryLines(); updateStoryShapes(); });
  window.addEventListener('resize', () => {
    clearTimeout(stage._lineResizeTimer);
    stage._lineResizeTimer = setTimeout(() => { updateStoryLines(); updateStoryShapes(); }, 120);
  });
  const storyPhoto = photoFrame.querySelector('.story-photo');
  if (storyPhoto){
    if (storyPhoto.complete) { updateStoryLines(); updateStoryShapes(); }
    else storyPhoto.addEventListener('load', () => { updateStoryLines(); updateStoryShapes(); }, { once: true });
  }
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(() => { updateStoryLines(); updateStoryShapes(); });
  }
}
initStoryHotspots();

/* Photo rushes into place slightly faster than the normal scroll as the
   section enters view (classic parallax), settling back to its natural
   spot well before it's fully on screen -- so by the time the annotation
   overlay is allowed to appear (see below), the dots/lines are already
   sitting exactly where updateStoryLines() expects them. */
function initStoryParallax(){
  const wrap = document.getElementById('storyPhotoFrame');
  if (!wrap) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width:880px)').matches) return;

  const photos = wrap.querySelectorAll('.story-photo');
  if (!photos.length) return;

  gsap.fromTo(photos,
    { yPercent: 8 },
    {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: wrap,
        start: 'top bottom',
        end: 'top 40%',
        scrub: true,
      }
    }
  );
}
initStoryParallax();

/* ================= CURTAIN TRANSITION =================
   A tile-mosaic blackout transition, matching the reference: a grid of
   small rounded tiles scales in with a center-out stagger until they
   fully cover the screen, then the same grid scales back out the same
   way, revealing whatever's now underneath. It's a real one-shot event
   -- scrolling is briefly locked while it plays, on its own clock, not
   tied to scroll distance -- because that's what makes it read as a
   clean cut rather than something you can scrub back and forth through.

   Since this page has no real routes to swap between (unlike the
   reference, which is cutting between two pages), the "swap" here is a
   straight jump of the scroll position to #story's top, done in the one
   instant the tiles are fully covering the screen -- invisible, exactly
   like a page-swap would be. */
function initCurtainTransition(){
  const catalog  = document.getElementById('catalog');
  const story    = document.getElementById('story');
  const gridWrap = document.getElementById('curtainBars');
  if (!catalog || !story || !gridWrap) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const COLS = 12;
  const ROWS = 7;
  const tiles = [];

  gridWrap.style.display = 'grid';
  gridWrap.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  gridWrap.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

  for (let i = 0; i < COLS * ROWS; i++){
    const tile = document.createElement('div');
    tile.className = 'curtain-tile';
    gridWrap.appendChild(tile);
    tiles.push(tile);
  }

  gsap.set(tiles, { scale: 0 });

  const TILE_DUR   = .5;   // real seconds -- own clock, not scrubbed
  const TILE_STAGGER_TOTAL = .45; // spread of the center-out ripple across all tiles

  let played = false;
  let locked = false;

  function preventKey(e){
    const blocked = ['ArrowDown','ArrowUp','PageDown','PageUp','Space',' ','End','Home'];
    if (blocked.includes(e.key)) e.preventDefault();
  }
  function preventScroll(e){ e.preventDefault(); }

  function lockScroll(){
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.addEventListener('wheel', preventScroll, { passive: false });
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('keydown', preventKey, { passive: false });
  }
  function unlockScroll(){
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    window.removeEventListener('wheel', preventScroll, { passive: false });
    window.removeEventListener('touchmove', preventScroll, { passive: false });
    window.removeEventListener('keydown', preventKey, { passive: false });
  }

  function playTransition(){
    if (played || locked) return;
    locked = true;
    gridWrap.classList.add('is-active');
    lockScroll();

    gsap.timeline({
      onComplete: () => {
        unlockScroll();
        gridWrap.classList.remove('is-active');
        gsap.set(tiles, { scale: 0 }); // reset for a possible replay later
        locked = false;
        played = true;
        ScrollTrigger.refresh();
      }
    })
    .to(tiles, {
      scale: 1,
      duration: TILE_DUR,
      ease: 'power2.out',
      stagger: { grid: [ROWS, COLS], from: 'center', amount: TILE_STAGGER_TOTAL },
    })
    .add(() => {
      // fully covered here -- jump straight to #story's real position
      // while nothing is visible, so there's nothing to see jump
      const storyTop = story.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, storyTop);
    })
    .to(tiles, {
      scale: 0,
      duration: TILE_DUR,
      ease: 'power2.in',
      stagger: { grid: [ROWS, COLS], from: 'center', amount: TILE_STAGGER_TOTAL },
    });
  }

  ScrollTrigger.create({
    trigger: catalog,
    start: 'bottom bottom', // fires once the carousel has fully scrolled into view
    onEnter: playTransition,
    onLeaveBack: () => { played = false; }, // scrolled back up above the catalog -- allow it to play again if they scroll down a second time
  });
}
initCurtainTransition();

/* ================= NAV: TRANSPARENT AT TOP, HIDE ON SCROLL DOWN,
   SOLID BLACK ON SCROLL BACK UP ================= */
const siteNav = document.querySelector('.nav');
let lastScrollY = window.scrollY;
const NAV_TOP_THRESHOLD = 40; // пока страница почти вверху -- навбар прозрачный

window.addEventListener('scroll', () => {
  const currentY = window.scrollY;
  const goingDown = currentY > lastScrollY;

  if (currentY <= NAV_TOP_THRESHOLD) {
    siteNav.classList.remove('nav--solid', 'nav--hidden');
  } else if (goingDown) {
    siteNav.classList.add('nav--hidden');
  } else {
    siteNav.classList.remove('nav--hidden');
    siteNav.classList.add('nav--solid');
  }

  lastScrollY = currentY;
}, { passive: true });