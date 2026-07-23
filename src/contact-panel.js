/* =========================================================
   CONTACT PANEL — модалка "Контакты".

   Открывается по клику на любой элемент с [data-contact-trigger]
   (пункт "Контакты" в шапке, на некоторых страницах — и nav-cta).
   Работает одинаково на index.html, catalog.html, reviews.html,
   т.к. разметка модалки (#contactOverlay) продублирована в каждом
   из них — тот же паттерн, что у checkout-overlay.

   Вызывать из main.js / catalog.js / reviews.js:
     import { initContactPanel } from './contact-panel.js';
     ...
     initContactPanel();
   ========================================================= */
export function initContactPanel(){
  const overlay = document.getElementById('contactOverlay');
  if (!overlay) return;

  const closeBtn  = document.getElementById('contactClose');
  const revealEls = overlay.querySelectorAll('.contact-row, .contact-socials');
  const triggers  = document.querySelectorAll('[data-contact-trigger]');

  function open(){
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    if (window.gsap){
      gsap.set(revealEls, { opacity: 0, y: 12 });
      gsap.to(revealEls, {
        opacity: 1, y: 0, duration: .4, stagger: .05,
        ease: 'power2.out', delay: .12,
      });
    }
  }

  function close(){
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  triggers.forEach(t => t.addEventListener('click', (e) => {
    e.preventDefault();
    open();
  }));

  closeBtn && closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });
}