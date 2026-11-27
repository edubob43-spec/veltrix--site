// Avatares reais dos servidores retornados pelo OAuth2 do Discord.
// Nenhuma requisição extra ao Discord ou permissão adicional é necessária.
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[char]));

export function guildIconUrl(guild) {
  const id = String(guild?.id ?? '');
  const icon = String(guild?.icon ?? '');
  if (!/^\d{17,20}$/.test(id) || !/^(?:a_)?[a-f\d]{32}$/i.test(icon)) return '';
  const ext = icon.startsWith('a_') ? 'gif' : 'webp';
  return `https://cdn.discordapp.com/icons/${id}/${icon}.${ext}?size=128`;
}

export function renderGuildAvatar(guild) {
  const name = String(guild?.name || 'Veltrix').trim();
  const initial = Array.from(name)[0] || 'V';
  const url = guildIconUrl(guild);
  return `<span class="serveravatar" aria-hidden="true"><span class="serveravatar-letter">${esc(initial)}</span>${url ? `<img class="serveravatar-image" src="${url}" alt="" width="48" height="48" loading="lazy" decoding="async"/>` : ''}</span>`;
}

export const GUILD_ICONS_CSS = `
/* Seleção de servidor: imagem do Discord, com fallback sem layout shift. */
.serveravatar{position:relative;overflow:hidden;isolation:isolate;flex:0 0 48px}
.serveravatar-letter{position:relative;z-index:0;display:block;line-height:1}
.serveravatar-image{position:absolute;z-index:1;inset:0;display:block;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .2s ease}
.serveravatar.icon-loaded .serveravatar-image{opacity:1}
@media(prefers-reduced-motion:reduce){.serveravatar-image{transition:none}}
`;
