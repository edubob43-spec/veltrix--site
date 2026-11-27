# Vitrine da comunidade Veltrix — persistência real

## O que muda

- A página inicial usa a largura inteira da tela (sem a moldura retangular).
- A faixa horizontal é animada e **só aparece para quem fez login com Discord quando já há participantes**.
- Sem nenhuma foto autorizada, **não aparece seção, símbolos fictícios ou texto de vitrine**.
- Clicar em Login **não** publica automaticamente a foto. Cada pessoa pode decidir em **Minha conta → Minha vitrine**.
- A pessoa autoriza publicar nome e foto do Discord, e pode retirar a autorização a qualquer momento. O usuário é identificado exclusivamente pela sessão OAuth2 do site.
- Os dados são gravados no PostgreSQL, não em arquivos temporários do Render e **não no GitHub**. O histórico Git manteria dados pessoais mesmo após a exclusão e por isso não deve ser usado como banco de usuários.

## Conectar o banco (necessário uma vez)

1. Crie ou utilize um banco PostgreSQL persistente, por exemplo no [Neon](https://console.neon.tech/) ou em outra instância PostgreSQL.
2. Copie a **connection string** PostgreSQL, que normalmente começa com `postgresql://` e termina com parâmetros TLS como `?sslmode=require`.
3. No **Render → veltrix-painel → Environment**, cadastre **somente lá**:

   `VELTRIX_SHOWCASE_DATABASE_URL` = `postgresql://usuario:senha@servidor/banco?sslmode=require`

   O exemplo acima é ilustrativo. Use sua connection string real. **Nunca cole essa senha em um chat, print ou arquivo do repositório.**
4. Salve e aguarde o deploy no Render. O site cria automaticamente a tabela `veltrix_showcase_members` dentro do banco, desde que o usuário tenha permissão `CREATE TABLE`.
5. Faça login com Discord no site; abra **Minha conta → Minha vitrine**.
6. Marque a autorização e clique **Participar da vitrine**. Recarregue a home: a galeria deverá aparecer e deslizar para o lado.
7. Teste **Remover minha foto** e confirme que ela desapareceu. O registro correspondente é excluído do PostgreSQL.

## Se o banco ainda não estiver configurado

A home **não** mostra fotos inventadas nem dados de um arquivo temporário. Em **Minha vitrine**, a tela explica que falta conectar o banco. A economia, o Daily, a KataBump e o painel de servidores continuam independentes.

## Segurança

- Cadastro exige sessão Discord + CSRF + checkbox explícito.
- Nome e avatar são sanitizados antes da inserção/exibição.
- Ações do banco usam parâmetros SQL (`$1`, `$2`, ...).
- A remoção exclui o registro da tabela (e não cria commits Git).
- O banco não deve ficar com as credenciais públicas nem na URL do navegador.

## Render

Serviços web gratuitos do Render usam sistema de arquivos efêmero: dados de arquivos locais podem ser perdidos em novas publicações e reinicializações. PostgreSQL externo resolve esse problema. A variável `VELTRIX_SHOWCASE_DATABASE_URL` é privada e **opcional**, mas obrigatória para ativar a vitrine.
