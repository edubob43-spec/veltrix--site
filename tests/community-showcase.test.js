import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createShowcaseStore, renderCommunityShowcase } from '../src/community-showcase.js';

const user={id:'123456789012345678',username:'Edu',global_name:'EDU',avatar:'0123456789abcdef0123456789abcdef'};
const makeStore=()=>{
  const dir=mkdtempSync(join(tmpdir(),'veltrix-showcase-test-'));
  return { store:createShowcaseStore(join(dir,'members.json')),file:join(dir,'members.json'),cleanup:()=>rmSync(dir,{recursive:true,force:true}) };
};

test('não publica pessoas sem consentimento',()=>{
  const html=renderCommunityShowcase();
  assert.match(html,/Prévia ilustrativa/);
  assert.doesNotMatch(html,/cdn\.discordapp\.com\/avatars\/\d+/);
  assert.match(html,/Entrar com Discord para participar/);
});

test('opt-in voluntário cria entrada usando apenas avatar do Discord',()=>{
  const {store,cleanup}=makeStore();
  try{
    assert.deepEqual(store.list(),[]);
    store.join(user);
    const members=store.list();
    assert.equal(members.length,1);
    assert.equal(members[0].name,'EDU');
    assert.match(members[0].avatarUrl,/cdn\.discordapp\.com\/avatars\/123456789012345678\/0123456789abcdef0123456789abcdef\.webp/);
    const markup=renderCommunityShowcase({members,user:{...user,optedIn:true},csrf:'valid'});
    assert.match(markup,/EDU/);
    assert.match(markup,/Remover minha foto/);
    assert.doesNotMatch(markup,/showcaseAction" value="join"/);
  }finally{cleanup();}
});

test('opt-out retira o participante e a decisão sobrevive a leitura do arquivo',()=>{
  const {store,file,cleanup}=makeStore();
  try{
    store.join(user);
    assert.equal(createShowcaseStore(file).list().length,1);
    store.leave(user.id);
    assert.equal(createShowcaseStore(file).list().length,0);
  }finally{cleanup();}
});

test('escapa nome do Discord e exige campos seguros',()=>{
  const {store,cleanup}=makeStore();
  try{
    store.join({...user,global_name:'<img src=x onerror=alert(1)>'});
    const html=renderCommunityShowcase({members:store.list()});
    assert.doesNotMatch(html,/<img src=x/);
    assert.match(html, /<figcaption>img src=x onerror=alert\(1\)/); // conteúdo tratado como texto, não como tag
    assert.throws(()=>store.join({...user,id:'../x'}),/inválida/);
    assert.match(renderCommunityShowcase({user:{optedIn:false},csrf:'csrf'}),/type="checkbox" name="consent" value="yes" required/);
  }finally{cleanup();}
});
