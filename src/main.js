import './style.css';
import { initFAQ } from './faq.js';
import { initFlorists } from './florists.js';
import { initBrandBanner } from './brand-banner.js';
import { initMouseTrail } from './mouse-trail.js';
import { initContactPanel } from './contact-panel.js';
import { initMobileNav } from './nav-mobile.js';
const BASE = import.meta.env.BASE_URL; // '/flowers_lending/' на проде, '/' в dev

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
let __stRefreshTimer = null;
function requestSTRefresh(){
  clearTimeout(__stRefreshTimer);
  __stRefreshTimer = setTimeout(() => {
    ScrollTrigger.refresh();
  }, 150);
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
const preloader = document.getElementById('preloader');
const preloaderTopRight = document.getElementById('preloaderTopRight');
const preloaderCountDigits = document.getElementById('preloaderCountDigits');
const preloaderWordmark = document.getElementById('preloaderWordmark');
const preloaderWordmarkLetters = preloaderWordmark
  ? preloaderWordmark.querySelectorAll('.pw-letter')
  : [];

document.body.classList.add('is-loading');

const progressObj = { val: 0 };
let displayedPercent = 0;
function renderProgress(){
  const v = Math.round(progressObj.val);
  if (v !== displayedPercent){
    displayedPercent = v;
    preloaderCountDigits.textContent = String(v).padStart(3, '0'); // 0 -> "000", 7 -> "007"
    gsap.fromTo(preloaderCountDigits,
      { y: -4, opacity: .5 },
      { y: 0, opacity: 1, duration: .18, ease: 'power2.out' }
    );
  }
}
function setProgress(fraction, duration = .45){
  gsap.to(progressObj, {
    val: Math.min(fraction, 1) * 100,
    duration, ease: 'power2.out',
    onUpdate: renderProgress,
  });
}

/* прелоадер обязан быть виден минимум MIN_PRELOADER_MS, даже если все
   критичные ассеты закешированы -- см. предыдущий комментарий выше по
   логике: часовой таймлайн сам ведёт счётчик до 92% за это время,
   реальная загрузка лишь добивает остаток */
const MIN_PRELOADER_MS = 1600;
const preloaderStart = performance.now();

const clockTween = gsap.to(progressObj, {
  val: 92,
  duration: MIN_PRELOADER_MS / 1000,
  ease: 'power1.out',
  onUpdate: renderProgress,
});

const criticalImages = [
  BASE + 'images/logo.png',
  BASE + 'images/bouquet-flirt.png',
  BASE + 'images/bouquet-field.png',
  BASE + 'images/bouquet-peach.png',
  BASE + 'images/bouquet-cloud.png',
  BASE + 'images/bouquet-whisper.png',
];
const fontsPromise = (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve());
const imagePromises = criticalImages.map(src => new Promise(resolve => {
  const img = new Image();
  img.onload = img.onerror = resolve;
  img.src = src;
}));

let __assetsLoaded = false;
let __pageReadyDone = false;
Promise.all([fontsPromise, ...imagePromises]).then(() => { __assetsLoaded = true; maybeRunIntro(); });
__pageReady.then(() => { __pageReadyDone = true; ScrollTrigger.refresh(); maybeRunIntro(); });

function maybeRunIntro(){
  if (!(__assetsLoaded && __pageReadyDone)) return;
  const elapsed = performance.now() - preloaderStart;
  const remaining = MIN_PRELOADER_MS - elapsed;

  const finish = () => {
    clockTween.kill();
    setProgress(1, .3);
    gsap.delayedCall(.35, runIntro);
  };

  if (remaining > 0) setTimeout(finish, remaining);
  else finish();
}

function runIntro(){
  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      document.body.classList.remove('is-loading');
      ScrollTrigger.refresh();
    }
  });

  // 1. счётчик в углу гаснет -- дальше он больше не нужен
  tl.to(preloaderTopRight, { opacity: 0, y: -8, duration: .22, ease: 'power2.in' })
    // 2. буквы BLOOMLY выпрыгивают по одной, с пружиной
    .fromTo(preloaderWordmarkLetters,
      { y: '70%', opacity: 0 },
      { y: '0%', opacity: 1, duration: .6, ease: 'back.out(1.7)', stagger: .045 },
      '-=.05'
    )
    // 3. короткая пауза -- буквы "постояли" на экране
    .to({}, { duration: .35 })
    // 4. весь прелоадер целиком уезжает вверх, унося с собой ворд-марк
    .to(preloader, { yPercent: -100, duration: .9, ease: 'power4.inOut' }, '+=.05')
    .add(playHero, '-=.55');
}
function playHero(){
  startShowcase();
}

const showcaseItems = [
  { name:'Нежный флирт',      desc:'Розовые и белые альстромерии в нежной упаковке',       price:'2 800 ₽', img:BASE + 'images/bouquet-flirt.png',    cat:'Хит недели'  },
  { name:'Полевой букет',     desc:'Ромашки, зелень и полевые травы',                       price:'2 400 ₽', img:BASE + 'images/bouquet-field.png',    cat:'Бестселлер'  },
  { name:'Утренний персик',   desc:'Пионовидные розы, ромашки и гвоздика',                  price:'3 100 ₽', img:BASE + 'images/bouquet-peach.png',    cat:'Новинка'     },
  { name:'Ромашковое облако', desc:'Огромная шапка хризантем с гипсофилой',                 price:'4 500 ₽', img:BASE + 'images/bouquet-cloud.png',    cat:'Премиум'     },
  { name:'Тихий шёпот',       desc:'Эустома, гвоздика и пастельные тона',                   price:'2 200 ₽', img:BASE + 'images/bouquet-whisper.png',  cat:'Топ подарок' },
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
  { name:'Нежный флирт',      desc:'Розовые и белые альстромерии в нежной упаковке', price:'2 800 ₽', img:BASE + 'images/bouquet-flirt.png',   accent:'#D9748F' },
  { name:'Полевой букет',     desc:'Ромашки, зелень и полевые травы',                price:'2 400 ₽', img:BASE + 'images/bouquet-field.png',   accent:'#7DAE5C' },
  { name:'Утренний персик',   desc:'Пионовидные розы, ромашки и гвоздика',           price:'3 100 ₽', img:BASE + 'images/bouquet-peach.png',   accent:'#E39A5D' },
  { name:'Ромашковое облако', desc:'Огромная шапка хризантем с гипсофилой',          price:'4 500 ₽', img:BASE + 'images/bouquet-cloud.png',   accent:'#E8A9C4' },
  { name:'Тихий шёпот',       desc:'Эустома, гвоздика и пастельные тона',            price:'2 200 ₽', img:BASE + 'images/bouquet-whisper.png', accent:'#D98CA3' },
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

  let rafId = null;
  let carouselVisible = false;
  function startTick(){ if (!rafId) rafId = requestAnimationFrame(tick); }
  function stopTick(){ if (rafId) cancelAnimationFrame(rafId); rafId = null; }

  let frontIndex = -1;
  function updateCaption(i){
    const item = items[((i % n) + n) % n];
    scrambleText(capName, item.name.toUpperCase());
    scrambleText(capPrice, item.price);
    scrambleText(capDesc, item.desc);

    // Пишем переменную на :root, а не на сам SVG-узел ribbons -- так
    // её подхватывает и .carousel3d-ribbons path (fill), и мягкое
    // цветовое "послесвечение" под каруселью (.carousel3d-bg-extend::before,
    // см. style.css) -- оба должны переливаться в один и тот же акцент
    // синхронно, а bg-extend лежит вне .collections как соседняя секция,
    // так что запись на сам ribbons-узел до него бы не докаскадилась.
    document.documentElement.style.setProperty('--ribbon-color', item.accent);

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

    if (carouselVisible) rafId = requestAnimationFrame(tick);
    else rafId = null;
  }

  new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      carouselVisible = entry.isIntersecting;
      if (carouselVisible) startTick();
    });
  }, { rootMargin: '200px 0px' }).observe(wrap);

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



/* ================= ADVANTAGES -- pinned scrollytelling ================= */
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
function initStoryPanels(){
  const section = document.getElementById('story');
  if (!section) return;

  const logo = document.getElementById('storyLogo');
  const wordWrapEl = section.querySelector('.story-word-wrap');
  const wordEl = document.getElementById('storyWord');
  const subEl  = document.getElementById('storySub');
  const dots   = section.querySelectorAll('.story-progress-dot');
  if (!wordWrapEl || !wordEl || !subEl) return;

  const items = [
    { word:'Прозрачность',    sub:'Пока вы читаете это, где-то в Эквадоре режут розы для завтрашней доставки.' },
    { word:'Эквадор, 2800 м', sub:'Фермы высоко в горах — розы растут медленнее, бутон получается плотнее и держится дольше.' },
    { word:'48 часов',        sub:'От срезки до сборки букета — никакого склада и никакой перележки в холодильнике.' },
    { word:'Ручная сборка',   sub:'Каждый стебель осматриваем и подрезаем под углом вручную — никакого конвейера.' },
    { word:'Фейс-контроль',   sub:'Флорист лично проверяет каждый букет перед тем, как он поедет к вам.' },
  ];
  const segments   = items.length;
  const transitions = segments - 1;      // сколько флипов нужно, чтобы показать все тексты (4)
  const dwellAfterLast = 0.5;            // короткая пауза-"отдых" после последнего флипа, в высотах экрана
  const totalScrollUnits = transitions + dwellAfterLast;

  let current = -1;

  function render(i, immediate = false){
    if (i === current) return;
    current = i;
    const item = items[i];
    const isDark = i % 2 === 0;
    const sideRight = isDark;

    section.classList.toggle('is-dark', isDark);
    section.classList.toggle('is-light', !isDark);
    wordWrapEl.classList.toggle('story-side-right', sideRight);
    wordWrapEl.classList.toggle('story-side-left', !sideRight);

    const enterX = sideRight ? 64 : -64;

    if (immediate){
      wordEl.textContent = item.word;
      subEl.textContent = item.sub;
      gsap.set(wordWrapEl, { x:0, opacity:1, scale:1 });
    } else {
      gsap.timeline()
        .to(wordWrapEl, { opacity:0, x: sideRight ? -18 : 18, scale:.94, duration:.22, ease:'power2.in' })
        .call(() => {
          wordEl.textContent = item.word;
          subEl.textContent = item.sub;
        })
        .fromTo(wordWrapEl,
          { opacity:0, x:enterX, scale:.94 },
          { opacity:1, x:0, scale:1, duration:.5, ease:'back.out(1.6)' }
        );
    }

    dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
  }

  /* ---- вращение лого от прогресса скролла.
     phase идёт 0..totalScrollUnits. Каждое ЦЕЛОЕ значение фазы
     (0,1,2,3,4) -- это момент, когда rotateY кратен 180°, то есть
     лого развёрнуто плашмя к зрителю -- именно тогда меняем текст
     (Math.floor(phase) даёт индекс сегмента ровно с этой границы).
     После последнего перехода (phase >= transitions) вращение
     ЗАМОРАЖИВАЕТСЯ -- остаток скролла (dwellAfterLast) просто держит
     лого неподвижным лицом к зрителю, без лишнего докручивания. ---- */
  function updateLogoRotation(rawPhase){
    if (!logo) return;
    const rotationPhase = Math.min(rawPhase, transitions);
    logo.style.transform = `rotateY(${rotationPhase * 180}deg)`;
  }

  function segmentIndexFromPhase(rawPhase){
    return Math.min(segments - 1, Math.floor(rawPhase));
  }

  render(0, true);
  updateLogoRotation(0);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    return;
  }

  const mm = gsap.matchMedia();

  mm.add('(min-width: 881px)', () => {
    const pinTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: () => '+=' + (window.innerHeight * totalScrollUnits),
      pin: true,
      scrub: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: self => {
        const phase = self.progress * totalScrollUnits;
        updateLogoRotation(phase);
        render(segmentIndexFromPhase(phase));
      },
      onRefresh: self => {
        const phase = self.progress * totalScrollUnits;
        updateLogoRotation(phase);
        render(segmentIndexFromPhase(phase), true);
      },
    });

    return () => { pinTrigger.kill(); };
  });
}
initStoryPanels();
/* ================= FAQ (glass strips, scramble + scroll-invert) ================= */
initFAQ();

/* ================= FLORISTS (pinned card-dealing sequence + video crossfade) ================= */
initFlorists();

/* ---- три видео секции florists все стартуют с autoplay при загрузке
   и продолжают декодироваться фоном, даже если видно только .is-active
   -- это лишняя постоянная нагрузка, которая как раз и складывается с
   пином/скрабом этой секции в лаг. Секция вне вьюпорта -- пауза всем;
   в кадре -- играет только текущий активный ролик, остальные на паузе. ---- */
(function initFloristsVideoPerf(){
  const section = document.getElementById('florists');
  if (!section) return;
  const videos = section.querySelectorAll('.florists-video');
  if (!videos.length) return;

  function syncPlayback(sectionInView){
    videos.forEach(v => {
      if (sectionInView && v.classList.contains('is-active')) v.play().catch(()=>{});
      else v.pause();
    });
  }

  new IntersectionObserver((entries) => {
    entries.forEach(entry => syncPlayback(entry.isIntersecting));
  }, { threshold: .05 }).observe(section);

  // florists.js переключает .is-active при кроссфейде -- ловим смену
  // класса и держим играющим только новый активный ролик
  const classObserver = new MutationObserver(() => {
    syncPlayback(section.getBoundingClientRect().top < window.innerHeight && section.getBoundingClientRect().bottom > 0);
  });
  videos.forEach(v => classObserver.observe(v, { attributes:true, attributeFilter:['class'] }));
})();

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
initMouseTrail();
initContactPanel();
initMobileNav();