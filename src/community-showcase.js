// Vitrine por adesão voluntária, persistida em PostgreSQL (ex.: Neon).
// Não grave identificadores de pessoas no Git: commits preservam histórico mesmo após exclusão.
import pg from 'pg';
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
  let initialized = false;
  let initialization = null;
  async function ready() {
    if (!db) throw new Error('Banco de dados da vitrine não configurado.');
    if (initialized) return;
    if (!initialization) {
      initialization = db.query(`
        CREATE TABLE IF NOT EXISTS veltrix_showcase_members (
          discord_id VARCHAR(20) PRIMARY KEY,
          display_name VARCHAR(40) NOT NULL,
          avatar_hash VARCHAR(34),
          opted_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `).then(() => { initialized = true; }).finally(() => { initialization = null; });
    }
    await initialization;
  }
  return {
    isConfigured() { return !!db; },
    async list() {
      if (!db) return [];
      await ready();
      const result = await db.query(
        'SELECT discord_id, display_name, avatar_hash FROM veltrix_showcase_members ORDER BY opted_in_at DESC, discord_id ASC LIMIT 48'
      );
      return result.rows.map(row => ({ name: cleanName(row.display_name), avatarUrl: avatarUrl(row) }));
    },
    async contains(userId) {
      if (!db || !validId(userId)) return false;
      await ready();
      const result = await db.query(
        'SELECT 1 FROM veltrix_showcase_members WHERE discord_id = $1 LIMIT 1',
        [String(userId)]
      );
      return result.rows.length > 0;
    },
    async join(user) {
      const entry = cleanUser(user);
      await ready();
      await db.query(
        `INSERT INTO veltrix_showcase_members (discord_id, display_name, avatar_hash, opted_in_at)
          VALUES ($1,$2,$3,NOW())
          ON CONFLICT (discord_id) DO UPDATE SET
            display_name=EXCLUDED.display_name,
            avatar_hash=EXCLUDED.avatar_hash,
            opted_in_at=NOW()`,
        [entry.id, entry.name, entry.avatar]
      );
    },
    async leave(userId) {
      if (!validId(userId)) throw new Error('Conta do Discord inválida.');
      await ready();
      await db.query('DELETE FROM veltrix_showcase_members WHERE discord_id = $1', [String(userId)]);
    }
  };
}

// A faixa nunca inventa avatares: fica ausente para visitantes sem login ou sem participantes.
export function renderCommunityShowcase({ members = [], user = null } = {}) {
  if (!user || !Array.isArray(members) || !members.length) return '';
  const people = members.slice(0, 24);
  const count = Math.ceil(18 / people.length) * people.length;
  const repeated = Array.from({ length: count }, (_, i) => people[i % people.length]);
  const images = repeated.map(member =>
    '<figure class="vel-community-person"><span class="vel-community-photo">' +
      '<img src="' + escapeHtml(member.avatarUrl) + '" alt="" width="88" height="88" loading="lazy" decoding="async">' +
      '</span><figcaption>' + escapeHtml(member.name) + '</figcaption></figure>'
  ).join('');
  const group = '<div class="vel-community-group">' + images + '</div>';
  return '<section id="comunidade" class="vel-community" aria-labelledby="vel-community-title">' +
    '<div class="vel-community-heading"><span class="vel-home-eyebrow">✦ COMUNIDADE VELTRIX</span>' +
    '<h2 id="vel-community-title">A nossa galera também <span>brilha!</span></h2>' +
    '<p>Participantes que autorizaram mostrar a foto do Discord.</p></div>' +
    '<div class="vel-community-window" aria-label="Avatares autorizados da comunidade Veltrix">' +
      '<div class="vel-community-track is-moving">' + group +
        '<div class="vel-community-group" aria-hidden="true">' + images + '</div>' +
      '</div></div>' +
    '<div class="vel-community-join"><a class="vel-showcase-btn secondary" href="/me/vitrine">Gerenciar minha foto</a></div>' +
    '</section>';
}

// Formulário privado: exige login com Discord e consentimento explícito.
export function renderShowcaseSettings({ configured = false, optedIn = false, csrf = '', notice = '' } = {}) {
  const message = notice ? '<p class="vel-showcase-notice" role="status">' + escapeHtml(notice) + '</p>' : '';
  const intro = '<div class="heading"><div class="eyebrow">✦ COMUNIDADE VELTRIX</div>' +
    '<h1>Minha foto na vitrine</h1><p>Escolha se deseja exibir seu nome e avatar do Discord na página inicial para outras pessoas logadas.</p></div>';
  const back = '<p style="margin-top:18px"><a class="btn btn-secondary" href="/">← Voltar para o início</a></p>';
  if (!configured) return intro + message +
    '<div class="alert">A vitrine ainda não está ativada. Falta conectar um banco de dados persistente ao Render.</div>' + back;
  const formStart = '<form class="vel-showcase-action" method="POST" action="/me/showcase">' +
    '<input type="hidden" name="csrf" value="' + escapeHtml(csrf) + '">';
  const form = optedIn
    ? formStart + '<input type="hidden" name="showcaseAction" value="leave">' +
      '<button class="vel-showcase-btn secondary" type="submit">Remover minha foto da vitrine</button></form>'
    : formStart + '<input type="hidden" name="showcaseAction" value="join">' +
      '<label class="vel-showcase-consent"><input type="checkbox" name="consent" value="yes" required> Autorizo exibir meu nome e minha foto do Discord publicamente nesta vitrine para pessoas logadas. Posso retirar a autorização quando quiser.</label>' +
      '<button class="vel-showcase-btn" type="submit">✦ Participar da vitrine</button></form>';
  return '<div class="panel" style="max-width:720px;padding:24px">' + intro + message + form + back + '</div>';
}
