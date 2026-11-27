import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createShowcaseStore, renderCommunityShowcase, renderShowcaseSettings
} from '../src/community-showcase.js';

const SECRET='veltrix-test-secret-please-do-not-use-in-production-12345';
const person = {
  id:'123456789012345678', username:'Edu', global_name:'EDU',
  avatar:'0123456789abcdef0123456789abcdef'
};

class FakePool {
  constructor() { this.members=new Map(); this.hidden=new Set(); this.calls=[]; }
  async query(sql,params=[]) {
    this.calls.push({sql,params});
    const q=sql.replace(/\s+/g,' ').trim().toUpperCase();
    if(q.startsWith('CREATE TABLE') || q.startsWith('ALTER TABLE'))return {rows:[]};
    if(q.startsWith('INSERT INTO VELTRIX_SHOWCASE_MEMBERS')){
      this.members.set(params[0],{discord_id:params[0],display_name:params[1],avatar_hash:params[2],public_visible:true});
      return {rows:[]};
    }
    if(q.startsWith('INSERT INTO VELTRIX_SHOWCASE_HIDDEN')){
      this.hidden.add(params[0]);return {rows:[]};
    }
    if(q.startsWith('DELETE FROM VELTRIX_SHOWCASE_HIDDEN')){
      this.hidden.delete(params[0]);return {rows:[]};
    }
    if(q.startsWith('DELETE FROM VELTRIX_SHOWCASE_MEMBERS')){
      this.members.delete(params[0]);return {rows:[]};
    }
    if(q.startsWith('SELECT 1 FROM VELTRIX_SHOWCASE_HIDDEN'))
      return {rows:this.hidden.has(params[0])?[{}]:[]};
    if(q.startsWith('SELECT 1 FROM VELTRIX_SHOWCASE_MEMBERS'))
      return {rows:this.members.get(params[0])?.public_visible?[{}]:[]};
    if(q.startsWith('SELECT DISCORD_ID')){
      return {rows:[...this.members.values()].filter(row=>row.public_visible)};
    }
    throw new Error('Unexpected SQL: '+sql);
  }
}

const makeStore = pool => createShowcaseStore(undefined,{pool,optOutSecret:SECRET});

test('vitrine não mostra nada enquanto não houver avatares',()=>{
  assert.equal(renderCommunityShowcase(), '');
  assert.equal(renderCommunityShowcase({members:[]}), '');
});

test('um membro aparece uma única vez e fica centralizado sem animação',()=>{
  const card={id:person.id,name:'EDU',avatarUrl:'https://cdn.discordapp.com/embed/avatars/0.png'};
  const html=renderCommunityShowcase({members:[card]});
  assert.equal((html.match(/<figure /g)||[]).length,1);
  assert.equal((html.match(/<img /g)||[]).length,1);
  assert.doesNotMatch(html,/can-rotate|veltrix-community-carousel-v32\.js/);
  assert.match(html,/is-current/);
  assert.doesNotMatch(html,/vel-community-placeholder|Prévia ilustrativa/);
});

test('múltiplos membros aparecem apenas uma vez cada e alternam pro lado',()=>{
  const avatar='https://cdn.discordapp.com/embed/avatars/0.png';
  const a={id:person.id,name:'EDU',avatarUrl:avatar};
  const b={id:'123456789012345679',name:'Outro',avatarUrl:avatar};
  const html=renderCommunityShowcase({members:[a,b]});
  assert.equal((html.match(/<figure /g)||[]).length,2);
  assert.equal((html.match(/class="vel-community-person is-current"/g)||[]).length,1);
  assert.match(html,/is-one-at-a-time can-rotate/);
  assert.match(html,/veltrix-community-carousel-v32\.js/);
  assert.doesNotMatch(html,/aria-hidden="true"/); // sem clones para preencher espaço
  assert.equal((html.match(/EDU<\/figcaption>/g)||[]).length,1);
});

test('login insere no PostgreSQL, mantém apenas um registro por ID',async()=>{
  const pool=new FakePool(),store=makeStore(pool);
  assert.equal(store.isConfigured(),true);
  assert.equal(await store.autoJoin(person),true);
  assert.equal(await store.autoJoin(person),true);
  assert.equal((await store.list()).length,1);
  assert.equal(await store.contains(person.id),true);
  const afterRestart=makeStore(pool);
  assert.equal((await afterRestart.list()).length,1);
  assert.match((await afterRestart.list())[0].avatarUrl,/discordapp\.com\/avatars/);
});

test('opt-out é permanente: novo login não publica a foto novamente',async()=>{
  const pool=new FakePool(),store=makeStore(pool);
  await store.autoJoin(person);
  await store.leave(person.id);
  assert.deepEqual(await store.list(),[]);
  assert.equal(await makeStore(pool).autoJoin(person),false);
  assert.deepEqual(await store.list(),[]);
  // Opt-out preserva somente identificador HMAC, nunca ID puro.
  const key=[...pool.hidden][0];
  assert.match(key,/^[a-f0-9]{64}$/);
  assert.ok(!key.includes(person.id));
  await store.join(person);
  assert.equal((await store.list()).length,1);
  assert.equal(pool.hidden.size,0);
});

test('cadastros antigos privados não se tornam públicos retroativamente',async()=>{
  const pool=new FakePool();
  pool.members.set(person.id,{discord_id:person.id,display_name:'EDU',avatar_hash:null,public_visible:false});
  const store=makeStore(pool);
  assert.deepEqual(await store.list(),[]);
  await store.autoJoin(person);
  assert.equal((await store.list()).length,1);
  assert.ok(pool.calls.some(x=>x.sql.includes('ADD COLUMN IF NOT EXISTS public_visible')));
});

test('formulário permite esconder e reexibir sem checkbox extra',()=>{
  const hidden=renderShowcaseSettings({configured:true,optedIn:false,csrf:'abc'});
  assert.match(hidden,/showcaseAction" value="join"/);
  assert.doesNotMatch(hidden,/name="consent"/);
  const visible=renderShowcaseSettings({configured:true,optedIn:true,csrf:'abc'});
  assert.match(visible,/showcaseAction" value="leave"/);
  assert.match(visible,/Ocultar minha foto/);
  assert.match(visible,/nome e avatar podem aparecer publicamente/);
});

test('validação de conta e escaping evitam HTML arbitrário',async()=>{
  const pool=new FakePool(),store=makeStore(pool);
  await assert.rejects(store.autoJoin({...person,id:'../../etc/passwd'}),/inválida/);
  await store.join({...person,global_name:'<img src=x onerror=1>'});
  const html=renderCommunityShowcase({members:await store.list()});
  assert.doesNotMatch(html,/<img src=x/);
  assert.doesNotMatch(html,/onerror=/);
});

test('sem Neon a galeria fica desativada',async()=>{
  const store=createShowcaseStore(undefined,{optOutSecret:SECRET});
  assert.equal(store.isConfigured(),false);
  assert.deepEqual(await store.list(),[]);
  assert.match(renderShowcaseSettings({configured:false}),/não está ativada/);
});
