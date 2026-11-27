import test from 'node:test';
import assert from 'node:assert/strict';
import { profileSyncStatus } from '../src/profile-status.js';

const uid='123456789012345678';
const makeBridge=()=>({jobs:new Map(),profilePending:new Map(),results:new Map()});

test('status mostra pendente enquanto bot ainda não confirmou',()=>{
  const b=makeBridge();b.jobs.set('job',{id:'job',type:'profile-settings',userId:uid,createdAt:1000});b.profilePending.set(uid,1000);
  assert.deepEqual(profileSyncStatus(uid,b,5000),{status:'pending',waitSeconds:4});
});
test('status mostra sucesso após confirmação recente',()=>{
  const b=makeBridge();b.results.set('profile:'+uid,{ok:true,action:'profile-settings',at:1000,error:''});
  assert.deepEqual(profileSyncStatus(uid,b,2000),{status:'success',error:''});
});
test('status mostra falha e a mensagem segura retornada pelo bot',()=>{
  const b=makeBridge();b.results.set('profile:'+uid,{ok:false,action:'profile-settings',at:1000,error:'Falha ao gravar'});
  assert.deepEqual(profileSyncStatus(uid,b,2000),{status:'failure',error:'Falha ao gravar'});
});
test('resultado antigo não aparece como confirmação atual',()=>{
  const b=makeBridge();b.results.set('profile:'+uid,{ok:true,action:'profile-settings',at:1000,error:''});
  assert.deepEqual(profileSyncStatus(uid,b,181001),{status:'idle'});
});
test('pedido sem job, mas ainda marcado pending, segue aguardando até 30 min',()=>{
  const b=makeBridge();b.profilePending.set(uid,1000);
  assert.deepEqual(profileSyncStatus(uid,b,3000),{status:'pending',waitSeconds:2});
});
test('pendência antiga recebe estado expirado',()=>{
  const b=makeBridge();b.profilePending.set(uid,1000);
  assert.equal(profileSyncStatus(uid,b,1801000).status,'expired');
});
