import test from 'node:test';
import assert from 'node:assert/strict';
import { validateV2Action, V2_SECTIONS, V2_PERMISSIONS } from '../src/v2-contract.js';
import { v2SectionHtml, V2_CSS } from '../src/v2-ui.js';
const gid='123456789012345678',text='123456789012345679',cat='123456789012345680',voice='123456789012345681',rid='123456789012345682';
const channels=[{id:text,name:'geral',type:0},{id:cat,name:'INÍCIO',type:4},{id:voice,name:'Voz',type:2}];
const roles=[{id:gid,name:'@everyone'},{id:rid,name:'Membro',managed:false}];
const guild={id:gid,name:'Servidor Teste',channels:{cache:new Map(channels.map(c=>[c.id,c]))},roles:{cache:new Map(roles.map(r=>[r.id,r]))}};
test('V2 tem 6 abas reais',()=>assert.equal(V2_SECTIONS.length,6));
test('V2 UI contém CSRF e guildId apenas no servidor selecionado',()=>{
 for(const sec of V2_SECTIONS){const html=v2SectionHtml(guild,sec,'TOKEN_X');assert.match(html,/TOKEN_X/);assert.match(html,new RegExp(gid));assert.ok(html.length>450);}
 assert.match(V2_CSS,/v2-card/);
});
test('permissões: ações possuem flag prevista',()=>{
 for(const act of ['v2-create-channel','v2-edit-role','v2-overwrite','v2-template','v2-avatar']) assert.ok(V2_PERMISSIONS[act]);
});
test('canal privado exige cargo válido',()=>{
 assert.throws(()=>validateV2Action('v2-create-channel',{name:'privado',kind:'text',access:'private'},guild),/Cargo/);
 assert.deepEqual(validateV2Action('v2-create-channel',{name:'privado',kind:'text',access:'private',role:rid,parent:cat},guild),{name:'privado',kind:'text',parent:cat,access:'private',roleId:rid});
});
test('exclusão e templates exigem confirmação',()=>{
 assert.throws(()=>validateV2Action('v2-delete-channel',{channel:text},guild),/EXCLUIR/);
 assert.throws(()=>validateV2Action('v2-template',{template:'games'},guild),/APLICAR/);
 assert.deepEqual(validateV2Action('v2-template',{template:'games',confirm:'APLICAR'},guild),{template:'games'});
});
test('bloqueia cor inválida e cargo de integração',()=>{
 assert.throws(()=>validateV2Action('v2-create-role',{name:'Staff',color:'javascript:0'},guild),/cor/);
 assert.throws(()=>validateV2Action('v2-delete-role',{role:gid,confirm:'EXCLUIR'},guild),/Cargo/);
});
test('overwrite só suporta flags previstas',()=>{
 assert.throws(()=>validateV2Action('v2-overwrite',{channel:text,role:rid,visibility:'admin',send:'allow'},guild),/permissões/);
 assert.equal(validateV2Action('v2-overwrite',{channel:text,role:rid,visibility:'deny',send:'inherit'},guild).visibility,'deny');
});
test('embed valida tamanho',()=>{
 assert.throws(()=>validateV2Action('v2-embed',{channel:text,title:'',description:'texto',color:'#ffffff'},guild),/Embed/);
 assert.equal(validateV2Action('v2-embed',{channel:text,title:'Olá',description:'texto',color:'#ffffff'},guild).title,'Olá');
});
test('imagem só através de upload validado',()=>{
 assert.throws(()=>validateV2Action('v2-avatar',{image:'abc'},guild),/Imagem/);
});
