/* ============================================================
   BrickSpark Shared App JS — js/app.js
   Supabase init, nav toggle, toasts, forms, page loader
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Supabase Client ---------- */

  const SUPABASE_URL = 'https://dppjohfplbznhggdemeu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpvaGZwbGJ6bmhnZ2RlbWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MzMwODYsImV4cCI6MjA5MDIwOTA4Nn0.05a8RlPvNlpDgarsjvvFDoPBUKDCOPUwMqquVoBH63o';

  let supabase = null;

  function initSupabase() {
    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      console.warn('Supabase JS not loaded. Forms will use fallback.');
    }
    window.BrickSparkSupabase = supabase;
  }

  /* ---------- Toast Notification System ---------- */

  function ensureToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type) {
    const container = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = 'display:flex;align-items:center;gap:10px;padding:14px 18px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12);font-family:Nunito,sans-serif;font-size:.9rem;color:#333;opacity:0;transform:translateY(20px);transition:all .35s ease;cursor:pointer';

    if (type === 'error') toast.style.borderLeft = '4px solid #ef4444';
    else if (type === 'warning') toast.style.borderLeft = '4px solid #f59e0b';
    else if (type === 'info') toast.style.borderLeft = '4px solid #3b82f6';
    else toast.style.borderLeft = '4px solid #22c55e';

    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    const dismiss = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 350);
    };

    toast.addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
  }

  window.showToast = showToast;

  /* ---------- Navbar Mobile Toggle ---------- */

  function initNavToggle() {
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobile-nav');
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Navbar scroll effect ---------- */

  function initNavScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 10);
    }, { passive: true });
  }

  /* ---------- Smooth Scroll ---------- */

  function initSmoothScroll() {
    document.addEventListener('click', e => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ---------- Newsletter Form ---------- */

  function initNewsletterForms() {
    document.querySelectorAll('[data-newsletter-form], .newsletter-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        const email = emailInput?.value?.trim();

        if (!email || !isValidEmail(email)) {
          showToast('Please enter a valid email address.', 'error');
          return;
        }

        setLoadingState(submitBtn, true);

        try {
          if (supabase) {
            const { error } = await supabase
              .from('newsletter')
              .insert([{ email, subscribed_at: new Date().toISOString() }]);
            if (error) {
              if (error.code === '23505') {
                showToast("You're already subscribed! 🎉", 'info');
              } else {
                throw error;
              }
            } else {
              showToast('Welcome to the BrickSpark family! 🧱', 'success');
            }
          } else {
            showToast('Thanks for subscribing! 🧱', 'success');
          }
          form.reset();
        } catch (err) {
          console.error('Newsletter error:', err);
          showToast('Something went wrong. Please try again.', 'error');
        } finally {
          setLoadingState(submitBtn, false);
        }
      });
    });
  }

  /* ---------- Waitlist Form ---------- */

  function initWaitlistForms() {
    document.querySelectorAll('[data-waitlist-form], .waitlist-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        const email = emailInput?.value?.trim();
        const product = form.dataset.product || form.querySelector('[name="product"]')?.value || 'general';

        if (!email || !isValidEmail(email)) {
          showToast('Please enter a valid email address.', 'error');
          return;
        }

        setLoadingState(submitBtn, true);

        try {
          if (supabase) {
            const { error } = await supabase
              .from('waitlist')
              .insert([{ email, product, created_at: new Date().toISOString() }]);
            if (error) {
              if (error.code === '23505') {
                showToast("You're already on the waitlist! We'll be in touch. 🚀", 'info');
              } else {
                throw error;
              }
            } else {
              showToast("You're on the list! We'll notify you soon. 🎉", 'success');
            }
          } else {
            showToast("Thanks! You're on the waitlist. 🎉", 'success');
          }
          form.reset();
        } catch (err) {
          console.error('Waitlist error:', err);
          showToast('Something went wrong. Please try again.', 'error');
        } finally {
          setLoadingState(submitBtn, false);
        }
      });
    });
  }

  /* ---------- Page Loader ---------- */

  function initPageLoader() {
    const loader = document.getElementById('page-loader');
    if (!loader) return;
    window.addEventListener('load', () => {
      loader.style.opacity = '0';
      loader.style.pointerEvents = 'none';
      setTimeout(() => loader.remove(), 500);
    });
  }

  /* ---------- Utilities ---------- */

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setLoadingState(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Please wait...';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }

  /* ---------- Init All ---------- */

  function init() {
    initSupabase();
    initNavToggle();
    initNavScroll();
    initSmoothScroll();
    initNewsletterForms();
    initWaitlistForms();
    initPageLoader();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
