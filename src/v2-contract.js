// Contrato de ações V2: validação do lado do painel. O KataBump valida novamente.
export const V2_SECTIONS = Object.freeze(['estrutura','cargos','permissoes','embeds','templates','identidade']);
export const V2_ACTION_SECTION = Object.freeze({
  'v2-create-category':'estrutura','v2-create-channel':'estrutura','v2-edit-channel':'estrutura','v2-delete-channel':'estrutura',
  'v2-create-role':'cargos','v2-edit-role':'cargos','v2-delete-role':'cargos',
  'v2-overwrite':'permissoes','v2-embed':'embeds','v2-template':'templates',
  'v2-nickname':'identidade','v2-avatar':'identidade','v2-reset-avatar':'identidade'
});
// Bits: ManageChannels 0x10, ManageRoles 0x10000000, SendMessages 0x800.
export const V2_PERMISSIONS=Object.freeze({
  'v2-create-category':0x10n,'v2-create-channel':0x10n,'v2-edit-channel':0x10n,'v2-delete-channel':0x10n,
  'v2-create-role':0x10000000n,'v2-edit-role':0x10000000n,'v2-delete-role':0x10000000n,
  'v2-overwrite':0x10000000n,'v2-embed':0x800n,'v2-template':0x10n,
  'v2-nickname':0x20n,'v2-avatar':0x20n,'v2-reset-avatar':0x20n
});
const id=x=>/^\d{17,20}$/.test(String(x??''));
const str=x=>String(x??'').trim();
const hex=x=>/^#[\da-f]{6}$/i.test(str(x));
const name=x=>str(x).length>=2 && str(x).length<=80 && !/[\r\n\x00-\x1f]/.test(str(x));
const channel=(g,x,type)=>{const c=g.channels.cache.get(str(x));if(!c || (type!==undefined && c.type!==type))throw Error('Canal inexistente ou de tipo inválido.');return c.id;};
const role=(g,x)=>{const r=g.roles.cache.get(str(x));if(!r||r.id===g.id||r.managed)throw Error('Cargo inexistente ou gerenciado pelo Discord.');return r.id;};
export function validateV2Action(action,b,g){
  if(!V2_ACTION_SECTION[action])throw Error('Ação desconhecida.');
  if(action==='v2-create-category'){
    if(!name(b.name))throw Error('Nome da categoria inválido (2 a 80 caracteres).');
    return {name:str(b.name).slice(0,80)};
  }
  if(action==='v2-create-channel'){
    if(!name(b.name))throw Error('Nome do canal inválido.');
    if(!['text','voice'].includes(b.kind))throw Error('Tipo inválido.');
    const parent=str(b.parent);if(parent)channel(g,parent,4);
    const access=str(b.access)||'public';if(!['public','private'].includes(access))throw Error('Visibilidade inválida.');
    const roleId=access==='private'?role(g,b.role):'';
    return {name:str(b.name).slice(0,80),kind:b.kind,parent,access,roleId};
  }
  if(action==='v2-edit-channel'){
    const ch=channel(g,b.channel);
    if(!name(b.name))throw Error('Novo nome inválido.');
    const parent=str(b.parent);if(parent)channel(g,parent,4);
    if(parent===ch)throw Error('Uma categoria não pode ser pai de si mesma.');
    return {channel:ch,name:str(b.name).slice(0,80),parent};
  }
  if(action==='v2-delete-channel'){
    if(str(b.confirm)!=='EXCLUIR')throw Error('Digite EXCLUIR para confirmar.');
    return {channel:channel(g,b.channel)};
  }
  if(action==='v2-create-role'){
    if(!name(b.name)||!hex(b.color))throw Error('Nome ou cor do cargo inválidos.');
    return {name:str(b.name).slice(0,80),color:str(b.color)};
  }
  if(action==='v2-edit-role'){
    if(!name(b.name)||!hex(b.color))throw Error('Nome ou cor do cargo inválidos.');
    return {role:role(g,b.role),name:str(b.name).slice(0,80),color:str(b.color)};
  }
  if(action==='v2-delete-role'){
    if(str(b.confirm)!=='EXCLUIR')throw Error('Digite EXCLUIR para confirmar.');
    return {role:role(g,b.role)};
  }
  if(action==='v2-overwrite'){
    const c=channel(g,b.channel), r=role(g,b.role);
    const visibility=str(b.visibility),send=str(b.send);
    if(!['allow','deny','inherit'].includes(visibility)||!['allow','deny','inherit'].includes(send))throw Error('Escolha permissões válidas.');
    return {channel:c,role:r,visibility,send};
  }
  if(action==='v2-embed'){
    const c=channel(g,b.channel,0),title=str(b.title),description=str(b.description),footer=str(b.footer),color=str(b.color)||'#9d6fff';
    if(!title||title.length>256||!description||description.length>3900||footer.length>2000||!hex(color))throw Error('Embed inválido.');
    return {channel:c,title,description,footer,color};
  }
  if(action==='v2-template'){
    if(!['comunidade','games','estudos'].includes(b.template)||str(b.confirm)!=='APLICAR')throw Error('Escolha um template e digite APLICAR.');
    return {template:b.template};
  }
  if(action==='v2-nickname'){
    const nickname=str(b.nickname);if(nickname.length>32)throw Error('Apelido precisa ter no máximo 32 caracteres.');
    return {nickname};
  }
  if(action==='v2-reset-avatar')return {};
  // v2-avatar recebe um arquivo validado por middleware multipart, não pelo formulário textual.
  throw Error('Imagem inválida ou não enviada.');
}
