PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pizza_categories (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pizzas (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES pizza_categories(id),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price_medium_cents INTEGER NOT NULL CHECK (price_medium_cents > 0),
  price_large_cents INTEGER NOT NULL CHECK (price_large_cents > 0),
  image_path TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  complement TEXT,
  city TEXT NOT NULL DEFAULT 'Lavras',
  state TEXT NOT NULL DEFAULT 'MG',
  postal_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY,
  order_code TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  address_id INTEGER REFERENCES addresses(id),
  fulfillment_type TEXT NOT NULL DEFAULT 'delivery' CHECK (fulfillment_type IN ('delivery', 'pickup')),
  checkout_route TEXT NOT NULL CHECK (checkout_route IN ('online', 'whatsapp')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (delivery_fee_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  size TEXT NOT NULL CHECK (size IN ('medium', 'large')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_item_flavors (
  id INTEGER PRIMARY KEY,
  order_item_id INTEGER NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  pizza_id INTEGER NOT NULL REFERENCES pizzas(id),
  portion TEXT NOT NULL CHECK (portion IN ('whole', 'half_left', 'half_right')),
  UNIQUE (order_item_id, portion)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('pix', 'credit_card', 'debit_card', 'cash')),
  provider TEXT,
  provider_payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'authorized', 'paid', 'failed', 'refunded', 'cancelled')),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pizzas_category ON pizzas(category_id, active);
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_item_flavors_item ON order_item_flavors(order_item_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

CREATE TRIGGER IF NOT EXISTS pizzas_updated_at
AFTER UPDATE ON pizzas
FOR EACH ROW
BEGIN
  UPDATE pizzas SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS customers_updated_at
AFTER UPDATE ON customers
FOR EACH ROW
BEGIN
  UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS addresses_updated_at
AFTER UPDATE ON addresses
FOR EACH ROW
BEGIN
  UPDATE addresses SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS orders_updated_at
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS payments_updated_at
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  UPDATE payments SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

INSERT OR IGNORE INTO pizza_categories (id, slug, name, display_order) VALUES
  (1, 'tradicionais', 'Tradicionais', 1),
  (2, 'especiais', 'Especiais', 2),
  (3, 'doces', 'Doces', 3);

INSERT OR IGNORE INTO pizzas (id, category_id, slug, name, description, price_medium_cents, price_large_cents, image_path) VALUES
  (1, 1, 'mussarela-classica', 'Mussarela Clássica', 'Molho da casa, mussarela derretida, tomate fresco e orégano.', 3800, 4900, 'assets/pizza-calabresa-real.png'),
  (2, 1, 'calabresa-da-vila', 'Calabresa da Vila', 'Calabresa fatiada, cebola roxa, mussarela e orégano.', 4100, 5300, 'assets/pizza-calabresa-real.png'),
  (3, 1, 'marguerita', 'Marguerita', 'Mussarela, tomate, manjericão fresco e um toque de azeite.', 4200, 5400, 'assets/pizza-calabresa-real.png'),
  (4, 1, 'portuguesa', 'Portuguesa', 'Presunto, ovos, cebola, pimentão, ervilha, mussarela e azeitonas.', 4500, 5700, 'assets/pizza-calabresa-real.png'),
  (5, 1, 'frango-com-catupiry', 'Frango com Catupiry', 'Frango bem temperado, Catupiry cremoso, mussarela e orégano.', 4600, 5800, 'assets/pizza-especial-real.png'),
  (6, 2, 'lavras-especial', 'Lavras Especial', 'Frango cremoso, bacon crocante, milho, mussarela e molho da casa.', 4800, 6100, 'assets/pizza-especial-real.png'),
  (7, 2, 'lombo-mineiro', 'Lombo Mineiro', 'Lombo defumado, requeijão, cebola caramelizada e mussarela.', 4900, 6200, 'assets/pizza-especial-real.png'),
  (8, 2, 'quatro-queijos', 'Quatro Queijos', 'Mussarela, provolone, parmesão, gorgonzola e orégano.', 5100, 6500, 'assets/pizza-especial-real.png'),
  (9, 2, 'rucula-e-tomate-seco', 'Rúcula e Tomate Seco', 'Mussarela, tomate seco, rúcula fresca e pesto suave.', 5000, 6400, 'assets/pizza-especial-real.png'),
  (10, 3, 'romeu-e-julieta', 'Romeu e Julieta', 'Mussarela dourada, goiabada cremosa e pitada de canela.', 4300, 5500, 'assets/pizza-doce-real.png'),
  (11, 3, 'chocolate-crocante', 'Chocolate Crocante', 'Chocolate ao leite, granulado crocante e borda levemente dourada.', 4500, 5700, 'assets/pizza-doce-real.png'),
  (12, 3, 'banana-caramelada', 'Banana Caramelada', 'Banana, canela, leite condensado e farofa crocante da casa.', 4400, 5600, 'assets/pizza-doce-real.png');

CREATE VIEW IF NOT EXISTS order_totals AS
SELECT
  o.id,
  o.order_code,
  o.status,
  o.total_cents,
  c.name AS customer_name,
  c.phone AS customer_phone,
  p.status AS payment_status,
  p.payment_method
FROM orders o
JOIN customers c ON c.id = o.customer_id
LEFT JOIN payments p ON p.order_id = o.id;
