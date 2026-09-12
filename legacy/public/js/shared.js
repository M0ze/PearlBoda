(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initNav() {
    const nav = document.querySelector('.site-nav');
    const navLinksContainer = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');
    if (!nav) return;

    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });

    // Build Navigation Links
    const links = [
      { name: 'Home', href: '/' },
      { name: 'Order', href: '/order' },
      { name: 'Fare', href: '/fare' },
      { name: 'Track', href: '/track' },
      { name: 'About', href: '/about' },
      { name: 'Help', href: '/help' }
    ];

    if (navLinksContainer) {
      const currentPath = window.location.pathname;
      navLinksContainer.innerHTML = links.map(link => `
        <a href="${link.href}" class="${(currentPath === link.href || (currentPath === '' && link.href === '/')) ? 'active' : ''}">${link.name}</a>
      `).join('');
    }

    // Auth State Handling
    updateAuthUI();
  }

  function updateAuthUI() {
    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const token = localStorage.getItem('pb_token');
    const user = JSON.parse(localStorage.getItem('pb_user') || '{}');

    if (token) {
      navActions.innerHTML = `
        <a href="/dashboard" class="btn btn-outline">Dashboard</a>
        <button id="logoutBtn" class="btn btn-primary">Logout</button>
        <button class="theme-toggle" aria-label="Toggle Theme">🌙</button>
      `;
      document.getElementById('logoutBtn')?.addEventListener('click', logout);
    } else {
      navActions.innerHTML = `
        <a href="/login" class="btn btn-outline">Login</a>
        <a href="/register" class="btn btn-primary">Sign Up</a>
        <button class="theme-toggle" aria-label="Toggle Theme">🌙</button>
      `;
    }
    initTheme(); // Re-init theme toggle after updating HTML
  }

  function logout() {
    localStorage.removeItem('pb_token');
    localStorage.removeItem('pb_user');
    window.location.href = '/';
  }

  function initTheme() {
    const toggles = document.querySelectorAll('.theme-toggle');
    const saved = localStorage.getItem('pearlboda-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);

    toggles.forEach(toggle => {
      toggle.textContent = saved === 'dark' ? '☀️' : '🌙';
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('pearlboda-theme', next);
        toggles.forEach(t => t.textContent = next === 'dark' ? '☀️' : '🌙');
      });
    });
  }

  function hideLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 600);
    }
  }

  function initReveal() {
    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }

    if (typeof gsap !== 'undefined') {
      gsap.utils.toArray('.reveal').forEach(el => {
        gsap.to(el, {
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power2.out'
        });
      });
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15 });
      document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }
  }

  window.PearlBoda = {
    prefersReducedMotion,
    hideLoader,
    initReveal,
    initNav,
    initTheme,
    updateAuthUI
  };

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initTheme();
    initReveal();
    // Simulate loader hide for pages without 3D
    if (!document.getElementById('hero-bg') && !document.getElementById('order-map-canvas')) {
      setTimeout(hideLoader, 500);
    }
  });
})();
