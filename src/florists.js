/* =========================================================
   FLORISTS — pinned, scroll-scrubbed card stack over a looping
   video background.

   Desktop: the section pins for a scroll distance of roughly
   (card count) screens. Scrubbing through that distance "deals"
   the next florist's card in -- the outgoing card slides up and
   away with a slight rotation (echoing the fanned card stack in
   the preloader), the incoming one drops in from below -- while
   the matching background video crossfades underneath. Because
   it's pin + scrub rather than a one-shot wheel-lock, it stays
   scrubbable both directions and never fights the browser's own
   scroll/trackpad handling.

   Mobile (<=880px -- the same breakpoint the "story" bouquet
   breakdown section already uses for its own fallback): pinning
   three autoplaying videos is expensive for very little payoff on
   a small screen, so cards fall back to a plain vertical stack
   that reveals on scroll, with a single ambient video behind the
   whole section instead of three.

   Wire up in main.js:
     import { initFlorists } from './florists.js';
     ...
     initFlorists();

   Assumes gsap + ScrollTrigger are already loaded/registered
   globally, same as the rest of main.js.
   ========================================================= */

export function initFlorists(){
  const section = document.getElementById('florists');
  if (!section || !window.gsap) return;

  const videos = [...section.querySelectorAll('.florists-video')];
  const cards  = [...section.querySelectorAll('.florist-card')];
  const dots   = [...section.querySelectorAll('.florists-progress-dot')];
  if (!cards.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setActiveVideo(index){
    videos.forEach((v, i) => v.classList.toggle('is-active', i === index));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  // Videos only need to burn battery/bandwidth while the section is
  // actually on screen -- pause them the instant it scrolls out of view.
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        videos.forEach(v => {
          if (entry.isIntersecting) v.play().catch(() => {});
          else v.pause();
        });
      });
    }, { threshold: .05 });
    io.observe(section);
  }

  if (reduceMotion){
    // No motion: every card sits in normal document flow already visible,
    // background frozen on the first video's poster frame.
    gsap.set(cards, { position: 'static', opacity: 1, marginBottom: 24 });
    setActiveVideo(0);
    videos.forEach(v => v.pause());
    return;
  }

  ScrollTrigger.matchMedia({

    /* ---- desktop / tablet: pinned card-dealing sequence ---- */
    '(min-width: 881px)': function(){
      setActiveVideo(0);

      cards.forEach((card, i) => {
        gsap.set(card, {
          opacity: i === 0 ? 1 : 0,
          yPercent: i === 0 ? 0 : 32,
          scale: i === 0 ? 1 : .88,
          rotate: i === 0 ? 0 : (i % 2 ? 7 : -7),
        });
      });

      const tl = gsap.timeline({
  scrollTrigger: {
    trigger: section,
    start: 'top top',
    end: () => '+=' + (window.innerHeight * cards.length * 0.85), // было: `+=${cards.length * 85}%`
    scrub: .6,
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true, // добавили — пересчитывает end при каждом refresh, а не хранит устаревшее число
    onUpdate: (self) => {
      const active = Math.min(cards.length - 1, Math.floor(self.progress * cards.length));
      setActiveVideo(active);
    },
  }
});

      for (let i = 1; i < cards.length; i++){
        const outgoing = cards[i - 1];
        const incoming = cards[i];
        const dir = i % 2 ? -1 : 1; // alternates the discard direction, dealt left/right like the preloader stack

        tl.to(outgoing, {
          opacity: 0, yPercent: -28, scale: .85, rotate: dir * 9,
          duration: 1, ease: 'power2.in',
        }, i - 1)
        .to(incoming, {
          opacity: 1, yPercent: 0, scale: 1, rotate: 0,
          duration: 1, ease: 'power3.out',
        }, i - 1 + .12);
      }

      // hold the final card on screen for a beat before the pin releases,
      // so the section doesn't feel like it cuts off mid-read
      tl.to({}, { duration: .4 });

      return () => { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); };
    },

    /* ---- mobile: plain vertical reveal, one ambient video ---- */
    '(max-width: 880px)': function(){
      setActiveVideo(0);
      gsap.set(cards, { opacity: 0, y: 40 });

      const triggers = cards.map(card =>
        gsap.to(card, {
          opacity: 1, y: 0, duration: .7, ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 88%' },
        })
      );

      return () => triggers.forEach(t => t.scrollTrigger && t.scrollTrigger.kill());
    }
  });
}
