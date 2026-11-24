import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {page} from '../src/ui.js';
const server=readFileSync(new URL('../src/server.js',import.meta.url),'utf8');
const effects=readFileSync(new URL('../src/assets/veltrix-stardust-v24.js',import.meta.url),'utf8');
test('canvas animado continuo e gif com transparencia, sem fundo quadrado',()=>{
 const landing=page('Início','');
 assert.match(landing,/vel-star-canvas/);
 assert.match(landing,/veltrix-stardust-v24\.js/);
 assert.doesNotMatch(landing,/veltrix-effects-v22\.js/);
 assert.match(server,/veltrix-mascote-animada-v24\.gif/);
 assert.match(effects,/requestAnimationFrame/);
 assert.match(effects,/createStar\(false\)/);
 const gif=readFileSync(new URL('../src/assets/veltrix-mascote-animada-v24.gif',import.meta.url));
 assert.equal(gif.subarray(0,6).toString('ascii'),'GIF89a');
 assert.ok(statSync(new URL('../src/assets/veltrix-mascote-animada-v24.gif',import.meta.url)).size>1000);
});
