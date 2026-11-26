// Identical validation contract on Render and KataBump.
// Public flags, not invented badges. Discord does not expose every profile badge.
export const BANNERS = Object.freeze([
  { id: 'cyber', name: 'Anime Neon', tone: 'Azul elétrico' },
  { id: 'todas', name: 'De todas', tone: 'Laranja & preto' },
  { id: 'anjo', name: 'Loves Money', tone: 'Dark minimal' },
  { id: 'minecraft', name: 'Mundo em blocos', tone: 'Verde aventureiro' },
  { id: 'santuario', name: 'Santuário', tone: 'Gótico & branco' },
  { id: 'tropa', name: 'Tropa', tone: 'Humor & dinheiro' },
  { id: 'regua', name: 'Na régua', tone: 'Urbano' }
]);
export const THEMES = Object.freeze([
  { id:'cyber', name:'Cyber Anime', accent:'#FF3BEB', secondary:'#00E5FF', bg:'#100C26' },
  { id:'neon', name:'Violeta Neon', accent:'#C17BFF', secondary:'#AA7CFF', bg:'#120D21' },
  { id:'ambar', name:'Âmbar', accent:'#FFAD66', secondary:'#F46BA9', bg:'#191018' },
  { id:'glacial', name:'Glacial', accent:'#72E7DE', secondary:'#7AA6FF', bg:'#091C23' },
  { id:'noir', name:'Noir', accent:'#D8D8E4', secondary:'#9FA9C4', bg:'#101118' }
]);
// Only stable, publicly exposed Discord UserFlags. Other cosmetic profile badges
// (e.g. certain quests/collectibles) are not promised as readable via OAuth.
export const BADGES = Object.freeze([
  { id:'staff', name:'Equipe Discord', bit:1, short:'DS' },
  { id:'partner', name:'Parceiro Discord', bit:2, short:'P' },
  { id:'hypesquad', name:'Eventos HypeSquad', bit:4, short:'H' },
  { id:'bug1', name:'Caçador de Bugs', bit:8, short:'B' },
  { id:'bravery', name:'HypeSquad Bravery', bit:64, short:'BR' },
  { id:'brilliance', name:'HypeSquad Brilliance', bit:128, short:'BI' },
  { id:'balance', name:'HypeSquad Balance', bit:256, short:'BA' },
  { id:'supporter', name:'Apoiador Inicial', bit:512, short:'AS' },
  { id:'bug2', name:'Caçador de Bugs nível 2', bit:16384, short:'B2' },
  { id:'developer', name:'Desenvolvedor Inicial', bit:131072, short:'DEV' },
  { id:'moderator', name:'Moderador certificado', bit:262144, short:'MOD' },
  { id:'active', name:'Desenvolvedor Ativo', bit:4194304, short:'AD' }
]);
export const DEFAULT_PROFILE = Object.freeze({ banner:'cyber', theme:'cyber', badges:null, bio:'' });
const list=(arr, id)=>arr.some(x=>x.id===id);
export function ownedBadges(flags) {
  const n=Number(flags);
  if(!Number.isSafeInteger(n)||n<0)return [];
  return BADGES.filter(b=>(n & b.bit)===b.bit);
}
export function cleanProfile(raw={}) {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Perfil inválido.');
  const banner=String(raw.banner??DEFAULT_PROFILE.banner);
  const theme=String(raw.theme??DEFAULT_PROFILE.theme);
  if(!list(BANNERS,banner) || !list(THEMES,theme))throw Error('Banner ou layout inválido.');
  let badges=raw.badges;
  if(badges===undefined||badges===null)badges=null;
  else {
    if(!Array.isArray(badges)||badges.length>5||badges.some(x=>typeof x!=='string'||!list(BADGES,x)))throw Error('Insígnias inválidas.');
    badges=[...new Set(badges)];
  }
  const bio=String(raw.bio??'').trim();
  if(Array.from(bio).length>160 || /[\x00-\x08\x0b-\x1f\x7f]/.test(bio))throw Error('Descrição inválida: limite de 160 caracteres.');
  return { banner, theme, badges, bio };
}
export function visibleBadges(raw,flags){
  const owned=ownedBadges(flags);
  const selected=cleanProfile(raw).badges;
  return (selected===null?owned:owned.filter(b=>selected.includes(b.id))).slice(0,5);
}
