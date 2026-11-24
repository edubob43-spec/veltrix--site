import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {page,nav,sectionHtml,validSettings} from '../src/ui.js';
import {DEFAULT_SETTINGS} from '../src/defaults.js';
const ui=readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
const server=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const gid='123456789012345678';
const guild={id:gid,name:'Servidor',stats:{},memberCount:1,channels:{cache:new Map()},roles:{cache:new Map()}};
test('sem seções desnecessárias no menu e cards',()=>{
  const items=nav.map(x=>x[0]);
  assert.deepEqual(items,['geral','aparencia','boasvindas','logs','tickets','niveis','parcerias','permissoes','identidade']);
  const html=sectionHtml(guild,DEFAULT_SETTINGS,'geral','X',{});
  assert.doesNotMatch(html,/undefined/);
  assert.doesNotMatch(html,/Inteligência Artificial|Ferramentas básicas|Templates|>Embeds</);
});
test('o menu continua sem áreas removidas',()=>{
  const h=page('Dashboard','', {side:'',user:null});
  assert.match(h,/sparkfield/);
  assert.match(h,/veltrix-stardust-v24.js/);
});
test('rotas administrativas removidas',()=>{
  assert.doesNotMatch(server,/'create-channel':'ferramentas'|'send-embed':'ferramentas'/);
  assert.doesNotMatch(server,/Criar canal de texto/);
  assert.match(server,/ticket-panel/);
});
