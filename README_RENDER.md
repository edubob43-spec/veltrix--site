# Veltrix — Painel web separado no Render (v1.3 beta)

Este ZIP é **somente o painel web**. A Veltrix bot continua funcionando no KataBump.
O painel NÃO recebe o `DISCORD_TOKEN` nem conecta diretamente ao gateway do Discord.
O bot cria uma conexão **HTTPS de saída** para buscar alterações do painel.

## Passo 1 — Criar o serviço no Render

1. Extraia este ZIP no computador.
2. Crie um repositório **privado** no GitHub e envie o conteúdo extraído (package.json e src/ na raiz).
3. No https://dashboard.render.com clique **New > Web Service**, conecte o repositório.
4. Runtime: Node. Build command: `npm install`. Start command: `npm start`.
5. Selecione Free (para testes). A aplicação deve ouvir em `0.0.0.0` e na porta `process.env.PORT` (já configurado).
6. Ao publicar, o Render atribuirá um endereço HTTPS, por exemplo `https://veltrix-painel-xyz.onrender.com`.

Atenção: `veltrix-painel-xyz.onrender.com` **é apenas exemplo**. Use o endereço real que aparecer na sua conta.

## Passo 2 — Definir as variáveis Environment no Render

- `PUBLIC_URL` = `https://SEU-ENDERECO-REAL.onrender.com` (sem barra final)
- `DISCORD_CLIENT_ID` = Client ID da aplicação Veltrix no Developer Portal
- `DISCORD_CLIENT_SECRET` = Client Secret do Developer Portal
- `SESSION_SECRET` = sequência aleatória secreta, com 32+ caracteres
- `BRIDGE_SECRET` = OUTRA sequência aleatória, 32+ caracteres, usada também pelo bot no KataBump

**Não configure DISCORD_TOKEN no Render.** Não envie .env preenchido ao GitHub.

Gerar um segredo no seu computador (com Node instalado):

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

Execute duas vezes (uma para SESSION_SECRET e outra para BRIDGE_SECRET).

Salve e faça Redeploy/Restart do serviço no Render.

## Passo 3 — Configurar OAuth2 no Discord

No Developer Portal > Veltrix > OAuth2 > Redirects, cadastre:

    https://SEU-ENDERECO-REAL.onrender.com/auth/callback

O código calcula automaticamente esse callback a partir de PUBLIC_URL.
**Não mantenha um callback localhost ou para domínio HTTP como URL principal do Render.**

## Passo 4 — Atualizar o bot no KataBump

Use o ZIP separado **Veltrix_KATABUMP_BRIDGE_PATCH.zip**. Ele contém `src/index.js` e `src/bridge.js`.
Faça backup antes de substituir. Mantenha `src/bot/`, `src/web.js`, `src/store.js` e `data/` intactos.

No `.env` que JÁ EXISTE no KataBump, adicione:

    RENDER_PANEL_URL=https://SEU-ENDERECO-REAL.onrender.com
    BRIDGE_SECRET=EXATAMENTE_A_MESMA_CHAVE_DO_RENDER
    BRIDGE_POLL_SECONDS=30

Mantenha `DISCORD_TOKEN`, `PORT=20049`, IA etc.
Reinicie a Veltrix. O console deve registrar `[Render bridge] Sincronização HTTPS...`.

## Passo 5 — Testar

- `https://SEU-ENDERECO-REAL.onrender.com/healthz` deve mostrar `ok: true`.
- `https://SEU-ENDERECO-REAL.onrender.com/api/status` deve mudar para `online: true` depois do primeiro contato do bot.
- Na página inicial, clique **Entrar com Discord**. Autorize o acesso ao perfil e à lista de servidores.
- Escolha um servidor em que sua conta possua Gerenciar Servidor. Altere, por exemplo, uma cor de embed.
- Aguarde uma ou duas sincronizações (normalmente até 30–60 segundos) para os dados no bot refletirem a mudança.

## Segurança e limites (leia)

- Esta é uma **beta inicial**, não uma migração 1:1 de todo sistema Python.
- O painel valida login OAuth, CSRF, permissões e servidor escolhido. O bot **revalida** a permissão antes de executar cada ação.
- O token de bot permanece **somente no KataBump**. O canal entre bot e Render usa HTTPS com chave compartilhada.
- O banco `data/veltrix.json` permanece no KataBump como fonte definitiva.
- No Free, o filesystem do Render é **efêmero**. Sessões e solicitações pendentes podem sumir ao reiniciar/reimplantar. A fila de jobs é em memória; é adequada para protótipo, não ações críticas em produção.
- O bot contacta o Render periodicamente, o que pode impedir hibernação e **consumir horas do plano gratuito**. Monitore os limites do Render.
- O painel exibe uma confirmação de **enfileiramento**; não assume que a ação já foi concluída. Erros de execução aparecem na próxima sincronização.
- O avatar/bio da Veltrix por servidor e o gerenciamento avançado planejado estão reservados à V2.
- Nunca compartilhe prints que contenham `DISCORD_CLIENT_SECRET`, `DISCORD_TOKEN`, `BRIDGE_SECRET`, `SESSION_SECRET` ou URL OAuth com parâmetro `code=`.
