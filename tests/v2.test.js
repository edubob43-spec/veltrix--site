import test from 'node:test';
import assert from 'node:assert/strict';
import { validateV2Action, V2_SECTIONS, V2_PERMISSIONS } from '../src/v2-contract.js';
import { v2SectionHtml } from '../src/v2-ui.js';
const gid='123456789012345678', cid='123456789012345679', rid='123456789012345680';
const guild={id:gid,name:'Servidor Teste',channels:{cache:new Map([[cid,{id:cid,name:'geral',type:0}]])},roles:{cache:new Map([[rid,{id:rid,name:'Membro',managed:false}]])}};
test('V2.3 mantém só Permissões e Identidade',()=>assert.deepEqual(V2_SECTIONS,['permissoes','identidade']));
test('formulários mantêm proteção CSRF',()=>{
  for(const sec of V2_SECTIONS){const html=v2SectionHtml(guild,sec,'TOKEN_CSRF');assert.match(html,/TOKEN_CSRF/);assert.match(html,new RegExp(gid));}
});
test('áreas removidas não aceitam comandos antigos',()=>{
  for(const cmd of ['v2-create-channel','v2-create-category','v2-edit-role','v2-embed','v2-template','create-channel','create-role','send-embed']){
    assert.throws(()=>validateV2Action(cmd,{},guild),/removida/);assert.equal(V2_PERMISSIONS[cmd],undefined);
  }
});
test('validação de permissões continua',()=>{
  assert.throws(()=>validateV2Action('v2-overwrite',{channel:cid,role:rid,visibility:'admin',send:'allow'},guild),/permissões/);
  assert.equal(validateV2Action('v2-overwrite',{channel:cid,role:rid,visibility:'allow',send:'inherit'},guild).visibility,'allow');
});
test('identidade local permanece',()=>{
  assert.deepEqual(validateV2Action('v2-nickname',{nickname:'Veltrix Roxa'},guild),{nickname:'Veltrix Roxa'});
  assert.deepEqual(validateV2Action('v2-reset-avatar',{},guild),{});
});
