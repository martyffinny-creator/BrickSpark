/* ============================================================
   BrickSpark Cart System — js/cart.js
   Full localStorage cart with sidebar, badge, and animations
   ============================================================ */

(function () {
  'use strict';

  const CART_KEY = 'brickspark_cart';

  /* ---------- Core helpers ---------- */

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateBadge();
    renderSidebar();
    dispatchCartEvent();
  }

  function dispatchCartEvent() {
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: getCart() }));
  }

  /* ---------- Public API ---------- */

  function addToCart(product) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        emoji: product.emoji || '🧱',
        slug: product.slug || '',
        quantity: 1
      });
    }
    saveCart(cart);
    showAddFeedback(product.name);
  }

  function removeFromCart(id) {
    const cart = getCart().filter(item => item.id !== id);
    saveCart(cart);
  }

  function updateQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    item.quantity = qty;
    saveCart(cart);
  }

  function getTotal() {
    return getCart().reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  function getCount() {
    return getCart().reduce((sum, i) => sum + i.quantity, 0);
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateBadge();
    renderSidebar();
    dispatchCartEvent();
  }

  /* ---------- Badge ---------- */

  function updateBadge() {
    const count = getCount();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = count;
      el.classList.toggle('show', count > 0);
    });
  }

  /* ---------- Add-to-cart animation ---------- */

  function showAddFeedback(name) {
    if (typeof window.showToast === 'function') {
      window.showToast(name + ' added to cart! 🛒');
    }
    // Pulse the cart button
    const cartBtn = document.getElementById('cart-toggle');
    if (cartBtn) {
      cartBtn.style.transform = 'scale(1.3)';
      setTimeout(() => { cartBtn.style.transform = ''; }, 400);
    }
  }

  /* ---------- Sidebar ---------- */

  function ensureSidebar() {
    if (document.getElementById('cart-sidebar')) return;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'cart-overlay';
    overlay.id = 'cart-overlay';
    overlay.addEventListener('click', closeSidebar);

    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'cart-sidebar';
    sidebar.id = 'cart-sidebar';
    sidebar.innerHTML = `
      <div class="cart-header">
        <h3>🛒 Your Cart</h3>
        <button class="cart-close" id="cart-close" aria-label="Close cart">&times;</button>
      </div>
      <div class="cart-items" id="cart-items">
        <div class="cart-empty" id="cart-empty">
          <p>Your cart is empty</p>
          <a href="shop.html" class="btn btn-primary" style="margin-top:12px">Shop Now</a>
        </div>
      </div>
      <div class="cart-footer" id="cart-footer" style="display:none">
        <div class="cart-total">
          <span>Total</span>
          <span id="cart-total-amount">$0.00</span>
        </div>
        <a href="checkout.html" class="btn btn-primary" style="width:100%">Checkout</a>
        <a href="cart.html" class="btn btn-outline" style="width:100%;margin-top:8px">View Full Cart</a>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(sidebar);

    sidebar.querySelector('#cart-close').addEventListener('click', closeSidebar);
  }

  function openSidebar() {
    ensureSidebar();
    renderSidebar();
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderSidebar() {
    const itemsEl = document.getElementById('cart-items');
    const footerEl = document.getElementById('cart-footer');
    const emptyEl = document.getElementById('cart-empty');
    const totalEl = document.getElementById('cart-total-amount');
    if (!itemsEl) return;

    const cart = getCart();

    // Remove existing rendered items (not the empty element)
    itemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());

    if (cart.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (footerEl) footerEl.style.display = 'none';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (footerEl) footerEl.style.display = 'block';

    cart.forEach(item => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.innerHTML = `
        <span style="font-size:1.8rem;flex-shrink:0">${item.emoji}</span>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:.9rem;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${item.name}</div>
          <div style="font-size:.85rem;color:var(--gray-600)">$${item.price.toFixed(2)} × ${item.quantity}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <button class="qty-btn" data-action="minus" data-id="${item.id}" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--gray-300);background:var(--gray-50);cursor:pointer;font-weight:700;font-size:.9rem">−</button>
          <span style="min-width:18px;text-align:center;font-weight:700;font-size:.9rem">${item.quantity}</span>
          <button class="qty-btn" data-action="plus" data-id="${item.id}" style="width:28px;height:28px;border-radius:50%;border:1px solid var(--gray-300);background:var(--gray-50);cursor:pointer;font-weight:700;font-size:.9rem">+</button>
        </div>
        <button class="cart-item-remove" data-id="${item.id}" style="background:none;border:none;font-size:1.2rem;color:var(--gray-400);cursor:pointer;padding:0 4px;flex-shrink:0" aria-label="Remove">&times;</button>
      `;
      itemsEl.appendChild(el);
    });

    // Update total
    if (totalEl) totalEl.textContent = '$' + getTotal().toFixed(2);

    // Bind buttons
    itemsEl.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = getCart().find(i => i.id === id);
        if (!item) return;
        if (btn.dataset.action === 'minus') updateQty(id, item.quantity - 1);
        else updateQty(id, item.quantity + 1);
      });
    });
    itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', () => removeFromCart(btn.dataset.id));
    });
  }

  /* ---------- Init ---------- */

  function init() {
    updateBadge();

    // Wire cart toggle button
    document.addEventListener('click', e => {
      const toggle = e.target.closest('#cart-toggle, [data-cart-toggle]');
      if (toggle) {
        e.preventDefault();
        openSidebar();
      }
    });

    // Wire any "Add to Cart" buttons with data attributes
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-add-to-cart]');
      if (!btn) return;
      e.preventDefault();
      const product = {
        id: btn.dataset.productId,
        name: btn.dataset.productName,
        price: btn.dataset.productPrice,
        emoji: btn.dataset.productEmoji || '🧱',
        slug: btn.dataset.productSlug || ''
      };
      addToCart(product);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- Expose globally ---------- */
  window.BrickSparkCart = {
    addToCart,
    removeFromCart,
    updateQty,
    getCart,
    getTotal,
    getCount,
    clearCart,
    openSidebar,
    closeSidebar
  };
})();
