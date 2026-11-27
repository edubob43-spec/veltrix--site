// Vitrine publica, com cadastro apos login informado e exclusao voluntaria.
// NUNCA salvar usuarios em commits Git: guardar no PostgreSQL.
// IDs removidos nao sao mantidos em texto puro: apenas HMAC para respeitar opt-out.
import pg from 'pg';
import { createHmac } from 'node:crypto';
const { Pool } = pg;

const validId = value => /^\d{17,20}$/.test(String(value ?? ''));
const validAvatar = value => typeof value === 'string' && /^(?:a_)?[a-f0-9]{32}$/i.test(value);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
}[ch]));
const cleanName = value => String(value ?? '').replace(/[\x00-\x1f\x7f<>]/g,'').trim().slice(0,40) || 'Membro Veltrix';

function cleanUser(user) {
  if (!validId(user?.id)) throw new Error('Conta do Discord inválida.');
  return {
    id: String(user.id),
    name: cleanName(user.global_name || user.username),
    avatar: validAvatar(user.avatar) ? user.avatar : null
  };
}

function avatarUrl(row) {
  const id = String(row.discord_id || '');
  const avatar = String(row.avatar_hash || '');
  if (!validId(id) || !validAvatar(avatar)) return 'https://cdn.discordapp.com/embed/avatars/0.png';
  const extension = avatar.startsWith('a_') ? 'gif' : 'webp';
  return 'https://cdn.discordapp.com/avatars/' + id + '/' + avatar + '.' + extension + '?size=128';
}

export function createShowcaseStore(connectionString, options = {}) {
  const db = options.pool || (typeof connectionString === 'string' && /^postgres(?:ql)?:\/\//i.test(connectionString)
    ? new Pool({ connectionString, max: 3, connectionTimeoutMillis: 6000, idleTimeoutMillis: 10000 })
    : null);
  const secret = String(options.optOutSecret || '');
  let initialized = false;
  let initialization = null;
  function hiddenKey(id) {
    if (!secret || !validId(id)) throw new Error('Identificador de privacidade indisponível.');
    return createHmac('sha256', secret).update('veltrix-showcase-v2:' + String(id)).digest('hex');
  }
  async function ready() {
    if (!db) throw new Error('Banco de dados da vitrine não configurado.');
    if (initialized) return;
    if (!initialization) {
      initialization = (async () => {
        await db.query(`
          CREATE TABLE IF NOT EXISTS veltrix_showcase_members (
            discord_id VARCHAR(20) PRIMARY KEY,
            display_name VARCHAR(40) NOT NULL,
            avatar_hash VARCHAR(34),
            public_visible BOOLEAN NOT NULL DEFAULT FALSE,
            opted_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        // Contas cadastradas antes da mudança não ficam públicas retroativamente.
        await db.query('ALTER TABLE veltrix_showcase_members ADD COLUMN IF NOT EXISTS public_visible BOOLEAN NOT NULL DEFAULT FALSE');
        await db.query(`
          CREATE TABLE IF NOT EXISTS veltrix_showcase_hidden (
            user_key CHAR(64) PRIMARY KEY,
            hidden_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `);
        initialized = true;
      })().finally(() => { initialization = null; });
    }
    await initialization;
  }
  const insertQuery = `
    INSERT INTO veltrix_showcase_members (discord_id, display_name, avatar_hash, opted_in_at, public_visible)
    VALUES ($1,$2,$3,NOW(),TRUE)
    ON CONFLICT (discord_id) DO UPDATE SET
      display_name=EXCLUDED.display_name,
      avatar_hash=EXCLUDED.avatar_hash,
      public_visible=TRUE
  `;
  return {
    isConfigured() { return !!db && !!secret; },
    async list() {
      if (!db) return [];
      await ready();
      const result = await db.query(
        'SELECT discord_id, display_name, avatar_hash FROM veltrix_showcase_members WHERE public_visible=TRUE ORDER BY opted_in_at DESC, discord_id ASC LIMIT 48'
      );
      const seen = new Set();
      return result.rows.filter(row => {
        if (!validId(row.discord_id) || seen.has(row.discord_id)) return false;
        seen.add(row.discord_id);
        return true;
      }).map(row => ({ name: cleanName(row.display_name), avatarUrl: avatarUrl(row) }));
    },
    async contains(userId) {
      if (!db || !validId(userId)) return false;
      await ready();
      const result = await db.query(
        'SELECT 1 FROM veltrix_showcase_members WHERE discord_id = $1 AND public_visible=TRUE LIMIT 1',
        [String(userId)]
      );
      return result.rows.length > 0;
    },
    async autoJoin(user) {
      const entry = cleanUser(user);
      await ready();
      const result = await db.query('SELECT 1 FROM veltrix_showcase_hidden WHERE user_key = $1 LIMIT 1', [hiddenKey(entry.id)]);
      if (result.rows.length) return false;
      await db.query(insertQuery, [entry.id, entry.name, entry.avatar]);
      return true;
    },
    async join(user) {
      const entry = cleanUser(user);
      await ready();
      await db.query(insertQuery, [entry.id, entry.name, entry.avatar]);
      await db.query('DELETE FROM veltrix_showcase_hidden WHERE user_key = $1', [hiddenKey(entry.id)]);
    },
    async leave(userId) {
      if (!validId(userId)) throw new Error('Conta do Discord inválida.');
      await ready();
      await db.query(
        'INSERT INTO veltrix_showcase_hidden (user_key, hidden_at) VALUES ($1,NOW()) ON CONFLICT (user_key) DO UPDATE SET hidden_at=NOW()',
        [hiddenKey(userId)]
      );
      await db.query('DELETE FROM veltrix_showcase_members WHERE discord_id = $1', [String(userId)]);
    }
  };
}

// Um card por usuario real. Com 1 participante, um avatar centralizado.
// Com 2+, o script troca um avatar de cada vez, deslizante, sem fazer clones.
export function renderCommunityShowcase({ members = [] } = {}) {
  if (!Array.isArray(members) || !members.length) return '';
  const uniqueUrls = new Set();
  const people = members.slice(0,48).filter(member => {
    if (!member || typeof member.name !== 'string' || typeof member.avatarUrl !== 'string') return false;
    const key = member.avatarUrl;
    if (uniqueUrls.has(key)) return false;
    uniqueUrls.add(key);
    return true;
  });
  if (!people.length) return '';
  const rotating = people.length > 1;
  const cards = people.map((member, i) =>
    '<figure class="vel-community-person' + (i === 0 ? ' is-current' : '') + '">' +
      '<span class="vel-community-photo"><img src="' + escapeHtml(member.avatarUrl) +
      '" alt="" width="88" height="88" loading="lazy" decoding="async"></span>' +
      '<figcaption>' + escapeHtml(member.name) + '</figcaption></figure>'
  ).join('');
  return '<section id="comunidade" class="vel-community" aria-labelledby="vel-community-title">' +
    '<div class="vel-community-heading"><span class="vel-home-eyebrow">✦ COMUNIDADE VELTRIX</span>' +
    '<h2 id="vel-community-title">A nossa galera também <span>brilha!</span></h2>' +
    '<p>Avatares da comunidade — uma pessoa de cada vez.</p></div>' +
    '<div class="vel-community-window" aria-label="Avatares da comunidade Veltrix">' +
      '<div class="vel-community-track is-one-at-a-time' + (rotating ? ' can-rotate' : '') + '">' + cards + '</div>' +
    '</div>' +
    (rotating ? '<script src="/assets/veltrix-community-carousel-v32.js" defer></script>' : '') +
    '<div class="vel-community-join"><a class="vel-showcase-btn secondary" href="/me/vitrine">Gerenciar minha foto</a></div>' +
    '</section>';
}

export function renderShowcaseSettings({ configured = false, optedIn = false, csrf = '', notice = '' } = {}) {
  const message = notice ? '<p class="vel-showcase-notice" role="status">' + escapeHtml(notice) + '</p>' : '';
  const intro = '<div class="heading"><div class="eyebrow">✦ COMUNIDADE VELTRIX</div>' +
    '<h1>Minha foto na vitrine</h1><p>Ao entrar com Discord, seu nome e avatar podem aparecer publicamente na página inicial. Você pode ocultar sua foto e voltar a exibi-la quando quiser.</p></div>';
  const back = '<p class="vel-showcase-back"><a class="btn btn-secondary" href="/">← Voltar para o início</a></p>';
  if (!configured) return intro + message +
    '<div class="alert">A vitrine ainda não está ativada. Falta conectar um banco de dados persistente ao Render.</div>' + back;
  const formStart = '<form class="vel-showcase-action" method="POST" action="/me/showcase">' +
    '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">';
  const form = optedIn
    ? formStart + '<input type="hidden" name="showcaseAction" value="leave">' +
      '<button class="vel-showcase-btn secondary" type="submit">Ocultar minha foto da vitrine</button></form>'
    : formStart + '<input type="hidden" name="showcaseAction" value="join">' +
      '<button class="vel-showcase-btn" type="submit">✦ Voltar a mostrar minha foto</button></form>';
  return '<div class="panel vel-showcase-settings">' + intro + message + form + back + '</div>';
}
