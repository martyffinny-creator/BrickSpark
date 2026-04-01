// BrickSpark — Shared App JS
// All functions exposed on window for inline onclick handlers

const SUPABASE_URL = 'https://dppjohfplbznhggdemeu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzMwODYsImV4cCI6MjA5MDIwOTA4Nn0.05a8RlPvNlpDgarsjvvFDoPBUKDCOPUwMqquVoBH63o';

window.sb = null;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
}

// ─── NAVBAR ──────────────────────────────────────────────
window.toggleMenu = function() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
};

function initNavbar() {
  // Hamburger
  const hamburger = document.getElementById('hamburger');
  if (hamburger) hamburger.addEventListener('click', window.toggleMenu);

  // Cart toggle
  const cartToggle = document.getElementById('cart-toggle');
  if (cartToggle) cartToggle.addEventListener('click', window.openCart);

  // Cart close
  const cartClose = document.getElementById('cart-close');
  if (cartClose) cartClose.addEventListener('click', window.closeCart);

  // Cart overlay click-outside
  const overlay = document.getElementById('cart-overlay');
  if (overlay) overlay.addEventListener('click', window.closeCart);

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('mobile-menu');
    const hb = document.getElementById('hamburger');
    if (menu && hb && !hb.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
    }
  });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 10);
  });

  // Mark active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a, .mobile-menu a, .nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

// ─── TOAST ───────────────────────────────────────────────
window.showToast = function(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: '🧱', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.style.cssText = 'background:#fff;border-radius:12px;padding:14px 18px;box-shadow:0 4px 20px rgba(0,0,0,.15);display:flex;align-items:center;gap:10px;font-family:Nunito,sans-serif;font-weight:700;font-size:.95rem;opacity:0;transform:translateY(10px);transition:all .3s ease;max-width:320px;';
  toast.innerHTML = `<span style="font-size:1.2rem">${icons[type] || '🧱'}</span><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 10));
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; setTimeout(() => toast.remove(), 400); }, 3500);
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
  const count = window.getCart().reduce((s, i) => s + (i.qty || i.quantity || 1), 0);
  document.querySelectorAll('.cart-badge, #cart-badge').forEach(b => {
    b.textContent = count;
    b.classList.toggle('show', count > 0);
  });
}

window.addToCart = function(product, qty = 1) {
  const cart = window.getCart();
  const idx = cart.findIndex(i => i.id === product.id);
  if (idx >= 0) cart[idx].qty = (cart[idx].qty || 1) + qty;
  else cart.push({ ...product, qty });
  saveCart(cart);
  window.showToast(`${product.emoji || '🧱'} ${product.name} added to cart!`, 'success');
  renderCartSidebar();
};

window.removeFromCart = function(id) {
  saveCart(window.getCart().filter(i => i.id !== id));
  renderCartSidebar();
};

window.updateCartQty = function(id, delta) {
  const cart = window.getCart();
  const idx = cart.findIndex(i => i.id === id);
  if (idx >= 0) {
    cart[idx].qty = Math.max(0, (cart[idx].qty || 1) + delta);
    if (cart[idx].qty === 0) cart.splice(idx, 1);
  }
  saveCart(cart);
  renderCartSidebar();
};

window.getCartTotal = function() {
  return window.getCart().reduce((s, i) => s + (i.price * (i.qty || i.quantity || 1)), 0).toFixed(2);
};

window.clearCart = function() { saveCart([]); };

// ─── CART SIDEBAR ─────────────────────────────────────────
window.openCart = function() {
  const overlay = document.getElementById('cart-overlay');
  const sidebar = document.getElementById('cart-sidebar');
  if (overlay) overlay.classList.add('open');
  if (sidebar) { sidebar.classList.add('open'); renderCartSidebar(); }
  document.body.style.overflow = 'hidden';
};

window.closeCart = function() {
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.getElementById('cart-sidebar')?.classList.remove('open');
  document.body.style.overflow = '';
};

function renderCartSidebar() {
  const items = window.getCart();
  const container = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px 20px"><p style="font-size:3rem;margin-bottom:10px">🛒</p><p style="font-weight:800;color:#999">Your cart is empty</p><a href="shop.html" class="btn btn-primary" style="margin-top:14px;display:inline-flex">Shop Now</a></div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';
  container.innerHTML = items.map(i => `
    <div class="cart-item">
      <div class="cart-item-emoji" style="font-size:2rem;margin-right:12px">${i.emoji || '🧱'}</div>
      <div class="cart-item-info" style="flex:1">
        <div style="font-weight:800;font-size:.95rem">${i.name}</div>
        <div style="color:#c4161c;font-weight:700">$${(i.price * (i.qty || 1)).toFixed(2)}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
          <button class="qty-btn" onclick="window.updateCartQty('${i.id}',-1)">−</button>
          <span style="font-weight:700">${i.qty || 1}</span>
          <button class="qty-btn" onclick="window.updateCartQty('${i.id}',1)">+</button>
          <span onclick="window.removeFromCart('${i.id}')" style="cursor:pointer;margin-left:6px;opacity:.5" title="Remove">🗑</span>
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
  const price = p.sale_price || p.price;
  const hasOriginal = p.sale_price && p.price && p.sale_price < p.price;
  const save = hasOriginal ? Math.round((1 - p.sale_price / p.price) * 100) : 0;
  const ages = p.ages || p.age_range || '3+';
  const pieces = p.pieces || p.piece_count || '';
  const escapedProduct = JSON.stringify({id:p.id,name:p.name,price:parseFloat(price),emoji:p.emoji||'🧱',slug:p.slug,image_url:p.image_url||''}).replace(/"/g,'&quot;');
  return `
    <div class="product-card" onclick="window.location='product.html?slug=${p.slug}'">
      <div class="product-img" style="aspect-ratio:1;background:#f8f9fa;border-radius:12px;overflow:hidden;position:relative;margin-bottom:12px">
        ${p.image_url
          ? `<img src="${p.image_url}" alt="${p.name}" loading="lazy" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
          : ''}
        <div style="display:${p.image_url ? 'none' : 'flex'};align-items:center;justify-content:center;width:100%;height:100%;font-size:3rem">${p.emoji || '🧱'}</div>
        ${save > 0 ? `<span style="position:absolute;top:10px;left:10px;background:#c4161c;color:#fff;padding:4px 10px;border-radius:20px;font-size:.75rem;font-weight:800">Save ${save}%</span>` : ''}
      </div>
      <div style="font-size:.75rem;color:#999;margin-bottom:4px">Ages ${ages}${pieces ? ' · ' + pieces + ' pcs' : ''}</div>
      <div style="font-weight:800;font-size:1rem;margin-bottom:4px;color:#1a1a2e">${p.name}</div>
      <div style="font-size:.85rem;color:#666;margin-bottom:10px;line-height:1.4">${p.short_desc || p.description?.substring(0,80) || ''}</div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:auto">
        <div>
          <span style="font-size:1.1rem;font-weight:800;color:#c4161c">$${parseFloat(price).toFixed(2)}</span>
          ${hasOriginal ? `<span style="font-size:.85rem;color:#999;text-decoration:line-through;margin-left:6px">$${parseFloat(p.price).toFixed(2)}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();window.addToCart(JSON.parse(this.dataset.product));this.textContent='✓ Added!';this.style.background='#28a745';setTimeout(()=>{this.textContent='Add to Cart';this.style.background=''},2000)" data-product="${escapedProduct}">Add to Cart</button>
      </div>
    </div>`;
};

// ─── BLOG CARD HTML ────────────────────────────────────────
window.blogCardHTML = function(p) {
  const date = p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';
  const img = p.image_url || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600';
  return `
    <div class="blog-card" onclick="window.location='blog-post.html?slug=${p.slug}'" style="cursor:pointer">
      <div style="aspect-ratio:16/9;border-radius:12px;overflow:hidden;margin-bottom:16px">
        <img src="${img}" alt="${p.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover">
      </div>
      <div style="font-size:.75rem;font-weight:800;color:#c4161c;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">${p.category || 'Blog'}</div>
      <div style="font-weight:800;font-size:1.05rem;color:#1a1a2e;margin-bottom:8px;line-height:1.3">${p.title}</div>
      <div style="font-size:.88rem;color:#666;margin-bottom:12px;line-height:1.5">${p.excerpt || ''}</div>
      <div style="font-size:.78rem;color:#999">${date}${p.author ? ' · ' + p.author : ''}</div>
    </div>`;
};

// ─── NEWSLETTER / WAITLIST FORMS ──────────────────────────
function initForms() {
  document.querySelectorAll('.newsletter-form').forEach(form => {
    if (form.dataset.bound) return;
    form.dataset.bound = 'true';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type=email]')?.value?.trim();
      const btn = form.querySelector('button[type=submit]');
      if (!email || !window.sb) return;
      if (btn) { btn.disabled = true; btn.textContent = 'Subscribing...'; }
      const { error } = await window.sb.from('newsletter').insert([{ email }]);
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
      if (!email || !window.sb) return;
      if (btn) { btn.disabled = true; btn.textContent = 'Joining...'; }
      const { error } = await window.sb.from('waitlist').insert([{ email, product }]);
      if (error && error.code !== '23505') window.showToast('Something went wrong. Try again.', 'error');
      else { window.showToast('🚀 You\'re on the list!', 'success'); form.reset(); }
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

// ─── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  initNavbar();
  updateCartBadge();
  initForms();

  // Remove page loader if present
  const loader = document.getElementById('page-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 400);
  }

  if (typeof window.pageInit === 'function') await window.pageInit();
});
