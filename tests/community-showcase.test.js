import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createShowcaseStore, renderCommunityShowcase, renderShowcaseSettings
} from '../src/community-showcase.js';

class FakePool {
  constructor() { this.users = new Map(); this.calls = []; }
  async query(sql, params = []) {
    this.calls.push({ sql, params });
    const normalized = sql.trim().toUpperCase();
    if (normalized.startsWith('CREATE TABLE')) return { rows: [] };
    if (normalized.startsWith('INSERT INTO')) {
      this.users.set(params[0], {
        discord_id: params[0], display_name: params[1], avatar_hash: params[2]
      });
      return { rows: [] };
    }
    if (normalized.startsWith('DELETE FROM')) {
      this.users.delete(params[0]); return { rows: [] };
    }
    if (normalized.startsWith('SELECT 1')) {
      return { rows: this.users.has(params[0]) ? [{ exists: 1 }] : [] };
    }
    if (normalized.startsWith('SELECT DISCORD_ID')) {
      return { rows: [...this.users.values()] };
    }
    throw new Error('Unexpected SQL: ' + sql);
  }
}
const user = {
  id:'123456789012345678', username:'EDU', global_name:'EDU',
  avatar:'0123456789abcdef0123456789abcdef'
};

test('vitrine só é exibida após login e com pessoas reais', () => {
  assert.equal(renderCommunityShowcase({}), '');
  assert.equal(renderCommunityShowcase({members:[],user}), '');
  assert.equal(renderCommunityShowcase({
    members:[{name:'EDU',avatarUrl:'https://cdn.discordapp.com/embed/avatars/0.png'}]
  }), '');
});

test('faixa de fotos confirmadas percorre para o lado em loop', () => {
  const html = renderCommunityShowcase({
    members:[{name:'EDU',avatarUrl:'https://cdn.discordapp.com/embed/avatars/0.png'}],user
  });
  assert.match(html, /class="vel-community-track is-moving"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /<img/);
  assert.match(html, /Gerenciar minha foto/);
  assert.doesNotMatch(html, /vel-community-placeholder|Prévia ilustrativa/);
});

test('PostgreSQL persiste opt-in e opt-out sem arquivos ou commits Git', async () => {
  const pool = new FakePool();
  const store = createShowcaseStore(undefined, {pool});
  assert.equal(store.isConfigured(), true);
  assert.deepEqual(await store.list(), []);
  await store.join(user);
  assert.equal(await store.contains(user.id),true);
  const afterRestart = createShowcaseStore(undefined, {pool});
  assert.equal((await afterRestart.list()).length, 1);
  assert.match((await afterRestart.list())[0].avatarUrl, /cdn\.discordapp\.com\/avatars\//);
  await afterRestart.leave(user.id);
  assert.equal((await store.list()).length,0);
  assert.ok(pool.calls.some(call => call.sql.includes('DELETE FROM')));
});

test('sem banco, formulário desabilitado e galeria vazia', async () => {
  const store = createShowcaseStore();
  assert.equal(store.isConfigured(),false);
  assert.deepEqual(await store.list(),[]);
  await assert.rejects(store.join(user),/Banco de dados/);
  assert.match(renderShowcaseSettings({configured:false}),/não está ativada/);
});

test('consentimento explícito e remoção da foto', () => {
  const form = renderShowcaseSettings({configured:true,optedIn:false,csrf:'abc'});
  assert.match(form,/name="consent" value="yes" required/);
  assert.match(form,/name="csrf" value="abc"/);
  assert.match(form,/showcaseAction" value="join"/);
  const optOut = renderShowcaseSettings({configured:true,optedIn:true,csrf:'abc'});
  assert.match(optOut,/showcaseAction" value="leave"/);
  assert.doesNotMatch(optOut,/name="consent"/);
});

test('IDs e nomes inválidos não geram HTML ou SQL inseguro', async () => {
  const pool = new FakePool();
  const store = createShowcaseStore(undefined,{pool});
  await assert.rejects(store.join({...user,id:'../../etc'}),/inválida/);
  await store.join({...user,global_name:'<img src=x onerror=1>'});
  const members = await store.list();
  const html = renderCommunityShowcase({members,user});
  assert.doesNotMatch(html,/<img src=x/);
  assert.doesNotMatch(html,/onerror=/);
  assert.ok(members[0].name.includes('img src=x'));
});
