// Consulta de servidores com retry para falhas transitórias do Discord.
// Nunca autoriza alterações usando cache: o POST exige resposta atual da API.
export function isTransientGuildError(error) {
  return error?.status === 429 || error?.status >= 500 || error?.code === 'NETWORK';
}
export function canUseReadOnlyGuildCache(cache, userId, now=Date.now(), maxStaleMs=90000) {
  return !!cache && cache.userId === String(userId) &&
    Number.isFinite(cache.checkedAt) && cache.checkedAt <= now &&
    now-cache.checkedAt <= maxStaleMs && Array.isArray(cache.list) &&
    cache.list.length <= 250;
}
const wait = ms => new Promise(resolve => setTimeout(resolve,ms));
function guildError(message,status,code) {
  return Object.assign(new Error(message),{status,code});
}
export async function requestAuthorizedGuilds({
  getAccessToken, refreshAccessToken, authorized, fetcher=fetch,
  timeoutMs=10000, pause=wait
}) {
  if (typeof getAccessToken!=='function' || typeof refreshAccessToken!=='function' ||
      typeof authorized!=='function') throw new TypeError('Dependências OAuth inválidas');
  let refreshed=false;
  let transientFailures=0;
  for(let attempt=0;attempt<4;attempt++) {
    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),timeoutMs);
    try {
      const response=await fetcher('https://discord.com/api/v10/users/@me/guilds',{
        headers:{Authorization:`Bearer ${getAccessToken()}`},signal:ctl.signal
      });
      if(response.status===401) {
        if(refreshed) throw guildError('Sessão do Discord expirada',401,'AUTH');
        refreshed=true;
        if(!await refreshAccessToken()) throw guildError('Sessão do Discord expirada',401,'AUTH');
        continue;
      }
      if(response.status===429 || response.status>=500) {
        if(transientFailures>=1) throw guildError('API do Discord indisponível',response.status,'TEMPORARY');
        transientFailures++;
        const retrySeconds=Number(response.headers?.get?.('retry-after'));
        const retryDelay=Number.isFinite(retrySeconds)&&retrySeconds>0? Math.min(1200,Math.ceil(retrySeconds*1000)):350;
        await pause(retryDelay);
        continue;
      }
      if(!response.ok) throw guildError('Falha ao validar permissões no Discord',response.status,'HTTP');
      const guilds=await response.json();
      if(!Array.isArray(guilds) || guilds.length>250)
        throw guildError('Resposta de servidores inválida',502,'BAD_RESPONSE');
      return guilds.filter(authorized).map(g=>({
        id:String(g.id), name:String(g.name||'').slice(0,100), owner:!!g.owner,
        permissions:String(g.permissions||'0'), icon:g.icon||null
      }));
    }catch(error) {
      if(error?.status || error?.code==='AUTH') throw error;
      if(transientFailures>=1) throw guildError('Falha temporária na conexão com Discord',503,'NETWORK');
      transientFailures++;
      await pause(350);
    }finally{clearTimeout(timer);}
  }
  throw guildError('Não foi possível validar os servidores agora',503,'NETWORK');
}
