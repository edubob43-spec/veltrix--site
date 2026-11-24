# Veltrix V2.4 — Mascote animada + céu mágico fluido

## Atualizar o Render sem mexer no KataBump

1. Faça backup dos arquivos atuais do seu repositório `veltrix-site`.
2. Extraia `Veltrix_V2_4_PATCH_VISUAL_Render.zip` e envie os arquivos nos **mesmos caminhos**, substituindo `src/server.js` e `src/ui.js`.
3. Envie também os **dois arquivos novos** da pasta `src/assets/`: `veltrix-mascote-animada-v24.gif` e `veltrix-stardust-v24.js`. Não é preciso remover os antigos.
4. Confirme o commit e aguarde o deploy ficar **Live** no Render. Abra `https://veltrix-painel.onrender.com/?v=24` e recarregue.

Não altere as variáveis do Render, OAuth2 ou arquivos do KataBump.

## Como funciona

- Mascote: GIF animado original aprovado, com transparência, e um movimento CSS suave. O navegador carrega o GIF diretamente do Render.
- Brilhos: canvas em tempo real, cores lilás, magenta, rosa, turquesa e dourado; estrela de 4 pontas; todas têm velocidade própria e piscam em momentos diferentes. Ao ultrapassar a tela, **cada estrela reaparece individualmente**, sem um salto de loop da tela toda.
- Scroll: ao rolar para baixo, as estrelas ganham impulso para cima; a mascote acompanha levemente.
- Acessibilidade: botão **Efeitos: ligados/pausados** na página inicial; respeita `prefers-reduced-motion` (troca a mascote animada pela versão parada já presente no pacote V2.3).
- Tela com login, API e bridge para bot: inalterados.

Se aparecer a versão anterior, confirme no GitHub que os dois novos arquivos `src/assets/veltrix-...v24` estão presentes e se o último deploy do Render está Live.
