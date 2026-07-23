export function initMobileNav(){
  const burger = document.getElementById('navBurger');
  const menu = document.getElementById('navMobileMenu');
  if (!burger || !menu) return;

  function closeMenu(){
    burger.classList.remove('is-active');
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-menu-open');
  }
  function toggleMenu(){
    const open = menu.classList.toggle('is-open');
    burger.classList.toggle('is-active', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-menu-open', open);
  }

  burger.addEventListener('click', toggleMenu);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 920) closeMenu(); });
}