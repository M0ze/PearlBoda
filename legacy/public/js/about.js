/**
 * PearlBoda About Page — scroll animations, counters, FAQ, light 3D
 */
(function () {
  'use strict';

  const reduced = window.PearlBoda?.prefersReducedMotion ?? false;

  function initAboutScene() {
    const canvas = document.getElementById('about-canvas');
    if (!canvas || typeof THREE === 'undefined' || reduced) {
      window.PearlBoda?.hideLoader();
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, canvas.parentElement.offsetWidth / canvas.parentElement.offsetHeight, 0.1, 100);
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.parentElement.offsetWidth, canvas.parentElement.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const cities = [
      { name: 'Hioma', pos: [-3, 1, 0], color: 0x2e7d32 },
      { name: 'Kampala', pos: [0, -0.5, 0], color: 0xe65100 },
      { name: 'Fort Portal', pos: [3, 0.5, 0], color: 0x1565c0 }
    ];

    const nodes = [];
    cities.forEach(({ pos, color }) => {
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 })
      );
      node.position.set(...pos);
      scene.add(node);
      nodes.push(node);
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const points = [nodes[i].position, nodes[j].position];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: 0xffc107, transparent: true, opacity: 0.5 }));
        scene.add(line);
      }
    }

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    function animate() {
      requestAnimationFrame(animate);
      nodes.forEach((node, i) => {
        node.position.y += Math.sin(Date.now() * 0.001 + i) * 0.002;
      });
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
      const w = canvas.parentElement.offsetWidth;
      const h = canvas.parentElement.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    window.PearlBoda?.hideLoader();
  }

  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const animateCounter = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = reduced ? 0 : 2000;
      const start = performance.now();

      function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(target * eased).toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      if (reduced) {
        el.textContent = target.toLocaleString() + suffix;
      } else {
        requestAnimationFrame(update);
      }
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => observer.observe(c));
  }

  function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => {
          i.classList.remove('open');
          i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = 'hello@pearlboda.ug';
      const subject = encodeURIComponent('PearlBoda Inquiry');
      const body = encodeURIComponent(
        `Name: ${form.name.value}\nEmail: ${form.email.value}\n\n${form.message.value}`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    });
  }

  function initGSAP() {
    if (reduced || typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    gsap.utils.toArray('.stat-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 85%' },
        opacity: 0, y: 40, duration: 0.6, delay: i * 0.1, ease: 'power2.out'
      });
    });

    gsap.utils.toArray('.team-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 85%' },
        opacity: 0, scale: 0.95, duration: 0.5, delay: i * 0.1, ease: 'back.out(1.2)'
      });
    });

    gsap.utils.toArray('.feature-item').forEach((item) => {
      gsap.from(item, {
        scrollTrigger: { trigger: item, start: 'top 85%' },
        opacity: 0, x: -30, duration: 0.6, ease: 'power2.out'
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAboutScene();
    initCounters();
    initFAQ();
    initContactForm();
    initGSAP();
    if (reduced) window.PearlBoda?.hideLoader();
  });
})();
