import test from 'node:test';
import assert from 'node:assert/strict';
import { guildIconUrl, renderGuildAvatar, GUILD_ICONS_CSS } from '../src/guild-icons.js';

const guild = { id:'123456789012345678', name:'Servidor de Edu', icon:'1a2b3c4d5e6f708192a3b4c5d6e7f809' };
test('mostra avatar do Discord com URL segura e dimensão fixa', () => {
  const html = renderGuildAvatar(guild);
  assert.match(html, /cdn\.discordapp\.com\/icons\/123456789012345678\/1a2b3c4d5e6f708192a3b4c5d6e7f809\.webp\?size=128/);
  assert.match(html, /class="serveravatar-image"/);
  assert.match(html, /width="48" height="48"/);
  assert.ok(GUILD_ICONS_CSS.includes('.serveravatar.icon-loaded'));
});
test('GIF para ícones animados do Discord', () => {
  assert.match(guildIconUrl({...guild, icon:'a_1a2b3c4d5e6f708192a3b4c5d6e7f809'}), /\.gif\?size=128$/);
});
test('usa inicial quando não existe avatar', () => {
  const html = renderGuildAvatar({...guild,name:'Galeria Animal',icon:null});
  assert.match(html, /class="serveravatar-letter">G<\/span>/);
  assert.doesNotMatch(html, /serveravatar-image/);
});
test('não injeta HTML nem URLs manipuladas', () => {
  assert.equal(guildIconUrl({...guild,icon:'bad" onerror="alert(1)'}),'');
  const html=renderGuildAvatar({...guild,name:'<img src=x onerror=alert(1)>',icon:null});
  assert.ok(html.includes('&lt;'));
  assert.ok(!html.includes('<img'));
});
