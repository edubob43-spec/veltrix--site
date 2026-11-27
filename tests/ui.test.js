import test from 'node:test';
import assert from 'node:assert/strict';
import { ChannelType } from 'discord.js';
import { page, sectionHtml, validSettings, safeId, sidebar, accountSidebar } from '../src/ui.js';
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

test('painel do servidor mantém as nove rotas existentes divididas em grupos',()=>{
  const html=sidebar(guild,'identidade');
  for(const id of ['geral','aparencia','boasvindas','logs','tickets','niveis','parcerias','permissoes','identidade']){
    assert.ok(html.includes('/dashboard/'+gid+'/'+id+'"'));
  }
  for(const title of ['CONFIGURAÇÕES','COMUNIDADE','MODERAÇÃO','EXPERIÊNCIA']){
    assert.ok(html.includes(title));
  }
  assert.ok(html.includes('href="/dashboard"'));
  assert.ok(!html.includes('href="/me/perfil"'));
  assert.ok(!html.includes('href="/me/daily"'));
  assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
});
test('painel pessoal separa servidores, perfil e economia',()=>{
  const servers=accountSidebar('servidores'),profile=accountSidebar('perfil'),daily=accountSidebar('daily');
  for(const path of ['/dashboard','/me/perfil','/me/daily'])assert.ok(servers.includes('href="'+path+'"'));
  for(const group of ['GERAL','PERSONALIZAÇÃO','ECONOMIA'])assert.ok(servers.includes(group));
  assert.ok(profile.includes('href="/me/perfil" aria-current="page"'));
  assert.ok(daily.includes('href="/me/daily" aria-current="page"'));
  assert.equal((daily.match(/aria-current="page"/g)||[]).length,1);
  assert.ok(!daily.includes('/dashboard/123456789012345678/tickets'));
});
test('layout da conta e de servidor compartilha CSS atualizado',()=>{
  assert.ok(page('Meus servidores','oi',{side:accountSidebar()}).includes('veltrix-layout-v29.css?v=34'));
  assert.match(page('Visão geral','oi',{side:sidebar(guild,'geral')}),/vel-server-sidebar-v32/);
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

test('XP por mensagem: painel exibe 1 base, cargos bônus e não mostra cooldown',()=>{
  const role1='123456789012345680',role2='123456789012345681';
  const g={...guild,roles:{cache:new Map([[gid,{id:gid,name:'@everyone',managed:false}],[role1,{id:role1,name:'VIP',managed:false}],[role2,{id:role2,name:'Booster',managed:true}]])}};
  const settings={...DEFAULT_SETTINGS,xpEnabled:true,xpRoleBonuses:[{roleId:role1,amount:5},{roleId:role2,amount:3}]};
  const html=sectionHtml(g,settings,'niveis','csrfSeguro',{});
  assert.ok(html.includes('1 XP'));
  assert.ok(html.includes('Bônus por cargo'));
  assert.ok(html.includes('VIP'));
  assert.ok(html.includes('Booster'));
  assert.ok(html.includes('Adicionar cargo'));
  assert.ok(html.includes('veltrix-xp-role-bonus-v34.js'));
  assert.ok(html.includes('9 XP em uma mensagem'));
  assert.doesNotMatch(html,/name="xpCooldown"|Cooldown entre mensagens pontuadas/);
  assert.ok(html.includes('name="csrf" value="csrfSeguro"'));
});
test('XP por cargo valida e salva bônus cumulativos por servidor',()=>{
  const role1='123456789012345680',role2='123456789012345681';
  const g={...guild,roles:{cache:new Map([[gid,{id:gid,name:'@everyone'}],[role1,{id:role1,name:'VIP'}],[role2,{id:role2,name:'Booster'}]])}};
  const body={xpEnabled:'on',xpChannelId:cid,xpBonusRoleId:[role1,role2],xpBonusAmount:['5','3']};
  assert.deepEqual(validSettings('niveis',body,g),{xpEnabled:true,xpChannelId:cid,xpRoleBonuses:[{roleId:role1,amount:5},{roleId:role2,amount:3}]});
});
test('XP bônus aceita formulário vazio e rejeita cargo repetido, inexistente e valores inválidos',()=>{
  const role1='123456789012345680';
  const g={...guild,roles:{cache:new Map([[gid,{id:gid,name:'@everyone'}],[role1,{id:role1,name:'VIP'}]])}};
  assert.deepEqual(validSettings('niveis',{xpEnabled:'on',xpChannelId:'',xpBonusRoleId:'',xpBonusAmount:''},g),{xpEnabled:true,xpChannelId:'',xpRoleBonuses:[]});
  assert.throws(()=>validSettings('niveis',{xpEnabled:'on',xpChannelId:'',xpBonusRoleId:[role1,role1],xpBonusAmount:['5','3']},g),/cargo/);
  assert.throws(()=>validSettings('niveis',{xpEnabled:'on',xpChannelId:'',xpBonusRoleId:role1,xpBonusAmount:'0'},g),/1 e 1.000/);
  assert.throws(()=>validSettings('niveis',{xpEnabled:'on',xpChannelId:'',xpBonusRoleId:role1,xpBonusAmount:'1001'},g),/1 e 1.000/);
  assert.throws(()=>validSettings('niveis',{xpEnabled:'on',xpChannelId:'',xpBonusRoleId:'123456789012345699',xpBonusAmount:'5'},g),/Cargo/);
  assert.throws(()=>validSettings('niveis',{xpEnabled:'on',xpChannelId:'',xpBonusRoleId:role1,xpBonusAmount:''},g),/Escolha/);
});
test('XP bônus limita a 20 cargos configurados',()=>{
  const roles=Array.from({length:21},(_,i)=>String(123456789012345600+i));
  const cache=new Map([[gid,{id:gid,name:'@everyone'}],...roles.map(id=>[id,{id,name:'cargo'}])]);
  const g={...guild,roles:{cache}};
  assert.throws(()=>validSettings('niveis',{xpEnabled:'on',xpChannelId:'',xpBonusRoleId:roles,xpBonusAmount:roles.map(()=>1)},g),/20 cargos/);
});
