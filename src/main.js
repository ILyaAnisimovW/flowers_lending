import './style.css';
import { initFAQ } from './faq.js';
import { initFlorists } from './florists.js';

gsap.registerPlugin(ScrollTrigger);

/* ================= LENIS SMOOTH SCROLL =================
   Обёрнуто в try/catch: если CDN с Lenis не отдался (сеть, блокировщик,
   упавший хостинг), сайт не должен вставать колом на прелоадере -- вместо
   плавного скролла используется нативный window.scrollTo, а весь
   остальной код (прелоадер, анимации, переход-жалюзи) работает как ни
   в чём не бывало. */
let lenis;
try {
  lenis = new Lenis({
    lerp: 0.1,        // сглаживание каждый кадр, а не отдельный твин на каждый скролл -- отзывчивее, без наслоения задержек
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
} catch (err) {
  console.warn('Lenis недоступен, используется нативный скролл:', err);
  lenis = {
    stop(){},
    start(){},
    scrollTo(target, opts = {}){
      const y = typeof target === 'number' ? target : (target?.getBoundingClientRect?.().top ?? 0) + window.scrollY;
      window.scrollTo({ top: y, behavior: opts.immediate ? 'auto' : 'smooth' });
    },
  };
}

window.__lenis = lenis; // доступен из initCurtainTransition и, при желании, снаружи

/* якорные ссылки (нав, кнопки "Смотреть каталог" и т.п.) теперь плавно
   скроллит Lenis -- раньше это делал html{scroll-behavior:smooth}, но
   его убрали из CSS, т.к. он конфликтовал с Lenis и давал тормоза */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href');
  if (!id || id === '#') return;
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  lenis.scrollTo(target, { duration: 1.1 });
});

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
      ScrollTrigger.refresh();
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

function playHero(){
  gsap.from('.showcase-tags, .showcase-title, .showcase-desc, .showcase-meta, .showcase-see-all', {
    opacity: 0, y: 26, duration: .8, stagger: .08, ease: 'power3.out', delay: .1
  });
  gsap.from('.showcase-media', { opacity: 0, scale: .92, duration: 1, ease: 'power2.out', delay: .18 });
  gsap.delayedCall(1.1, startShowcase);
}

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

const bouquets = [
  { name:'Нежный флирт',      desc:'Розовые и белые альстромерии в нежной упаковке', price:'2 800 ₽', img:'/images/bouquet-flirt.png',   accent:'#D9748F' },
  { name:'Полевой букет',     desc:'Ромашки, зелень и полевые травы',                price:'2 400 ₽', img:'/images/bouquet-field.png',   accent:'#7DAE5C' },
  { name:'Утренний персик',   desc:'Пионовидные розы, ромашки и гвоздика',           price:'3 100 ₽', img:'/images/bouquet-peach.png',   accent:'#E39A5D' },
  { name:'Ромашковое облако', desc:'Огромная шапка хризантем с гипсофилой',          price:'4 500 ₽', img:'/images/bouquet-cloud.png',   accent:'#E8A9C4' },
  { name:'Тихий шёпот',       desc:'Эустома, гвоздика и пастельные тона',            price:'2 200 ₽', img:'/images/bouquet-whisper.png', accent:'#D98CA3' },
];

initCarousel3D(bouquets);

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

  const SPACING = Math.round(cardW * (narrow ? .5 : .6));
  const TILT    = 34;
  const DEPTH   = 110;

  wrap.style.perspective = '1700px';
  ring.style.setProperty('--card-w', cardW + 'px');
  ring.style.setProperty('--card-h', cardH + 'px');

  const cardEls = [];
  let hoveredIndex = -1;
  let dragMoved = false;
  const hoverLocal = { x: 0, y: 0 };

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

  let position = 0;
  let targetPosition = 0;
  let dragBasePosition = 0;
  let paused = false;
  let dragging = false;
  let dragStartX = 0;
  let t = 0;

  let ribbonX = 0, ribbonTargetX = 0;
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
      let grayscale = Math.min(abs / .85, 1);
      let brightness = Math.max(1 - abs * .3, .55);

      if (index === hoveredIndex){
        scale += .1;
        x += hoverLocal.x * 26 + 10;
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

  wrap.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    e.preventDefault();
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

document.querySelectorAll('.reveal').forEach(el => {
  if (el.closest('#story')) return;
  gsap.to(el, {
    opacity: 1, y: 0, duration: .9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

document.querySelectorAll('#story .reveal').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: .45, ease: 'power4.out', delay: i * .05,
    scrollTrigger: { trigger: el, start: 'top 95%' }
  });
});

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

function initDistrictsReveal(){
  const rows = document.querySelectorAll('.districts-row');
  if (!rows.length || !window.gsap) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const RIPPLE_STEP = .09;

  function splitName(nameEl){
    const text = nameEl.textContent.trim();
    const chars = text.split('');
    const letterCount = chars.filter(ch => ch !== ' ').length;

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
      textEl: el.querySelector('.letter-text'),
      distance: Math.min(...seedPositions.map(s => Math.abs(Number(el.dataset.pos) - s))),
    }));
    const seedDots = nameEl.querySelectorAll('.seed-dot');
    const maxDistance = Math.max(...letterEls.map(l => l.distance), 0);

    return { letterEls, seedDots, maxDistance };
  }

  rows.forEach(row => {
    const nameEls  = row.querySelectorAll('.districts-name');
    const photoEls = row.querySelectorAll('.districts-photo');
    const timeEl   = row.querySelector('.districts-time');
    if (!nameEls.length) return;

    const parts = [...nameEls].map(splitName);
    const allLetterEls = parts.flatMap(p => p.letterEls);
    const allSeedDots  = parts.flatMap(p => [...p.seedDots]);
    const overallMaxDistance = Math.max(...parts.map(p => p.maxDistance), 0);

    if (reduceMotion){
      gsap.set(allSeedDots, { opacity: 0, scale: 0 });
      gsap.set(allLetterEls.map(l => l.textEl), { opacity: 1, scale: 1 });
      gsap.set(photoEls, { opacity: 1, scale: 1 });
      if (timeEl) gsap.set(timeEl, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(allSeedDots, { opacity: 0, scale: 0 });
    gsap.set(allLetterEls.map(l => l.textEl), { opacity: 0, scale: .15 });
    gsap.set(photoEls, { opacity: 0, scale: .8 });
    if (timeEl) gsap.set(timeEl, { opacity: 0, y: 6 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: row,
        start: 'top 92%',
        end:   'top 58%',
        scrub: .5,
      }
    });

    tl.to(allSeedDots, { opacity: 1, scale: 1, duration: .4, ease: 'power2.out' }, 0)
      .to(allSeedDots, { opacity: 0, scale: 0, duration: .35, ease: 'power1.in' }, .55);

    allLetterEls.forEach(({ textEl, distance }) => {
      tl.to(textEl, {
        opacity: 1, scale: 1,
        duration: .4,
        ease: 'steps(5)',
      }, .95 + distance * RIPPLE_STEP);
    });

    if (photoEls.length){
      tl.to(photoEls, { opacity: 1, scale: 1, duration: .6, ease: 'power2.out' }, .9);
    }

    if (timeEl){
      tl.to(timeEl, { opacity: 1, y: 0, duration: .5, ease: 'power2.out' }, .95 + overallMaxDistance * RIPPLE_STEP + .3);
    }
  });
}
initDistrictsReveal();

/* ================= ADVANTAGES -- pinned scrollytelling =================
   Desktop only (via gsap.matchMedia): while #advantages is scrolled
   through, the section pins to the viewport (scroll is "locked" to it
   for the length of the pin) and ONE big text slide -- index badge,
   heading, description -- swaps between 4 states as the scroll
   progresses, matching the 4 old advantage cards 1:1.

   Just before the pin engages, #districts (the section right above)
   is scaled down a touch, driven purely by how close #advantages is to
   the top of the viewport -- so it visibly "shrinks back" to make room
   instead of just being covered up by the next section.

   On mobile/touch (<=880px) none of this runs: gsap.matchMedia only
   registers the query below >880px, so on small screens the section
   just falls back to the plain .advantages-grid-mobile markup already
   sitting in the HTML (scroll-jacking on touch devices is bad UX and
   fights native momentum scrolling). */
function initAdvantagesPin(){
  const section = document.getElementById('advantages');
  const prevSection = document.getElementById('districts');
  const indexEl = document.getElementById('advIndex');
  const headingEl = document.getElementById('advHeading');
  const descEl = document.getElementById('advDesc');
  const ghostEl = document.getElementById('advGhost');
  const ringEl = document.getElementById('advRingProgress');
  const dots = document.querySelectorAll('.advantages-dot');
  if (!section || !prevSection || !indexEl || !headingEl || !descEl) return;

  const items = [
    { num:'01', title:'Свежая срезка',    desc:'Цветы приходят с фермы не позже чем за 48 часов до сборки — не залёживаются на складе.' },
    { num:'02', title:'60 минут',         desc:'От заявки до звонка в дверь — курьер уже в пути, пока флорист довязывает бант.' },
    { num:'03', title:'Честный состав',   desc:'У каждого букета — разбор по цветам и материалам. Видите, за что платите, до заказа.' },
    { num:'04', title:'Без слащавости',   desc:'Ни целлофана, ни рюшей — крафт-бумага, смелые сочетания и минимум декора.' },
  ];

  // exact perimeter of the rounded-rect outline, read straight from the
  // SVG geometry -- works regardless of the badge's actual pixel size,
  // since rect implements SVGGeometryElement same as path/circle do
  const ringLength = ringEl ? ringEl.getTotalLength() : 0;
  if (ringEl){
    ringEl.style.strokeDasharray = ringLength;
    ringEl.style.strokeDashoffset = ringLength;
  }

  let current = 0;

  function render(i){
    if (i === current) return;
    current = i;
    const item = items[i];
    gsap.timeline()
      .to([indexEl, headingEl, descEl], { opacity: 0, y: -14, duration: .22, ease: 'power2.in' })
      .call(() => {
        indexEl.textContent = item.num;
        headingEl.textContent = item.title;
        descEl.textContent = item.desc;
        if (ghostEl) ghostEl.textContent = item.num;
      })
      .to([indexEl, headingEl, descEl], { opacity: 1, y: 0, duration: .32, ease: 'power2.out' });
    if (ghostEl){
      gsap.fromTo(ghostEl, { opacity: 0 }, { opacity: .035, duration: .5, ease: 'power2.out' });
    }
    dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
  }

  const mm = gsap.matchMedia();

  mm.add('(min-width: 881px)', () => {
    gsap.set(prevSection, { transformOrigin: '50% 100%' });
    const shrinkTween = gsap.to(prevSection, {
      scale: .92,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
      }
    });

    // one full viewport height of scroll PER state (4 states -> 4 equal
    // segments), instead of 3 crossfade transitions across the total --
    // this is what lets the badge outline reset and redraw once per
    // segment rather than tracing once across the entire pin
    const segments = items.length;
    const pinTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => '+=' + (window.innerHeight * segments),
      pin: true,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => {
        const scaled = self.progress * segments;
        const idx = Math.min(segments - 1, Math.floor(scaled));
        render(idx);

        // local progress WITHIN the current segment (0 -> 1), so the
        // outline fills over the course of that one state and snaps
        // back to empty the moment the next state begins -- 4 separate
        // draws instead of one continuous draw over the whole scroll
        if (ringEl && ringLength){
          const localProgress = scaled - idx;
          ringEl.style.strokeDashoffset = ringLength * (1 - localProgress);
        }
      }
    });

    return () => {
      pinTrigger.kill();
      shrinkTween.kill();
      gsap.set(prevSection, { clearProps: 'transform' });
      if (ringEl && ringLength) ringEl.style.strokeDashoffset = ringLength;
    };
  });
}
initAdvantagesPin();

/* ================= FAQ (glass strips, scramble + scroll-invert) ================= */
initFAQ();

/* ================= FLORISTS (pinned card-dealing sequence + video crossfade) ================= */
initFlorists();

/* ================= STORY HOTSPOTS (bouquet breakdown) ================= */

function intersectSegmentWithRect(x1, y1, x2, y2, rx1, ry1, rx2, ry2){
  const dx = x2 - x1, dy = y2 - y1;
  let tMin = 0, tMax = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - rx1, rx2 - x1, y1 - ry1, ry2 - y1];
  for (let i = 0; i < 4; i++){
    if (p[i] === 0){
      if (q[i] < 0) return null;
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

function updateStoryLines(){
  const stage = document.getElementById('story');
  if (!stage) return;
  if (window.matchMedia('(max-width:880px)').matches) return;

  const stageRect = stage.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) return;

  const GAP = 10;

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

const STORY_SHAPES = {
  0: [
    "57.1,60.6 46.7,58.3 38.1,56.6 35.8,53.4 31.4,53.7 25.7,53.4 21.7,50.5 18.4,46.5 19.9,42.0 23.0,37.8 27.0,33.1 32.5,33.1 37.4,30.0 40.9,28.7 44.9,28.6 49.1,31.1 52.0,28.9 55.8,30.7 57.1,32.4 60.8,31.8 65.7,33.1 64.6,34.9 69.0,36.0 70.8,37.8 71.2,40.1 75.7,42.0 76.5,44.7 77.7,47.0 75.9,51.7 72.8,53.4 69.2,53.7 68.1,56.3 64.2,58.3 58.8,60.4"
  ],
  1: [
    "38.3,44.2 38.1,46.2 36.1,45.6 33.8,46.2 35.6,44.2 31.9,43.8 32.5,42.9 30.5,41.6 28.8,40.0 25.2,40.0 22.1,40.4 20.4,38.9 23.9,37.8 27.2,38.6 33.2,40.4 35.4,40.4 38.1,42.7",
    "27.2,35.8 23.7,36.9 22.6,35.1 26.3,32.4 27.2,30.8 32.1,28.8 34.5,30.4 36.7,31.5 33.8,32.2 33.2,34.6 31.0,34.9 29.9,32.6 27.2,33.1",
    "42.0,40.5 40.0,40.0 40.0,38.4 37.8,37.8 41.4,36.9 43.6,38.0 43.4,36.6 41.2,34.0 43.1,32.8 41.4,31.5 42.5,28.9 45.6,30.6 46.9,31.3 47.6,33.7 48.2,35.5 51.8,36.9 50.0,38.6 46.7,37.5 44.2,38.4",
    "62.4,32.0 63.9,30.2 67.9,29.1 69.2,30.4 63.3,32.8",
    "58.4,40.4 61.5,38.9 64.8,39.6 61.7,41.1 58.6,41.1",
    "70.4,33.8 68.4,36.7 69.2,39.6 67.7,40.9 69.0,44.2 67.7,46.3 62.8,47.4 60.4,46.3 57.7,48.5 54.9,48.3 54.6,51.4 57.7,51.1 60.4,49.4 63.9,50.9 67.3,50.1 68.8,48.7 70.8,49.1 70.4,51.8 72.6,52.3 73.9,50.3 71.9,48.5 72.1,47.4 73.5,47.2 76.8,46.9 77.2,44.9 73.0,43.8 72.6,42.5 71.7,40.5 69.9,39.5 70.6,37.5 75.2,38.2 78.5,38.4 81.6,37.3 79.6,35.5 75.7,35.5 74.1,36.9"
  ],
  2: [
    "57.1,60.6 46.7,58.3 38.1,56.6 35.8,53.4 31.4,53.7 25.7,53.4 21.7,50.5 18.4,46.5 19.9,42.0 23.0,37.8 27.0,33.1 32.5,33.1 37.4,30.0 40.9,28.7 44.9,28.6 49.1,31.1 52.0,28.9 55.8,30.7 57.1,32.4 60.8,31.8 65.7,33.1 64.6,34.9 69.0,36.0 70.8,37.8 71.2,40.1 75.7,42.0 76.5,44.7 77.7,47.0 75.9,51.7 72.8,53.4 69.2,53.7 68.1,56.3 64.2,58.3 58.8,60.4"
  ],
  3: [
    "62.8,90.8 63.1,89.2 62.8,86.5 62.4,83.8 61.7,80.3 60.4,77.1 59.7,74.3 58.4,72.5 61.3,71.8 67.7,69.8 70.6,65.5 76.8,62.6 81.0,44.3 78.8,40.1 76.1,38.1 72.3,35.8 71.5,37.4 74.3,40.5 77.2,44.3 78.8,49.0 73.7,54.6 66.8,58.2 57.7,60.4 49.6,58.6 43.4,58.2 38.9,58.4 33.4,57.3 26.5,54.8 22.1,52.4 18.8,49.3 17.7,42.3 15.0,46.4 19.0,53.9 22.1,59.7 25.7,64.0 27.2,65.8 30.3,67.5 28.5,68.0 21.7,80.5 21.0,85.8 24.3,88.7 28.5,90.8 28.5,93.0 49.6,95.5 52.4,95.2 55.3,94.1 56.6,91.2 59.1,90.7"
  ],
  4: [
    "57.1,82.1 59.1,78.9 56.6,72.7 54.9,72.9 45.1,72.5 38.3,70.5 35.0,68.9 31.2,72.0 27.7,78.9 28.1,81.6 32.1,74.3 36.3,70.4 38.7,70.5 36.5,73.4 39.8,74.7 41.4,73.6 41.2,76.0 40.0,78.7 43.8,82.1 45.4,79.1 46.2,74.9 45.6,73.4 50.4,73.4 54.2,74.5 56.0,76.9 57.3,79.8"
  ]
};

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
  let shapeFrameCoords = {};

  function updateStoryShapes(){
    const photo = photoFrame.querySelector('.story-photo:not(.story-photo-color)');
    if (!photo || !photo.naturalWidth) return;

    const frameRect = photoFrame.getBoundingClientRect();
    const Fw = frameRect.width, Fh = frameRect.height;
    if (!Fw || !Fh) return;

    const W = photo.naturalWidth, H = photo.naturalHeight;
    const scale = Math.max(Fw / W, Fh / H);
    const Ws = W * scale, Hs = H * scale;
    const offsetX = (Fw - Ws) / 2;
    const offsetY = (Fh - Hs) * 0.20;

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
    updateStoryShapes();
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

/* ================= CURTAIN TRANSITION -- горизонтальные шторки, честно завязанные на реальный скролл =================
   Раньше секция сама ловила wheel/touch и вручную двигала прогресс -- это
   было хрупко (особенно поверх Lenis, которая тоже перехватывает колесо)
   и в итоге либо не запускалось совсем, либо тут же само себя отменяло на
   первом же кадре.

   Теперь используется ровно тот же приём, что уже работает в блоке
   #advantages: секция #catalog в момент, когда её низ касается низа
   экрана, "пинится" (GSAP ScrollTrigger pin:true) -- визуально замирает
   на месте, а весь дальнейший скролл (ещё ~1.9 экрана) уходит не в
   реальное движение страницы, а в прогресс gsap-таймлайна (scrub). Это и
   есть "блокировка скролла": колесо физически продолжает работать (Lenis
   не ломается), но на экране ничего не двигается, кроме растущих чёрных
   полос.

   Зоны полос НЕ одинаковые: нижняя -- самая широкая, дальше вверх каждая
   уже предыдущей (см. ZONE_WEIGHTS). Стартуют они по очереди снизу вверх,
   внахлёст -- следующая полоса трогается ещё до того, как предыдущая
   дошла до конца, поэтому уже в районе половины пути нижней полосы в
   кадре одновременно "едет" ещё 2-3 соседних. Контент #story начинает
   проявляться заметно раньше, чем экран полностью закрыт -- он идёт ПО
   ходу перехода, а не отдельным кадром после.

   #story на время перехода превращается в position:fixed оверлей
   (.is-curtain-preview, см. style.css) -- единственный способ показать
   секцию, которая физически ещё не доскроллена, при запиненном скролле.
   Обратное направление (со story назад в каталог) отдельно не пишем --
   это один и тот же scrub-таймлайн, GSAP реверсит его сам при скролле
   вверх.
   ============================================================ */
function initCurtainTransition(){
  const catalog  = document.getElementById('catalog');
  const story    = document.getElementById('story');
  const gridWrap = document.getElementById('curtainBars');
  if (!catalog || !story || !gridWrap) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(max-width: 880px)').matches) return; // на тач-устройствах scroll-jacking не делаем

  // сверху вниз, сумма = 100 -- нижняя зона нарочно самая широкая
  const ZONE_WEIGHTS = [9, 13, 18, 25, 35];
  const bars = [];
  gridWrap.innerHTML = '';
  let cum = 0;
  ZONE_WEIGHTS.forEach(w => {
    const bar = document.createElement('div');
    bar.className = 'curtain-bar';
    bar.style.top    = cum + '%';
    bar.style.height = w + '%';
    gridWrap.appendChild(bar);
    bars.push(bar);
    cum += w;
  });
  // bars[0] -- верхняя (самая узкая) зона, bars[bars.length-1] -- нижняя (самая широкая)

  const storyReveal = story.querySelectorAll('#storyPhotoFrame, #storyIntro, #storyLabelsCol');

  const BAR_DUR     = 0.42; // рост/сдув ОДНОЙ полосы, условные единицы таймлайна
  const BAR_STAGGER = 0.19; // сдвиг старта между соседними -- меньше BAR_DUR, поэтому есть нахлёст-волна

  gsap.set(bars, { scaleY: 0, transformOrigin: 'center bottom' });
  gsap.set(storyReveal, { opacity: 0, y: 44 });

  let previewActive = false;
  function showPreview(){
    if (previewActive) return;
    previewActive = true;
    gridWrap.classList.add('is-active');
    story.classList.add('is-curtain-preview');
  }
  function hidePreview(){
    if (!previewActive) return;
    previewActive = false;
    gridWrap.classList.remove('is-active');
    story.classList.remove('is-curtain-preview');
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: catalog,
      start: 'bottom bottom',
      end: () => '+=' + Math.round(window.innerHeight * 1.9),
      pin: true,
      scrub: 0.3,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter: showPreview,
      onEnterBack: showPreview,
      onLeave: hidePreview,
      onLeaveBack: hidePreview,
    }
  });

  // 1. полосы растут снизу вверх, зона за зоной, внахлёст
  tl.to(bars, {
    scaleY: 1,
    duration: BAR_DUR,
    ease: 'power2.out',
    stagger: { each: BAR_STAGGER, from: 'end' }, // самая нижняя (широкая) полоса стартует первой
  }, 0);

  // 2. контент начинает проявляться ещё до того, как нижняя полоса
  //    полностью доросла -- идёт прямо по ходу перехода, а не отдельным
  //    кадром после того, как экран уже полностью чёрный
  tl.to(storyReveal, {
    opacity: 1,
    y: 0,
    duration: BAR_DUR * 0.9,
    ease: 'power2.out',
    stagger: 0.1,
  }, BAR_DUR * 0.55);

  // 3. когда все полосы выросли и экран полностью закрыт -- сдуваем их в
  //    том же порядке волны, открывая уже полностью проявленный #story
  tl.set(bars, { transformOrigin: 'center top' }, '+=0.1');
  tl.to(bars, {
    scaleY: 0,
    duration: BAR_DUR,
    ease: 'power2.inOut',
    stagger: { each: BAR_STAGGER, from: 'end' },
  });
}
initCurtainTransition();
/* ================= REVIEW CARDS: MAGNETIC 3D TILT ================= */
document.querySelectorAll('.review-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5;
    const py = (e.clientY - r.top) / r.height - .5;
    gsap.to(card, {
      rotateX: py * -9,
      rotateY: px * 11,
      y: -6,
      scale: 1.02,
      transformPerspective: 700,
      duration: .45,
      ease: 'power2.out'
    });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, {
      rotateX: 0, rotateY: 0, y: 0, scale: 1,
      duration: .7, ease: 'elastic.out(1,0.5)'
    });
  });
});

/* ================= NAV: TRANSPARENT AT TOP, HIDE ON SCROLL DOWN,
   SOLID BLACK ON SCROLL BACK UP ================= */
const siteNav = document.querySelector('.nav');
let lastScrollY = window.scrollY;
const NAV_TOP_THRESHOLD = 40;

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