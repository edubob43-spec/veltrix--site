import test from 'node:test';
import assert from 'node:assert/strict';
import { ChannelType } from 'discord.js';
import { page, sectionHtml, validSettings, safeId, sidebar } from '../src/ui.js';
import { DEFAULT_SETTINGS } from '../src/defaults.js';
const gid='123456789012345678';
const cid='123456789012345679';
const guild={id:gid,name:'Teste',memberCount:3,stats:{xpProfiles:2,ticketsOpen:1,giveawaysActive:0},
  channels:{cache:new Map([[cid,{id:cid,name:'geral',type:ChannelType.GuildText,guild:{id:gid},isTextBased(){return true;}}]])},
  roles:{cache:new Map()}};
test('HTML entrega CSS embutido (correção de 2026)',()=>assert.match(page('Veltrix','oi'),/<style>:root\{/));
test('o HTML inclui config específica de servidor',()=>assert.match(sectionHtml(guild,DEFAULT_SETTINGS,'tickets','csrf',{}),new RegExp(`/dashboard/${gid}/save/tickets`)));
test('valida canal correto',()=>assert.equal(validSettings('boasvindas',{welcomeEnabled:'on',welcomeChannelId:cid,welcomeMessage:'Olá'},guild).welcomeChannelId,cid));
test('rejeita prefixo inválido',()=>assert.throws(()=>validSettings('aparencia',{prefix:'/',embedColor:'#aabbcc'},guild),/Prefixo/));
test('ID de servidor precisa ser snowflake',()=>{assert.equal(safeId(gid),true);assert.equal(safeId('../etc/passwd'),false);});

test('V3: CSS da home é carregado somente na página inicial',()=>{
 assert.match(page('Início','oi'),/veltrix-home-v30\.css/);
 assert.doesNotMatch(page('Servidores','oi'),/veltrix-home-v30\.css/);
});

test('Avatar Nitro animado usa GIF no menu da conta; estático usa PNG',()=>{
  const id='123456789012345678', hash='0123456789abcdef0123456789abcdef';
  const animated=page('Início','oi',{user:{id,username:'EDU',avatar:'a_'+hash}});
  const still=page('Início','oi',{user:{id,username:'EDU',avatar:hash}});
  assert.match(animated,new RegExp('/avatars/'+id+'/a_'+hash+'\\.gif\\?size=64'));
  assert.match(still,new RegExp('/avatars/'+id+'/'+hash+'\\.png\\?size=64'));
});

test('menu lateral mantém todas as rotas e separa por categoria',()=>{
  const html=sidebar(guild,'identidade');
  for (const id of ['geral','tickets','boasvindas','logs','niveis','parcerias','permissoes','aparencia','identidade']){
    assert.match(html,new RegExp('/dashboard/'+gid+'/'+id+'(?:["?])'));
  }
  assert.match(html,/GERENCIAMENTO/);
  assert.match(html,/PERSONALIZAÇÃO/);
  assert.match(html,/ECONOMIA/);
  assert.ok(html.includes('href="/me/daily"'));
  assert.ok(html.includes('href="/me/perfil"'));
  assert.ok(html.includes('href="/dashboard"'));
  assert.match(html,/aria-current="page"/);
  assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
  assert.equal((html.match(/<nav /g)||[]).length,3);
});
test('menu lateral usa ícone real do servidor quando disponível',()=>{
  const g={...guild,icon:'0123456789abcdef0123456789abcdef'};
  const html=sidebar(g,'geral');
  assert.match(html,/vel-sidebar-server-image/);
  assert.ok(html.includes('cdn.discordapp.com/icons/123456789012345678/0123456789abcdef0123456789abcdef.webp'));
});

test('menu lateral preserva emoji como fallback do ícone',()=>{
  const html=sidebar({...guild,name:'🍭 Comunidade',icon:null},'geral');
  assert.ok(html.includes('<div class="servericon">🍭</div>'));
});
