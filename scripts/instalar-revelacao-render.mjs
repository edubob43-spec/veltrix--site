// Veltrix V2.7.2: acrescenta SOMENTE dois campos à validação do daily no Render.
// Execute na raiz do projeto do SITE. Não sobrescreve server.js inteiro.
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const file=resolve(process.cwd(),'src/server.js');
const before="const fields=['wallet','bank','streak','nextBonusIn','resetAt','asOf','lastClaimAt'];";
const after="const fields=['wallet','bank','streak','nextBonusIn','resetAt','asOf','lastClaimAt','todayReward','todayBonus'];";
if(!existsSync(file)){console.error('Erro: execute na raiz do projeto Render (src/server.js não encontrado).');process.exit(1);}
const contents=readFileSync(file,'utf8');
if(contents.includes(after)){console.log('[Veltrix Daily V2.7.2] Já atualizado. Nada a fazer.');process.exit(0);}
if(contents.split(before).length!==2){console.error('Estrutura não reconhecida. Nada alterado. Edite a linha manualmente seguindo LEIA_PRIMEIRO.md.');process.exit(1);}
const backup=`${file}.backup-daily-surpresa-${Date.now()}`;
copyFileSync(file,backup);
try{
 writeFileSync(file,contents.replace(before,after));
 execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
 console.log(`[Veltrix Daily V2.7.2] Sucesso. Backup: ${backup}`);
}catch(error){writeFileSync(file,contents);console.error('Falha: original restaurado.',error.message);process.exit(1);}
