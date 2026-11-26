import { BANNERS, THEMES, ownedBadges, cleanProfile, visibleBadges } from './profile-contract.js';

const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bannerUrl=id=>`/assets/profile-banners/${id}.webp`;
function avatarUrl(u) {
  if (!u?.avatar || !/^\d{17,20}$/.test(String(u.id||'')))return 'https://cdn.discordapp.com/embed/avatars/0.png';
  return `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`;
}
// Representações visuais, não cópias de insígnias oficiais: só são exibidas
// quando a flag pública correspondente pertence realmente à conta.
const BADGE_ICONS = {
 staff:'<path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6z"/><path d="m12 7 1.5 3.5 3.5.5-2.7 2.5.7 3.5-3-1.8-3 1.8.7-3.5-2.7-2.5 3.5-.5z"/>',
 partner:'<path d="m12 2 10 10-10 10L2 12zM12 2v20M2 12h20"/>',
 hypesquad:'<path d="M15 2 5 14h8l-3 8 10-13h-8z"/>',
 bug1:'<rect x="7" y="7" width="10" height="12" rx="3"/><path d="M9 7 7 4m8 3 2-3M7 11l-4-2m4 6-4 2m14-6 4-2m-4 6 4 2"/>',
 bravery:'<path d="M4 4 20 20m0-16L4 20M4 4l5 2-3 4m14-6-5 2 3 4"/>',
 brilliance:'<path d="m12 1 3.3 7.7L23 12l-7.7 3.3L12 23l-3.3-7.7L1 12l7.7-3.3z"/>',
 balance:'<path d="M12 3v18M4 8h16M6 9l-4 7h8L6 9zm12 0-4 7h8l-4-7zM7 21h10"/>',
 supporter:'<path d="M12 21C8 18 3 14 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5-5 9-9 12z"/>',
 bug2:'<path d="M6 8 12 3l6 5v8l-6 5-6-5zM6 11l-4-2m4 6-4 2m16-6 4-2m-4 6 4 2"/>',
 developer:'<path d="m8 5-6 7 6 7m8-14 6 7-6 7m-2-16L10 21"/>',
 moderator:'<path d="m12 2 9 4v6c0 5-3 8-9 10-6-2-9-5-9-10V6zM7 12l3 3 6-6"/>',
 active:'<path d="m12 1 3.2 7.8L23 12l-7.8 3.2L12 23l-3.2-7.8L1 12l7.8-3.2z"/>'
};
function badgeIcon(id){return `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${BADGE_ICONS[id]||BADGE_ICONS.active}</svg>`;}

export const PROFILE_EDITOR_CSS = `
/* Veltrix Profile V4: editable, CSS-based Cyber Anime interface, not a static mockup. */
.my-profile{max-width:1480px;margin:0 auto;color:#f8f3ff}
.pc-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;margin:0 0 24px}
.pc-eyebrow{font-size:11px;letter-spacing:.19em;text-transform:uppercase;color:#76eefa;font-weight:900}
.pc-heading h1{font-size:clamp(28px,3.4vw,42px);line-height:1.1;margin:6px 0 7px;letter-spacing:-.035em;font-weight:950}
.pc-heading p{font-size:13px;margin:0;color:#b5aaca;line-height:1.65}
.pc-grid{display:grid;grid-template-columns:minmax(330px,.85fr) minmax(390px,1.15fr);gap:22px;align-items:start}
.pc-editor{background:linear-gradient(143deg,#1f1339 0%,#130b25 65%,#0a1020 100%);border:1px solid #b76cff5e;border-radius:18px;box-shadow:0 10px 40px #0005,0 0 30px #952bf01a;overflow:hidden;min-width:0}
.pc-editor-head{padding:18px 20px 16px;border-bottom:1px solid #ffffff19;background:linear-gradient(90deg,#49208c30,transparent);display:flex;align-items:center;gap:10px}
.pc-editor-head-icon{display:grid;place-items:center;color:#110d20;font-size:22px;background:linear-gradient(140deg,#14eaff,#f13bff);width:40px;height:40px;border-radius:10px;font-weight:900}
.pc-editor-head strong{display:block;font-size:16px}.pc-editor-head small{font-size:11px;color:#c6b2d8}
.pc-field-group{padding:19px 19px 4px}.pc-field-title{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:12px;font-weight:900;letter-spacing:.04em;margin:0 0 12px}.pc-field-title small{font-size:11px;letter-spacing:0;color:#b8aaca;font-weight:500}
.pc-field-title::before{content:'◆';color:#17e5ff;margin-right:-5px}
.pc-theme-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.pc-choice{display:block;position:relative;cursor:pointer;min-width:0}.pc-choice>input{position:absolute;opacity:0;inset:0;width:100%;height:100%;cursor:pointer;z-index:2}.pc-choice>span{display:block;background:#080c1c9c;border:1px solid #a782c83f;border-radius:12px;padding:10px;transition:.16s ease;min-height:67px}
.pc-choice:hover>span{transform:translateY(-2px);border-color:#d94af8}.pc-choice input:focus-visible+span{outline:3px solid #28ebfd;outline-offset:2px}.pc-choice input:checked+span{border-color:#20e7ff;box-shadow:0 0 0 1px #24e7ff80,0 0 23px #d735fc4a;background:#25123a}
.pc-choice-name{display:flex;justify-content:space-between;gap:7px;align-items:center;margin-top:6px;font-size:12px;font-weight:850}.pc-choice-checked{color:#17e6fa;opacity:0}.pc-choice input:checked+span .pc-choice-checked{opacity:1}
.pc-swatch{display:block;height:24px;border-radius:6px;background:linear-gradient(95deg,#16102c,#20dfff,#ed29f4);border:1px solid #ffffff37}
.pc-swatch-neon{background:linear-gradient(100deg,#2b144c,#9e70ff,#b868ec)}.pc-swatch-ambar{background:linear-gradient(100deg,#311223,#f69d4e,#f656a5)}.pc-swatch-glacial{background:linear-gradient(100deg,#0c1f32,#13dfdf,#5895fa)}.pc-swatch-noir{background:linear-gradient(100deg,#080a12,#7a8198,#d6dde9)}
.pc-banner-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.pc-banner-options .pc-choice>span{padding:5px;min-height:unset}.pc-banner-thumb{width:100%;aspect-ratio:1.95;display:block;object-fit:cover;border-radius:7px}.pc-banner-title{font-size:10px;font-weight:850;display:block;padding:6px 3px 3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-badge-options{display:flex;flex-wrap:wrap;gap:8px}.pc-badge-option{display:flex;align-items:center;gap:8px;border-radius:11px;border:1px solid #ffffff30;background:#0a0b20;padding:9px 10px;cursor:pointer;position:relative;font-size:11px;color:#dfd1f0}.pc-badge-option input{accent-color:#1deaff;position:relative;width:15px;height:15px}.pc-badge-option:has(input:checked){border-color:#de4cff;background:#381c55}.pc-badge-option svg{color:#23ddf5}
.pc-bio-input{width:100%;resize:vertical;min-height:88px;max-height:175px;background:#070a1b;color:#f4eaff;border:1px solid #b48cfa55;border-radius:11px;padding:12px;outline:0;font:inherit;font-size:12px}.pc-bio-input:focus{border-color:#19e9fc;box-shadow:0 0 0 3px #19e9fc22}.pc-count{display:block;text-align:right;color:#b5a9c6;font-size:11px;margin:5px 0}
.pc-actions{margin-top:18px;padding:18px 20px;display:flex;align-items:center;gap:10px;border-top:1px solid #ffffff1a;flex-wrap:wrap}.pc-actions small{font-size:11px;color:#aaa0bc}.pc-actions .btn{background:linear-gradient(108deg,#17e5fb,#ef3ef4);color:#160d26;box-shadow:0 4px 24px #e02fff46}
.pc-preview-col{position:sticky;top:20px;min-width:0}.pc-preview-title{display:flex;align-items:center;justify-content:space-between;color:#d3bddf;font-size:12px;letter-spacing:.06em;margin-bottom:10px}.pc-live{font-size:11px;color:#82f1ce;font-weight:850;letter-spacing:0}
.pc-card{--pc-a:#ef3af3;--pc-b:#12e7f8;--pc-base:#0b0a1c;--pc-h:#1b1334;position:relative;overflow:hidden;border-radius:18px;padding:7px;background:linear-gradient(125deg,var(--pc-a),var(--pc-b) 30%,var(--pc-base) 50%,var(--pc-a) 79%,var(--pc-b));box-shadow:0 19px 55px #0009,0 0 31px #b734f442;transition:background .2s}
.pc-card::before{content:'';position:absolute;inset:0;background:linear-gradient(95deg,transparent 0%,#ffffff18 46%,transparent 48%);pointer-events:none}
.pc-card-surface{position:relative;border-radius:13px;background:linear-gradient(135deg,var(--pc-h),var(--pc-base) 65%);overflow:hidden}
.pc-theme-neon{--pc-a:#c67aff;--pc-b:#8c68f7;--pc-base:#110d22;--pc-h:#21123e}
.pc-theme-ambar{--pc-a:#ffad4d;--pc-b:#f15ba2;--pc-base:#140a1b;--pc-h:#2a132d}
.pc-theme-glacial{--pc-a:#12e8e8;--pc-b:#78adff;--pc-base:#071a29;--pc-h:#082d3b}
.pc-theme-noir{--pc-a:#c4d0e0;--pc-b:#929aaa;--pc-base:#10131e;--pc-h:#1a1e2a}
.pc-card-header{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;gap:10px;position:relative;min-height:40px;background:linear-gradient(95deg,#11101e,#231439)}
.pc-card-brand{font-size:14px;font-weight:1000;font-style:italic;letter-spacing:.07em;color:#fff;text-shadow:0 0 12px var(--pc-a)}.pc-card-brand b{color:var(--pc-b)}
.pc-card-bars{display:flex;gap:4px;transform:skewX(-20deg)}.pc-card-bars i{display:block;width:15px;height:7px;background:var(--pc-b);box-shadow:0 0 8px var(--pc-b)}
.pc-card-banner{height:142px;position:relative;background:linear-gradient(100deg,#1f6bd4,#13e8ff);background-size:cover;background-position:center;isolation:isolate}
.pc-card-banner::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,#00102d03,#02031918 60%,#050518a8);z-index:1}
.pc-card-banner::before{content:'';position:absolute;inset:0;border-bottom:4px solid var(--pc-b);box-shadow:inset 0 1px 0 #ffffff55;z-index:2}
.pc-card-banner.pr-banner-cyber{background-image:url('/assets/profile-banners/cyber.webp')}
.pc-card-banner.pr-banner-todas{background-image:url('/assets/profile-banners/todas.webp')}
.pc-card-banner.pr-banner-anjo{background-image:url('/assets/profile-banners/anjo.webp')}
.pc-card-banner.pr-banner-minecraft{background-image:url('/assets/profile-banners/minecraft.webp')}
.pc-card-banner.pr-banner-santuario{background-image:url('/assets/profile-banners/santuario.webp')}
.pc-card-banner.pr-banner-tropa{background-image:url('/assets/profile-banners/tropa.webp')}
.pc-card-banner.pr-banner-regua{background-image:url('/assets/profile-banners/regua.webp')}
.pc-avatar-row{display:flex;align-items:center;gap:14px;position:relative;margin:-43px 13px 0;padding:0 0 9px;z-index:3;min-height:119px}
.pc-avatar-ring{flex:0 0 100px;height:100px;padding:5px;border-radius:50%;background:linear-gradient(130deg,var(--pc-a),var(--pc-b),var(--pc-a));box-shadow:0 0 0 4px #0d0b20,0 0 25px var(--pc-a)}
.pc-avatar-ring img{width:90px;height:90px;border-radius:50%;object-fit:cover;background:#343747}
.pc-name-col{padding:43px 0 0;min-width:0;flex:1}.pc-nickname{font-size:clamp(17px,2.1vw,29px);font-weight:1000;letter-spacing:-.035em;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}
.pc-compact-xp{display:flex;gap:9px;align-items:center;color:#d8cadd;font-size:11px;margin-top:7px;flex-wrap:wrap}
.pc-level{border:1px solid var(--pc-b);padding:3px 7px;border-radius:7px;background:#03091bbb;color:var(--pc-b);font-weight:850}.pc-compact-xp span:last-child{font-weight:800}
.pc-accent-line{height:3px;margin:0 13px;background:linear-gradient(90deg,var(--pc-a),var(--pc-b),transparent);border-radius:2px;box-shadow:0 0 11px var(--pc-a)}
.pc-meta-row{padding:12px 15px 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.pc-wedding{display:flex;gap:8px;align-items:center;border:1px solid var(--pc-a);background:#0c0919cd;border-radius:8px;padding:9px 11px;min-width:0;flex:1;color:#f6e6ff;font-size:12px}.pc-wedding .pc-heart{color:var(--pc-a);font-size:18px}.pc-wedding small{color:#a9a5c6;display:block;font-size:10px}.pc-wedding strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-badge-tray{display:flex;gap:6px;min-height:42px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.pc-badge-emblem{width:35px;height:35px;border:1px solid var(--pc-a);border-radius:9px;display:grid;place-items:center;background:linear-gradient(135deg,#141125,#30124f);color:var(--pc-b);box-shadow:inset 0 0 10px #b833ff37,0 0 8px #d640fd38}
.pc-empty-badges{color:#a6a1b6;font-size:11px;max-width:130px;line-height:1.3;text-align:right}
.pc-bio{margin:12px 15px 15px;min-height:76px;background:linear-gradient(95deg,#0b1124b5,#231238b9);border:1px solid var(--pc-b);border-radius:9px;padding:11px 14px;position:relative}
.pc-bio-label{font-size:11px;font-weight:950;color:var(--pc-b);letter-spacing:.06em}.pc-bio p{margin:5px 0 0;color:#d9cee8;font-size:12px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.pc-decor-corner{position:absolute;right:12px;bottom:5px;width:28px;height:7px;border-left:7px solid var(--pc-a);border-right:7px solid var(--pc-a);transform:skewX(-25deg);opacity:.8}
.pc-preview-note{border:1px solid #a8a1d226;background:#ffffff08;padding:12px;border-radius:11px;font-size:11px;color:#ada9c6;line-height:1.6;margin-top:14px}
@media(max-width:1200px){.pc-grid{grid-template-columns:1fr}.pc-preview-col{position:static;order:-1;max-width:850px}.pc-card{max-width:850px}}
@media(max-width:550px){.pc-banner-options{grid-template-columns:repeat(2,1fr)}.pc-heading{align-items:flex-start;flex-direction:column}.pc-avatar-ring{flex-basis:77px;height:77px;padding:4px}.pc-avatar-ring img{width:69px;height:69px}.pc-avatar-row{margin-top:-31px;min-height:87px}.pc-name-col{padding-top:30px}.pc-nickname{font-size:19px}.pc-badge-tray{justify-content:flex-start}.pc-meta-row{align-items:flex-start}.pc-wedding{flex-basis:100%}.pc-card-banner{height:105px}.pc-editor-head{padding:14px}}
`;

function themeChoice(t,selected){
 const v=esc(t.id);return `<label class="pc-choice"><input type="radio" name="theme" value="${v}" ${selected===t.id?'checked':''}><span><i class="pc-swatch pc-swatch-${v}"></i><span class="pc-choice-name">${esc(t.name)}<b class="pc-choice-checked" aria-hidden="true">✓</b></span></span></label>`;
}
function bannerChoice(b,selected){
 const v=esc(b.id);return `<label class="pc-choice"><input type="radio" name="banner" value="${v}" ${selected===b.id?'checked':''}><span><img class="pc-banner-thumb" src="${bannerUrl(b.id)}" alt="" loading="lazy"><span class="pc-banner-title">${esc(b.name)}</span></span></label>`;
}
export function renderProfileEditor({user, settings={}, flags=0, csrf, connected, message=''}){
 const pref=cleanProfile(settings);
 const owned=ownedBadges(flags);
 const checked=pref.badges===null?owned.slice(0,5).map(x=>x.id):pref.badges;
 const shown=visibleBadges(pref,flags);
 const badgeHtml=shown.length?shown.map(b=>`<span class="pc-badge-emblem" title="${esc(b.name)}">${badgeIcon(b.id)}</span>`).join(''):'<span class="pc-empty-badges">Sem insígnias selecionadas</span>';
 const badgeChoices=owned.length?owned.map(b=>`<label class="pc-badge-option"><input type="checkbox" name="badge" value="${esc(b.id)}" ${checked.includes(b.id)?'checked':''}>${badgeIcon(b.id)}${esc(b.name)}</label>`).join(''):'<p style="font-size:12px;color:#b2a8c5">Sua conta não possui insígnias públicas identificáveis pela API do Discord.</p>';
 const nickname=esc(user.global_name||user.username||'Membro');
 const bio=pref.bio||'';
 return `<div class="my-profile"><div class="pc-heading"><div><div class="pc-eyebrow">✦ IDENTIDADE VELTRIX · PERFIL</div><h1>Seu perfil, <span class="gradient-text">seu estilo.</span></h1><p>Escolha um visual, use seus banners e personalize seu cartão do <strong>.perfil</strong> — tudo direto pelo site.</p></div><a class="btn btn-secondary" href="/dashboard">Meus servidores</a></div>
 ${message?`<div class="alert" role="status">${esc(message)}</div>`:''}
 ${!connected?'<div class="alert">Aguardando o bot no KataBump. Você pode experimentar o visual, mas salvar exige sincronização ativa.</div>':''}
 <div class="pc-grid">
 <form class="pc-editor" method="POST" action="/me/perfil" id="pc-editor">
  <input type="hidden" name="csrf" value="${esc(csrf)}">
  <div class="pc-editor-head"><span class="pc-editor-head-icon">✎</span><div><strong>Editor de Perfil</strong><small>Alterações visíveis na prévia ao lado</small></div></div>
  <div class="pc-field-group"><div class="pc-field-title">Layout do perfil <small>5 estilos</small></div><div class="pc-theme-options">${THEMES.map(t=>themeChoice(t,pref.theme)).join('')}</div></div>
  <div class="pc-field-group"><div class="pc-field-title">Escolha seu banner <small>7 opções</small></div><div class="pc-banner-options">${BANNERS.map(b=>bannerChoice(b,pref.banner)).join('')}</div></div>
  <div class="pc-field-group"><div class="pc-field-title">Insígnias visíveis <small>Até 5 · apenas suas</small></div><div class="pc-badge-options">${badgeChoices}</div></div>
  <div class="pc-field-group"><label class="pc-field-title" for="pc-bio">Sobre mim <small>Opcional</small></label><textarea id="pc-bio" class="pc-bio-input" name="bio" maxlength="160" placeholder="Escreva algo sobre você...">${esc(bio)}</textarea><span class="pc-count" id="pc-count">${Array.from(bio).length}/160</span></div>
  <div class="pc-actions"><button type="submit" class="btn" ${connected?'':'disabled'}>✦ Salvar meu perfil</button><small>${connected?'Salva e sincroniza com o bot':'Conectando à Veltrix…'}</small></div>
 </form>
 <div class="pc-preview-col"><div class="pc-preview-title"><strong>◈ PRÉVIA AO VIVO</strong><span class="pc-live">● Ao alterar, atualiza aqui</span></div>
  <div class="pc-card pc-theme-${esc(pref.theme)}" id="pc-card"><div class="pc-card-surface">
   <div class="pc-card-header"><span class="pc-card-brand">◈ VELTRI<b>X</b></span><span class="pc-card-bars" aria-hidden="true"><i></i><i></i><i></i></span></div>
   <div id="pc-banner" class="pc-card-banner pr-banner-${esc(pref.banner)}" role="img" aria-label="Banner selecionado"></div>
   <div class="pc-avatar-row"><span class="pc-avatar-ring"><img src="${esc(avatarUrl(user))}" alt="Seu avatar Discord"></span><div class="pc-name-col"><div class="pc-nickname">${nickname}</div><div class="pc-compact-xp"><span class="pc-level">Nv. 9</span><span>978/1000 XP</span></div></div></div>
   <div class="pc-accent-line" aria-hidden="true"></div>
   <div class="pc-meta-row"><div class="pc-wedding"><span class="pc-heart">♡</span><span><small>Casamento</small><strong>Veltrix</strong></span></div><div class="pc-badge-tray" id="pc-badge-tray">${badgeHtml}</div></div>
   <div class="pc-bio"><div class="pc-bio-label">◇ SOBRE MIM</div><p id="pc-bio-preview">${esc(bio)||'Sua descrição vai aparecer aqui…'}</p><span class="pc-decor-corner" aria-hidden="true"></span></div>
  </div></div>
  <div class="pc-preview-note">O nome será o <b>apelido usado no servidor</b>. Nível, XP, casamento e avatar serão os dados reais no Discord. A prévia usa valores de exemplo apenas para mostrar o visual. Não inclui conquistas nem barra de XP.</div>
 </div></div><script src="/assets/veltrix-profile-editor-v4.js" defer></script></div>`;
}
