// Vitrine voluntária da comunidade: nunca publica usuários do bot sem autorização.
// O arquivo local é temporário no Render gratuito. Para persistência configure VELTRIX_SHOWCASE_FILE
// para um caminho em disco persistente, caso o serviço possua um.
import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

const validId = id => /^\d{17,20}$/.test(String(id ?? ''));
const validAvatar = avatar => typeof avatar === 'string' && /^(?:a_)?[a-f0-9]{32}$/i.test(avatar);
const escapeHtml = text => String(text ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const trimName = text => String(text ?? '').replace(/[\x00-\x1f\x7f<>]/g,'').trim().slice(0,40) || 'Membro Veltrix';
const maxEntries = 80;

function cleanEntry(raw) {
  if(!raw || !validId(raw.id)) return null;
  return {
    id: String(raw.id),
    name: trimName(raw.name),
    avatar: validAvatar(raw.avatar) ? raw.avatar : null,
    consentAt: Number.isSafeInteger(raw.consentAt) && raw.consentAt > 0 ? raw.consentAt : Date.now()
  };
}
function avatarUrl(entry) {
  if (!entry.avatar) return 'https://cdn.discordapp.com/embed/avatars/0.png';
  return `https://cdn.discordapp.com/avatars/${entry.id}/${entry.avatar}.${entry.avatar.startsWith('a_')?'gif':'webp'}?size=128`;
}

export function createShowcaseStore(filePath = join(tmpdir(),'veltrix-community-showcase-v1.json')) {
  let entries=[];
  try {
    const saved=JSON.parse(readFileSync(filePath,'utf8'));
    if(Array.isArray(saved)) {
      const unique=new Map();
      for(const raw of saved.slice(-maxEntries)) {
        const entry=cleanEntry(raw);
        if(entry) unique.set(entry.id,entry);
      }
      entries=[...unique.values()];
    }
  } catch(error) {
    if(error.code!=='ENOENT') console.warn('[Vitrine Veltrix] Não foi possível ler os dados anteriores:',error.message);
  }
  function persist() {
    mkdirSync(dirname(filePath),{recursive:true,mode:0o700});
    const tempfile=filePath+'.tmp';
    writeFileSync(tempfile, JSON.stringify(entries),{mode:0o600});
    renameSync(tempfile,filePath);
  }
  return {
    list() { return entries.slice().reverse().slice(0,48).map(e=>({name:e.name,avatarUrl:avatarUrl(e)})); },
    contains(id) { return validId(id) && entries.some(e=>e.id===String(id)); },
    join(user) {
      const entry=cleanEntry({
        id:user?.id, name:user?.global_name||user?.username, avatar:user?.avatar, consentAt:Date.now()
      });
      if(!entry) throw Error('Conta do Discord inválida.');
      const previous=entries;
      entries=[...previous.filter(e=>e.id!==entry.id),entry].slice(-maxEntries);
      try { persist(); } catch(error) { entries=previous; throw error; }
    },
    leave(id) {
      if(!validId(id)) throw Error('Conta do Discord inválida.');
      const previous=entries;
      entries=entries.filter(e=>e.id!==String(id));
      try { persist(); } catch(error) { entries=previous; throw error; }
    }
  };
}

export function renderCommunityShowcase({members=[],user=null,csrf='',notice=''}={}) {
  const real=members.length>0;
  const animated=members.length>=5 || !real;
  const placeholders=['✦','♡','★','☾','✧','V','✺','✿','✶','♥','✧','✦','♢','★'];
  const cards=real
    ?members.slice(0,48).map(member=>`<figure class="vel-community-person"><span class="vel-community-photo"><img src="${escapeHtml(member.avatarUrl)}" alt="" width="88" height="88" loading="lazy" decoding="async"></span><figcaption>${escapeHtml(member.name)}</figcaption></figure>`).join('')
    :placeholders.map((symbol,i)=>`<span class="vel-community-placeholder vel-community-placeholder-${i%7}"><span>${escapeHtml(symbol)}</span></span>`).join('');
  const rail=`<div class="vel-community-group">${cards}</div>${animated ? `<div class="vel-community-group" aria-hidden="true">${cards}</div>` : ''}`;
  const controls=user ? (user.optedIn
    ? `<form class="vel-showcase-action" method="POST" action="/me/showcase"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="showcaseAction" value="leave"><button class="vel-showcase-btn secondary" type="submit">Remover minha foto</button></form>`
    : `<form class="vel-showcase-action" method="POST" action="/me/showcase"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="showcaseAction" value="join"><label class="vel-showcase-consent"><input type="checkbox" name="consent" value="yes" required> Autorizo mostrar publicamente meu nome e avatar do Discord nesta vitrine até eu remover.</label><button class="vel-showcase-btn" type="submit">✦ Quero aparecer também</button></form>`)
    : `<a class="vel-showcase-btn" href="/auth/login?next=showcase">✦ Entrar com Discord para participar</a>`;
  return `<section id="comunidade" class="vel-community" aria-labelledby="vel-community-title">
    <div class="vel-community-heading"><span class="vel-home-eyebrow">✦ COMUNIDADE VELTRIX</span><h2 id="vel-community-title">A nossa galera também <span>brilha!</span></h2>
    <p>${real ? 'Pessoas que escolheram aparecer na vitrine da Veltrix.' : 'Seja um dos primeiros a aparecer nessa vitrine com sua foto do Discord.'}</p></div>
    <div class="vel-community-window" aria-label="${real?'Fotos de participantes que autorizaram a exibição':'Prévia ilustrativa de avatares decorativos'}">
      <div class="vel-community-track ${animated?'is-moving':'is-static'}">${rail}</div>
    </div>
    ${!real?'<p class="vel-community-caption">Prévia ilustrativa — nenhuma foto de usuário é publicada sem permissão.</p>':''}
    <div class="vel-community-join">${notice?`<p class="vel-showcase-notice" role="status">${escapeHtml(notice)}</p>`:''}${controls}</div>
  </section>`;
}
