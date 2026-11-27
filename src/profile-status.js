// Read-only status for a personal profile customization request.
export function profileSyncStatus(uid, bridge, now=Date.now()) {
  const job=[...bridge.jobs.values()].find(j=>j.type==='profile-settings'&&j.userId===uid);
  const pendingAt=bridge.profilePending.get(uid);
  if(job || pendingAt!==undefined){
    const started=Number(job?.createdAt||pendingAt||now);
    const waitSeconds=Math.max(0,Math.floor((now-started)/1000));
    if(waitSeconds>=30*60)return {status:'expired',waitSeconds,error:'A Veltrix não confirmou em 30 minutos. Verifique se o bot está online e atualizado no KataBump.'};
    return {status:'pending',waitSeconds};
  }
  const result=bridge.results.get(`profile:${uid}`);
  if(result?.action==='profile-settings'&&Number.isFinite(result.at)&&now-result.at<180000){
    return {status:result.ok?'success':'failure',error:String(result.error||'').slice(0,160)};
  }
  return {status:'idle'};
}
