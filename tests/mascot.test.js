import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { page } from '../src/ui.js';
const assets=new URL('../src/assets/',import.meta.url);
test('mantém mascote, efeitos e CSS inline',()=>{
  const html=page('Início','Oi');assert.match(html,/sparkfield/);assert.match(html,/vel-fall/);assert.match(html,/veltrix-effects-v22.js/);
  assert.ok(existsSync(new URL('veltrix-mascot-recortada-v22.webp',assets)));
  assert.ok(existsSync(new URL('veltrix-effects-v22.js',assets)));
});
