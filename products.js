// Products browser + cart - plain JavaScript

const grid = document.getElementById('productsGrid');
const search = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const cartBar = document.getElementById('cartBar');
const cartCount = document.getElementById('cartCount');
const clearCartBtn = document.getElementById('clearCartBtn');
const startBtn = document.getElementById('startShoppingBtn');

let products = [];
let cart = [];
let speaking = false;

// ── Screen reader helper ─────────────────────────────────────────────────────
function speak(text, btn) {
  if (!('speechSynthesis' in window)) {
    alert('Sorry, your browser does not support text-to-speech.');
    return;
  }
  window.speechSynthesis.cancel();
  if (btn && btn.dataset.speaking === 'true') {
    btn.dataset.speaking = 'false';
    btn.innerHTML = '<i class="bi bi-volume-up-fill"></i> Read Info';
    btn.classList.replace('btn-info', 'btn-outline-info');
    return;
  }
  document.querySelectorAll('[data-speaking="true"]').forEach((b) => {
    b.dataset.speaking = 'false';
    b.innerHTML = '<i class="bi bi-volume-up-fill"></i> Read Info';
    b.classList.replace('btn-info', 'btn-outline-info');
  });

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = 1.05;
  if (btn) {
    btn.dataset.speaking = 'true';
    btn.innerHTML = '<i class="bi bi-stop-circle-fill"></i> Stop';
    btn.classList.replace('btn-outline-info', 'btn-info');
    utter.onend = () => {
      btn.dataset.speaking = 'false';
      btn.innerHTML = '<i class="bi bi-volume-up-fill"></i> Read Info';
      btn.classList.replace('btn-info', 'btn-outline-info');
    };
  }
  window.speechSynthesis.speak(utter);
}

function buildProductScript(p) {
  const stepsText = p.steps.map((step, i) => {
    if (typeof step === 'string') return `Step ${i + 1}: ${step}.`;
    const instr = step.instruction || '';
    const lm = step.landmark || '';
    return `Step ${i + 1}: ${instr}${lm ? ', ' + lm : ''}.`;
  }).join(' ');
  return (
    `${p.name}. Category: ${p.category}. Located in ${p.aisle}. ` +
    `Here are the navigation directions. ${stepsText}`
  );
}

function readAllVisible(btn) {
  if (!('speechSynthesis' in window)) { alert('Your browser does not support text-to-speech.'); return; }

  if (btn.dataset.reading === 'true') {
    window.speechSynthesis.cancel();
    btn.dataset.reading = 'false';
    btn.innerHTML = '<i class="bi bi-volume-up-fill"></i> Read This Page';
    btn.classList.replace('btn-info', 'btn-outline-info');
    return;
  }

  const visible = products.filter((p) => {
    const q = search.value.toLowerCase().trim();
    const cat = categoryFilter.value;
    if (cat && p.category !== cat) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.keywords.some((k) => k.toLowerCase().includes(q));
  });

  const text = visible.length === 0
    ? 'No products match your search.'
    : `There are ${visible.length} products on this page. ` +
      visible.map((p) => `${p.name}, in ${p.aisle}.`).join(' ');

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = 1.05;

  function resetBtn() {
    btn.dataset.reading = 'false';
    btn.innerHTML = '<i class="bi bi-volume-up-fill"></i> Read This Page';
    btn.classList.replace('btn-info', 'btn-outline-info');
  }
  utter.onend = resetBtn;
  utter.onerror = resetBtn;

  btn.dataset.reading = 'true';
  btn.innerHTML = '<i class="bi bi-stop-circle-fill"></i> Stop Reading';
  btn.classList.replace('btn-outline-info', 'btn-info');
  window.speechSynthesis.speak(utter);
}

// ── Load & render ────────────────────────────────────────────────────────────
async function load() {
  const res = await fetch('/api/products');
  products = await res.json();
  fillCategories();
  render();
}

function fillCategories() {
  const cats = [...new Set(products.map((p) => p.category))].sort();
  for (const c of cats) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    categoryFilter.appendChild(opt);
  }
}

function render() {
  const q = search.value.toLowerCase().trim();
  const cat = categoryFilter.value;
  grid.innerHTML = '';
  const filtered = products.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="col-12 text-center text-muted py-5">No products match.</div>';
    return;
  }
  for (const p of filtered) {
    grid.appendChild(card(p));
  }
  updateCartBar();
}

function card(p) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  const inCart = cart.includes(p.id);
  col.innerHTML = `
    <div class="card product-card h-100 ${inCart ? 'in-cart' : ''}">
      <div class="card-body d-flex flex-column">
        <span class="badge bg-warning text-dark align-self-start mb-2">${escapeHtml(p.category)}</span>
        <h4 class="fw-bold">${escapeHtml(p.name)}</h4>
        <div class="text-muted mb-3"><i class="bi bi-geo-alt"></i> ${escapeHtml(p.aisle)}</div>
        <div class="mt-auto d-grid gap-2">
          <button class="btn btn-outline-info readBtn" data-speaking="false" aria-label="Read product info aloud">
            <i class="bi bi-volume-up-fill"></i> Read Info
          </button>
          <button class="btn ${inCart ? 'btn-success' : 'btn-outline-light'} addBtn">
            <i class="bi ${inCart ? 'bi-check-circle' : 'bi-plus-circle'}"></i>
            ${inCart ? 'In list' : 'Add to list'}
          </button>
          <a class="btn btn-warning" href="/?items=${p.id}">
            <i class="bi bi-mic"></i> Navigate now
          </a>
        </div>
      </div>
    </div>
  `;
  col.querySelector('.addBtn').addEventListener('click', () => toggleCart(p.id));
  const readBtn = col.querySelector('.readBtn');
  readBtn.addEventListener('click', () => speak(buildProductScript(p), readBtn));
  return col;
}

function toggleCart(id) {
  if (cart.includes(id)) {
    cart = cart.filter((x) => x !== id);
  } else {
    cart.push(id);
  }
  render();
}

function updateCartBar() {
  if (cart.length === 0) {
    cartBar.classList.add('d-none');
    return;
  }
  cartBar.classList.remove('d-none');
  cartCount.textContent = cart.length;
  startBtn.href = '/?items=' + cart.join(',');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

search.addEventListener('input', render);
categoryFilter.addEventListener('change', render);
clearCartBtn.addEventListener('click', () => { cart = []; render(); });

document.getElementById('readPageBtn').addEventListener('click', function () { readAllVisible(this); });

load();
