# Vitrine da comunidade Veltrix — V3.2

## Funcionamento

- A galeria aparece na home para **qualquer visitante**, mesmo sem login, desde que existam pessoas cadastradas.
- Cada pessoa aparece **uma vez** por rodada. Se houver só uma pessoa, a foto fica centralizada e parada. Com duas ou mais pessoas, o carrossel mostra **uma por vez**, deslizando horizontalmente.
- Se ninguém estiver cadastrado, a seção toda desaparece.
- **Novos logins** do Discord após esta versão podem adicionar automaticamente nome e avatar à galeria. O aviso desse comportamento está visível na home antes de entrar.
- O usuário pode escolher **Minha conta → Minha vitrine → Ocultar minha foto**. Isso remove seu nome e avatar da galeria e impede que os próximos logins recadastrem a foto.
- Quem ocultou pode voltar a aparecer quando quiser, pelo botão **Voltar a mostrar minha foto**.
- Contas previamente cadastradas sob a regra de galeria privada **não se tornam públicas retroativamente**; para entrar na galeria pública, precisam entrar de novo no Discord depois da atualização ou habilitar a exibição na própria página.
- Quem usa a Veltrix somente pelo bot do Discord não é adicionado automaticamente. O cadastro é feito no fluxo de login do **site**.

## Persistência

O armazenamento da galeria é um banco PostgreSQL, como o Neon. Não salvar nomes, fotos nem IDs no GitHub: os commits guardariam histórico dos dados mesmo após a pessoa removê-los da galeria.

1. No Neon, abra o projeto Veltrix e copie a conexão PostgreSQL com SSL (somente em local seguro).
2. Em **Render → veltrix-painel → Environment**, defina:

   `VELTRIX_SHOWCASE_DATABASE_URL` = a URL PostgreSQL do Neon.

3. Não divulgue essa URL ou senha no GitHub, chat, screenshots ou logs.
4. O site prepara automaticamente as tabelas:

   - `veltrix_showcase_members` (nome/avatar de participantes visíveis).
   - `veltrix_showcase_hidden` (apenas chave HMAC de contas que pediram para ocultar; não contém avatar nem ID em texto puro).

5. O HMAC usa o `SESSION_SECRET` já configurado no Render. **Não troque o segredo sem plano de migração**, pois mudar o segredo invalidaria os registros de exclusão automática.
6. O site também adiciona a coluna `public_visible`. Contas antigas recebem `FALSE` por padrão para não publicar fotos compartilhadas apenas com usuários logados.

## Cuidados

- Login OAuth2 é necessário para entrar na galeria, e não apenas ser membro do bot.
- Postagens de gerenciamento da foto exigem a sessão Discord e token CSRF.
- Nome e avatar são sanitizados; SQL usa parâmetros.
- O usuário pode se remover a qualquer momento. O registro da galeria é apagado no banco; mantém-se somente uma chave HMAC para não cadastrar novamente sem pedido.
- A faixa não cria imagens, pessoas nem estatísticas fictícias.

## Verificação

Depois do deploy, teste com uma conta que entra no site pela primeira vez. Confira a galeria em uma aba anônima, depois esconda a foto e entre novamente: ela deve permanecer oculta. Com uma única conta, só deve existir **um** avatar visível; com duas ou mais, cada avatar deve aparecer separadamente.
