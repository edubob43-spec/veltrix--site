/* O ícone só substitui a inicial depois de carregar com sucesso. */
(() => {
  const init = () => {
    document.querySelectorAll('.serveravatar-image').forEach(img => {
      const avatar = img.closest('.serveravatar');
      if (!avatar) return;
      const update = () => avatar.classList.toggle('icon-loaded', img.naturalWidth > 0);
      img.addEventListener('load', update);
      img.addEventListener('error', update);
      if (img.complete) update();
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
