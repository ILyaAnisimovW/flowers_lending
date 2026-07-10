/* =========================================================
   FAQ — scroll-triggered slide-in from the left + hover glitch
   that scrambles the question into the answer (and back).

   Wire it up in main.js:
     import { initFAQ } from './faq.js';
     ...
     initFAQ();

   Assumes gsap + ScrollTrigger are already loaded/registered globally,
   same as the rest of main.js.
   ========================================================= */

const FAQ_SCRAMBLE_CHARS = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ0123456789*+×';

function faqScrambleTo(el, newText){
  clearInterval(el._faqScrambleTimer);
  const len = newText.length;
  const totalFrames = 16;
  let frame = 0;

  el.classList.add('is-glitching');

  el._faqScrambleTimer = setInterval(() => {
    frame++;
    let out = '';
    for (let i = 0; i < len; i++){
      const revealAt = (i / len) * totalFrames;
      if (newText[i] === ' ' || frame >= revealAt + 3){
        out += newText[i];
      } else {
        out += FAQ_SCRAMBLE_CHARS[(Math.random() * FAQ_SCRAMBLE_CHARS.length) | 0];
      }
    }
    el.textContent = out;

    if (frame >= totalFrames + 3){
      clearInterval(el._faqScrambleTimer);
      el.textContent = newText;
      el.classList.remove('is-glitching');
    }
  }, 26);
}

export function initFAQ(){
  const strips = document.querySelectorAll('.faq-strip');
  if (!strips.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- плавное укрупнение снизу: плашка входит в кадр уменьшенной и
     прозрачной, и по мере появления снизу экрана плавно дорастает до
     обычного размера -- триггерим прямо в момент входа в кадр (start:
     'top 100%'), а не когда она уже наполовину видна, иначе рост не
     будет заметен ---- */
  if (!reduceMotion && window.gsap){
    gsap.set(strips, { scale: .62, opacity: 0, transformOrigin: '50% 100%' });
    strips.forEach((strip, i) => {
      gsap.to(strip, {
        scale: 1,
        opacity: 1,
        duration: .8,
        delay: (i % 3) * .05, // лёгкий каскад для плашек, входящих в кадр почти одновременно
        ease: 'power3.out',
        scrollTrigger: { trigger: strip, start: 'top 100%' },
      });
    });
  } else {
    strips.forEach((strip) => { strip.style.opacity = 1; });
  }

  /* ---- НОВОЕ: плавная инверсия цветов на половине секции ---- */
  initFAQColorInvert(reduceMotion);

  /* ---- hover / focus glitch (без изменений) ---- */
  strips.forEach((strip) => {
    const textEl = strip.querySelector('.faq-strip-text');
    if (!textEl) return;
    const question = textEl.dataset.question || textEl.textContent.trim();
    const answer = textEl.dataset.answer || '';
    let showingAnswer = false;

    function openStrip(){
      if (showingAnswer || !answer) return;
      showingAnswer = true;
      strip.classList.add('is-open');
      faqScrambleTo(textEl, answer);
    }
    function closeStrip(){
      if (!showingAnswer) return;
      showingAnswer = false;
      strip.classList.remove('is-open');
      faqScrambleTo(textEl, question);
    }

    strip.addEventListener('mouseenter', openStrip);
    strip.addEventListener('mouseleave', closeStrip);
    strip.addEventListener('focus', openStrip);
    strip.addEventListener('blur', closeStrip);
    strip.addEventListener('click', () => {
      if (matchMedia('(hover: none)').matches){
        showingAnswer ? closeStrip() : openStrip();
      }
    });
  });
}

/* Секция стартует "инвертированной" (чёрный фон / светлые плашки),
   а перекрашивается в обычную схему (светлый фон / тёмные плашки) сразу
   же по мере входа в экран снизу -- а не только когда её верх дойдёт до
   верха страницы. Раньше start был 'top top', и пока секция въезжала
   снизу и уже наполовину читалась на экране, инверсия ещё даже не
   начиналась (весь этот путь она стояла чёрной). Теперь start -- 'top
   bottom' (в момент первого касания низа экрана), end -- фиксированные
   +=520px после этого, так что переход завершается рано, пока секция
   ещё въезжает, а не когда она давно на экране. */
function initFAQColorInvert(reduceMotion){
  const faqSection = document.querySelector('.faq');
  if (!faqSection || reduceMotion || !window.gsap) return;

  const faqDesc  = faqSection.querySelector('.section-head p');
  const strips   = faqSection.querySelectorAll('.faq-strip');
  const icons    = faqSection.querySelectorAll('.faq-strip-icon');

  const INK   = '#0D0D0D';
  const PAPER = '#FAF9F5';
  const GRAY  = '#4A4A47';
  const PAPER_MUTED = 'rgba(250,249,245,.68)';

  // стартовое (инвертированное) состояние
  gsap.set(faqSection, { backgroundColor: INK, color: PAPER });
  if (faqDesc) gsap.set(faqDesc, { color: PAPER_MUTED });
  gsap.set(strips, { backgroundColor: PAPER, color: INK });
  gsap.set(icons, { color: INK });

  const INVERT_DISTANCE = '+=520'; // фиксированная дистанция от start, не зависящая от высоты секции

  gsap.timeline({
    scrollTrigger: {
      trigger: faqSection,
      start: 'top bottom',
      end: INVERT_DISTANCE,
      scrub: true,
    }
  })
  .to(faqSection, { backgroundColor: PAPER, color: INK, ease: 'none' }, 0)
  .to(strips,     { backgroundColor: INK,   color: PAPER, ease: 'none' }, 0)
  .to(icons,      { color: PAPER, ease: 'none' }, 0);

  if (faqDesc){
    gsap.to(faqDesc, {
      color: GRAY, ease: 'none',
      scrollTrigger: { trigger: faqSection, start: 'top bottom', end: INVERT_DISTANCE, scrub: true }
    });
  }
}