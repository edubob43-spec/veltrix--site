/* Consulta apenas dados da conta autenticada; nenhuma alteração de saldo ocorre no navegador. */
(()=>{
 const root=document.getElementById('daily-root');if(!root)return;
 const $=id=>document.getElementById(id);
 let previousPending=root.dataset.pending==='1';
 const fmt=n=>Math.trunc(Number(n)||0).toLocaleString('pt-BR');
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
     }
     $('daily-claim').disabled=loading || s.claimedToday || !data.connected;
     $('daily-claim').textContent=loading?'⏳ Processando...':s.claimedToday?'✓ Daily resgatado':'🎁 Resgatar daily';
   }else{$('daily-claim').disabled=true;}
   if(data.result && !loading){
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
