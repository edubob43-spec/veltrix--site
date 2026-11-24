# Veltrix V2.3 — Painel simplificado

Esta atualização afeta SOMENTE O SITE NO RENDER e preserva o bot KataBump.

## Removido do painel
- Inteligência Artificial (aba e formulário de configuração)
- Ferramentas básicas (criar canal, criar cargo, enviar embed)
- Estrutura e Cargos (criação, edição e exclusão)
- Editor de Embeds
- Templates de servidor

As rotas de criação e edição dessas áreas também foram desativadas. O bot Discord e seus comandos existentes **não** são modificados.

## Mantido
- Visão geral (sem ícones `undefined`)
- Aparência (prefixo e cor), Boas-vindas, Logs, Tickets, Níveis & XP básico
- Parcerias, Permissões, Identidade da Veltrix por servidor
- Login Discord, seleção de servidores, integração Render/KataBump
- Mascote recortada e partículas da V2.2

## Atualizar o Render
1. Faça backup do seu repositório `veltrix-site`.
2. Substitua **src/ui.js**, **src/server.js** e **src/v2-contract.js** pelos 3 arquivos do ZIP de patch (mesma hierarquia).
3. Envie os commits para a branch publicada no Render e confira que o deploy está Live.
4. Atualize o navegador com Ctrl+Shift+R e confira o menu e a visão geral.
5. Se executa testes via npm test, substitua também os arquivos em tests/ (opcional para runtime).

Não altere `.env`, `BRIDGE_SECRET`, OAuth nem arquivos KataBump. Configurações existentes de módulos escondidos no bot não são apagadas nem desativadas automaticamente.
