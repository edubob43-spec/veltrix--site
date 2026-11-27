(() => {
  'use strict';
  function boot() {
    const track = document.querySelector('.vel-community-track.is-one-at-a-time.can-rotate');
    if (!track) return;
    const cards = [...track.querySelectorAll('.vel-community-person')];
    if (cards.length < 2) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let index = 0;
    function showNext(event) {
      if (event.target !== cards[index] || event.animationName !== 'vel-community-one') return;
      cards[index].classList.remove('is-current');
      index = (index + 1) % cards.length;
      cards[index].classList.add('is-current');
    }
    track.addEventListener('animationend', showNext);
    // Sem movimento quando o usuário preferir animações reduzidas.
    function applyPreference() {
      track.classList.toggle('is-paused', reduced.matches);
      if (!cards.some(card => card.classList.contains('is-current'))) cards[index].classList.add('is-current');
    }
    applyPreference();
    reduced.addEventListener?.('change', applyPreference);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
