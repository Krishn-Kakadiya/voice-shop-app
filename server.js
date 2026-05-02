// EchoAisle - Voice Shopping Navigator
// A simple Express server that serves the frontend and a small REST API.
// Run with: npm install && npm start

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const db = require('./db');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(express.json());

// --- Sessions for admin login ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 }, // 8 hours
}));

// --- Auth helpers ---
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'Login required' });
}
function requireAuthHtml(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.redirect('/login.html');
}

// --- Auth API ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    req.session.username = username;
    return res.json({ ok: true, username });
  }
  res.status(401).json({ error: 'Wrong username or password' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ loggedIn: true, username: req.session.username });
  }
  res.json({ loggedIn: false });
});

// --- Admin page is gated ---
app.get('/admin.html', requireAuthHtml, (req, res, next) => next());

// Static files (after the admin gate so /admin.html goes through requireAuthHtml first)
app.use(express.static(path.join(__dirname, 'public')));

// --- Public product API ---
app.get('/api/health', (req, res) => {
  res.json({ ok: true, storage: db.isUsingMysql() ? 'mysql' : 'json' });
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await db.listProducts();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

// --- Protected admin API: create / update / delete ---
app.post('/api/products', requireAuth, async (req, res) => {
  try {
    if (!req.body || !req.body.name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const product = await db.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const product = await db.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAuth, async (req, res) => {
  try {
    const ok = await db.deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Product not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Fallback: serve index.html so client-side links still work
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start ---
db.init()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n  EchoAisle is running!`);
      console.log(`  Open: http://localhost:${PORT}`);
      console.log(`  Admin login: ${ADMIN_USER} / ${ADMIN_PASSWORD}\n`);
    });
  })
  .catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
