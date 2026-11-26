import 'node:process';
import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import FileStoreFactory from 'session-file-store';
import { rateLimit } from 'express-rate-limit';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ChannelType } from 'discord.js';
import multer from 'multer';
import { V2_ACTION_SECTION, V2_PERMISSIONS, validateV2Action } from './v2-contract.js';
import { DEFAULT_SETTINGS } from './defaults.js';
import { cleanProfile, ownedBadges } from './profile-contract.js';
import { renderProfileEditor } from './profile-editor.js';
import { tokenNeedsRefresh, refreshDiscordOAuth } from './oauth-refresh.js';
import { VELTRIX_CSS_HASH, esc, safeId, authorized, nav, page, sidebar, sectionHtml, validSettings, errorRedirect, BOT_PERMISSIONS } from './ui.js';

// Render = HTTPS + OAuth; KataBump = bot e armazenamento definitivo.
// Não coloque DISCORD_TOKEN neste serviço. O bot se comunica com HTTPS de saída.
const env = process.env;
const publicUrl = (env.PUBLIC_URL || '').trim().replace(/\/$/, '');
const redirectUri = publicUrl ? `${publicUrl}/auth/callback` : '';
const clientId = (env.DISCORD_CLIENT_ID || '').trim();
const clientSecret = (env.DISCORD_CLIENT_SECRET || '').trim();
const sessionSecret = (env.SESSION_SECRET || '').trim();
const bridgeSecret = (env.BRIDGE_SECRET || '').trim();
const port = Number(env.PORT || 10000);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('PORT inválida.');
if (publicUrl && !/^https:\/\/[^/]+$/.test(publicUrl)) throw Error('PUBLIC_URL precisa ser https://seu-site.onrender.com');
if (sessionSecret && sessionSecret.length < 32) throw Error('SESSION_SECRET requer 32+ caracteres');
if (bridgeSecret && bridgeSecret.length < 32) throw Error('BRIDGE_SECRET requer 32+ caracteres');
const oauthReady = () => !!(publicUrl && clientId && clientSecret && sessionSecret && sessionSecret.length >= 32);
const bridgeReady = () => bridgeSecret.length >= 32;
const constantSecretMatch = (provided, expected) => {
  const a=createHash('sha256').update(provided).digest(), b=createHash('sha256').update(expected).digest();
  return !!expected && timingSafeEqual(a,b);
};
const safeError = msg => String(msg || '').replace(/\s+/g,' ').slice(0,160);
const userGuildPermission = (g, required) => g.owner || ((BigInt(g.permissions || '0') & (0x8n | required)) !== 0n);

const bridge = { guilds:new Map(), profiles:new Map(), profilePending:new Map(), jobs:new Map(), results:new Map(), lastSeen:0, botOnline:false };
// Pedidos de sincronização HTTPS aguardando novos trabalhos.
// Ao salvar uma configuração, acordamos o bot imediatamente.
const bridgeWaiters = new Set();
const notifyBridge = () => { for (const wake of [...bridgeWaiters]) wake(); };
const connected = () => bridge.botOnline && Date.now()-bridge.lastSeen < 120000;
const queueJob = (guildId, userId, type, payload, action='') => {
  if(type==='profile-settings' && [...bridge.jobs.values()].some(j=>j.type===type && j.userId===userId))throw Error('Você já tem uma atualização de perfil em andamento. Aguarde a sincronização.');
  if ([...bridge.jobs.values()].filter(j=>j.guildId===guildId).length >= 25) throw Error('Fila desse servidor lotada. Tente novamente depois.');
  const id=randomUUID();
  bridge.jobs.set(id,{id,guildId,userId,type,action,payload,createdAt:Date.now()});
  notifyBridge();
  return id;
};
const makeGuild = (raw) => {
  const channels=(raw.channels||[]).map(c=>({...c,guild:{id:raw.id},isTextBased(){return [0,5,10,11,12].includes(this.type);}}));
  const roles=(raw.roles||[]).map(r=>({...r}));
  return {id:raw.id,name:raw.name,memberCount:raw.memberCount,stats:raw.stats||{},
    channels:{cache:new Map(channels.map(c=>[c.id,c]))}, roles:{cache:new Map(roles.map(r=>[r.id,r]))}};
};

const app=express();
app.disable('x-powered-by');
app.set('trust proxy',1); // Render encerra TLS antes de encaminhar ao Node.
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'",VELTRIX_CSS_HASH],imgSrc:["'self'",'https://cdn.discordapp.com'],connectSrc:["'self'"],fontSrc:["'self'"],formAction:["'self'"],frameAncestors:["'none'"],objectSrc:["'none'"],baseUri:["'self'"]}}}));
app.use('/assets',express.static(join(import.meta.dirname,'assets'),{maxAge:'10m',immutable:false,fallthrough:false}));
app.use(express.urlencoded({extended:false,limit:'16kb'}));
app.get('/healthz', (_req,res)=>res.json({ok:true,panel:'Render',botOnline:connected()}));
app.get('/api/status', (_req,res)=>res.set('Cache-Control','no-store').json({online:connected(),servers:connected()?bridge.guilds.size:0,backend:'Render+KataBump',bridgeConfigured:bridgeReady(),lastSyncSeconds:bridge.lastSeen?Math.floor((Date.now()-bridge.lastSeen)/1000):null}));

// O bot do KataBump abre uma conexão HTTPS para buscar solicitações feitas no painel.
// Este endpoint não está disponível aos usuários autenticados pelo Discord.
app.post('/bridge/sync', express.json({limit:'4mb'}), (req,res)=>{
  const provided=String(req.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if (!bridgeReady() || !constantSecretMatch(provided,bridgeSecret))return res.status(401).json({error:'Bridge não autorizado'});
  if (!Array.isArray(req.body?.guilds) || req.body.guilds.length>250)return res.status(400).json({error:'Payload de guilds inválido'});
  const next=new Map();
  for (const raw of req.body.guilds) {
    if(!safeId(raw?.id) || typeof raw.name!=='string' || !Array.isArray(raw.channels) || !Array.isArray(raw.roles))return res.status(400).json({error:'Guild inválida'});
    const sanitizedSettings=Object.fromEntries(Object.keys(DEFAULT_SETTINGS).map(k=>[k,raw.settings?.[k]??DEFAULT_SETTINGS[k]]));
    next.set(raw.id,{id:raw.id,name:raw.name.slice(0,100),memberCount:Number(raw.memberCount)||0,
      channels:raw.channels.slice(0,800).filter(c=>safeId(c.id)).map(c=>({id:c.id,name:String(c.name||'').slice(0,100),type:Number(c.type)})),
      roles:raw.roles.slice(0,500).filter(r=>safeId(r.id)).map(r=>({id:r.id,name:String(r.name||'').slice(0,100),managed:!!r.managed})),
      stats:raw.stats||{},settings:sanitizedSettings});
  }
  bridge.guilds=next;
  // The bot is the durable source of each user's personal preferences.
  if(req.body.profiles && typeof req.body.profiles==='object' && !Array.isArray(req.body.profiles)) {
    const entries=Object.entries(req.body.profiles);
    if(entries.length<=4000) for(const [uid,raw] of entries) {
      if(!safeId(uid) || bridge.profilePending.has(uid))continue;
      try {bridge.profiles.set(uid,cleanProfile(raw));} catch {}
    }
  }
  bridge.botOnline=!!req.body.botOnline;
  bridge.lastSeen=Date.now();
  const acked=[];
  for(const completed of Array.isArray(req.body.completed)?req.body.completed.slice(0,100):[]){
    if(!completed?.id || !/^[\w-]{36}$/.test(completed.id))continue;
    acked.push(completed.id);
    const job=bridge.jobs.get(completed.id);
    if(job){
      if(job.type==='profile-settings')bridge.profilePending.delete(job.userId);
      bridge.results.set(job.type==='profile-settings'?`profile:${job.userId}`:job.guildId,{ok:!!completed.ok,error:safeError(completed.error),at:Date.now(),action:job.action||job.type});bridge.jobs.delete(job.id);
    }
  }
  for(const job of bridge.jobs.values())if(Date.now()-job.createdAt>30*60*1000)bridge.jobs.delete(job.id);
  for(const [uid,created] of bridge.profilePending)if(Date.now()-created>35*60*1000)bridge.profilePending.delete(uid);
  for(const [key,info] of bridge.results)if(Date.now()-info.at>60*60*1000)bridge.results.delete(key);
  // Long polling: uma única requisição HTTPS fica aguardando até surgir uma ação,
  // evitando o intervalo fixo de 15-30 segundos da V2.5.
  // Render responde ao final de no máximo 18 segundos para atualizar o heartbeat.
  let timeout;
  let replied=false;
  const reply = () => {
    if (replied || res.destroyed) return;
    replied=true;
    clearTimeout(timeout);
    bridgeWaiters.delete(reply);
    res.set('Cache-Control','no-store').json({jobs:[...bridge.jobs.values()].slice(0,20),acked});
  };
  res.on('close',()=>{
    replied=true;
    clearTimeout(timeout);
    bridgeWaiters.delete(reply);
  });
  if (bridge.jobs.size) return reply();
  bridgeWaiters.add(reply);
  timeout=setTimeout(reply,18000);
  timeout.unref?.();
});

if(!oauthReady())console.warn('[Render] Configure PUBLIC_URL, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET e SESSION_SECRET para usar OAuth.');
if(!bridgeReady())console.warn('[Render] Configure BRIDGE_SECRET (32+ caracteres) para sincronizar com o KataBump.');
const sessionDir=join(tmpdir(),'veltrix-render-sessions');mkdirSync(sessionDir,{recursive:true,mode:0o700});
const FileStore=FileStoreFactory(session);
app.use(session({store:new FileStore({path:sessionDir,ttl:60*60*24,retries:1}),name:'veltrix.render.sid',secret:sessionSecret||randomBytes(48).toString('hex'),resave:false,saveUninitialized:false,rolling:true,cookie:{httpOnly:true,sameSite:'lax',secure:true,maxAge:24*60*60*1000}}));
const limiter=rateLimit({windowMs:15*60*1000,limit:90,standardHeaders:'draft-7',legacyHeaders:false});
app.use('/auth',limiter);app.use('/dashboard',limiter);app.use('/me',limiter);
const loginBanner=()=>oauthReady()?'':'<div class="alert">Login não configurado. Falta preencher as variáveis de ambiente no Render.</div>';
app.get('/',(req,res)=>{
  const status=connected()?`Veltrix conectada em ${bridge.guilds.size} servidor(es)`:'Aguardando sincronização do bot';
  const dashboard=req.session.user?'/dashboard':'/auth/login';
  const features=[
    ['🎫','Tickets','Organize atendimentos com canais privados, equipe e transcrições.'],
    ['👋','Boas-vindas','Receba os membros com mensagens no seu estilo.'],
    ['📜','Logs','Acompanhe eventos do servidor em um canal reservado.'],
    ['🤝','Parcerias','Gerencie pedidos, revisões e anúncios.'],
    ['🔐','Permissões','Ajuste visibilidade e envio de mensagens por cargo.'],
    ['🌟','Identidade da Veltrix','Avatar e apelido exclusivos para cada servidor.']
  ];
  const cards=features.map(([emoji,title,desc])=>`<a class="vel-feature" href="${dashboard}"><span class="vel-feature-icon">${emoji}</span><strong>${title}</strong><small>${desc}</small></a>`).join('');
  const html=`${loginBanner()}<div class="landing">
    <section class="vel-hero">
      <div class="vel-copy"><div class="vel-kicker">✦ SUA COMUNIDADE, SEU UNIVERSO</div>
        <h1>Seu servidor.<span class="gradient-text"><br>Seu universo.</span></h1>
        <p>Conheça a Veltrix: seu painel para cuidar dos tickets, boas-vindas, logs, permissões e personalização de cada servidor.</p>
        <div class="vel-online"><span class="vel-pulse"></span>${esc(status)}</div>
        <div class="vel-actions"><a class="btn btn-large" href="${dashboard}">✦ Abrir meu painel ↗</a><a class="vel-secondary" href="#recursos">Explorar recursos ↓</a></div>
      </div>
      <div class="vel-mascot-wrap" aria-label="Mascote oficial da Veltrix">
        <div class="vel-aura"></div><div class="vel-orbit"></div>
        <img class="vel-mascot" src="/assets/veltrix-mascote-animada-v24.gif" data-animated="/assets/veltrix-mascote-animada-v24.gif" data-still="/assets/veltrix-mascot-recortada-v22.webp" width="362" height="482" alt="Mascote Veltrix de anime com cabelo laranja e roupa turquesa, animada com movimento suave" fetchpriority="high">
        <span class="vel-floating-pill a">✦ <b>Sua</b> assistente</span><span class="vel-floating-pill b">✧ Seu servidor, seu <b>estilo</b></span>
      </div>
    </section>
    <section id="recursos" aria-labelledby="recursos-titulo"><div class="vel-section-title"><div class="vel-kicker">✦ CRIE DO SEU JEITO</div><h2 id="recursos-titulo">Tudo sob seu controle</h2><p>Gerencie os sistemas essenciais de cada servidor com a identidade única da Veltrix.</p></div><div class="vel-features">${cards}</div></section>
    <section class="vel-lower-cta"><div><h2>Seu servidor merece mais.</h2><p>Entre com Discord para abrir o painel e escolher seu servidor.</p></div><a class="btn btn-large" href="${dashboard}">Começar agora ↗</a></section>
  </div>`;
  return res.set('Cache-Control','no-store').send(page('Início',html,{user:req.session.user}));
});
app.get('/auth/login', (req,res)=>{
  if(!oauthReady())return res.status(503).send('Configure PUBLIC_URL e os dados OAuth no Render antes de entrar.');
  const state=randomBytes(24).toString('hex');req.session.oauthState=state;
  req.session.save(e=>{
    if(e)return res.status(500).send('Falha ao salvar sessão.');
    const p=new URLSearchParams({client_id:clientId,redirect_uri:redirectUri,response_type:'code',scope:'identify guilds',state});
    res.redirect(`https://discord.com/oauth2/authorize?${p}`);
  });
});
app.get('/auth/callback',async(req,res)=>{
  if(!oauthReady())return res.status(503).send('OAuth não configurado.');
  const state=String(req.query.state||''),expected=req.session.oauthState;
  if(!expected||state.length!==expected.length||!timingSafeEqual(Buffer.from(state),Buffer.from(expected)))return res.status(403).send('Estado OAuth inválido. Faça login de novo.');
  if(req.query.iss && req.query.iss!=='https://discord.com')return res.status(403).send('Emissor OAuth inválido.');
  const code=String(req.query.code||'');if(!code)return res.status(400).send('Código OAuth ausente.');
  delete req.session.oauthState;
  try {
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
    let token,user;
    try{
      const r=await fetch('https://discord.com/api/v10/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:'authorization_code',code,redirect_uri:redirectUri}),signal:ctl.signal});
      if(!r.ok)throw Error(`Discord token HTTP ${r.status}`);
      token=await r.json();
      const u=await fetch('https://discord.com/api/v10/users/@me',{headers:{Authorization:`Bearer ${token.access_token}`},signal:ctl.signal});
      if(!u.ok)throw Error(`Discord user HTTP ${u.status}`);user=await u.json();
    }finally{clearTimeout(timer);}
    req.session.regenerate(e=>{
      if(e)return res.status(500).send('Erro ao iniciar a sessão.');
      req.session.oauth={accessToken:token.access_token,refreshToken:token.refresh_token,expiresAt:Date.now()+(token.expires_in||3600)*1000};
      req.session.user={id:user.id,username:user.username,global_name:user.global_name,avatar:user.avatar,public_flags:Number(user.public_flags||0)};
      req.session.csrf=randomBytes(24).toString('hex');
      req.session.save(err=>err?res.status(500).send('Erro ao salvar login.'):res.redirect('/dashboard'));
    });
  }catch(e){console.warn('[OAuth Render]',safeError(e.message));res.status(502).send('Erro ao finalizar login do Discord. Tente novamente.');}
});
app.get('/auth/logout',(req,res)=>req.session.destroy(()=>{res.clearCookie('veltrix.render.sid');res.redirect('/');}));
// V2.5.1: um access token do Discord costuma vencer após ~1 h.
// Renovamos antes do vencimento para não perder alterações durante o uso do painel.
// Um refresh por sessão de cada vez evita disputar refresh tokens rotativos.
const refreshInFlight = new Map();
const persistSession = req => new Promise((resolve, reject) =>
  req.session.save(err => err ? reject(err) : resolve()));
async function refreshSessionToken(req) {
  if (!req.session?.oauth?.refreshToken) return false;
  const sessionId=req.sessionID;
  let pending=refreshInFlight.get(sessionId);
  if (!pending) {
    pending=refreshDiscordOAuth(req.session.oauth,{clientId,clientSecret});
    refreshInFlight.set(sessionId,pending);
    // A limpeza ocorre também em caso de erro, sem gerar rejeição não tratada.
    void pending.then(
      ()=>{if(refreshInFlight.get(sessionId)===pending)refreshInFlight.delete(sessionId);},
      ()=>{if(refreshInFlight.get(sessionId)===pending)refreshInFlight.delete(sessionId);}
    );
  }
  const renewed=await pending;
  req.session.oauth=renewed;
  await persistSession(req);
  return true;
}
async function ensureOAuth(req,{force=false}={}) {
  if(!req.session?.user || !req.session.oauth) return false;
  if (!force && !tokenNeedsRefresh(req.session.oauth)) return true;
  if (!req.session.oauth.refreshToken) return false; // sessões antigas: login único necessário
  try { return await refreshSessionToken(req); }
  catch(e) {
    console.warn('[OAuth refresh]',safeError(e.message));
    // Em falha temporária de rede, ainda podemos usar um token não vencido.
    if (!force && req.session.oauth?.accessToken && req.session.oauth.expiresAt>Date.now()) return true;
    if (e.status===400 || e.status===401) return false;
    const err=new Error('O Discord está temporariamente indisponível. Tente novamente.');
    err.status=503;
    throw err;
  }
}
function logged(req,res,next){
  ensureOAuth(req).then(ok=>{
    if(ok) return next();
    if(req.method==='GET')return res.redirect('/auth/login');
    return res.status(401).send(page('Sessão expirada',
      '<div class="alert">Sua sessão expirou. Nenhuma alteração foi enviada. Entre com Discord novamente e repita a operação.</div><a class="btn" href="/auth/login">Entrar novamente</a>'));
  }).catch(e=>res.status(e.status||503).send(page('Discord indisponível',
    '<div class="alert">Não foi possível renovar o login agora. Tente novamente em alguns instantes.</div>')));
}
async function guildsFor(req){
  // A API pode revogar o token antes do horário informado. Revalida uma vez se retornar 401.
  for (let attempt=0;attempt<2;attempt++){
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);
    try{
      const r=await fetch('https://discord.com/api/v10/users/@me/guilds',
        {headers:{Authorization:`Bearer ${req.session.oauth.accessToken}`},signal:ctl.signal});
      if(r.status===401 && attempt===0) {
        if(!await ensureOAuth(req,{force:true}))throw Object.assign(Error('Sessão OAuth vencida'),{status:401});
        continue;
      }
      if(r.status===401)throw Object.assign(Error('Sessão OAuth vencida'),{status:401});
      if(!r.ok)throw Object.assign(Error(`Discord guilds HTTP ${r.status}`),{status:r.status});
      return (await r.json()).filter(authorized);
    }finally{clearTimeout(timer);}
  }
  throw Object.assign(Error('Sessão OAuth vencida'),{status:401});
}
// Perfil individual: cada pessoa edita SOMENTE o próprio usuário autenticado.
// Não exige Gerenciar Servidor e nunca permite trocar userId pelo formulário.
async function personalFlags(req){
  if(Number.isInteger(req.session.user?.public_flags))return req.session.user.public_flags;
  try {
    const r=await fetch('https://discord.com/api/v10/users/@me',{
      headers:{Authorization:`Bearer ${req.session.oauth.accessToken}`},signal:AbortSignal.timeout(7000)});
    if(r.ok){const info=await r.json();req.session.user.public_flags=Number(info.public_flags||0);return req.session.user.public_flags;}
  }catch{}
  return 0;
}
app.get('/me/perfil',logged,async(req,res)=>{
  const uid=req.session.user.id;
  const flags=await personalFlags(req);
  const last=bridge.results.get(`profile:${uid}`)||{};
  const msg=req.query.queued?'Sua escolha foi enviada à Veltrix. Aguarde a confirmação do bot.':
    req.query.error?String(req.query.error).slice(0,140):
    last.action==='profile-settings' && Date.now()-last.at<180000 ? (last.ok?'Última personalização aplicada no bot.':'A última personalização falhou: '+last.error):'';
  const content=renderProfileEditor({user:req.session.user,settings:bridge.profiles.get(uid),flags,csrf:req.session.csrf,connected:connected(),message:msg});
  res.set('Cache-Control','no-store').send(page('Meu perfil',content,{user:req.session.user}));
});
app.post('/me/perfil',logged,checkCsrf,async(req,res)=>{
  if(!connected())return res.status(503).send(page('Sincronização pendente','<div class="alert">Aguarde a reconexão da Veltrix no KataBump antes de salvar.</div><a class="btn" href="/me/perfil">Voltar ao editor</a>',{user:req.session.user}));
  try{
    const flags=await personalFlags(req);
    const all=ownedBadges(flags).map(b=>b.id);
    const selected=req.body.badge===undefined?[]:Array.isArray(req.body.badge)?req.body.badge:[req.body.badge];
    if(selected.length>5 || selected.some(b=>!all.includes(String(b))))throw Error('Selecione no máximo 5 insígnias que pertencem à sua conta.');
    const pref=cleanProfile({theme:req.body.theme,banner:req.body.banner,badges:selected,bio:req.body.bio||''});
    const uid=req.session.user.id;
    queueJob('',uid,'profile-settings',pref);
    bridge.profiles.set(uid,pref);
    bridge.profilePending.set(uid,Date.now());
    return res.redirect('/me/perfil?queued=1');
  }catch(e){return res.redirect('/me/perfil?error='+encodeURIComponent(safeError(e.message)));}
});
app.get('/dashboard',logged,async(req,res)=>{
  try{
    const list=await guildsFor(req);
    const content=`<div class="heading"><div class="eyebrow">SELECIONE O SERVIDOR</div><h1>Seu espaço de <span class="gradient-text">controle.</span></h1><p>Somente servidores em que você tem permissão Gerenciar Servidor.</p></div>${!connected()?'<div class="alert">Reconectando a Veltrix no KataBump… Este painel atualizará automaticamente quando o bot responder.</div><script defer src="/assets/veltrix-sync-refresh-v26.js"></script>':''}<div class="server-grid">${list.map(g=>{
      const inside=bridge.guilds.has(g.id);
      const link=inside?`/dashboard/${g.id}/geral`:`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&permissions=${BOT_PERMISSIONS}&scope=bot%20applications.commands&guild_id=${g.id}`;
      return `<a class="servercard" href="${link}"><span class="serveravatar">${esc(g.name[0]||'V')}</span><div><strong>${esc(g.name)}</strong><small>${inside?'● Veltrix conectada':'+ Convidar Veltrix'}</small></div><span>→</span></a>`;
    }).join('')||'<p>Você não administra nenhum servidor disponível.</p>'}</div>`;
    res.set('Cache-Control','no-store').send(page('Servidores',content,{user:req.session.user}));
  }catch(e){res.status(e.status===401?401:503).send(page('Conexão com Discord',`<div class="alert">${e.status===401?'Seu login expirou. Entre novamente.':'Não foi possível consultar o Discord agora. Tente atualizar em alguns instantes.'}</div><a class="btn" href="${e.status===401?'/auth/login':'/dashboard'}">${e.status===401?'Entrar novamente':'Tentar de novo'}</a>`));}
});
async function guard(req,res,next){
  if(!safeId(req.params.id))return res.status(400).send('Servidor inválido.');
  if(!connected())return res.status(503).send(page('Bot desconectado','<div class="alert">O bot ainda não se conectou ao painel. Tente novamente depois que sincronizar.</div>',{user:req.session.user}));
  const raw=bridge.guilds.get(req.params.id);
  if(!raw)return res.status(404).send('Veltrix não está nesse servidor.');
  try{
    const g=(await guildsFor(req)).find(g=>g.id===req.params.id);
    if(!g)return res.status(403).send('Sem permissão Gerenciar Servidor.');
    req.guild=makeGuild(raw);req.oauthGuild=g;req.guildData=raw;next();
  }catch(e){
    if(e.status===401)return res.status(401).send('Sua sessão do Discord expirou. Entre novamente para continuar.');
    return res.status(503).send('Não foi possível consultar o Discord agora. Tente novamente sem perder suas configurações.');
  }
}
function checkCsrf(req,res,next){
  const actual=String(req.body.csrf||''),expected=req.session.csrf||'';
  if(!expected||actual.length!==expected.length||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return res.status(403).send('Token CSRF inválido.');
  next();
}
app.get('/dashboard/:id/:section',logged,guard,(req,res)=>{
  const sec=nav.some(([k])=>k===req.params.section)?req.params.section:'geral';
  const last=bridge.results.get(req.guild.id);
  const message=req.query.queued?'Solicitação enviada à Veltrix. As alterações aparecem após a próxima sincronização.':req.query.error?String(req.query.error).slice(0,160):last?`${last.ok?'Última ação concluída':'Última ação falhou'}: ${last.action}${last.error?` — ${last.error}`:''}`:'';
  const html=sectionHtml(req.guild,req.guildData.settings,sec,req.session.csrf,{});
  res.set('Cache-Control','no-store').send(page(sec,html,{user:req.session.user,side:sidebar(req.guild,sec),flash:message}));
});
app.get('/dashboard/:id',logged,guard,(req,res)=>res.redirect(`/dashboard/${req.guild.id}/geral`));
app.post('/dashboard/:id/save/:section',logged,guard,checkCsrf,(req,res)=>{
  try{
    const patch=validSettings(req.params.section,req.body,req.guild);
    queueJob(req.guild.id,req.session.user.id,'save-settings',patch);
    return res.redirect(`/dashboard/${req.guild.id}/${req.params.section}?queued=1`);
  }catch(e){return errorRedirect(res,req.guild.id,req.params.section,safeError(e.message));}
});
// Avatar é recebido como multipart, com tamanho limitado; não é salvo no Render.
const avatarUpload=multer({
  storage:multer.memoryStorage(),limits:{fileSize:512*1024,files:1,fields:2},
  fileFilter:(_req,file,cb)=>cb(null,['image/png','image/jpeg','image/webp'].includes(file.mimetype))
});
const imageType=(b)=>{
  if(b.length>=8&&b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))return 'image/png';
  if(b.length>=3&&b.subarray(0,3).equals(Buffer.from('ffd8ff','hex')))return 'image/jpeg';
  if(b.length>=12&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP')return 'image/webp';
  return null;
};
app.post('/dashboard/:id/action/v2-avatar',logged,guard,(req,res,next)=>{
  avatarUpload.single('avatar')(req,res,e=>{
    if(e)return errorRedirect(res,req.guild.id,'identidade','Arquivo inválido ou maior que 512 KB.');
    next();
  });
},checkCsrf,(req,res)=>{
  try{
    if(!userGuildPermission(req.oauthGuild,0x20n))throw Error('Sem permissão Gerenciar Servidor.');
    if(!req.file?.buffer||!imageType(req.file.buffer))throw Error('Envie uma imagem PNG, JPEG ou WebP válida.');
    queueJob(req.guild.id,req.session.user.id,'action',{image:req.file.buffer.toString('base64'),type:imageType(req.file.buffer)},'v2-avatar');
    return res.redirect(`/dashboard/${req.guild.id}/identidade?queued=1`);
  }catch(e){return errorRedirect(res,req.guild.id,'identidade',safeError(e.message));}
});
app.post('/dashboard/:id/action/:action',logged,guard,checkCsrf,(req,res)=>{
  const action=req.params.action;
  if(V2_ACTION_SECTION[action]){
    try{
      if(!userGuildPermission(req.oauthGuild,V2_PERMISSIONS[action]))throw Error('Sem a permissão necessária para esta ação.');
      const payload=validateV2Action(action,req.body,req.guild);
      queueJob(req.guild.id,req.session.user.id,'action',payload,action);
      return res.redirect(`/dashboard/${req.guild.id}/${V2_ACTION_SECTION[action]}?queued=1`);
    }catch(e){return errorRedirect(res,req.guild.id,V2_ACTION_SECTION[action],safeError(e.message));}
  }
  const sections={'ticket-panel':'tickets','partner-panel':'parcerias'};
  if(!sections[action])return res.status(404).send('Ação indisponível no painel.');
  try{
    if(!userGuildPermission(req.oauthGuild,0x20n))throw Error('Sua conta não pode administrar esse servidor.');
    const payload={};
    queueJob(req.guild.id,req.session.user.id,'action',payload,action);
    return res.redirect(`/dashboard/${req.guild.id}/${sections[action]}?queued=1`);
  }catch(e){return errorRedirect(res,req.guild.id,sections[action],safeError(e.message));}
});
app.use((_req,res)=>res.status(404).send(page('404','<div class="heading"><h1>Página não encontrada</h1></div>')));
app.listen(port,'0.0.0.0',()=>console.log(`💜 Painel Render na porta ${port} (OAuth ${oauthReady()?'configurado':'pendente'}, bridge ${bridgeReady()?'configurado':'pendente'})`));
