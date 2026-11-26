import test from 'node:test';
import assert from 'node:assert/strict';
import { renderDailyPage } from '../src/daily-page.js';
const base = {user:{id:'123456789012345678',username:'Edu'},csrf:'abc',connected:true,pending:false,result:null,
  status:{wallet:3000000,bank:0,streak:2,nextBonusIn:5,claimedToday:false,todayReward:0,todayBonus:0}};
test('Antes de resgatar não revela faixa ou valor e remove link de perfil',()=>{
 const html=renderDailyPage(base);
 assert.match(html,/🎁 \?\?\?/);
 assert.doesNotMatch(html,/5\.000\s*[—-]\s*10\.000/);
 assert.doesNotMatch(html,/Personalizar meu perfil/);
 assert.match(html,/me\/daily\/claim/);
});
test('Após resgatar revela valor real, recuperado do status persistente',()=>{
 const html=renderDailyPage({...base,status:{...base.status,claimedToday:true,todayReward:8745}});
 assert.match(html,/\+8\.745 <small>VelCoins!<\/small>/);
 assert.match(html,/Daily resgatado/);
 assert.doesNotMatch(html,/5\.000 — 10\.000/);
});
test('Resultado de resgate recém concluído também revela valor antes do próximo status',()=>{
 const html=renderDailyPage({...base,result:{ok:true,result:{amount:7777,bonus:100000}}});
 assert.match(html,/\+7\.777 <small>VelCoins!<\/small>/);
 assert.match(html,/100\.000 VC de sequência/);
});
test('Mesmo com daily resgatado, sem histórico antigo exibe estado sem inventar prêmio',()=>{
 const html=renderDailyPage({...base,status:{...base.status,claimedToday:true,todayReward:0}});
 assert.match(html,/🎁 Resgatado!/);
 assert.doesNotMatch(html,/\+5\.000/);
});

test('Bônus de sétimo dia permanece visível na página, depois de atualizar',()=>{
 const html=renderDailyPage({...base,status:{...base.status,claimedToday:true,todayReward:6500,todayBonus:100000}});
 assert.match(html,/Bônus de sequência: \+100\.000 VC!/);
});
