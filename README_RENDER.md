# Veltrix Site V2 — Render (beta)

Este projeto atualiza o painel V1.3 já instalado no `https://veltrix-painel.onrender.com`. Mantém **o login Discord, a identidade visual roxa, o armazenamento de configurações no KataBump e o sistema de sincronização HTTPS**.

## Novidades da V2

- **Estrutura:** criar categorias e canais de texto/voz; canais privados para cargo; renomear, mover e excluir com confirmação.
- **Cargos:** criar, renomear, trocar cor e excluir (sujeito à hierarquia do Discord).
- **Permissões:** controlar Ver Canal e Enviar Mensagens em um canal para um cargo, sem modificar permissões não selecionadas.
- **Embeds:** título, descrição, rodapé e cor com menções bloqueadas.
- **Templates:** comunidade, games e estudos. Criam 2 categorias + 5 canais; não excluem canais existentes. Confirmar com `APLICAR`.
- **Identidade:** apelido e avatar da Veltrix *apenas no servidor selecionado*. Upload JPG/PNG/WebP de até 512 KB. O avatar global não é alterado.
- Todas as abas anteriores (tickets, parcerias, IA, boas-vindas, configurações básicas) são preservadas.

## Atualizar sua instalação atual, na ordem segura

1. **No KataBump**, faça backup de `src/bridge.js`, `src/index.js` e `data/`. Do ZIP separado `Veltrix_V2_KATABUMP_PATCH.zip`, envie SOMENTE `src/bridge.js` (substitua o anterior) e reinicie a Veltrix. Não restaure o servidor HTTP antigo.
2. Confirme no console `[Render bridge] Sincronização HTTPS...` e teste a mudança de prefixo no site atual.
3. **No GitHub**, abra o repositório `veltrix-site`. Atualize os arquivos do ZIP do Render, mantendo a mesma estrutura de pastas (pasta `src/` na raiz, não crie `render/` dentro do repositório). Pode fazer upload por `Add file → Upload files` ou `git add && git commit && git push`.
4. O Render deve implantar automaticamente após o commit. Se não implantar, use Render → veltrix-painel → Manual Deploy → Deploy latest commit.
5. Acesse `https://veltrix-painel.onrender.com`, entre com Discord e abra seu servidor. Teste primeiro **criar um canal de teste**, e depois as funções mais delicadas.

Não é necessário recriar o serviço no Render, trocar o `.env`, os Redirects do Discord ou o domínio. **Nunca envie `.env` preenchido ao GitHub**, nem mostre `BRIDGE_SECRET` nos prints.

## Permissões exigidas

- O usuário deve administrar o servidor e possuir a permissão correspondente à ação, conforme a seção.
- A Veltrix precisa de Gerenciar Canais, Gerenciar Cargos e permissão para enviar embeds, conforme a ação.
- Cargos gerenciados por integrações ou acima da hierarquia da Veltrix não podem ser editados.
- Mudanças por servidor são restritas pelo ID do servidor (guild ID) e verificadas novamente pelo bot.

## Limitações importantes da beta

- O Render Free usa filesystem efêmero; sessões e **fila de alterações pendentes podem ser perdidas** quando o serviço reinicia. O banco definitivo do bot continua no KataBump. Não use a V2 como ferramenta para reorganizações críticas sem backup.
- Templates executam várias operações e podem ficar **parcialmente criados** caso uma delas falhe (por limite de canais, conexão, etc.). Não existe desfazer automático.
- O bot aplica ações na próxima sincronização (~30s configuráveis). O aviso ao clicar em salvar indica *enfileiramento*, não sucesso no Discord. Confira a mensagem de resultado e o canal.
- A versão gratuita do Render pode dormir ou consumir horas de uso devido à conexão periódica do bot. Acompanhe no dashboard.
- A identidade por servidor depende do suporte da API do Discord e pode ter limites de frequência. Falhas são informadas após a sincronização.
- Avatar do servidor é armazenado apenas temporariamente na fila Render até a entrega ao bot; não há serviço de armazenamento de fotos.

## URLs e comandos de teste

- Site: `https://veltrix-painel.onrender.com`
- Saúde: `https://veltrix-painel.onrender.com/healthz`
- Status: `https://veltrix-painel.onrender.com/api/status`
- Comandos locais: `npm install`, `npm run check`, `npm test`

## Ambiente (já existente; não precisa mexer se V1.3 funciona)

Render: `PUBLIC_URL`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `SESSION_SECRET`, `BRIDGE_SECRET`.
KataBump: `DISCORD_TOKEN`, `RENDER_PANEL_URL`, `BRIDGE_SECRET`, `BRIDGE_POLL_SECONDS`.

O projeto ainda é beta e precisa ser testado conectado ao Discord em uma guild de teste.
