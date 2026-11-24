const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const id=x=>e(x.id);
const opts=(items,first='— Selecionar —')=>`<option value="">${first}</option>${items.map(x=>`<option value="${id(x)}">${e(x.name)}</option>`).join('')}`;
const input=(n,label,value='',extra='')=>`<label class="field"><span>${e(label)}</span><input name="${e(n)}" value="${e(value)}" ${extra}></label>`;
const select=(n,label,items,first)=>`<label class="field"><span>${e(label)}</span><select name="${e(n)}">${opts(items,first)}</select></label>`;
const csrfInput=csrf=>`<input type="hidden" name="csrf" value="${e(csrf)}">`;
const form=(guild,action,csrf,body,button='Salvar')=>`<form method="post" action="/dashboard/${id(guild)}/action/${action}" class="config-form">${csrfInput(csrf)}${body}<div class="form-actions"><button class="btn" type="submit">✦ ${e(button)}</button><small>Confirme as ações antes de enviar. A Veltrix aplica na próxima sincronização.</small></div></form>`;
const card=(title,sub,body,icon='✦')=>`<section class="panel v2-card"><div class="panel-head"><span class="panel-icon">${icon}</span><div><h2>${e(title)}</h2><p>${e(sub)}</p></div></div><div class="panel-body">${body}</div></section>`;
const heading=(name,text)=>`<div class="heading"><div class="eyebrow">VELTRIX V2 / GERENCIAMENTO</div><h1>${e(name)} <span class="gradient-text">✦</span></h1><p>${e(text)}</p></div>`;
export const V2_CSS = `
.v2-card{margin-bottom:20px}.v2-note{background:#ad89ff11;border:1px solid #ab8aff38;border-radius:15px;padding:16px 20px;margin-bottom:22px;color:#cdbfe6;font-size:13px}.v2-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.v2-pill{font-size:11px;color:#e4c8ff;background:#af76ea1c;border:1px solid #d2a1f33b;padding:6px 9px;border-radius:9px}.v2-list{display:flex;flex-direction:column;gap:8px}.v2-line{display:flex;align-items:center;justify-content:space-between;padding:13px 15px;background:#120f21;border:1px solid #ffffff0d;border-radius:12px;font-size:13px;gap:12px}.v2-line small{color:#9d93b3}.v2-preview{background:#121026;border-left:4px solid #b88aff;border-radius:10px;padding:20px;margin:10px 0 15px;white-space:pre-wrap}.v2-danger{border-color:#e66b9e55}.v2-danger .panel-head{background:#b94a7b0e}.v2-danger .btn{background:#a43c65;color:white}.v2-identity{display:flex;align-items:center;gap:16px;margin-bottom:16px}.v2-identity .icon{height:70px;width:70px;border-radius:19px;display:grid;place-items:center;background:linear-gradient(140deg,#663bab,#db86db);font-size:27px}.v2-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:24px}.v2-grid .v2-stat{padding:19px;border:1px solid var(--border);background:var(--panel);border-radius:15px}.v2-stat strong{font-size:27px;display:block}.v2-stat small{color:var(--muted)}.v2-card select,.v2-card input[type=file]{max-width:100%}.v2-warn{color:#fbbacb;font-weight:600}.v2-card input[type=color]{min-height:40px}.v2-card .field select{appearance:auto}@media(max-width:820px){.v2-two,.v2-grid{grid-template-columns:1fr}}
`;
const channelList=g=>[...g.channels.cache.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name)));
const roleList=g=>[...g.roles.cache.values()].filter(r=>r.id!==g.id&&!r.managed).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
const typeName=t=>t===4?'Categoria':t===2?'Voz':t===0?'Texto':'Outro';
const flagOpts=()=>[['inherit','Herdar'],['allow','Permitir'],['deny','Negar']].map(([v,n])=>`<option value="${v}">${n}</option>`).join('');
export function v2SectionHtml(g,section,csrf){
  const channels=channelList(g),roles=roleList(g),cats=channels.filter(x=>x.type===4),rooms=channels.filter(x=>x.type===0||x.type===2||x.type===4),texts=channels.filter(x=>x.type===0);
  const roleOpts=roles.map(r=>({id:r.id,name:'@ '+r.name}));
  const roomOpts=rooms.map(c=>({id:c.id,name:`${c.type===4?'▣ ':c.type===2?'🔊 ':'# '}${c.name}`}));
  if(section==='estrutura')return heading('Estrutura do servidor','Crie, organize e edite categorias e canais com permissões respeitadas.')+
    `<div class="v2-grid"><div class="v2-stat"><strong>${channels.length}</strong><small>Canais no servidor</small></div><div class="v2-stat"><strong>${cats.length}</strong><small>Categorias</small></div><div class="v2-stat"><strong>${channels.filter(c=>c.type===2).length}</strong><small>Canais de voz</small></div></div>`+
    card('Criar categoria','Organize os canais em seções',form(g,'v2-create-category',csrf,input('name','Nome da categoria','','required minlength="2" maxlength="80"'),'Criar categoria'),'▣')+
    card('Criar canal','Texto, voz, público ou privado',form(g,'v2-create-channel',csrf,input('name','Nome do canal','','required minlength="2" maxlength="80"')+
      `<label class="field"><span>Tipo</span><select name="kind"><option value="text">Texto</option><option value="voice">Voz</option></select></label>`+
      select('parent','Categoria (opcional)',cats)+`<label class="field"><span>Visibilidade</span><select name="access"><option value="public">Público</option><option value="private">Privado para um cargo</option></select></label>`+
      select('role','Cargo autorizado (se privado)',roleOpts),'Criar canal'),'#')+
    card('Renomear ou mover','A categoria vazia significa sem categoria',form(g,'v2-edit-channel',csrf,select('channel','Canal existente',roomOpts)+input('name','Novo nome','','required minlength="2" maxlength="80"')+select('parent','Mover para categoria',cats,'— Sem categoria —'),'Salvar mudanças'),'✎')+
    card('Excluir canal ou categoria','A exclusão pode apagar mensagens e não possui desfazer',form(g,'v2-delete-channel',csrf,select('channel','Canal ou categoria',roomOpts)+input('confirm','Digite EXCLUIR para confirmar','','required pattern="EXCLUIR"'),'Excluir canal'),'⚠');
  if(section==='cargos')return heading('Cargos','Crie, renomeie e organize a identidade dos membros.')+
    `<div class="v2-note">A Veltrix só pode gerenciar cargos abaixo da posição dela. Cargos gerenciados por integrações não são editáveis aqui.</div>`+
    card('Criar cargo','Sem permissões administrativas perigosas por padrão',form(g,'v2-create-role',csrf,input('name','Nome do cargo','','required minlength="2" maxlength="80"')+input('color','Cor (#RRGGBB)','#aa7dff','required pattern="#[0-9a-fA-F]{6}"'),'Criar cargo'),'✦')+
    card('Editar cargo','Atualize nome e cor de um cargo existente',form(g,'v2-edit-role',csrf,select('role','Cargo',roleOpts)+input('name','Novo nome','','required minlength="2" maxlength="80"')+input('color','Nova cor','#aa7dff','required pattern="#[0-9a-fA-F]{6}"'),'Salvar cargo'),'✎')+
    card('Excluir cargo','Excluir um cargo pode alterar acessos de vários membros',form(g,'v2-delete-role',csrf,select('role','Cargo',roleOpts)+input('confirm','Digite EXCLUIR','','required pattern="EXCLUIR"'),'Excluir cargo'),'⚠');
  if(section==='permissoes')return heading('Permissões','Controle quem pode ver e escrever em canais específicos.')+
    `<div class="v2-note">Essas opções editam apenas <b>Ver canal</b> e <b>Enviar mensagens</b> para o cargo escolhido. Outras permissões existentes serão preservadas.</div>`+
    card('Ajustar acesso do cargo','Mudanças ficam restritas a este servidor',form(g,'v2-overwrite',csrf,
      select('channel','Canal',roomOpts)+select('role','Cargo',roleOpts)+`<label class="field"><span>Ver canal</span><select name="visibility">${flagOpts()}</select></label><label class="field"><span>Enviar mensagens (canais de texto)</span><select name="send">${flagOpts()}</select></label>`,'Aplicar permissões'),'♢');
  if(section==='embeds')return heading('Editor de embeds','Crie mensagens formatadas diretamente para um canal do seu servidor.')+
    card('Publicar mensagem embed','Menções @everyone e cargos ficam desativadas por segurança',form(g,'v2-embed',csrf,select('channel','Canal de texto',texts.map(c=>({id:c.id,name:'# '+c.name})))+input('title','Título','','required maxlength="256"')+
      `<label class="field"><span>Descrição</span><textarea name="description" rows="6" maxlength="3900" required placeholder="Escreva o texto..."></textarea></label>`+
      input('footer','Rodapé (opcional)','','maxlength="2000"')+input('color','Cor hexadecimal','#9d6fff','required pattern="#[0-9a-fA-F]{6}"'),'Publicar embed'),'✉');
  if(section==='templates')return heading('Templates de servidor','Comece com uma estrutura organizada, sem apagar canais existentes.')+
    `<div class="v2-note">Cada template cria no máximo 2 categorias e 5 canais. Um template <b>não apaga nada</b> e deve ser confirmado antes da aplicação. Confira também o limite de canais do Discord.</div>`+
    card('Escolha o modelo','Prévia das categorias e canais disponíveis',form(g,'v2-template',csrf,
      `<label class="field"><span>Modelo</span><select name="template"><option value="comunidade">💜 Comunidade — boas-vindas, geral, avisos e voz</option><option value="games">🎮 Games — chat, clips, notícias e squads</option><option value="estudos">📚 Estudos — dúvidas, materiais e salas</option></select></label>`+
      `<div class="v2-preview">▣ INÍCIO<br>　# boas-vindas<br>　# avisos<br>▣ COMUNIDADE<br>　# geral<br>　# mídia<br>　🔊 Bate-papo</div>`+
      input('confirm','Digite APLICAR para confirmar','','required pattern="APLICAR"'),'Aplicar template'),'▣');
  if(section==='identidade')return heading('Identidade da Veltrix','Personalize o bot só neste servidor, sem alterar a aparência dele nos outros.')+
    `<div class="v2-note">Alterações na identidade são feitas no perfil <b>deste servidor</b>. O avatar padrão global e os outros servidores não são afetados. O Discord pode aplicar limites de alteração de avatar.</div>`+
    card('Apelido por servidor','Nome que aparece na lista de membros',form(g,'v2-nickname',csrf,input('nickname','Novo apelido (vazio restaura o nome padrão)','','maxlength="32"'),'Atualizar apelido'),'✎')+
    card('Avatar por servidor','Envie PNG, JPEG ou WebP de até 512 KB',`<form method="post" action="/dashboard/${id(g)}/action/v2-avatar" enctype="multipart/form-data" class="config-form">${csrfInput(csrf)}<label class="field"><span>Imagem</span><input type="file" name="avatar" accept="image/png,image/jpeg,image/webp" required></label><div class="form-actions"><button class="btn" type="submit">✦ Alterar avatar</button><small>Somente neste servidor</small></div></form>`,'◉')+
    card('Restaurar foto padrão','Remove a foto personalizada do bot neste servidor',form(g,'v2-reset-avatar',csrf,`<p class="v2-warn">A foto local será substituída pelo avatar global.</p>`,'Restaurar avatar'),'↺');
  return heading('Gerenciamento','Selecione uma área no menu lateral.');
}
