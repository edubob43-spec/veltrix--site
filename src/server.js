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
import { DEFAULT_SETTINGS } from './defaults.js';
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

const bridge = { guilds:new Map(), jobs:new Map(), results:new Map(), lastSeen:0, botOnline:false };
const connected = () => bridge.botOnline && Date.now()-bridge.lastSeen < 120000;
const queueJob = (guildId, userId, type, payload, action='') => {
  if ([...bridge.jobs.values()].filter(j=>j.guildId===guildId).length >= 25) throw Error('Fila desse servidor lotada. Tente novamente depois.');
  const id=randomUUID();
  bridge.jobs.set(id,{id,guildId,userId,type,action,payload,createdAt:Date.now()});
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
app.use(express.urlencoded({extended:false,limit:'16kb'}));
app.get('/healthz', (_req,res)=>res.json({ok:true,panel:'Render',botOnline:connected()}));
app.get('/api/status', (_req,res)=>res.set('Cache-Control','no-store').json({online:connected(),servers:connected()?bridge.guilds.size:0,backend:'Render+KataBump'}));

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
  bridge.botOnline=!!req.body.botOnline;
  bridge.lastSeen=Date.now();
  const acked=[];
  for(const completed of Array.isArray(req.body.completed)?req.body.completed.slice(0,100):[]){
    if(!completed?.id || !/^[\w-]{36}$/.test(completed.id))continue;
    acked.push(completed.id);
    const job=bridge.jobs.get(completed.id);
    if(job){bridge.results.set(job.guildId,{ok:!!completed.ok,error:safeError(completed.error),at:Date.now(),action:job.action||job.type});bridge.jobs.delete(job.id);}
  }
  for(const job of bridge.jobs.values())if(Date.now()-job.createdAt>30*60*1000)bridge.jobs.delete(job.id);
  for(const [key,info] of bridge.results)if(Date.now()-info.at>60*60*1000)bridge.results.delete(key);
  const jobs=[...bridge.jobs.values()].slice(0,20);
  res.set('Cache-Control','no-store').json({jobs,acked});
});

if(!oauthReady())console.warn('[Render] Configure PUBLIC_URL, DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET e SESSION_SECRET para usar OAuth.');
if(!bridgeReady())console.warn('[Render] Configure BRIDGE_SECRET (32+ caracteres) para sincronizar com o KataBump.');
const sessionDir=join(tmpdir(),'veltrix-render-sessions');mkdirSync(sessionDir,{recursive:true,mode:0o700});
const FileStore=FileStoreFactory(session);
app.use(session({store:new FileStore({path:sessionDir,ttl:60*60*24,retries:1}),name:'veltrix.render.sid',secret:sessionSecret||randomBytes(48).toString('hex'),resave:false,saveUninitialized:false,rolling:true,cookie:{httpOnly:true,sameSite:'lax',secure:true,maxAge:24*60*60*1000}}));
const limiter=rateLimit({windowMs:15*60*1000,limit:90,standardHeaders:'draft-7',legacyHeaders:false});
app.use('/auth',limiter);app.use('/dashboard',limiter);
const loginBanner=()=>oauthReady()?'':'<div class="alert">Login não configurado. Falta preencher as variáveis de ambiente no Render.</div>';
app.get('/',(req,res)=>res.set('Cache-Control','no-store').send(page('Início', `${loginBanner()}<div class="landing"><div class="tagline">✦ A PRÓXIMA ERA DA VELTRIX</div><h1>Seu servidor.<br/><span class="gradient-text">Seu universo.</span></h1><p>Gerencie tickets, moderação, boas-vindas e Inteligência Artificial pelo navegador. <strong>${connected()?`🟢 Veltrix conectada em ${bridge.guilds.size} servidor(es).`:'🟠 Aguardando sincronização do bot no KataBump.'}</strong></p><a class="btn btn-large" href="${req.session.user?'/dashboard':'/auth/login'}">✦ Abrir meu painel ↗</a><div class="preview"><span>🛡️ Moderação</span><span>🎫 Tickets</span><span>🤖 IA</span><span>🏗️ Gerenciamento</span></div></div>`,{user:req.session.user})));
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
      req.session.oauth={accessToken:token.access_token,expiresAt:Date.now()+(token.expires_in||3600)*1000};
      req.session.user={id:user.id,username:user.username,global_name:user.global_name,avatar:user.avatar};
      req.session.csrf=randomBytes(24).toString('hex');
      req.session.save(err=>err?res.status(500).send('Erro ao salvar login.'):res.redirect('/dashboard'));
    });
  }catch(e){console.warn('[OAuth Render]',safeError(e.message));res.status(502).send('Erro ao finalizar login do Discord. Tente novamente.');}
});
app.get('/auth/logout',(req,res)=>req.session.destroy(()=>{res.clearCookie('veltrix.render.sid');res.redirect('/');}));
const logged=(req,res,next)=>req.session.user&&req.session.oauth&&req.session.oauth.expiresAt>Date.now()?next():res.redirect('/auth/login');
async function guildsFor(req){
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),10000);
  try{
    const r=await fetch('https://discord.com/api/v10/users/@me/guilds',{headers:{Authorization:`Bearer ${req.session.oauth.accessToken}`},signal:ctl.signal});
    if(!r.ok)throw Error(`Discord guilds HTTP ${r.status}`);
    return (await r.json()).filter(authorized);
  }finally{clearTimeout(timer);}
}
app.get('/dashboard',logged,async(req,res)=>{
  try{
    const list=await guildsFor(req);
    const content=`<div class="heading"><div class="eyebrow">SELECIONE O SERVIDOR</div><h1>Seu espaço de <span class="gradient-text">controle.</span></h1><p>Somente servidores em que você tem permissão Gerenciar Servidor.</p></div>${!connected()?'<div class="alert">Aguardando conexão da Veltrix no KataBump. O login funciona, mas as configurações ficam indisponíveis até o bot sincronizar.</div>':''}<div class="server-grid">${list.map(g=>{
      const inside=bridge.guilds.has(g.id);
      const link=inside?`/dashboard/${g.id}/geral`:`https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&permissions=${BOT_PERMISSIONS}&scope=bot%20applications.commands&guild_id=${g.id}`;
      return `<a class="servercard" href="${link}"><span class="serveravatar">${esc(g.name[0]||'V')}</span><div><strong>${esc(g.name)}</strong><small>${inside?'● Veltrix conectada':'+ Convidar Veltrix'}</small></div><span>→</span></a>`;
    }).join('')||'<p>Você não administra nenhum servidor disponível.</p>'}</div>`;
    res.set('Cache-Control','no-store').send(page('Servidores',content,{user:req.session.user}));
  }catch(e){res.status(401).send(page('Sessão',`<div class="alert">${esc(safeError(e.message))}</div><a class="btn" href="/auth/login">Entrar novamente</a>`));}
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
  }catch(e){res.status(401).send('Login expirou ou Discord indisponível. Entre novamente.');}
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
app.post('/dashboard/:id/action/:action',logged,guard,checkCsrf,(req,res)=>{
  const action=req.params.action;
  const sections={'create-channel':'ferramentas','create-role':'ferramentas','send-embed':'ferramentas','ticket-panel':'tickets','partner-panel':'parcerias'};
  if(!sections[action])return res.status(404).send('Ação inexistente.');
  try{
    const required={'create-channel':0x10n,'create-role':0x10000000n,'send-embed':0x800n,'ticket-panel':0x20n,'partner-panel':0x20n}[action];
    if(!userGuildPermission(req.oauthGuild,required))throw Error('Sua conta não tem a permissão específica para esta ação.');
    let payload={};
    if(action==='create-channel'){
      const name=String(req.body.name||'').trim();if(!/^[\p{L}\p{N}_ -]{2,80}$/u.test(name))throw Error('Nome de canal inválido.');payload={name};
    }else if(action==='create-role'){
      const name=String(req.body.name||'').trim(),color=String(req.body.color||'').trim();
      if(!/^[\p{L}\p{N}_ -]{2,80}$/u.test(name)||!/^#[a-f0-9]{6}$/i.test(color))throw Error('Nome ou cor do cargo inválidos.');payload={name,color};
    }else if(action==='send-embed'){
      const channel=String(req.body.channel||''),title=String(req.body.title||'').trim(),description=String(req.body.description||'').trim();
      if(!req.guild.channels.cache.has(channel)||!title||!description||title.length>240||description.length>3800)throw Error('Canal, título ou descrição inválidos.');
      payload={channel,title,description};
    }
    queueJob(req.guild.id,req.session.user.id,'action',payload,action);
    return res.redirect(`/dashboard/${req.guild.id}/${sections[action]}?queued=1`);
  }catch(e){return errorRedirect(res,req.guild.id,sections[action],safeError(e.message));}
});
app.use((_req,res)=>res.status(404).send(page('404','<div class="heading"><h1>Página não encontrada</h1></div>')));
app.listen(port,'0.0.0.0',()=>console.log(`💜 Painel Render na porta ${port} (OAuth ${oauthReady()?'configurado':'pendente'}, bridge ${bridgeReady()?'configurado':'pendente'})`));
