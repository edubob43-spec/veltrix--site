import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDailyPage, DAILY_CSS } from '../src/daily-page.js';
const base={user:{id:'123456789012345678',username:'Usuário'},csrf:'tok',connected:true,status:{wallet:10000,bank:5000,claimedToday:false,streak:4,nextBonusIn:3},pending:false,result:null};
test('Daily em aba própria e resgate por formulário CSRF',()=>{
 const h=renderDailyPage(base);assert.match(h,/\/me\/daily\/claim/);assert.match(h,/name="csrf" value="tok"/);assert.match(h,/Resgatar daily/);assert.match(h,/100\.000 VelCoins/);assert.match(h,/10\.000/);
});
test('Daily já reivindicado desabilita botão',()=>{
 assert.match(renderDailyPage({...base,status:{...base.status,claimedToday:true}}),/id="daily-claim" class="daily-btn" disabled/);
});
test('Bônus por anúncio não pode ser resgatado sem provedor validado',()=>{
 const h=renderDailyPage(base);assert.match(h,/Ver anúncio — em breve<\/button>/);assert.match(h,/daily-locked" disabled/);assert.ok(DAILY_CSS.includes('.daily-shell'));
});

test('Daily permite solicitar resgate com bot online e saldo ainda pendente',()=>{
 const html=renderDailyPage({...base,status:null});
 assert.match(html,/id="daily-claim" class="daily-btn">🎁 Resgatar daily<\/button>/);
 assert.doesNotMatch(html,/Sincronizando sua conta/);
 assert.match(html,/Saldo ainda indisponível/);
});
test('Daily desabilita botão se o bot estiver offline',()=>{
 const html=renderDailyPage({...base,status:null,connected:false});
 assert.match(html,/id="daily-claim" class="daily-btn" disabled/);
 assert.match(html,/Bot desconectado/);
});
