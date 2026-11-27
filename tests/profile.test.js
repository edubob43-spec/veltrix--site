import test from 'node:test';
import assert from 'node:assert/strict';
import { renderProfileEditor } from '../src/profile-editor.js';
import { cleanProfile } from '../src/profile-contract.js';

test('editor só trabalha com a própria conta, e 6 banners + 4 layouts',()=>{
  const html=renderProfileEditor({user:{id:'123456789012345678',username:'Exemplo',avatar:null},csrf:'xxxx',flags:0,connected:true});
  assert.match(html,/action="\/me\/perfil"/);assert.match(html,/Escolha seu banner/);
  assert.equal((html.match(/name="banner"/g)||[]).length,6);
  assert.equal((html.match(/name="theme"/g)||[]).length,5);
  assert.doesNotMatch(html,/name="userId"|name="guildId"|Conquistas/);
});
test('status de salvamento pendente expõe o elemento para confirmação automática',()=>{
  const html=renderProfileEditor({user:{id:'123456789012345678',username:'Exemplo',avatar:null},csrf:'xxxx',flags:0,connected:true,message:'Aguarde confirmação do bot.',pending:true});
  assert.match(html,/id="pc-profile-status"/);
  assert.match(html,/data-profile-pending="true"/);
  assert.match(html,/veltrix-profile-status-v1\.js/);
});

test('só permite flags reais detectadas',()=>{
  const html=renderProfileEditor({user:{id:'123456789012345678',username:'Exemplo',avatar:null},csrf:'xxxx',flags:1,connected:true});
  assert.match(html,/Equipe Discord/);
  assert.doesNotMatch(html,/Parceiro Discord/);
});
test('layout e badges enviados são validados',()=>{
  assert.throws(()=>cleanProfile({banner:'x',theme:'neon'}));
  assert.deepEqual(cleanProfile({banner:'todas',theme:'noir',badges:[]}).badges,[]);
});
