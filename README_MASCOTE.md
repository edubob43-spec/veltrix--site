# Veltrix Site V2 — Atualização visual + Mascote oficial

Atualiza **somente o site hospedado no Render**, sem alteração no bot KataBump.

## O que mudou
- A personagem original Veltrix, em estilo anime, entrou na abertura do site.
- Removido o selo de desenvolvimento “NODE V2 · RENDER” no cabeçalho.
- Cores da interface: roxo escuro, laranja, turquesa e dourado, inspiradas na mascote.
- Partículas luminosas com queda suave e parallax reverso ao descer a página.
- Seção de recursos e CTA adicional; layout responsivo para celular.
- Acessibilidade: animação é reduzida conforme a preferência de movimento do navegador.

## Instalação
1. Faça um backup do repositório GitHub `veltrix-site`.
2. Extraia o ZIP e envie **o conteúdo** à raiz do repositório. Substitua `src/ui.js` e `src/server.js`, e adicione a pasta `src/assets/` com `veltrix-mascot.webp` e `veltrix-effects.js`. Preserve os outros arquivos.
3. O Render deve publicar automaticamente após commit. Se não publicar, use Manual Deploy → Deploy latest commit.
4. Atualize a página usando Ctrl + Shift + R; teste a home e o painel autenticado.

**Não mexer** no `.env`, chaves do Render, OAuth, bot KataBump, `src/bridge.js` ou banco de dados. `src/assets` é novo e precisa ser mantido com a mesma hierarquia do ZIP.

## Verificações úteis
- Página: https://veltrix-painel.onrender.com/
- Mascote: https://veltrix-painel.onrender.com/assets/veltrix-mascot.webp
- Efeitos: https://veltrix-painel.onrender.com/assets/veltrix-effects.js

Comandos locais: `npm install`, `npm run check`, `npm test`. Testes de integração reais com Discord/Render precisam ser feitos na hospedagem.
