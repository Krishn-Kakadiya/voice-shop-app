# EchoAisle - Voice Shopping Navigator

A simple voice-guided in-store navigation app for visually impaired shoppers.

**Stack:** plain HTML, CSS, JavaScript, Bootstrap on the frontend; Node.js +
Express + MySQL on the backend. No React, no TypeScript, no build tools.

---

## What it does

- A customer taps a microphone and says what they want
  (e.g. *"I want soap and shampoo and milk"*).
- The app speaks step-by-step directions to each item, one at a time.
- The customer says "next", "done", "finish", or "reach" to advance.
- The customer says "stop" to cancel.
- A shop owner can log in to a protected admin page to add, edit, and
  delete products and their step-by-step directions.

---

## How to run on your laptop

### 1. Install Node.js

Download and install Node.js (LTS) from <https://nodejs.org>.
After installing, open a Command Prompt / terminal and check:

```
node --version
npm --version
```

You should see version numbers.

### 2. Install MySQL (recommended: XAMPP)

Easiest way on Windows or Mac is **XAMPP**:

1. Download from <https://www.apachefriends.org/download.html>.
2. Install it.
3. Open the **XAMPP Control Panel** and click **Start** next to "MySQL".

(On Linux: `sudo apt install mysql-server`.)

### 3. Create the database

1. Open <http://localhost/phpmyadmin> in your browser.
2. Click the **SQL** tab.
3. Open `schema.sql` from this project, copy everything, paste it in,
   and click **Go**.

This creates the `voice_shop` database, the `products` table, and inserts
12 starter products.

### 4. Configure `.env`

Copy `.env.example` to `.env`:

- **Windows:** `copy .env.example .env`
- **Mac/Linux:** `cp .env.example .env`

The default values match XAMPP. If your MySQL has a password, set
`MYSQL_PASSWORD=`. The default admin login is `admin` / `admin123` —
change `ADMIN_USER` and `ADMIN_PASSWORD` in `.env` to whatever you want.

### 5. Install dependencies and run

In the project folder:

```
npm install
npm start
```

You should see:

```
EchoAisle is running!
Open: http://localhost:5000
Admin login: admin / admin123
```

Open <http://localhost:5000> in **Chrome, Edge, or Safari**
(Firefox does not support the voice features).

---

## Pages

| URL | What it is | Auth |
|---|---|---|
| `/` | Voice navigation (home page) | public |
| `/products.html` | Browse all products and build a shopping list | public |
| `/login.html` | Shop owner login | public |
| `/admin.html` | Shop owner admin (add / edit / delete products) | login required |

## API endpoints

| Method | Endpoint | Auth | What it does |
|---|---|---|---|
| GET | `/api/health` | public | Server health + which storage is in use |
| GET | `/api/products` | public | List all products |
| GET | `/api/products/:id` | public | Get one product |
| POST | `/api/products` | admin | Create a product |
| PUT | `/api/products/:id` | admin | Update a product |
| DELETE | `/api/products/:id` | admin | Delete a product |
| POST | `/api/login` | public | Log in `{username, password}` |
| POST | `/api/logout` | public | Log out the current session |
| GET | `/api/me` | public | Returns `{loggedIn:bool, username?}` |

A product looks like this:

```json
{
  "id": 1,
  "name": "Soap",
  "category": "Personal Care",
  "aisle": "Personal Care - Aisle 3",
  "keywords": ["soap", "hand soap", "body soap"],
  "steps": [
    "Walk forward 8 steps from the entrance",
    "Turn right at the first crossing",
    "Walk forward 6 steps",
    "Soap is on the left shelf at waist height"
  ]
}
```

---

## Folder layout

```
voice-shop-app/
├── server.js          ← Express server with auth + product API
├── db.js              ← Database layer (MySQL or JSON file)
├── package.json       ← npm dependencies
├── schema.sql         ← MySQL setup script
├── data.json          ← Fallback data when MySQL isn't configured
├── .env.example       ← Copy to .env and edit
├── README.md          ← This file
└── public/
    ├── index.html     ← Voice navigation page
    ├── products.html  ← Product browser + shopping list
    ├── login.html     ← Admin login page
    ├── admin.html     ← Admin (protected)
    ├── css/style.css  ← Styles
    └── js/
        ├── voice-nav.js
        ├── products.js
        └── admin.js
```

---

## Running without MySQL

If `MYSQL_HOST` is not set in `.env`, the app uses `data.json` as a
file-based store. Useful for trying things out quickly. For the real
project demo, use MySQL via XAMPP as above.

---

# Full source code

Below is the complete source of every file in the project. If you ever
lose any file, you can recreate the project by copying these blocks
into files with the matching names.

---

## `package.json`

```json
{
  "name": "voice-shop-app",
  "version": "1.0.0",
  "description": "EchoAisle - Voice-guided in-store navigation app for visually impaired shoppers",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "mysql2": "^3.11.0",
    "dotenv": "^16.4.5"
  }
}
```

---

## `.env.example`

```env
# Copy this file to .env and fill in your MySQL details.
# If you don't set these, the app uses a simple JSON file instead of MySQL.

# Server port (default 5000)
PORT=5000

# MySQL connection (XAMPP defaults shown)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=voice_shop

# Admin login (used to access /admin.html)
ADMIN_USER=admin
ADMIN_PASSWORD=admin123

# Session secret (any random long string)
SESSION_SECRET=please-change-me-to-a-long-random-string
```

---

## `schema.sql`

```sql
-- EchoAisle MySQL schema
-- Run this in phpMyAdmin or the MySQL command line to create the database.

CREATE DATABASE IF NOT EXISTS voice_shop
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE voice_shop;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  aisle VARCHAR(100) NOT NULL,
  keywords TEXT NOT NULL,
  steps TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data: 12 starter products
INSERT INTO products (name, category, aisle, keywords, steps) VALUES
('Soap', 'Personal Care', 'Personal Care - Aisle 3',
  'soap|hand soap|bar soap|body soap',
  'Walk forward 8 steps from the entrance|Turn right at the first crossing|Walk forward 6 steps|Soap is on the left shelf at waist height'),
('Shampoo', 'Personal Care', 'Personal Care - Aisle 3',
  'shampoo|hair wash|conditioner',
  'Walk forward 8 steps from the entrance|Turn right at the first crossing|Walk forward 10 steps|Shampoo bottles are on the right shelf at chest height'),
('Toothpaste', 'Personal Care', 'Personal Care - Aisle 3',
  'toothpaste|paste|tooth|brush',
  'Walk forward 8 steps from the entrance|Turn right at the first crossing|Walk forward 4 steps|Toothpaste is on the left shelf at eye level'),
('Bread', 'Bakery', 'Bakery - Aisle 1',
  'bread|loaf|bun|toast',
  'Walk forward 4 steps from the entrance|Turn left|Walk forward 6 steps|Bread is in the open basket on your right'),
('Milk', 'Dairy', 'Dairy - Aisle 5',
  'milk|dairy milk|cow milk',
  'Walk forward 8 steps from the entrance|Continue straight 12 more steps|Turn left at the cold section|Milk cartons are in the refrigerator on your right'),
('Bottled Water', 'Beverages', 'Beverages - Aisle 4',
  'water|bottle|drinking water|mineral water',
  'Walk forward 8 steps from the entrance|Continue straight 6 more steps|Turn right|Water bottles are stacked on the left'),
('Chips', 'Snacks', 'Snacks - Aisle 6',
  'chips|crisps|snack|wafers',
  'Walk forward 8 steps from the entrance|Continue straight 16 more steps|Turn right|Chips are on the middle shelves on both sides'),
('Frozen Pizza', 'Frozen', 'Frozen - Aisle 7',
  'pizza|frozen pizza|frozen food',
  'Walk forward 8 steps from the entrance|Continue straight 18 more steps|Turn left into the freezer aisle|Pizza is in the third freezer on your right'),
('Coffee', 'Beverages', 'Beverages - Aisle 4',
  'coffee|instant coffee|coffee powder',
  'Walk forward 8 steps from the entrance|Continue straight 6 more steps|Turn right|Coffee jars are on the right shelf at chest height'),
('Detergent', 'Household', 'Household - Aisle 8',
  'detergent|washing powder|laundry|soap powder',
  'Walk forward 8 steps from the entrance|Continue straight 20 more steps|Turn left|Detergent boxes are on the bottom shelf'),
('Eggs', 'Dairy', 'Dairy - Aisle 5',
  'eggs|egg|dozen eggs',
  'Walk forward 8 steps from the entrance|Continue straight 12 more steps|Turn left at the cold section|Egg trays are on the shelf next to the milk'),
('Bananas', 'Groceries', 'Produce - Aisle 2',
  'banana|bananas|fruit',
  'Walk forward 4 steps from the entrance|Turn right|Walk forward 4 steps|Bananas are in the open crate on your left');
```

---

## `server.js`

```javascript
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
```

---

## `db.js`

```javascript
// Database layer for EchoAisle.
// Uses MySQL when MYSQL_HOST is set in .env, otherwise falls back to a JSON file.
// This lets the app run anywhere with zero setup, and easily switch to MySQL.

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');
const useMysql = !!process.env.MYSQL_HOST;

let pool = null;

async function init() {
  if (useMysql) {
    const mysql = require('mysql2/promise');
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'voice_shop',
      waitForConnections: true,
      connectionLimit: 10,
    });
    console.log(`[db] Using MySQL at ${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT || 3306}`);
    await ensureTable();
    await seedIfEmpty();
  } else {
    console.log('[db] No MYSQL_HOST set — using local data.json file as the database.');
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ products: [], nextId: 1 }, null, 2));
    }
  }
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      aisle VARCHAR(100) NOT NULL,
      keywords TEXT NOT NULL,
      steps TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function seedIfEmpty() {
  const [rows] = await pool.query('SELECT COUNT(*) AS c FROM products');
  if (rows[0].c > 0) return;
  console.log('[db] Empty products table — seeding from data.json');
  const seed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  for (const p of seed.products) {
    await pool.query(
      'INSERT INTO products (name, category, aisle, keywords, steps) VALUES (?, ?, ?, ?, ?)',
      [p.name, p.category, p.aisle, p.keywords.join('|'), p.steps.join('|')]
    );
  }
}

// --- JSON file helpers ---
function readJson() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writeJson(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// --- Public API ---
async function listProducts() {
  if (useMysql) {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id');
    return rows.map(rowToProduct);
  }
  return readJson().products;
}

async function getProduct(id) {
  id = Number(id);
  if (useMysql) {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] ? rowToProduct(rows[0]) : null;
  }
  return readJson().products.find((p) => p.id === id) || null;
}

async function createProduct(p) {
  const product = normalize(p);
  if (useMysql) {
    const [r] = await pool.query(
      'INSERT INTO products (name, category, aisle, keywords, steps) VALUES (?, ?, ?, ?, ?)',
      [product.name, product.category, product.aisle, product.keywords.join('|'), product.steps.join('|')]
    );
    return getProduct(r.insertId);
  }
  const data = readJson();
  product.id = data.nextId++;
  data.products.push(product);
  writeJson(data);
  return product;
}

async function updateProduct(id, p) {
  id = Number(id);
  const product = normalize(p);
  if (useMysql) {
    await pool.query(
      'UPDATE products SET name=?, category=?, aisle=?, keywords=?, steps=? WHERE id=?',
      [product.name, product.category, product.aisle, product.keywords.join('|'), product.steps.join('|'), id]
    );
    return getProduct(id);
  }
  const data = readJson();
  const idx = data.products.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  data.products[idx] = { ...data.products[idx], ...product, id };
  writeJson(data);
  return data.products[idx];
}

async function deleteProduct(id) {
  id = Number(id);
  if (useMysql) {
    const [r] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return r.affectedRows > 0;
  }
  const data = readJson();
  const before = data.products.length;
  data.products = data.products.filter((p) => p.id !== id);
  if (data.products.length === before) return false;
  writeJson(data);
  return true;
}

// --- Helpers ---
function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    aisle: row.aisle,
    keywords: String(row.keywords || '').split('|').filter(Boolean),
    steps: String(row.steps || '').split('|').filter(Boolean),
  };
}

function normalize(p) {
  return {
    name: String(p.name || '').trim(),
    category: String(p.category || '').trim(),
    aisle: String(p.aisle || '').trim(),
    keywords: Array.isArray(p.keywords)
      ? p.keywords
      : String(p.keywords || '').split(',').map((s) => s.trim()).filter(Boolean),
    steps: Array.isArray(p.steps)
      ? p.steps
      : String(p.steps || '').split('\n').map((s) => s.trim()).filter(Boolean),
  };
}

module.exports = {
  init,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  isUsingMysql: () => useMysql,
};
```

---

## `public/index.html`

See the file in the `public/` folder. Contents are the voice-navigation home
page using Bootstrap, with a microphone button, a heard-text card, a queue
(shopping list) card, a step card, and manual repeat / next / stop buttons.
The full text is in `public/index.html`.

---

## `public/products.html`

Contents are the products browser page: search box, category filter, a grid
of product cards each with "Add to list" and "Navigate now" buttons, and a
top "cart bar" that lets the customer kick off guided shopping for the
whole list. Full text in `public/products.html`.

---

## `public/login.html`

Contents are a small Bootstrap login form posting `{username, password}` to
`/api/login`. On success it redirects to `/admin.html`. Full text in
`public/login.html`.

---

## `public/admin.html`

Contents are the protected shop-owner admin page: a left-side form for
adding / editing a product (name, category, aisle, comma-separated
keywords, line-separated steps), a right-side table of all products with
Edit / Delete buttons, a logout button in the navbar, and a toast for
status messages. Full text in `public/admin.html`.

---

## `public/css/style.css`

Dark-themed styling on top of Bootstrap: card backgrounds, form-control
overrides, the round microphone button with a pulsing animation, queue-item
chips with current / done states, and product card hover effects. Full
text in `public/css/style.css`.

---

## `public/js/voice-nav.js`

The voice navigation logic in plain JavaScript. Uses the browser's Web
Speech API for both speech recognition (mic) and text-to-speech (spoken
directions). Loads products from `/api/products`, parses the user's
sentence to find any matching keywords, builds a queue, then walks through
each item one step at a time, advancing on "next/done/finish/reach",
repeating on "repeat/again", and cancelling on "stop". Full text in
`public/js/voice-nav.js`.

---

## `public/js/products.js`

Loads `/api/products`, renders cards, handles search + category filter,
maintains an in-memory cart, and links to the home page with
`?items=1,2,3` so the voice page can start guided shopping for the whole
list. Full text in `public/js/products.js`.

---

## `public/js/admin.js`

Loads products into the admin table, handles the form to create / update
products via the protected API, handles delete with a confirm dialog,
and wires up the logout button. Full text in `public/js/admin.js`.

---

## Common problems

- **Mic doesn't work** — use Chrome, Edge, or Safari (not Firefox). The
  first time you click the mic, your browser will ask permission to use
  the microphone. Allow it.
- **Page won't load** — make sure `npm start` is still running in the
  terminal, and you opened `http://localhost:5000` (not `https://`).
- **MySQL connection error** — make sure XAMPP's MySQL service is started
  (green light in the XAMPP Control Panel) and your `.env` matches your
  setup. If your MySQL has a password, set `MYSQL_PASSWORD=` accordingly.
- **Login keeps failing** — the default is `admin` / `admin123`. Check
  your `.env` for what you set `ADMIN_USER` and `ADMIN_PASSWORD` to.
