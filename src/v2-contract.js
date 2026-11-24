// Veltrix V2.3: as ações de criação de canais/cargos, embeds e templates foram removidas do painel.
// O bot Discord permanece intacto. O Render permite somente permissões e identidade local.
export const V2_SECTIONS = Object.freeze(['permissoes','identidade']);
export const V2_ACTION_SECTION = Object.freeze({
  'v2-overwrite':'permissoes',
  'v2-nickname':'identidade',
  'v2-avatar':'identidade',
  'v2-reset-avatar':'identidade'
});
export const V2_PERMISSIONS = Object.freeze({
  'v2-overwrite':0x10000000n,
  'v2-nickname':0x20n,
  'v2-avatar':0x20n,
  'v2-reset-avatar':0x20n
});
const id=x=>/^\d{17,20}$/.test(String(x??''));
const str=x=>String(x??'').trim();
const channel=(guild,x)=>{
  const channelId=str(x), c=guild.channels.cache.get(channelId);
  if(!id(channelId)||!c)throw Error('Canal inexistente.');
  return c.id;
};
const role=(guild,x)=>{
  const roleId=str(x), r=guild.roles.cache.get(roleId);
  if(!id(roleId)||!r||r.id===guild.id||r.managed)throw Error('Cargo inexistente ou gerenciado pelo Discord.');
  return r.id;
};
export function validateV2Action(action,body,guild){
  if(!V2_ACTION_SECTION[action])throw Error('Essa ação foi removida do painel.');
  if(action==='v2-overwrite'){
    const channelId=channel(guild,body.channel),roleId=role(guild,body.role);
    const visibility=str(body.visibility),send=str(body.send);
    if(!['allow','deny','inherit'].includes(visibility)||!['allow','deny','inherit'].includes(send))throw Error('Escolha permissões válidas.');
    return {channel:channelId,role:roleId,visibility,send};
  }
  if(action==='v2-nickname'){
    const nickname=str(body.nickname);
    if(nickname.length>32)throw Error('Apelido precisa ter no máximo 32 caracteres.');
    return {nickname};
  }
  if(action==='v2-reset-avatar')return {};
  // Upload de avatar exige validação multipart no servidor.
  throw Error('Imagem inválida ou não enviada.');
}
