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
// As três casas HypeSquad têm imagens diferentes, vindas do material
// fornecido para a Veltrix. A conta só recebe a imagem da flag real (64/128/256).
const HYPE_HOUSES = new Set(['bravery','brilliance','balance']);
const houseSrc = id => `/assets/profile-badges/${id}.png?v=52`;
function badgeIcon(id){
 if(HYPE_HOUSES.has(id))return `<img class="pc-house-badge" src="${houseSrc(id)}" alt="" width="26" height="26" loading="lazy">`;
 return `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${BADGE_ICONS[id]||BADGE_ICONS.active}</svg>`;}

export const PROFILE_EDITOR_CSS = `
/* V5: layouts estruturais inspirados nos exemplos enviados. Sem neon ou bordas luminosas. */
.my-profile{max-width:1450px;margin:0 auto;color:#faf7ff}
.pc-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:18px;margin:0 0 23px}
.pc-eyebrow{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#d3c0ec;font-weight:800}
.pc-heading h1{font-size:clamp(30px,3.4vw,43px);line-height:1.1;margin:7px 0 10px;letter-spacing:-.03em;font-weight:850}
.pc-heading p{color:#b8aec8;font-size:13px;margin:0;max-width:680px;line-height:1.65}
.pc-grid{display:grid;grid-template-columns:minmax(340px,.86fr) minmax(390px,1.14fr);gap:24px;align-items:start}
.pc-editor{background:#191526;border:1px solid #403651;border-radius:16px;overflow:hidden;min-width:0;box-shadow:0 15px 32px #05030b3a}
.pc-editor-head{display:flex;align-items:center;gap:13px;background:#251b37;padding:21px;border-bottom:1px solid #423458}
.pc-editor-head-icon{font-size:21px;display:grid;place-items:center;background:#7c60ad;border-radius:9px;width:39px;height:39px}
.pc-editor-head strong{display:block;font-size:17px}.pc-editor-head small{font-size:11px;color:#c6bbd7}
.pc-field-group{padding:19px 20px 2px}.pc-field-title{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px;font-weight:800;letter-spacing:0;margin:0 0 12px}.pc-field-title small{color:#afa3c2;font-size:11px;font-weight:500}
.pc-theme-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.pc-choice{position:relative;display:block;cursor:pointer;min-width:0}.pc-choice>input{position:absolute;inset:0;opacity:0;cursor:pointer;z-index:2;width:100%;height:100%}
.pc-choice>span{display:block;background:#100e1a;border:2px solid #40354c;border-radius:11px;padding:8px;transition:border-color .15s,background .15s;min-height:82px}
.pc-choice:hover>span{border-color:#9d88bc}.pc-choice input:focus-visible+span{outline:3px solid #e9cf98;outline-offset:3px}
.pc-choice input:checked+span{background:#27213a;border-color:#edba79}
.pc-choice-name{display:flex;justify-content:space-between;gap:6px;align-items:center;font-size:12px;font-weight:800;margin-top:8px}.pc-choice-checked{color:#e7b86e;opacity:0}.pc-choice input:checked+span .pc-choice-checked{opacity:1}
/* Each layout preview is drawn with geometry, not a simple gradient swatch. */
.pc-swatch{height:39px;display:block;position:relative;overflow:hidden;border-radius:4px;background:#151322;border:1px solid #514a68}
.pc-swatch::before{content:'';position:absolute;top:4px;left:5px;width:35%;height:30%;background:#4c4169;clip-path:polygon(0 0,100% 0,85% 100%,0 100%)}
.pc-swatch::after{content:'';position:absolute;bottom:5px;left:5px;right:5px;height:13px;border-top:3px solid #6c5883;background:linear-gradient(90deg,#292338 55%,transparent 55%)}
.pc-swatch-cyber{background:linear-gradient(155deg,#281742 0 52%,#131829 52%);border-color:#3bd2d9}
.pc-swatch-cyber::before{background:#f5a333}.pc-swatch-cyber::after{border-color:#22cce0;background:linear-gradient(90deg,#f4a332 34%,#17172b 34%)}
.pc-swatch-neon{background:linear-gradient(160deg,#291739 0 60%,#20112b 60%);border-color:#ce70bc}
.pc-swatch-neon::before{background:#a662d5}.pc-swatch-neon::after{border-color:#be79df;background:linear-gradient(90deg,#54296c 50%,#21132c 50%)}
.pc-swatch-ambar{background:linear-gradient(150deg,#2d2022 0 45%,#17131b 45%);border-color:#f4ae4a}
.pc-swatch-ambar::before{background:#ef9b39}.pc-swatch-ambar::after{border-color:#ed9b3c;background:linear-gradient(90deg,#4c2f22 50%,#171319 50%)}
.pc-swatch-glacial{background:#eff8ff;border-color:#4d99dc}.pc-swatch-glacial::before{background:#50aff2}.pc-swatch-glacial::after{border-color:#378fce;background:linear-gradient(90deg,#b0d9f1 50%,#ffffff 50%)}
.pc-swatch-noir{background:linear-gradient(180deg,#33b8ed 0 58%,#111e39 58%);border-color:#25aee6}.pc-swatch-noir::before{background:#f9f5e9}.pc-swatch-noir::after{border-color:#0f6395;background:linear-gradient(90deg,#96def5 50%,#152943 50%)}
.pc-banner-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.pc-banner-options .pc-choice>span{padding:5px;min-height:0}.pc-banner-thumb{display:block;width:100%;aspect-ratio:1.95;object-fit:cover;border-radius:5px}.pc-banner-title{font-size:10px;display:block;font-weight:800;padding:6px 3px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-badge-options{display:flex;flex-wrap:wrap;gap:8px}.pc-badge-option{display:flex;align-items:center;gap:7px;border:1px solid #534763;border-radius:8px;background:#110f1b;padding:9px;position:relative;cursor:pointer;font-size:11px;color:#ece2f5}.pc-badge-option input{accent-color:#8cbcf1;width:15px;height:15px}.pc-badge-option:has(input:checked){border-color:#d4abdf;background:#2a2039}.pc-badge-option svg{color:#d4ace9}
.pc-bio-input{width:100%;min-height:88px;max-height:180px;resize:vertical;background:#100e1c;color:#f6efff;border:1px solid #5c4a6e;border-radius:9px;padding:12px;outline:0;font:inherit;font-size:13px}.pc-bio-input:focus{outline:2px solid #b899dc}.pc-count{display:block;text-align:right;font-size:11px;color:#b1a4bc;margin:6px 0}
.pc-actions{margin-top:20px;border-top:1px solid #40354c;padding:18px 20px;display:flex;align-items:center;flex-wrap:wrap;gap:10px}.pc-actions small{font-size:11px;color:#b2a9be}
.pc-actions .btn{background:#c09fe4;color:#171023;box-shadow:none}
.pc-preview-col{position:sticky;top:20px;min-width:0}.pc-preview-title{display:flex;align-items:center;justify-content:space-between;color:#c9bbd9;font-size:12px;margin-bottom:9px;gap:10px}.pc-live{color:#b6dfce;font-size:11px}
/* Base card: shared content model, 5 completely different skins. */
.pc-card{--paper:#111223;--text:#f8f5fe;--muted:#bbb8d6;--accent:#4ccbdd;--accent2:#ffa547;--line:#5e5479;--bar:#252039;position:relative;overflow:hidden;border:3px solid var(--accent);border-radius:14px;background:var(--paper);box-shadow:0 14px 30px #0203085c;color:var(--text)}
.pc-card-surface{position:relative;overflow:hidden;background:var(--paper)}
.pc-card-header{height:55px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:var(--bar);border-bottom:3px solid var(--accent);gap:12px}
.pc-card-brand{font-weight:950;font-size:22px;line-height:1;font-style:italic;letter-spacing:.045em;color:var(--text);text-shadow:none}
.pc-card-brand b{color:var(--accent2)}.pc-card-bars{display:flex;gap:5px;transform:skewX(-22deg)}.pc-card-bars i{width:22px;height:8px;background:var(--accent);display:block;box-shadow:none}
.pc-card-banner{height:168px;position:relative;background-size:cover;background-position:center;background-color:#355e87;isolation:isolate}
.pc-card-banner::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,#05050a73);z-index:1}
.pc-card-banner::before{content:'';position:absolute;inset:0;z-index:2;border-bottom:3px solid var(--accent)}
.pc-card-banner.pr-banner-cyber{background-image:url('/assets/profile-banners/cyber.webp')}.pc-card-banner.pr-banner-todas{background-image:url('/assets/profile-banners/todas.webp')}.pc-card-banner.pr-banner-anjo{background-image:url('/assets/profile-banners/anjo.webp')}.pc-card-banner.pr-banner-minecraft{background-image:url('/assets/profile-banners/minecraft.webp')}.pc-card-banner.pr-banner-santuario{background-image:url('/assets/profile-banners/santuario.webp')}.pc-card-banner.pr-banner-tropa{background-image:url('/assets/profile-banners/tropa.webp')}.pc-card-banner.pr-banner-regua{background-image:url('/assets/profile-banners/regua.webp')}
.pc-avatar-row{position:relative;z-index:3;display:flex;gap:16px;align-items:center;margin:-38px 20px 0;min-height:124px;padding-bottom:8px}
.pc-avatar-ring{height:108px;flex:0 0 108px;border:5px solid var(--accent);background:var(--bar);border-radius:50%;box-shadow:0 0 0 4px var(--paper);overflow:hidden}
.pc-avatar-ring img{height:100%;width:100%;object-fit:cover;border-radius:50%}
.pc-name-col{padding-top:42px;min-width:0;flex:1}.pc-nickname{font-size:clamp(20px,2.4vw,32px);line-height:1.15;font-weight:900;font-style:italic;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.02em}
.pc-compact-xp{margin-top:8px;display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:11px;color:var(--muted)}.pc-compact-xp span:last-child{font-weight:800}
.pc-level{font-size:11px;font-weight:900;color:var(--text);border:1px solid var(--line);background:var(--bar);padding:3px 8px;border-radius:5px}
.pc-accent-line{height:3px;margin:0 19px;background:var(--accent)}
.pc-meta-row{display:flex;align-items:center;gap:12px;padding:14px 19px 0}.pc-wedding{display:flex;gap:9px;align-items:center;flex:1;min-width:0;padding:10px 13px;background:var(--bar);border:1px solid var(--line);border-radius:7px}.pc-heart{font-size:23px;line-height:1;color:var(--accent2)}.pc-wedding small{display:block;color:var(--muted);font-size:10px}.pc-wedding strong{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pc-badge-tray{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap}.pc-badge-emblem{height:36px;width:36px;display:grid;place-items:center;border:1px solid var(--line);background:var(--bar);border-radius:7px;color:var(--accent2);box-shadow:none}.pc-empty-badges{color:var(--muted);font-size:10px;max-width:120px;line-height:1.4;text-align:right}
.pc-bio{border:1px solid var(--line);background:var(--bar);margin:15px 19px 19px;min-height:92px;padding:14px 15px 15px;border-radius:6px;position:relative}.pc-bio-label{font-size:12px;font-weight:900;color:var(--accent2)}.pc-bio p{font-size:12px;line-height:1.6;color:var(--text);white-space:pre-wrap;overflow-wrap:anywhere;margin:7px 0 0}.pc-decor-corner{position:absolute;bottom:9px;right:14px;width:29px;height:5px;background:var(--accent);clip-path:polygon(0 0,15% 0,9% 100%,0 100%,29% 0,45% 0,38% 100%,23% 100%,60% 0,75% 0,68% 100%,53% 100%)}
.pc-preview-note{padding:12px;margin-top:12px;background:#181328a6;border:1px solid #4a3e5a;border-radius:10px;font-size:11px;color:#b4a8c3;line-height:1.65}
/* 1 - Exclusive: angular orange / cyan / violet, flat sharp panels. */
.pc-theme-cyber{--paper:#111025;--text:#fffaf8;--muted:#bdb3cf;--accent:#1ac7df;--accent2:#ffa32a;--line:#6f3ab7;--bar:#27143e;border-color:#2ac6d7;clip-path:polygon(0 4%,5% 0,42% 0,45% 3%,100% 3%,100% 96%,96% 100%,0 100%);border-radius:0}
.pc-theme-cyber .pc-card-header{height:62px;background:linear-gradient(125deg,#241037 0 62%,#442270 62%);border-bottom:4px solid #ffa22e;clip-path:polygon(0 0,100% 0,100% 100%,9% 100%,7% 84%,0 84%)}
.pc-theme-cyber .pc-avatar-row{border-bottom:3px solid #602a8b}.pc-theme-cyber .pc-wedding{border:2px solid #ff9e26;clip-path:polygon(0 0,98% 0,100% 30%,100% 100%,0 100%);background:#281638}.pc-theme-cyber .pc-bio{border:2px solid #22bed5;background:#21183d;clip-path:polygon(0 0,96% 0,100% 16%,100% 100%,0 100%)}
/* 2 - Premium: rich purple panels, solid magenta tabs; not a glowing border. */
.pc-theme-neon{--paper:#191126;--text:#fff7ff;--muted:#d1bedc;--accent:#ae64be;--accent2:#eb9ddf;--line:#884993;--bar:#2f1b40;border-radius:4px;border-color:#aa67b9}
.pc-theme-neon .pc-card-header{background:#371c4b;border-bottom:4px solid #a05ab7}.pc-theme-neon .pc-card-brand{font-family:Georgia,serif;font-style:normal;letter-spacing:.08em}.pc-theme-neon .pc-bio-label{background:#7c4194;color:white;display:inline-block;padding:5px 12px;clip-path:polygon(0 0,100% 0,93% 100%,0 100%)}.pc-theme-neon .pc-bio{border-radius:0;border-width:2px}
/* 3 - Street: bold orange and charcoal ribbons. */
.pc-theme-ambar{--paper:#1e1a1d;--text:#fffbf4;--muted:#cbb7a6;--accent:#ec9d37;--accent2:#f5c16e;--line:#7d4b31;--bar:#362723;border-color:#f2ad3e;border-radius:0}
.pc-theme-ambar .pc-card-header{background:#221b21;border-bottom:5px solid #ef9f3a}.pc-theme-ambar .pc-card-banner::before{border-color:#f5b151}.pc-theme-ambar .pc-name-col{transform:skewX(-2deg)}.pc-theme-ambar .pc-wedding{clip-path:polygon(0 0,96% 0,100% 50%,96% 100%,0 100%);background:#54321e;border:2px solid #e8a249}
/* 4 - Retro community: browser/card-like light blue with pixel UI vocabulary. */
.pc-theme-glacial{--paper:#eaf5ff;--text:#153b65;--muted:#57738f;--accent:#368fcb;--accent2:#126eaf;--line:#74b6e0;--bar:#ffffff;border-color:#278fd2;border-width:5px;border-radius:15px;font-family:Verdana,Arial,sans-serif}
.pc-theme-glacial .pc-card-header{background:#b2e0fb;border-color:#2588c9;border-bottom-width:4px}.pc-theme-glacial .pc-card-brand{font-style:normal;letter-spacing:-.04em;color:#18528b}.pc-theme-glacial .pc-card-brand b{color:#0b82bb}.pc-theme-glacial .pc-avatar-ring{border-radius:16px;box-shadow:0 0 0 4px white}.pc-theme-glacial .pc-avatar-ring img{border-radius:11px}.pc-theme-glacial .pc-nickname{font-style:normal}.pc-theme-glacial .pc-bio{background:white;border:2px solid #56a5d9;border-radius:10px}.pc-theme-glacial .pc-level{color:#154874}.pc-theme-glacial .pc-card-banner::after{background:linear-gradient(180deg,transparent 40%,#a1d5f74d)}.pc-theme-glacial .pc-avatar-row{margin-top:-32px}
/* 5 - Anime blue: cyan manga panel, navy wedges and illustrated banner. */
.pc-theme-noir{--paper:#12233b;--text:#f5ffff;--muted:#b3d6e7;--accent:#2bbbe8;--accent2:#78dbf3;--line:#5299d2;--bar:#17375a;border-color:#2bb4e6;border-radius:2px;clip-path:polygon(2% 0,100% 0,100% 95%,97% 100%,0 100%,0 5%)}
.pc-theme-noir .pc-card-header{background:#171d44;border-color:#2bc6ec}.pc-theme-noir .pc-card-banner{background-position:top}.pc-theme-noir .pc-avatar-row{background:#16365a;clip-path:polygon(0 0,100% 0,96% 100%,0 100%);padding-right:14px}.pc-theme-noir .pc-wedding{border:2px solid #29c8e3;background:#143f60;clip-path:polygon(0 0,96% 0,100% 100%,4% 100%)}.pc-theme-noir .pc-bio{background:#234d72;border:2px solid #3ed1e9;border-radius:0}.pc-theme-noir .pc-bio-label{display:inline-block;background:#35bfe9;color:#061c31;padding:4px 10px;font-weight:1000;transform:skewX(-9deg)}
@media(max-width:1170px){.pc-grid{grid-template-columns:1fr}.pc-preview-col{position:static;order:-1;max-width:790px}}
@media(max-width:550px){.pc-heading{align-items:flex-start;flex-direction:column}.pc-banner-options{grid-template-columns:repeat(2,1fr)}.pc-theme-options{gap:7px}.pc-avatar-ring{height:78px;flex-basis:78px;border-width:3px}.pc-avatar-row{min-height:86px;margin-top:-25px;gap:10px}.pc-name-col{padding-top:23px}.pc-nickname{font-size:20px}.pc-card-header{height:45px}.pc-theme-cyber .pc-card-header{height:47px}.pc-card-banner{height:105px}.pc-meta-row{flex-direction:column;align-items:stretch}.pc-badge-tray{justify-content:flex-start}.pc-wedding{width:100%}.pc-card-brand{font-size:17px}.pc-editor-head{padding:15px}}

/* V5.2: o emblema real da casa HypeSquad é plano e recortado, sem ícone inventado. */
.pc-house-badge{display:block;width:27px;height:27px;object-fit:contain;flex:none}
.pc-badge-emblem .pc-house-badge{width:30px;height:30px}
.pc-badge-option:has(.pc-house-badge){min-height:44px}

/* V5.3 • Layout limpo solicitado: sem barra VELTRIX, insígnias livres, casamento no canto direito. */
.pc-card{clip-path:none!important}
.pc-card-banner{height:196px;background-position:center;}
.pc-avatar-row{min-height:120px;gap:13px;align-items:center;margin-top:-38px;margin-right:20px;}
.pc-name-col{flex:1 1 auto;min-width:0;padding-top:38px;}
.pc-nickname{font-size:clamp(18px,2vw,27px)}
.pc-badge-tray{display:flex;flex:0 0 auto;justify-content:flex-end;align-self:flex-end;align-items:center;gap:7px;margin:0 0 21px;flex-wrap:nowrap;min-height:38px}
.pc-badge-emblem{width:32px;height:34px;display:grid;place-items:center;background:transparent;border:0;border-radius:0;box-shadow:none;color:var(--accent2)}
.pc-badge-emblem svg{height:27px;width:27px}
.pc-badge-emblem .pc-house-badge{height:31px;width:31px}
.pc-empty-badges{font-size:10px;white-space:nowrap}
.pc-meta-row{display:flex;justify-content:flex-end;align-items:center;padding:12px 19px 0;}
.pc-wedding{flex:0 1 49%;min-height:62px;max-width:410px;justify-content:flex-start;}
.pc-theme-cyber .pc-avatar-row{border-bottom:0}
@media(max-width:650px){
 .pc-card-banner{height:125px}
 .pc-avatar-row{margin:-27px 12px 0;min-height:100px;align-items:center;gap:8px}
 .pc-avatar-ring{height:74px;flex-basis:74px;border-width:3px}
 .pc-name-col{padding-top:28px}
 .pc-nickname{font-size:18px}
 .pc-compact-xp{font-size:9px;gap:3px}
 .pc-level{font-size:9px;padding:2px 3px}
 .pc-badge-tray{gap:1px;margin-bottom:12px;min-height:25px}
 .pc-badge-emblem{width:23px;height:25px}
 .pc-badge-emblem svg,.pc-badge-emblem .pc-house-badge{width:22px;height:22px}
 .pc-meta-row{flex-direction:row;justify-content:flex-end;align-items:center;padding:9px 12px 0}
 .pc-wedding{width:62%;min-height:50px;max-width:none;flex:0 1 62%;padding:7px 9px}
 .pc-wedding small{font-size:9px}.pc-wedding strong{font-size:12px}
 .pc-bio{margin:11px 12px 13px}
}

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
 return `<div class="my-profile"><div class="pc-heading"><div><div class="pc-eyebrow">PERFIL VELTRIX · PERSONALIZAÇÃO</div><h1>Monte seu <span class="gradient-text">cartão.</span></h1><p>Escolha um layout inspirado nos modelos que você gosta, selecione o banner e confira a prévia. Sem efeitos neon no cartão.</p></div><a class="btn btn-secondary" href="/dashboard">Meus servidores</a></div>
 ${message?`<div class="alert" role="status">${esc(message)}</div>`:''}
 ${!connected?'<div class="alert">Aguardando o bot no KataBump. Você pode experimentar o visual, mas salvar exige sincronização ativa.</div>':''}
 <div class="pc-grid">
 <form class="pc-editor" method="POST" action="/me/perfil" id="pc-editor">
  <input type="hidden" name="csrf" value="${esc(csrf)}">
  <div class="pc-editor-head"><span class="pc-editor-head-icon">✎</span><div><strong>Editor de Perfil</strong><small>Alterações visíveis na prévia ao lado</small></div></div>
  <div class="pc-field-group"><div class="pc-field-title">Estilo do cartão <small>5 layouts</small></div><div class="pc-theme-options">${THEMES.map(t=>themeChoice(t,pref.theme)).join('')}</div></div>
  <div class="pc-field-group"><div class="pc-field-title">Escolha seu banner <small>7 opções</small></div><div class="pc-banner-options">${BANNERS.map(b=>bannerChoice(b,pref.banner)).join('')}</div></div>
  <div class="pc-field-group"><div class="pc-field-title">Insígnias visíveis <small>Até 5 · apenas suas</small></div><div class="pc-badge-options">${badgeChoices}</div></div>
  <div class="pc-field-group"><label class="pc-field-title" for="pc-bio">Sobre mim <small>Opcional</small></label><textarea id="pc-bio" class="pc-bio-input" name="bio" maxlength="160" placeholder="Escreva algo sobre você...">${esc(bio)}</textarea><span class="pc-count" id="pc-count">${Array.from(bio).length}/160</span></div>
  <div class="pc-actions"><button type="submit" class="btn" ${connected?'':'disabled'}>✦ Salvar meu perfil</button><small>${connected?'Salva e sincroniza com o bot':'Conectando à Veltrix…'}</small></div>
 </form>
 <div class="pc-preview-col"><div class="pc-preview-title"><strong>PRÉVIA DO CARTÃO</strong><span class="pc-live">● Ao alterar, atualiza aqui</span></div>
  <div class="pc-card pc-theme-${esc(pref.theme)}" id="pc-card"><div class="pc-card-surface">
   <div id="pc-banner" class="pc-card-banner pr-banner-${esc(pref.banner)}" role="img" aria-label="Banner selecionado"></div>
   <div class="pc-avatar-row"><span class="pc-avatar-ring"><img src="${esc(avatarUrl(user))}" alt="Seu avatar Discord"></span><div class="pc-name-col"><div class="pc-nickname">${nickname}</div><div class="pc-compact-xp"><span class="pc-level">Nv. 9</span><span>978/1000 XP</span></div></div><div class="pc-badge-tray" id="pc-badge-tray">${badgeHtml}</div></div>
   <div class="pc-accent-line" aria-hidden="true"></div>
   <div class="pc-meta-row"><div class="pc-wedding"><span class="pc-heart">♡</span><span><small>Casamento</small><strong>Veltrix</strong></span></div></div>
   <div class="pc-bio"><div class="pc-bio-label">◇ SOBRE MIM</div><p id="pc-bio-preview">${esc(bio)||'Sua descrição vai aparecer aqui…'}</p><span class="pc-decor-corner" aria-hidden="true"></span></div>
  </div></div>
  <div class="pc-preview-note">O nome será o <b>apelido usado no servidor</b>. Nível, XP, casamento e avatar serão os dados reais no Discord. A prévia usa valores de exemplo apenas para mostrar o visual. Não inclui conquistas nem barra de XP.</div>
 </div></div><script src="/assets/veltrix-profile-editor-v52.js" defer></script></div>`;
}
