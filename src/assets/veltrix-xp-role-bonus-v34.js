(() => {
  'use strict';
  const list = document.getElementById('vel-xp-bonus-list');
  const template = document.getElementById('vel-xp-bonus-template');
  const add = document.getElementById('vel-xp-bonus-add');
  const count = document.getElementById('vel-xp-bonus-count');
  if (!list || !template || !add) return;
  const limit = 20;
  const refresh = () => {
    const rows = [...list.querySelectorAll('[data-xp-bonus-row]')];
    const configured = rows.filter(row => {
      const role = row.querySelector('select')?.value || '';
      const amount = row.querySelector('input')?.value?.trim() || '';
      return !!role && !!amount;
    }).length;
    if (count) count.textContent = configured + '/' + limit;
    add.disabled = rows.length >= limit;
  };
  add.addEventListener('click', () => {
    if (list.querySelectorAll('[data-xp-bonus-row]').length >= limit) return;
    list.append(template.content.cloneNode(true));
    refresh();
  });
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-xp-bonus-remove]');
    if (!button) return;
    button.closest('[data-xp-bonus-row]')?.remove();
    refresh();
  });
  list.addEventListener('input', refresh);
  list.addEventListener('change', refresh);
  refresh();
})();
