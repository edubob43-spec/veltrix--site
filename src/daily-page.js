const fmt = amount => Math.trunc(Math.max(0,Number(amount)||0)).toLocaleString('pt-BR');
const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const DAILY_CSS=`
/* Veltrix Daily V2.7: painel individual, independente dos servidores. */
.daily-shell{max-width:1060px;margin:0 auto;padding:18px 0 48px}
.daily-head{display:flex;align-items:flex-start;justify-content:space-between;gap:15px;margin-bottom:27px;flex-wrap:wrap}
.daily-eyebrow{font-size:12px;letter-spacing:.22em;color:#8fead7;font-weight:850}
.daily-head h1{margin:5px 0;font-size:clamp(34px,5vw,55px);line-height:1.16;letter-spacing:-.05em}
.daily-head p{margin:7px 0;color:#b9b2cd;max-width:560px}
.daily-layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(280px,.85fr);gap:18px}
.daily-panel{border:1px solid rgba(163,133,215,.26);border-radius:24px;background:linear-gradient(142deg,rgba(39,29,64,.94),rgba(17,16,35,.96));box-shadow:0 25px 70px #03000f40;padding:28px;overflow:hidden;position:relative}
.daily-hero:after{content:'';position:absolute;width:280px;height:280px;background:radial-gradient(circle,#ffac6d24,transparent 70%);top:-100px;right:-90px;pointer-events:none}
.daily-panel h2{font-size:20px;letter-spacing:-.035em;margin:0 0 6px}.daily-panel p{color:#bcb2d1;font-size:14px;margin:4px 0 18px;line-height:1.55}
.daily-kicker{color:#f5b57d;font-size:12px;font-weight:850;letter-spacing:.13em;text-transform:uppercase}
.daily-amount{font-size:clamp(36px,5vw,56px);letter-spacing:-.06em;line-height:1.2;font-weight:900;background:linear-gradient(100deg,#ffbe79,#ffe5ba,#a6eee0);color:transparent;background-clip:text}
.daily-amount small{font-size:17px;letter-spacing:0;font-weight:700;color:#d6c6da}.daily-amount .daily-mystery{letter-spacing:.015em}.daily-amount.revealed{animation:dailyPrizeReveal .5s ease-out}@keyframes dailyPrizeReveal{from{opacity:.35;transform:translateY(9px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
.daily-bonus-earned{margin-top:8px;color:#ffe6a8;font-size:14px;font-weight:800}.daily-bonus-earned[hidden]{display:none!important}.daily-note{margin:8px 0 20px!important}.daily-note strong{color:#ffe2ad}
.daily-btn{background:linear-gradient(110deg,#ffb97d,#f6a4b8,#9ff3df);border:0;border-radius:14px;color:#17111e;cursor:pointer;font-weight:900;font-size:15px;padding:16px 18px;display:inline-flex;align-items:center;justify-content:center;min-width:220px;max-width:100%;box-shadow:0 12px 33px #fcb27d25}
.daily-btn:disabled{cursor:not-allowed;filter:grayscale(.55);opacity:.6;box-shadow:none}
.daily-btn:focus-visible{outline:2px solid #fff;outline-offset:4px}
.daily-balance{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin:20px 0 0}
.daily-stat{background:#ffffff09;border:1px solid #ffffff16;padding:15px;border-radius:15px}
.daily-stat span{font-size:12px;color:#aea5c4;display:block}.daily-stat strong{font-size:22px;letter-spacing:-.04em;display:block;margin-top:3px}
.daily-progress-area{margin-top:22px}.daily-streak-heading{margin-top:5px!important}.daily-extra-footer{margin-top:15px}.daily-streak{display:flex;gap:8px;margin:21px 0 15px}.daily-day{flex:1;min-width:0;border-radius:12px;border:1px solid #ffffff15;background:#ffffff09;text-align:center;padding:10px 1px;font-size:12px;color:#a9a2c1}
.daily-day.active{background:#ffbd8529;color:#ffe1b4;border-color:#ffc89170}.daily-day .flame{font-size:21px;display:block}
.daily-muted{color:#aca4bf;font-size:12px;line-height:1.55}.daily-status{margin-top:13px;color:#dcf8e8;font-weight:700;font-size:13px}
.daily-extra{background:radial-gradient(circle at top right,#71e7cf17,transparent 75%),linear-gradient(135deg,#242039,#161327)}
.daily-extra .daily-extra-icon{font-size:33px;display:block;margin-bottom:10px}.daily-extra strong{color:#b5f9e9}
.daily-locked{background:#ffffff10!important;color:#bbb3cc!important;box-shadow:none!important;cursor:not-allowed!important}
.daily-back{display:inline-flex;align-items:center;font-weight:700;font-size:13px;border:1px solid #ffffff24;padding:10px 13px;border-radius:12px;margin-top:6px}
@media(max-width:810px){.daily-layout{grid-template-columns:1fr}.daily-panel{padding:21px}.daily-balance{margin-top:13px}}
`;
export function renderDailyPage({user,csrf,connected,status,pending,result}) {
  const balance=status||null;
  const claimed=balance?.claimedToday===true;
  // O saldo pode demorar a chegar. O bot valida o resgate; não bloqueie a tentativa por ausência do snapshot.
  const ready=!!connected;
  const streak=Number(balance?.streak)||0;
  const progress=streak===0?0:(streak%7||7);
  const brDate = timestamp => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(timestamp);
  const resultCurrentDay= !Number.isSafeInteger(result?.at) || brDate(result.at)===brDate(Date.now());
  const claimedAmount=(claimed && Number.isSafeInteger(balance?.todayReward) ? balance.todayReward : 0) || (resultCurrentDay && result?.ok===true && !result?.result?.alreadyClaimed && Number.isSafeInteger(result?.result?.amount) ? result.result.amount : 0);
  const claimedBonus=(claimed && Number.isSafeInteger(balance?.todayBonus) ? balance.todayBonus : 0) || (resultCurrentDay && result?.ok===true && Number.isSafeInteger(result?.result?.bonus) ? result.result.bonus : 0);
  const revealed=claimedAmount>0;
  const note=!connected?'Bot desconectado. O resgate está indisponível no momento.':pending?'Resgate enviado ao bot. Aguardando confirmação...':claimed?'Daily de hoje resgatado. Volte à 00h (Brasília).':!balance?'Saldo ainda indisponível. Você pode tentar resgatar; o bot verifica sua conta.':'Disponível para coletar agora!';
  const outcome=result && resultCurrentDay && !pending?result.ok===true?(result.result?.alreadyClaimed?'Você já havia coletado o daily de hoje.':`🎉 Resgatado: +${fmt(result.result?.amount)} VelCoins${Number(result.result?.bonus)?` + ${fmt(result.result.bonus)} VC de sequência!`:''}`):`⚠️ Não foi possível resgatar: ${esc(result.error||'tente novamente.')}`:'';
  return `<div class="daily-shell" id="daily-root" data-pending="${pending?'1':'0'}">
    <div class="daily-head"><div><div class="daily-eyebrow">VELTRIX · ECONOMIA GLOBAL</div><h1>Seu <span class="gradient-text">Daily</span> 🎁</h1><p>Entre com Discord, receba suas VelCoins e mantenha sua sequência. O saldo é o mesmo em todos os servidores.</p></div><a class="daily-back" href="/dashboard">← Meus servidores</a></div>
    <div class="daily-layout"><section class="daily-panel daily-hero"><span class="daily-kicker">✦ Recompensa diária</span><h2>Seu presente está aqui.</h2><div class="daily-amount ${revealed?'revealed':''}" id="daily-amount" aria-live="polite">${revealed?`+${fmt(claimedAmount)} <small>VelCoins!</small>`:claimed?'🎁 Resgatado!':`<span class="daily-mystery">🎁 ???</span> <small>VelCoins</small>`}</div><div class="daily-bonus-earned" id="daily-bonus-earned" ${claimedBonus>0?'':'hidden'}>🏆 Bônus de sequência: +${claimedBonus>0?fmt(claimedBonus):'0'} VC!</div>
    <p class="daily-note">A cada <strong>7 dias consecutivos</strong>, você ganha mais <strong>100.000 VelCoins</strong>!</p>
    <form action="/me/daily/claim" method="POST"><input type="hidden" name="csrf" value="${esc(csrf)}"/><button type="submit" id="daily-claim" class="daily-btn" ${!ready||claimed||pending?'disabled':''}>${pending?'⏳ Processando...':claimed?'✓ Daily resgatado':'🎁 Resgatar daily'}</button></form>
    <div id="daily-message" role="status" class="daily-status">${outcome||esc(note)}</div>
    <p class="daily-muted" id="daily-reset">Reinicia todos os dias à meia-noite, horário de Brasília.</p></section>
    <section class="daily-panel"><span class="daily-kicker">💰 SUA CARTEIRA</span><h2>${esc(user.global_name||user.username||'Seu perfil')}</h2><p>VelCoins globais, sincronizadas com o bot.</p>
    <div class="daily-balance"><div class="daily-stat"><span>👛 Carteira</span><strong id="daily-wallet">${balance?fmt(balance.wallet):'—'}</strong></div><div class="daily-stat"><span>🏦 Banco</span><strong id="daily-bank">${balance?fmt(balance.bank):'—'}</strong></div></div>
    <div class="daily-progress-area"><span class="daily-kicker">🔥 SEQUÊNCIA</span><h2 class="daily-streak-heading"><span id="daily-streak">${streak}</span> dia(s)</h2><div class="daily-streak" id="daily-streak-dots">${Array.from({length:7},(_,i)=>`<div class="daily-day ${i<progress?'active':''}"><span class="flame">${i<progress?'🔥':'✦'}</span>${i+1}</div>`).join('')}</div><span class="daily-muted" id="daily-next-bonus">${balance?`Próximo bônus em ${balance.nextBonusIn} resgate(s).`:'Seu progresso aparecerá quando o bot enviar o saldo.'}</span></div></section>
    <section class="daily-panel daily-extra"><span class="daily-extra-icon">🎬</span><span class="daily-kicker">BÔNUS EXTRA</span><h2>Mais VelCoins assistindo anúncio?</h2><p>Queremos adicionar um anúncio recompensado opcional. O benefício ficará disponível quando uma rede aprovar o uso e confirmar cada visualização pelo servidor.</p><button class="daily-btn daily-locked" disabled title="Aguardando provedor de anúncios compatível">🔒 Ver anúncio — em breve</button><div class="daily-muted daily-extra-footer">O daily grátis continua funcionando normalmente, sem anúncio.</div></section>
    <section class="daily-panel"><span class="daily-extra-icon">💜</span><span class="daily-kicker">CONTA VELTRIX</span><h2>Uma carteira em qualquer servidor.</h2><p>Seu daily pelo site usa o mesmo ID e as mesmas regras de <strong>.daily</strong> no Discord. Resgatou em um lugar? Já estará resgatado no outro.</p></section></div>
    <script src="/assets/veltrix-daily-v1.js" defer></script>
  </div>`;
}
