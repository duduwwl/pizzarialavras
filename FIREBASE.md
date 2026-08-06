# Firebase da Pizza Lavras

O cardápio usa Firebase Authentication e Cloud Firestore para identificar quem
fez o pedido e centralizar os pedidos no painel `admin.html`.

## O que o site salva

Cada pedido é criado na coleção `orders` com:

- conta do cliente (`customerUid` e e-mail);
- nome e telefone;
- endereço de entrega;
- pizzas, sabores, tamanho e valores em centavos;
- forma de finalização, status e datas.

O cliente não consegue ler pedidos de outras pessoas, nem alterar valor, itens
ou dados depois de salvar. Somente o administrador pode listar pedidos e mudar
o status.

## Configuração no Console do Firebase

1. Em **Authentication → Método de login**, mantenha ativos **E-mail/senha** e
   **Google**.
2. Em **Authentication → Settings → Authorized domains**, adicione
   `duduwwl.github.io` para o login funcionar no GitHub Pages.
3. Em **Firestore Database → Regras**, substitua o conteúdo pelas regras do
   arquivo [`firestore.rules`](./firestore.rules) e clique em **Publicar**.
4. A conta administradora é `dudumesquita2004@gmail.com`. Ela precisa entrar
   pelo Google ou confirmar o e-mail para receber o acesso ao painel.
5. Abra `https://duduwwl.github.io/pizzarialavras/admin.html`, entre com essa
   conta e acompanhe os pedidos.

## Segurança e pagamento

O campo de pagamento do site ainda é demonstrativo: ele registra a intenção do
cliente, mas não gera PIX nem cobra cartão. Para cobrança real, integre um
gateway por uma Cloud Function/backend e nunca coloque chaves privadas, dados
de cartão, CVV ou segredo de webhook no HTML/JavaScript público.
