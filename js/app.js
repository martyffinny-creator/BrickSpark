// BrickSpark — Shared App JS
// All functions exposed on window for inline onclick handlers

const SUPABASE_URL = 'https://dppjohfplbznhggdemeu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzMwODYsImV4cCI6MjA5MDIwOTA4Nn0.05a8RlPvNlpDgarsjvvFDoPBUKDCOPUwMqquVoBH63o';

// Global Supabase client — set after CDN loads
let sb = null;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    window.sb = sb;
  }
}

// ─── NAVBAR ──────────────────────────────────────────────
window.toggleMenu = function() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
};

function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.addEventListener('click', window.toggleMenu);
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('mobile-menu');
      if (menu && !hamburger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
      }
    });
  }
  // Mark active nav link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

// ─── TOAST ───────────────────────────────────────────────
window.showToast = function(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: '🧱', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '🧱'}</span><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => setTimeout(() => toast.classList.add('show'), 10));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3500);
};

// ─── CART ─────────────────────────────────────────────────
window.getCart = function() {
  try { return JSON.parse(localStorage.getItem('brickspark_cart') || '[]'); } catch { return []; }
};

function saveCart(cart) {
  localStorage.setItem('brickspark_cart', JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const count = window.getCart().reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = count;
    count > 0 ? b.classList.add('show') : b.classList.remove('show');
  });
}

window.addToCart = function(product, qty = 1) {
  const cart = window.getCart();
  const idx = cart.findIndex(i => i.id === product.id);
  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ ...product, qty });
  saveCart(cart);
  window.showToast(`${product.emoji || '🧱'} ${product.name} added to cart!`, 'success');
};

window.removeFromCart = function(id) {
  saveCart(window.getCart().filter(i => i.id !== id));
  renderCartSidebar();
};

window.updateCartQty = function(id, delta) {
  const cart = window.getCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx >= 0) {
    cart[idx].qty = Math.max(0, cart[idx].qty + delta);
    if (cart[idx].qty === 0) cart.splice(idx, 1);
  }
  saveCart(cart);
  renderCartSidebar();
};

window.getCartTotal = function() {
  return window.getCart().reduce((s, i) => s + (i.price * i.qty), 0).toFixed(2);
};

window.clearCart = function() { saveCart([]); };

// ─── CART SIDEBAR ─────────────────────────────────────────
window.openCart = function() {
  const overlay = document.getElementById('cart-overlay');
  const sidebar = document.getElementById('cart-sidebar');
  if (overlay) overlay.classList.add('open');
  if (sidebar) { sidebar.classList.add('open'); renderCartSidebar(); }
};

window.closeCart = function() {
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-sidebar')?.classList.remove('open');
};

function renderCartSidebar() {
  const items = window.getCart();
  const container = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div class="cart-empty"><p style="font-size:3rem;margin-bottom:10px">🛒</p><p style="font-weight:800;color:var(--muted)">Your cart is empty</p><a href="shop.html" class="btn btn-primary btn-sm" style="margin-top:14px;display:inline-flex">Shop Now</a></div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';
  container.innerHTML = items.map(i => `
    <div class="cart-item">
      <div class="cart-item-emoji">${i.emoji || '🧱'}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">$${(i.price * i.qty).toFixed(2)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="window.updateCartQty('${i.id}',-1)">−</button>
          <span class="qty-num">${i.qty}</span>
          <button class="qty-btn" onclick="window.updateCartQty('${i.id}',1)">+</button>
          <span class="cart-remove" onclick="window.removeFromCart('${i.id}')" title="Remove">🗑</span>
        </div>
      </div>
    </div>`).join('');

  const total = parseFloat(window.getCartTotal());
  const shipping = total >= 50 ? 0 : 5.99;
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('cart-shipping');
  const grandEl = document.getElementById('cart-grand');
  if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE 🎉' : `$${shipping.toFixed(2)}`;
  if (grandEl) grandEl.textContent = `$${(total + shipping).toFixed(2)}`;
}

// ─── PRODUCT CARD HTML ─────────────────────────────────────
window.productCardHTML = function(p) {
  const save = p.original_price ? Math.round((1 - p.price / p.original_price) * 100) : 0;
  const escapedName = (p.name || '').replace(/'/g, "\\'");
  const escapedEmoji = (p.emoji || '🧱').replace(/'/g, "\\'");
  return `
    <div class="product-card" onclick="window.location='product.html?slug=${p.slug}'">
      <div class="product-img">
        ${p.image_url
          ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=product-emoji-placeholder>${p.emoji || '🧱'}</div>'">`
          : `<div class="product-emoji-placeholder">${p.emoji || '🧱'}</div>`}
        ${save > 0 ? `<span class="product-badge">Save ${save}%</span>` : ''}
      </div>
      <div class="product-age">Ages ${p.ages} · ${p.pieces} pieces</div>
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.short_desc || ''}</div>
      <div class="product-footer">
        <div class="product-price">$${p.price}<span class="product-orig">${p.original_price ? '$' + p.original_price : ''}</span></div>
        <button class="add-cart-btn" onclick="event.stopPropagation();window.addToCart({id:'${p.id}',name:'${escapedName}',price:${p.price},emoji:'${escapedEmoji}',slug:'${p.slug}'});this.textContent='✓ Added!';this.classList.add('added');setTimeout(()=>{this.textContent='Add to Cart';this.classList.remove('added')},2000)">Add to Cart</button>
      </div>
    </div>`;
};

// ─── BLOG CARD HTML ────────────────────────────────────────
window.blogCardHTML = function(p) {
  const date = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const img = p.image_url || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600';
  return `
    <div class="blog-card" onclick="window.location='blog-post.html?slug=${p.slug}'">
      <div class="blog-thumb"><img src="${img}" alt="${p.title}" loading="lazy"></div>
      <div class="blog-body">
        <div class="blog-tag">${p.category || 'Blog'}</div>
        <div class="blog-title">${p.title}</div>
        <div class="blog-excerpt">${p.excerpt || ''}</div>
        <div class="blog-meta">${date}${p.author ? ' · ' + p.author : ''}</div>
        <div class="blog-read">Read more →</div>
      </div>
    </div>`;
};

// ─── NEWSLETTER ────────────────────────────────────────────
function initForms() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type=email]')?.value?.trim();
      const btn = form.querySelector('button[type=submit]');
      if (!email || !sb) return;
      if (btn) { btn.disabled = true; btn.textContent = 'Subscribing...'; }
      const { error } = await sb.from('newsletter').insert([{ email }]);
      if (error && error.code !== '23505') window.showToast('Something went wrong. Try again.', 'error');
      else { window.showToast('🎉 Subscribed! Welcome to BrickSpark.', 'success'); form.reset(); }
      if (btn) { btn.disabled = false; btn.textContent = 'Subscribe 🧱'; }
    });
  });

  document.querySelectorAll('.waitlist-form').forEach(form => {
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type=email]')?.value?.trim();
      const product = form.dataset.product || 'general';
      const btn = form.querySelector('button[type=submit]');
      if (!email || !sb) return;
      if (btn) { btn.disabled = true; btn.textContent = 'Joining...'; }
      const { error } = await sb.from('waitlist').insert([{ email, product }]);
      if (error && error.code !== '23505') window.showToast('Something went wrong. Try again.', 'error');
      else { window.showToast('🚀 You\'re on the list! We\'ll email you first.', 'success'); form.reset(); }
      if (btn) { btn.disabled = false; btn.textContent = 'Join Waitlist'; }
    });
  });
}

// ─── COUNTDOWN ─────────────────────────────────────────────
window.startCountdown = function(targetDate, container) {
  if (!container) return;
  function update() {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) { container.innerHTML = '<strong>We\'re Live! 🚀</strong>'; return; }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    container.innerHTML = ['Days','Hours','Mins','Secs'].map((label, i) => {
      const val = [d,h,m,s][i];
      return `<div class="countdown-item"><span class="countdown-num">${String(val).padStart(2,'0')}</span><div class="countdown-label">${label}</div></div>`;
    }).join('');
  }
  update(); setInterval(update, 1000);
};

// ─── ACCORDION ─────────────────────────────────────────────
document.addEventListener('click', (e) => {
  const trigger = e.target.closest('.accordion-trigger');
  if (!trigger) return;
  const item = trigger.closest('.accordion-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.accordion-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
});

// ─── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  initNavbar();
  updateCartBadge();
  initForms();
  if (typeof window.pageInit === 'function') window.pageInit();
});
