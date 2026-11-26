// Veltrix V2.8 — comportamento do menu de conta; CSS e HTML funcionam mesmo sem este arquivo.
(() => {
  const menu = document.querySelector('#vel-user-menu');
  if (!menu) return;
  const trigger = menu.querySelector('summary');
  document.addEventListener('pointerdown', (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      trigger?.focus();
    }
  });
  const pathname = window.location.pathname;
  for (const link of menu.querySelectorAll('[data-vel-menu-path]')) {
    const target = link.getAttribute('data-vel-menu-path');
    if (pathname === target || pathname.startsWith(target + '/')) {
      link.setAttribute('aria-current', 'page');
    }
  }
})();
