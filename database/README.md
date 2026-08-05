# Banco de dados — Pizza Lavras

Este diretório contém o banco SQLite `pizza-lavras.db` e o script de criação `schema.sql`.

## Estrutura

- `pizza_categories` e `pizzas`: cardápio e preços.
- `customers` e `addresses`: dados de entrega.
- `orders`, `order_items` e `order_item_flavors`: pedidos, inclusive pizzas de um ou dois sabores.
- `payments`: status e referência do provedor, sem armazenar número de cartão, CVV ou dados bancários sensíveis.

## Abrir localmente

```powershell
sqlite3 pizza-lavras.db
```

Exemplo de consulta:

```sql
SELECT name, price_medium_cents / 100.0 AS preco_medio
FROM pizzas
WHERE active = 1
ORDER BY category_id, name;
```

## Integração com o site

O site atual é estático; um navegador não deve acessar o SQLite diretamente. Para gravar pedidos reais, conecte este banco a uma API/backend que valide o pedido, gere o código de pedido e se comunique com um gateway de pagamento. Nunca grave números de cartão ou CVV neste banco.
