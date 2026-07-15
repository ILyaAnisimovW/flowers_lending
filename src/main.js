import './style.css';
import { initFAQ } from './faq.js';
import { initFlorists } from './florists.js';
import { initBrandBanner } from './brand-banner.js'; 

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({
  ignoreMobileResize: true, // игнорит "resize" от появления/скрытия адресбара на мобильных
  autoRefreshEvents: 'DOMContentLoaded,load', // убрали 'resize' и 'visibilitychange' из дефолтного списка
});

/* ================= LENIS SMOOTH SCROLL =================
   Обёрнуто в try/catch: если CDN с Lenis не отдался (сеть, блокировщик,
   упавший хостинг), сайт не должен вставать колом на прелоадере -- вместо
   плавного скролла используется нативный window.scrollTo, а весь
   остальной код (прелоадер, анимации, переход-жалюзи) работает как ни
   в чём не бывало. */
window.__lenis = {
  scrollTo(target, opts = {}) {
    const y = typeof target === 'number'
      ? target
      : (target?.getBoundingClientRect?.().top ?? 0) + window.scrollY;
    window.scrollTo({ top: y, behavior: opts.immediate ? 'auto' : 'smooth' });
  },
};
 // доступен из initCurtainTransition и, при желании, снаружи

/* ================= LENIS <-> SCROLLTRIGGER SYNC =================
   Причина "телепортов" при скролле: Lenis при инициализации считает
   свой внутренний `limit` (высота документа минус высота вьюпорта) и
   дальше клэмпит/лерпит скролл относительно этого числа. Но реальная
   высота документа продолжает меняться уже ПОСЛЕ первого рендера --
   догружаются видео (.florists-video), lazy-картинки (districts,
   florist-card-photo, process-step-img с внешнего picsum.photos), а
   также сами GSAP-пины (#advantages, #story, #florists) добавляют
   pin-spacer'ы, которые дополнительно увеличивают scrollHeight.

   ScrollTrigger.refresh() эти изменения учитывает (пересчитывает
   триггеры), а вот Lenis -- нет, если явно не вызвать lenis.resize().
   В момент, когда реальная высота документа расходится с тем, что
   Lenis посчитал при старте, скролл колесом мыши упирается в старый
   `limit` и резко "перескакивает" -- это и есть баг с телепортами.

   Фикс: 1) любой ScrollTrigger.refresh() досчитывает lenis.resize();
         2) ResizeObserver на <body> ловит любое изменение реальной
            высоты документа (видео/картинки/пин-спейсеры) и сам
            вызывает ScrollTrigger.refresh() (а тот, по цепочке из
            пункта 1, дёрнет lenis.resize());
         3) на всякий случай -- отдельные слушатели на загрузку видео
            и lazy-картинок, чтобы не полагаться только на резайз-обсёрвер. */


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
  window.__lenis.scrollTo(target);
});

const __pageReady = Promise.all([
  document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
  document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise(res => window.addEventListener('load', res, { once: true })),
]);

__pageReady.then(() => {
  // единственный "официальный" refresh за всю жизнь страницы после старта
  ScrollTrigger.refresh();
});

/* ================= РЕАЛЬНАЯ синхронизация ScrollTrigger с late-loading
   контентом (видео флористов, lazy-картинки, pin-spacer'ы) —
   то, что было только в комментарии выше, но не было написано. */
let __stRefreshPending = false;
function requestSTRefresh(){
  if (__stRefreshPending) return;
  __stRefreshPending = true;
  requestAnimationFrame(() => {
    __stRefreshPending = false;
    ScrollTrigger.refresh();
  });
}

// ловит ЛЮБОЕ изменение реальной высоты body: догрузку видео,
// картинок, появление/исчезание pin-spacer'ов
new ResizeObserver(requestSTRefresh).observe(document.body);

// на всякий случай отдельно — видео и lazy-картинки часто
// резолвятся не через resize body синхронно, а с задержкой кадра
document.querySelectorAll('video').forEach(v => {
  if (v.readyState >= 1) return; // metadata уже есть
  v.addEventListener('loadedmetadata', requestSTRefresh, { once: true });
});

document.querySelectorAll('img[loading="lazy"]').forEach(img => {
  if (img.complete) return;
  img.addEventListener('load', requestSTRefresh, { once: true });
});

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
let __counterDone = false;
let __pageReadyDone = false;

function __maybeRunIntro(){
  if (__counterDone && __pageReadyDone) runIntro();
}

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
  onComplete: () => { __counterDone = true; __maybeRunIntro(); }
});

__pageReady.then(() => {
  __pageReadyDone = true;
  ScrollTrigger.refresh();
  __maybeRunIntro();
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

/* "Все букеты" сидит внутри .carousel3d-wrap, который слушает
   pointerdown/mousemove на себе (bubbling phase) для drag/tilt
   взаимодействий. Проверка e.target.closest() внутри того обработчика
   уже должна пропускать ссылки и кнопки, но остановка propagation прямо
   здесь, до того как событие дойдёт до wrap, надёжнее -- обработчики
   wrap вообще не срабатывают для этого элемента. */
(function protectViewAllButton(){
  const viewAllBtn = document.querySelector('.carousel3d-viewall');
  if (!viewAllBtn) return;
  ['pointerdown', 'mousedown', 'touchstart', 'click'].forEach(evt => {
    viewAllBtn.addEventListener(evt, e => e.stopPropagation());
  });
})();

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
    // button = select thumbnails / prev-next arrows; a = "Все букеты" link
    // и любой другой anchor внутри carousel wrap -- ни один из них
    // не должен начинать drag, иначе его click никогда не сработает
    // из-за preventDefault() ниже.
    if (e.target.closest('button, a')) return;
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

  // Heading now uses the same scrambleText() glitch reveal as the
  // showcase title / carousel captions elsewhere on the site (random
  // Cyrillic letters + digits + symbols resolving left-to-right into
  // the real word) instead of a plain fade -- ties the pinned slide's
  // text swap into the same "glitch" visual language already used for
  // text swap into the same "glitch" visual language used elsewhere on the site.
  function render(i){
    if (i === current) return;
    current = i;
    const item = items[i];

    gsap.timeline()
      .to([indexEl, descEl], { opacity: 0, y: -14, duration: .22, ease: 'power2.in' })
      .call(() => {
        indexEl.textContent = item.num;
        descEl.textContent = item.desc;
        if (ghostEl) ghostEl.textContent = item.num;
        scrambleText(headingEl, item.title);
      })
      .to([indexEl, descEl], { opacity: 1, y: 0, duration: .32, ease: 'power2.out' });

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

/* ================= STORY -- pinned wave-cards ================= */
/* Desktop: section pins to the viewport while one scrub-driven timeline
   flies each dark card in from its own edge (left/top/right/bottom),
   staggered so they cascade in like a wave rather than popping in
   together. Because it's tied to ScrollTrigger's `scrub` (not a
   `once`-fired reveal), scrolling back up runs the exact same timeline
   backwards -- the cards retreat off-screen in reverse order, so the
   effect works both ways and isn't a one-time animation.
   Mobile disables the pin via gsap.matchMedia and the cards just sit
   in their plain stacked-card layout (see the max-width:880px rules
   in style.css), matching the same pattern used for #advantages. */
function initStoryCardsPin(){
  const section = document.getElementById('story');
  const pin = document.getElementById('storyPin');
  const cards = document.querySelectorAll('.story-card');
  const introEl = document.getElementById('storyIntro');
  const timelineFill = document.getElementById('storyTimelineFill');
  const flashEl = document.getElementById('storyFlash');
  if (!section || !pin || !cards.length) return;

  cards.forEach(card => {
  const inner = card.querySelector('.story-card-inner');
  if (!inner) return;

  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - .5;
    const py = (e.clientY - r.top) / r.height - .5;
    gsap.to(inner, {
      rotateX: py * -18,
      rotateY: px * 22,
      z: 50,
      scale: 1.05,
      transformPerspective: 700,
      duration: .5,
      ease: 'power2.out',
    });
  });

  card.addEventListener('mouseleave', () => {
    gsap.to(inner, {
      rotateX: 0, rotateY: 0, z: 0, scale: 1,
      duration: .8, ease: 'elastic.out(1,0.5)',
    });
  });
});

  const DIR_OFFSET = {
    left:   { x: '-160%', y: '0%'    },
    top:    { x: '0%',    y: '-160%' },
    right:  { x: '160%',  y: '0%'    },
    bottom: { x: '0%',    y: '160%'  },
  };

  // куда и как каждая карточка улетает при взрыве -- дальше и по
  // своей диагонали, а не просто назад тем же путём, каким влетела
  const EXPLODE = {
  left:   { x: '-320%', y: '-90%',  z: -1300, rot: -540 },
  top:    { x: '110%',  y: '-320%', z: -1350, rot: 480  },
  right:  { x: '320%',  y: '100%',  z: -1300, rot: 560  },
  bottom: { x: '-110%', y: '320%',  z: -1350, rot: -500 },
};

  const mm = gsap.matchMedia();

  mm.add('(min-width: 881px)', () => {
    cards.forEach(card => {
      const dir = card.dataset.dir;
      const offset = DIR_OFFSET[dir] || DIR_OFFSET.left;
      const flatRot = (dir === 'left' || dir === 'bottom') ? -10 : 10;
      const vertical = dir === 'top' || dir === 'bottom';

      gsap.set(card, {
        xPercent: parseFloat(offset.x),
        yPercent: parseFloat(offset.y),
        opacity: 0,
        rotate: flatRot,
        rotationX: vertical ? 65 : 0,
        rotationY: vertical ? 0 : 65,
        z: -320,
        scale: .6,
        filter: 'blur(7px)',
        transformPerspective: 1200,
      });
    });
    if (introEl) gsap.set(introEl, { opacity: 1 });
    if (flashEl) gsap.set(flashEl, { opacity: 0 });

    const tl = gsap.timeline();

    if (introEl){
      tl.to(introEl, { opacity: 0, ease: 'power1.in', duration: 1 }, 0.1);
    }

    // ---- ВХОД: волна с кувырком ----
    cards.forEach((card, i) => {
      const dir = card.dataset.dir;
      const offset = DIR_OFFSET[dir] || DIR_OFFSET.left;
      const horizontal = dir === 'left' || dir === 'right';
      const bump = (i % 2 === 0 ? -1 : 1) * 22;
      const start = i * 0.55;

      const midVars = {
        opacity: 1, ease: 'power2.out', duration: 0.6,
        rotationX: horizontal ? 0 : 22,
        rotationY: horizontal ? 22 : 0,
        z: -90, scale: .86, filter: 'blur(2.5px)',
      };
      const finalVars = {
        xPercent: 0, yPercent: 0, rotate: 0,
        rotationX: 0, rotationY: 0, z: 0, scale: 1,
        filter: 'blur(0px)',
        ease: 'back.out(1.6)', duration: 0.75,
      };

      if (horizontal){
        midVars.xPercent = parseFloat(offset.x) * 0.32;
        midVars.yPercent = bump;
      } else {
        midVars.yPercent = parseFloat(offset.y) * 0.32;
        midVars.xPercent = bump;
      }

      tl.to(card, midVars, start)
        .to(card, finalVars, start + 0.5);
    });

    // момент, когда последняя карточка долетела -- считаем динамически,
    // чтобы не подбирать числа руками при изменении количества карточек
    const lastCardEnd = (cards.length - 1) * 0.55 + 0.5 + 0.75;
    const holdStart = lastCardEnd + 0.35; // короткая пауза "все на местах"

    // ---- ВЗРЫВ ----
    if (flashEl){
      tl.to(flashEl, { opacity: .85, duration: .12, ease: 'power1.in' }, holdStart)
        .to(flashEl, { opacity: 0, duration: .6, ease: 'power2.out' }, holdStart + .12);
    }

    cards.forEach((card, i) => {
  const dir = card.dataset.dir;
  const ex = EXPLODE[dir] || EXPLODE.left;
  const t0 = holdStart + i * 0.05;

  // короткий рывок на зрителя — "вспышка" взрыва, а не просто разъезд
  tl.to(card, {
    z: 180,
    scale: 1.18,
    filter: 'blur(0px)',
    duration: .16,
    ease: 'power1.out',
  }, t0);

  // сам улёт — крутится и уходит в глубину, а не просто по плоскости
  tl.to(card, {
    xPercent: parseFloat(ex.x),
    yPercent: parseFloat(ex.y),
    z: ex.z,
    rotate: ex.rot,
    rotationX: gsap.utils.random(340, 760) * (i % 2 ? 1 : -1),
    rotationY: gsap.utils.random(340, 760) * (i % 2 ? -1 : 1),
    scale: .2,
    opacity: 0,
    filter: 'blur(10px)',
    ease: 'power2.in',
    duration: 1.35,
  }, t0 + .16);
});

    gsap.set(prevSectionDummy => {}, {}); // no-op guard removed below

    const pinTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => '+=' + (window.innerHeight * 2.9),
      pin: true,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: tl,
      onUpdate: self => {
        if (timelineFill) timelineFill.style.width = (self.progress * 100).toFixed(1) + '%';
      },
    });

    return () => {
      pinTrigger.kill();
      gsap.set(cards, { clearProps: 'transform,opacity,filter' });
      if (introEl) gsap.set(introEl, { clearProps: 'opacity' });
      if (flashEl) gsap.set(flashEl, { clearProps: 'opacity' });
      if (timelineFill) timelineFill.style.width = '0%';
    };
  });
}
//initStoryCardsPin();
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
initBrandBanner();