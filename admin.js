// Admin page - add, edit, delete products. Plain JavaScript.

const form = document.getElementById('productForm');
const formTitle = document.getElementById('formTitle');
const productId = document.getElementById('productId');
const nameI = document.getElementById('name');
const categoryI = document.getElementById('category');
const aisleI = document.getElementById('aisle');
const keywordsI = document.getElementById('keywords');
const stepsContainer = document.getElementById('stepsContainer');
const addStepBtn = document.getElementById('addStepBtn');
const cancelBtn = document.getElementById('cancelBtn');
const tbody = document.getElementById('adminProductsBody');
const toastEl = document.getElementById('toast');
const toastBody = document.getElementById('toastBody');
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

const toast = new bootstrap.Toast(toastEl, { delay: 2200 });

function showToast(message, isError = false) {
  toastBody.textContent = message;
  toastEl.classList.remove('text-bg-success', 'text-bg-danger');
  toastEl.classList.add(isError ? 'text-bg-danger' : 'text-bg-success');
  toast.show();
}

// ── Step builder ─────────────────────────────────────────────────────────────
function addStepRow(instruction = '', landmark = '') {
  const idx = stepsContainer.children.length + 1;
  const row = document.createElement('div');
  row.className = 'step-row border rounded p-2 mb-2';
  row.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <span class="step-label badge bg-warning text-dark">Step ${idx}</span>
      <button type="button" class="btn btn-sm btn-outline-danger removeStepBtn">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
    <div class="mb-1">
      <label class="form-label form-label-sm mb-1">
        <i class="bi bi-arrow-right-circle text-warning"></i> Movement instruction
      </label>
      <input class="form-control form-control-sm step-instruction"
             placeholder="e.g. Walk forward 8 steps"
             value="${escapeAttr(instruction)}" required />
    </div>
    <div>
      <label class="form-label form-label-sm mb-1">
        <i class="bi bi-geo-alt text-info"></i> Landmark reference
      </label>
      <input class="form-control form-control-sm step-landmark"
             placeholder="e.g. past the pharmacy counter on your right"
             value="${escapeAttr(landmark)}" />
    </div>
  `;
  row.querySelector('.removeStepBtn').addEventListener('click', () => {
    row.remove();
    renumberSteps();
  });
  stepsContainer.appendChild(row);
}

function renumberSteps() {
  stepsContainer.querySelectorAll('.step-label').forEach((lbl, i) => {
    lbl.textContent = `Step ${i + 1}`;
  });
}

function readSteps() {
  const rows = stepsContainer.querySelectorAll('.step-row');
  const steps = [];
  rows.forEach((row) => {
    const instruction = row.querySelector('.step-instruction').value.trim();
    const landmark = row.querySelector('.step-landmark').value.trim();
    if (instruction) steps.push({ instruction, landmark });
  });
  return steps;
}

addStepBtn.addEventListener('click', () => addStepRow());

// ── Products list ─────────────────────────────────────────────────────────────
async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  tbody.innerHTML = '';
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No products yet.</td></tr>';
    return;
  }
  for (const p of products) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <strong>${escapeHtml(p.name)}</strong><br>
        <small class="text-muted">${p.keywords.length} keywords &middot; ${p.steps.length} steps</small>
      </td>
      <td>${escapeHtml(p.category)}</td>
      <td>${escapeHtml(p.aisle)}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-warning editBtn"><i class="bi bi-pencil"></i> Edit</button>
        <button class="btn btn-sm btn-outline-danger delBtn"><i class="bi bi-trash"></i> Delete</button>
      </td>
    `;
    tr.querySelector('.editBtn').addEventListener('click', () => fillForm(p));
    tr.querySelector('.delBtn').addEventListener('click', () => deleteProduct(p));
    tbody.appendChild(tr);
  }
}

function fillForm(p) {
  productId.value = p.id;
  nameI.value = p.name;
  categoryI.value = p.category;
  aisleI.value = p.aisle;
  keywordsI.value = p.keywords.join(', ');

  stepsContainer.innerHTML = '';
  for (const step of p.steps) {
    if (typeof step === 'string') {
      addStepRow(step, '');
    } else {
      addStepRow(step.instruction || '', step.landmark || '');
    }
  }
  if (stepsContainer.children.length === 0) addStepRow();

  formTitle.textContent = 'Edit product';
  cancelBtn.classList.remove('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  form.reset();
  productId.value = '';
  stepsContainer.innerHTML = '';
  addStepRow();
  formTitle.textContent = 'Add a new product';
  cancelBtn.classList.add('d-none');
}

cancelBtn.addEventListener('click', resetForm);

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const steps = readSteps();
  if (steps.length === 0) {
    showToast('Please add at least one navigation step.', true);
    return;
  }
  const body = {
    name: nameI.value.trim(),
    category: categoryI.value.trim(),
    aisle: aisleI.value.trim(),
    keywords: keywordsI.value.split(',').map((s) => s.trim()).filter(Boolean),
    steps,
  };
  const id = productId.value;
  const url = id ? `/api/products/${id}` : '/api/products';
  const method = id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) {
    showToast(id ? 'Product updated.' : 'Product added.');
    resetForm();
    loadProducts();
  } else {
    const err = await res.json().catch(() => ({}));
    showToast(err.error || 'Save failed.', true);
  }
});

async function deleteProduct(p) {
  if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  const res = await fetch(`/api/products/${p.id}`, { method: 'DELETE' });
  if (res.ok) {
    showToast('Product deleted.');
    if (productId.value == p.id) resetForm();
    loadProducts();
  } else {
    showToast('Delete failed.', true);
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
function escapeAttr(s) {
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ── Init ──────────────────────────────────────────────────────────────────────
addStepRow(); // start with one empty step row
loadProducts();
