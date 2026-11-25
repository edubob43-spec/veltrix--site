import { BANNERS, THEMES, ownedBadges, cleanProfile, visibleBadges } from './profile-contract.js';

const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const bannerUrl=id=>`/assets/profile-banners/${id}.webp`;
const avatarUrl=u=>u.avatar?`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`:'https://cdn.discordapp.com/embed/avatars/0.png';

export const PROFILE_EDITOR_CSS = `
.my-profile{max-width:1170px;margin:0 auto}.profile-head{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:24px}
.profile-head small{font-size:11px;letter-spacing:.17em;color:#93eedc;font-weight:800}.profile-head h1{font-size:39px;letter-spacing:-.045em;margin:8px 0}.profile-head p{color:#a9a2ba;max-width:760px;font-size:13px;line-height:1.65}
.profile-editor-grid{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(290px,.88fr);gap:22px;align-items:start}
.pr-preview-side{position:sticky;top:22px;min-width:0}.pr-preview-label{font-size:11px;color:#BEB2D0;margin-bottom:12px}.pr-card{--pr-accent:#C17BFF;--pr-secondary:#AA7CFF;--pr-bg:#120D21;overflow:hidden;position:relative;border:1px solid var(--pr-accent);border-radius:23px;background:var(--pr-bg);box-shadow:0 20px 60px #0005,0 0 45px color-mix(in srgb,var(--pr-accent) 13%,transparent)}
.pr-theme-ambar .pr-card-inner{background:linear-gradient(0deg,#211219e8,#17101c84)}.pr-theme-glacial .pr-card-inner{background:linear-gradient(108deg,#101c29ee,#092929bd)}.pr-theme-noir .pr-card-inner{background:linear-gradient(135deg,#111218f7,#0e0f17eb)}.pr-theme-noir .pr-nick{letter-spacing:.015em}.pr-theme-ambar .pr-nick{color:#FFE8DB}.pr-theme-glacial .pr-nick{color:#DFFFFA}
.pr-banner{height:186px;background:#120D1D url('/assets/profile-banners/todas.webp') center / cover no-repeat;position:relative}
.pr-banner:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent,#090715cc)}
.pr-card-inner{display:grid;grid-template-columns:92px minmax(0,1fr);gap:13px;align-items:center;padding:0 19px 22px;position:relative;margin-top:-40px;background:linear-gradient(0deg,var(--pr-bg),transparent)}
.pr-avatar{width:84px;height:84px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 4px var(--pr-bg),0 0 0 6px var(--pr-accent);position:relative;z-index:2}
.pr-main{min-width:0;padding-top:48px}.pr-nick{font-weight:900;font-size:25px;letter-spacing:-.04em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#fff}
.pr-lower{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:9px}
.pr-xp{font-size:12px;font-weight:700;color:#bab1c8}.pr-level{color:var(--pr-accent);border:1px solid var(--pr-accent);border-radius:9px;padding:3px 7px;margin-right:7px;font-size:12px}
.pr-marriage{font-size:12px;color:#e8dff5}.pr-marriage strong{color:var(--pr-accent)}.pr-flag-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:13px;min-height:27px}
.pr-flag{min-width:30px;height:29px;padding:2px 6px;display:inline-grid;place-items:center;border-radius:8px;border:1px solid color-mix(in srgb,var(--pr-accent) 40%,transparent);background:#ffffff0a;font-size:11px;font-weight:900;color:#e6dcfa}
.pr-notes{margin-top:15px;background:#1c1729c7;padding:15px;border:1px solid #ffffff12;border-radius:13px;color:#aea5bd;font-size:12px;line-height:1.6}
.pr-edit-form{background:linear-gradient(160deg,#20172e,#111021);border:1px solid #ffffff1a;border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:21px}
.pr-edit-form h2{margin:0 0 5px;font-size:20px}.pr-edit-form p{font-size:12px;color:#b5a9c6;margin:0 0 5px}
.pr-section-title{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:13px;margin:4px 0 11px}.pr-section-title small{font-weight:500;color:#afa3bc}
.pr-theme-options{display:grid;grid-template-columns:1fr 1fr;gap:9px}.pr-option{position:relative;cursor:pointer;display:block}.pr-option input{position:absolute;opacity:0;top:0;left:0;width:100%;height:100%;cursor:pointer}.pr-option-body{border-radius:13px;border:1px solid #ffffff20;padding:10px;display:block;transition:transform .15s,border .15s,box-shadow .15s;background:#100d1c}
.pr-option input:checked+.pr-option-body{border-color:#c591ff;box-shadow:0 0 0 1px #a58aff88,0 6px 25px #0003}
.pr-option input:focus-visible+.pr-option-body{outline:3px solid #9DEFE4;outline-offset:2px}.pr-option:hover .pr-option-body{transform:translateY(-2px)}
.pr-skin-swatch{height:33px;display:block;border-radius:9px;margin-bottom:8px;border:1px solid #ffffff17}.pr-option-title{font-size:12px;font-weight:800;display:block}
.pr-banner-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.pr-banner-options .pr-option-body{padding:6px}
.pr-banner-thumb{width:100%;aspect-ratio:1.8;object-fit:cover;border-radius:7px;display:block;margin-bottom:7px}.pr-banner-name{font-size:11px;font-weight:750;display:block;padding:0 2px 2px}
.pr-badge-options{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pr-badge-options label{display:flex;gap:10px;align-items:center;font-size:12px;padding:9px;border:1px solid #ffffff23;border-radius:10px;cursor:pointer;min-height:43px}.pr-badge-options label:has(input:checked){border-color:#ae7cf4;background:#a876f417}.pr-badge-options input{accent-color:#ba8dff;width:15px;height:15px}
.pr-badge-options label span{background:#322744;border-radius:6px;padding:4px 6px;font-size:10px;font-weight:900}
.pr-save{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid #ffffff19;padding-top:17px}.pr-save small{font-size:11px;color:#8ce3d8}
.pr-theme-neon{--pr-accent:#C17BFF;--pr-secondary:#AA7CFF;--pr-bg:#120D21}.pr-skin-neon{background:linear-gradient(135deg,#120D21,#C17BFF,#AA7CFF)}
.pr-theme-ambar{--pr-accent:#FFAD66;--pr-secondary:#F46BA9;--pr-bg:#191018}.pr-skin-ambar{background:linear-gradient(135deg,#191018,#FFAD66,#F46BA9)}
.pr-theme-glacial{--pr-accent:#72E7DE;--pr-secondary:#7AA6FF;--pr-bg:#091C23}.pr-skin-glacial{background:linear-gradient(135deg,#091C23,#72E7DE,#7AA6FF)}
.pr-theme-noir{--pr-accent:#D8D8E4;--pr-secondary:#9FA9C4;--pr-bg:#101118}.pr-skin-noir{background:linear-gradient(135deg,#101118,#D8D8E4,#9FA9C4)}
.pr-banner-todas{background-image:url('/assets/profile-banners/todas.webp')}
.pr-banner-anjo{background-image:url('/assets/profile-banners/anjo.webp')}
.pr-banner-minecraft{background-image:url('/assets/profile-banners/minecraft.webp')}
.pr-banner-santuario{background-image:url('/assets/profile-banners/santuario.webp')}
.pr-banner-tropa{background-image:url('/assets/profile-banners/tropa.webp')}
.pr-banner-regua{background-image:url('/assets/profile-banners/regua.webp')}
@media(max-width:1000px){.profile-editor-grid{grid-template-columns:1fr}.pr-preview-side{position:static}.pr-card{max-width:650px}.pr-edit-form{max-width:650px}}
@media(max-width:580px){.pr-banner-options{grid-template-columns:repeat(2,minmax(0,1fr))}.pr-card-inner{grid-template-columns:70px 1fr}.pr-avatar{width:64px;height:64px}.pr-main{padding-top:43px}.pr-nick{font-size:20px}.pr-lower{gap:7px}.pr-edit-form{padding:16px}.profile-head h1{font-size:30px}}
`;

export function renderProfileEditor({ user, settings={}, flags=0, csrf, connected, message='' }) {
  const pref=cleanProfile(settings);
  const visible=visibleBadges(pref,flags);
  const owned=ownedBadges(flags);
  
  const chosen=pref.badges===null?owned.slice(0,5).map(x=>x.id):pref.badges;
  const themeOptions=THEMES.map(t=>`<label class="pr-option"><input type="radio" name="theme" value="${t.id}" ${pref.theme===t.id?'checked':''}/><span class="pr-option-body"><span class="pr-skin-swatch pr-skin-${t.id}"></span><span class="pr-option-title">${esc(t.name)}</span></span></label>`).join('');
  const bannerOptions=BANNERS.map(b=>`<label class="pr-option"><input type="radio" name="banner" value="${b.id}" ${pref.banner===b.id?'checked':''}/><span class="pr-option-body"><img src="${bannerUrl(b.id)}" alt="" class="pr-banner-thumb" loading="lazy"/><span class="pr-banner-name">${esc(b.name)}</span></span></label>`).join('');
  const badgeOptions=owned.map(b=>`<label><input type="checkbox" name="badge" value="${b.id}" ${chosen.includes(b.id)?'checked':''}/><span>${esc(b.short)}</span>${esc(b.name)}</label>`).join('');
  const badgeChips=visible.map(b=>`<span class="pr-flag" title="${esc(b.name)}">${esc(b.short)}</span>`).join('');
  const name=esc(user.global_name||user.username||'Membro');
  return `<div class="my-profile"><div class="profile-head"><div><small>✦ VELTRIX / PERSONALIZAÇÃO</small><h1>Meu perfil <span class="gradient-text">✦</span></h1><p>Escolha o banner, o layout e quais insígnias públicas vão aparecer no <strong>.perfil</strong> e <strong>/perfil</strong>. Sua escolha vale nos servidores em que você usar a Veltrix.</p></div><a class="btn btn-secondary" href="/dashboard">Meus servidores</a></div>
  ${message?`<div class="alert">${esc(message)}</div>`:''}
  ${!connected?'<div class="alert">A Veltrix está reconectando ao KataBump. Você pode visualizar os estilos, mas o botão de salvar fica indisponível até a sincronização voltar.</div>':''}
  <div class="profile-editor-grid">
    <div class="pr-preview-side"><div class="pr-preview-label">PRÉVIA DO CARTÃO — XP E CASAMENTO ILUSTRATIVOS</div>
      <div class="pr-card pr-theme-${pref.theme}" id="pr-card">
        <div class="pr-banner pr-banner-${pref.banner}" id="pr-banner"></div>
        <div class="pr-card-inner"><img class="pr-avatar" src="${esc(avatarUrl(user))}" alt="Seu avatar Discord"/><div class="pr-main"><div class="pr-nick">${name}</div><div class="pr-lower"><div class="pr-xp"><span class="pr-level">Nv. 9</span>978/1000 XP</div><div class="pr-marriage">♡ Casamento <strong>Veltrix</strong></div></div><div class="pr-flag-row" id="pr-flag-row">${badgeChips}</div></div></div>
      </div><div class="pr-notes">No Discord, o perfil usa o <strong>apelido visível no servidor</strong>, o XP real, e o casamento real. A prévia é para escolher o visual. As insígnias são verificadas pela API pública; outras insígnias do Discord podem não estar disponíveis.</div>
    </div>
    <form class="pr-edit-form" action="/me/perfil" method="POST" id="pr-editor"><input type="hidden" name="csrf" value="${esc(csrf)}"/>
      <div><h2>Personalize seu cartão</h2><p>Escolhas salvas no banco da Veltrix, não apenas neste navegador.</p></div>
      <div><div class="pr-section-title">Escolha seu layout <small>4 estilos</small></div><div class="pr-theme-options">${themeOptions}</div></div>
      <div><div class="pr-section-title">Escolha seu banner <small>6 opções</small></div><div class="pr-banner-options">${bannerOptions}</div></div>
      <div><div class="pr-section-title">Quais insígnias aparecem? <small>Até 5</small></div>${owned.length?`<div class="pr-badge-options">${badgeOptions}</div>`:'<p>Nenhuma insígnia pública disponível nesta conta pela API do Discord. Nada será inventado no seu perfil.</p>'}</div>
      <div class="pr-save"><button class="btn" type="submit" ${connected?'':'disabled'}>✦ Salvar meu perfil</button><small>${connected?'Salva pelo bot no KataBump em instantes':'Aguardando conexão do bot'}</small></div>
    </form></div><script src="/assets/veltrix-profile-editor-v1.js" defer></script></div>`;
}
