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
