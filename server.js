require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'd1shop',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getUserId(req) {
  const userId = parseInt(req.body?.userId || req.query?.userId, 10);
  return userId > 0 ? userId : null;
}

// --- API: Registro ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Faltan email, contraseña o nombre completo' });
    }
    const emailTrim = String(email).trim().toLowerCase();
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, 'usuario')
       RETURNING user_id, email, full_name`,
      [emailTrim, passwordHash, String(fullName).trim()]
    );
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Este correo ya está registrado' });
    console.error(err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// --- API: Inicio de sesión ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    const emailTrim = String(email).trim().toLowerCase();
    const { rows } = await pool.query(
      'SELECT user_id, email, full_name, password_hash FROM users WHERE email = $1',
      [emailTrim]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    const { password_hash, ...user } = rows[0];
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// --- API: Categorías ---
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT category_id, name, description, image_url, display_order FROM categories WHERE is_active = TRUE ORDER BY display_order, name'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// --- API: Productos ---
app.get('/api/products', async (req, res) => {
  try {
    const { category, featured, search } = req.query;
    let query = `
      SELECT p.product_id, p.name, p.description, p.price, p.offer_price, p.image_url, p.is_featured, p.stock, p.category_id, c.name AS category_name
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      WHERE p.is_active = TRUE
    `;
    const params = [];
    let n = 1;
    if (category) {
      query += ` AND p.category_id = $${n}`;
      params.push(parseInt(category, 10));
      n++;
    }
    if (featured === '1') {
      query += ' AND p.is_featured = TRUE';
    }
    if (search && search.trim()) {
      query += ` AND (p.name ILIKE $${n} OR p.description ILIKE $${n})`;
      params.push(`%${search.trim()}%`);
      n++;
    }
    query += ' ORDER BY p.is_featured DESC, p.name';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.category_id WHERE p.product_id = $1 AND p.is_active = TRUE',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// --- API: Carrito (requiere usuario logueado) ---
app.get('/api/cart', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Debes iniciar sesión para ver el carrito' });
  try {
    const { rows } = await pool.query(
      `SELECT c.cart_item_id, c.product_id, c.quantity, c.unit_price, p.name, p.image_url
       FROM cart_items c
       JOIN products p ON c.product_id = p.product_id
       WHERE c.user_id = $1
       ORDER BY c.added_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
});

app.post('/api/cart', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Debes iniciar sesión para agregar al carrito' });
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'Falta productId' });
  try {
    const prod = await pool.query('SELECT price, offer_price FROM products WHERE product_id = $1', [productId]);
    if (prod.rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const unitPrice = parseFloat(prod.rows[0].offer_price ?? prod.rows[0].price);

    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + $3, unit_price = $4`,
      [userId, productId, Math.max(1, parseInt(quantity, 10)), unitPrice]
    );
    const { rows } = await pool.query(
      `SELECT c.cart_item_id, c.product_id, c.quantity, c.unit_price, p.name, p.image_url
       FROM cart_items c JOIN products p ON c.product_id = p.product_id WHERE c.user_id = $1 ORDER BY c.added_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
});

app.put('/api/cart/:cartItemId', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Debes iniciar sesión' });
  const quantity = Math.max(1, parseInt(req.body.quantity, 10));
  try {
    await pool.query(
      'UPDATE cart_items SET quantity = $1 WHERE cart_item_id = $2 AND user_id = $3',
      [quantity, req.params.cartItemId, userId]
    );
    const { rows } = await pool.query(
      `SELECT c.cart_item_id, c.product_id, c.quantity, c.unit_price, p.name, p.image_url
       FROM cart_items c JOIN products p ON c.product_id = p.product_id WHERE c.user_id = $1 ORDER BY c.added_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar carrito' });
  }
});

app.delete('/api/cart/:cartItemId', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Debes iniciar sesión' });
  try {
    await pool.query('DELETE FROM cart_items WHERE cart_item_id = $1 AND user_id = $2', [req.params.cartItemId, userId]);
    const { rows } = await pool.query(
      `SELECT c.cart_item_id, c.product_id, c.quantity, c.unit_price, p.name, p.image_url
       FROM cart_items c JOIN products p ON c.product_id = p.product_id WHERE c.user_id = $1 ORDER BY c.added_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar del carrito' });
  }
});

// --- API: Métodos de pago ---
app.get('/api/payment-methods', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT payment_method_id, name, description, icon_url FROM payment_methods WHERE is_active = TRUE ORDER BY payment_method_id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener métodos de pago' });
  }
});

// --- API: Crear pedido ---
app.post('/api/orders', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Debes iniciar sesión para finalizar la compra' });
  const { paymentMethodId, addressId } = req.body;
  try {
    const cart = await pool.query(
      `SELECT c.cart_item_id, c.product_id, c.quantity, c.unit_price, p.name
       FROM cart_items c JOIN products p ON c.product_id = p.product_id WHERE c.user_id = $1`,
      [userId]
    );
    if (cart.rows.length === 0) return res.status(400).json({ error: 'Carrito vacío' });

    const subtotal = cart.rows.reduce((sum, i) => sum + parseFloat(i.unit_price) * i.quantity, 0);
    const totalAmount = subtotal;

    const orderResult = await pool.query(
      `INSERT INTO orders (user_id, address_id, payment_method_id, status, subtotal, total_amount)
       VALUES ($1, $2, $3, 'confirmado', $4, $5) RETURNING order_id, total_amount, status, created_at`,
      [userId, addressId || null, paymentMethodId || null, subtotal, totalAmount]
    );
    const orderId = orderResult.rows[0].order_id;

    for (const item of cart.rows) {
      const itemSubtotal = parseFloat(item.unit_price) * item.quantity;
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.product_id, item.name, item.quantity, item.unit_price, itemSubtotal]
      );
    }

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    res.status(201).json({
      orderId,
      totalAmount: orderResult.rows[0].total_amount,
      status: orderResult.rows[0].status,
      createdAt: orderResult.rows[0].created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
});

// SPA: todas las rutas no-API sirven index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).end();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`D1Shop servidor en http://localhost:${PORT}`);
});
