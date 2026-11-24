import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { page } from '../src/ui.js';
const root=new URL('../src/assets/',import.meta.url);
test('identidade visual sem selo de desenvolvimento',()=>assert.doesNotMatch(page('Início','Oi'),/NODE V2 · RENDER/));
test('CSS e partículas embutidos na página',()=>{const html=page('Início','Oi');assert.match(html,/sparkfield/);assert.match(html,/vel-fall/);assert.match(html,/veltrix-effects.js/);});
test('mascote otimizada e animador presentes',()=>{assert.ok(existsSync(new URL('veltrix-mascot.webp',root)));assert.ok(existsSync(new URL('veltrix-effects.js',root)));assert.match(readFileSync(new URL('veltrix-effects.js',root),'utf8'),/prefers-reduced-motion/);});
