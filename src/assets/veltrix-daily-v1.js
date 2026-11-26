/* Consulta apenas dados da conta autenticada; nenhuma alteração de saldo ocorre no navegador. */
(()=>{
 const root=document.getElementById('daily-root');if(!root)return;
 const $=id=>document.getElementById(id);
 let previousPending=root.dataset.pending==='1';
 const fmt=n=>Math.trunc(Number(n)||0).toLocaleString('pt-BR');
 const brDay=t=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(t);
 const reveal=(amount, claimed)=>{
   const el=$('daily-amount');if(!el)return;
   const reward=Number.isSafeInteger(amount)&&amount>0?amount:0;
   const state=reward?'revealed':claimed?'claimed':'hidden';
   if(el.dataset.state===state&&el.dataset.amount===String(reward))return;
   el.dataset.state=state;el.dataset.amount=String(reward);
   el.classList.toggle('revealed',reward>0);
   if(reward){el.replaceChildren(document.createTextNode(`+${fmt(reward)} `));const small=document.createElement('small');small.textContent='VelCoins!';el.append(small);}
   else if(claimed){el.textContent='🎁 Resgatado!';}
   else{el.replaceChildren();const mystery=document.createElement('span');mystery.className='daily-mystery';mystery.textContent='🎁 ???';const small=document.createElement('small');small.textContent='VelCoins';el.append(mystery,' ',small);}
 };
 const update=(data)=>{
   if(!data||typeof data!=='object')return;
   const s=data.status,loading=!!data.pending;
   if(s){
     $('daily-wallet').textContent=fmt(s.wallet);
     $('daily-bank').textContent=fmt(s.bank);
     $('daily-streak').textContent=fmt(s.streak);
     $('daily-next-bonus').textContent=`Próximo bônus em ${s.nextBonusIn} resgate(s).`;
     const progress=s.streak===0?0:(s.streak%7||7);
     $('daily-streak-dots').innerHTML=Array.from({length:7},(_,i)=>`<div class="daily-day ${i<progress?'active':''}"><span class="flame">${i<progress?'🔥':'✦'}</span>${i+1}</div>`).join('');
     if(s.claimedToday && s.resetAt){
       const remain=Math.max(0,s.resetAt-Date.now());
       const h=Math.floor(remain/3600000),m=Math.ceil(remain%3600000/60000);
       $('daily-reset').textContent=`Próximo daily às 00h de Brasília (cerca de ${h}h ${m}min).`;
     }else{$('daily-reset').textContent='Reinicia todos os dias à meia-noite, horário de Brasília.';}
     $('daily-claim').disabled=loading || s.claimedToday || !data.connected;
     $('daily-claim').textContent=loading?'⏳ Processando...':s.claimedToday?'✓ Daily resgatado':'🎁 Resgatar daily';
   }else{$('daily-claim').disabled=true;}
   // Antes do resgate: segredo. Depois: resultado real da conta (ou do job recém-concluído).
   const recent=data.result?.ok && !data.result?.result?.alreadyClaimed &&
     (!Number.isSafeInteger(data.result.at)||brDay(data.result.at)===brDay(Date.now())) ? data.result.result : null;
   const actual=Number.isSafeInteger(s?.todayReward)&&s.todayReward>0 ? s.todayReward
     : Number.isSafeInteger(recent?.amount)&&recent.amount>0 ? recent.amount : 0;
   reveal(actual,!!s?.claimedToday||!!recent);
   const bonus=Number.isSafeInteger(s?.todayBonus)&&s.todayBonus>0?s.todayBonus
     :Number.isSafeInteger(recent?.bonus)&&recent.bonus>0?recent.bonus:0;
   const bonusBadge=$('daily-bonus-earned');if(bonusBadge){bonusBadge.hidden=bonus<=0;bonusBadge.textContent=bonus>0?`🏆 Bônus de sequência: +${fmt(bonus)} VC!`:'';}
   if(data.result && !loading && (!Number.isSafeInteger(data.result.at)||brDay(data.result.at)===brDay(Date.now()))){
     if(data.result.ok){
       const d=data.result.result||{};
       $('daily-message').textContent=d.alreadyClaimed?'Daily de hoje já coletado.':`🎉 +${fmt(d.amount)} VelCoins${d.bonus?` e +${fmt(d.bonus)} de sequência!`:''}`;
     }else{$('daily-message').textContent='⚠️ '+(data.result.error||'Falha ao resgatar.');}
   }else if(loading){$('daily-message').textContent='⏳ Resgate enviado, aguardando o KataBump...';}
   else if(s){$('daily-message').textContent=s.claimedToday?'Daily resgatado hoje!':'Disponível para resgatar agora.';}
   else{$('daily-message').textContent='Sincronizando sua conta com a Veltrix...';}
   previousPending=loading;
 };
 const poll=async()=>{
   try{const response=await fetch('/api/me/daily',{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});
     if(response.ok)update(await response.json());
   }catch{}
 };
 poll();setInterval(()=>{if(!document.hidden)poll();},4500);
})();
