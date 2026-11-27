import test from 'node:test';
import assert from 'node:assert/strict';
import { requestAuthorizedGuilds, canUseReadOnlyGuildCache, isTransientGuildError } from '../src/discord-guild-lookup.js';

const gid='1470166443801706691';
const allowed=g=>g.owner || (BigInt(g.permissions||0)&0x20n)!==0n;
const reply=(status,data=[],headers=null)=>({
  status,ok:status>=200&&status<300,
  headers:{get:key=>key==='retry-after'?headers:null},
  json:async()=>data
});
const opts=(fetcher,refreshAccessToken=async()=>true)=>({
  getAccessToken:()=>'sample',refreshAccessToken,authorized:allowed,fetcher,
  pause:async()=>{},timeoutMs:1000
});

test('validacao de servidor e permissoes ainda acontece',async()=>{
  let calls=0;
  const result=await requestAuthorizedGuilds(opts(async()=>{
    calls++;
    return reply(200,[
      {id:gid,name:'Meu servidor',owner:false,permissions:'32',icon:null},
      {id:'123456789012345678',name:'Sem acesso',owner:false,permissions:'0'}
    ]);
  }));
  assert.equal(calls,1);
  assert.deepEqual(result,[{id:gid,name:'Meu servidor',owner:false,permissions:'32',icon:null}]);
});
test('discord 429 faz nova tentativa apos Retry-After',async()=>{
  let calls=0;
  const result=await requestAuthorizedGuilds(opts(async()=>{
    return ++calls===1?reply(429,[],'0.1'):reply(200,[{id:gid,name:'Veltrix',owner:true}]);
  }));
  assert.equal(calls,2);
  assert.equal(result.length,1);
});
test('falha de rede temporaria permite nova tentativa',async()=>{
  let calls=0;
  const result=await requestAuthorizedGuilds(opts(async()=>{
    if(++calls===1)throw Error('timeout');
    return reply(200,[{id:gid,name:'Veltrix',owner:true}]);
  }));
  assert.equal(calls,2);
  assert.equal(result.length,1);
});
test('401 tenta renovar token uma unica vez',async()=>{
  let calls=0,refreshes=0;
  const result=await requestAuthorizedGuilds(opts(async()=>{
    return ++calls===1?reply(401):reply(200,[{id:gid,name:'Veltrix',owner:true}]);
  },async()=>{refreshes++;return true;}));
  assert.equal(calls,2);
  assert.equal(refreshes,1);
  assert.equal(result[0].id,gid);
});
test('401 sem refresh nao volta a autorizar',async()=>{
  await assert.rejects(requestAuthorizedGuilds(opts(async()=>reply(401),async()=>false)),e=>e.status===401);
});
test('403 nao usa retry e nao autoriza',async()=>{
  let calls=0;
  await assert.rejects(requestAuthorizedGuilds(opts(async()=>{calls++;return reply(403);})),e=>e.status===403);
  assert.equal(calls,1);
});
test('falha 5xx apos retry mantem indicacao de indisponibilidade',async()=>{
  let calls=0;
  await assert.rejects(requestAuthorizedGuilds(opts(async()=>{calls++;return reply(503);})),e=>e.status===503);
  assert.equal(calls,2);
});
test('somente cache recente do proprio usuario serve para leitura',()=>{
  const now=1_000_000;
  const cache={userId:'123456789012345678',checkedAt:now-15000,list:[{id:gid}]};
  assert.equal(canUseReadOnlyGuildCache(cache,cache.userId,now,20000),true);
  assert.equal(canUseReadOnlyGuildCache(cache,'999999999999999999',now,20000),false);
  assert.equal(canUseReadOnlyGuildCache(cache,cache.userId,now+190000,90000),false);
  assert.equal(isTransientGuildError({status:503}),true);
  assert.equal(isTransientGuildError({status:401}),false);
});
