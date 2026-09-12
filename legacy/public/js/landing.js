/**
 * PearlBoda Landing Page — Three.js hero + GSAP scroll animations
 */
(function () {
  'use strict';

  const reduced = window.PearlBoda?.prefersReducedMotion ?? false;
  let scene, camera, renderer, motorcycle, particles, animationId;
  let mouseX = 0, mouseY = 0;

  function createMotorcycle() {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe65100, metalness: 0.6, roughness: 0.35 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, metalness: 0.4, roughness: 0.5 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.3, roughness: 0.7 });
    const accentMat = new THREE.MeshStandardMaterial({ color: 0xffc107, metalness: 0.5, roughness: 0.4 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.6), bodyMat);
    body.position.y = 0.6;
    group.add(body);

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.5), darkMat);
    seat.position.set(-0.2, 0.95, 0);
    group.add(seat);

    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 12), bodyMat);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0.3, 0.85, 0);
    group.add(tank);

    const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), darkMat);
    handlebar.rotation.z = Math.PI / 2;
    handlebar.position.set(0.85, 1.1, 0);
    group.add(handlebar);

    const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), darkMat);
    forkL.position.set(0.85, 0.5, 0.25);
    group.add(forkL);

    const forkR = forkL.clone();
    forkR.position.z = -0.25;
    group.add(forkR);

    [[0.7, 0.35], [-0.7, 0.35]].forEach(([x, y]) => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 12, 24), wheelMat);
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(x, y, 0);
      group.add(wheel);
    });

    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), accentMat);
    headlight.position.set(1.0, 0.75, 0);
    group.add(headlight);

    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8), darkMat);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(-0.9, 0.45, 0.3);
    group.add(exhaust);

    group.scale.set(1.2, 1.2, 1.2);
    group.position.set(0, -0.5, 0);
    return group;
  }

  function createRoad() {
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 8),
      new THREE.MeshStandardMaterial({ color: 0x2d2d44, roughness: 0.9 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.05;
    return road;
  }

  function createParticles(count) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = Math.random() * 8;
      positions[i + 2] = (Math.random() - 0.5) * 10;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: 0xffc107,
      size: 0.06,
      transparent: true,
      opacity: 0.7
    });
    return new THREE.Points(geometry, material);
  }

  function initThree() {
    const canvas = document.getElementById('hero-bg');
    if (!canvas || typeof THREE === 'undefined') {
      window.PearlBoda?.hideLoader();
      return;
    }

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x1a1a2e, 8, 25);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2.5, 6);

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !reduced });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, reduced ? 1 : 2));
    renderer.setClearColor(0x1a1a2e, 1);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffc107, 1.2);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe65100, 0.4);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    scene.add(createRoad());
    motorcycle = createMotorcycle();
    scene.add(motorcycle);

    if (!reduced) {
      particles = createParticles(120);
      scene.add(particles);
    }

    const geoGroup = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const geo = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.15 + Math.random() * 0.1),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? 0x2e7d32 : 0xffc107,
          transparent: true,
          opacity: 0.4
        })
      );
      geo.position.set(
        (Math.random() - 0.5) * 12,
        1 + Math.random() * 4,
        (Math.random() - 0.5) * 6 - 2
      );
      geo.userData.speed = 0.002 + Math.random() * 0.004;
      geoGroup.add(geo);
    }
    scene.add(geoGroup);
    scene.userData.geoGroup = geoGroup;

    document.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    window.addEventListener('resize', onResize);
    animate();
    window.PearlBoda?.hideLoader();
  }

  function onResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    const t = Date.now() * 0.001;

    if (motorcycle && !reduced) {
      motorcycle.position.y = -0.5 + Math.sin(t * 2) * 0.05;
      motorcycle.rotation.y = Math.sin(t * 0.5) * 0.08;
    }

    if (particles && !reduced) {
      particles.rotation.y = t * 0.05;
      const pos = particles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += 0.003;
        if (pos[i] > 8) pos[i] = 0;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    }

    if (scene.userData.geoGroup && !reduced) {
      scene.userData.geoGroup.children.forEach((geo) => {
        geo.rotation.x += geo.userData.speed;
        geo.rotation.y += geo.userData.speed * 0.7;
        geo.position.y += Math.sin(t + geo.position.x) * 0.002;
      });
    }

    if (!reduced) {
      camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.05;
      camera.position.y += (2.5 - mouseY * 0.5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0.5, 0);
    }

    renderer.render(scene, camera);
  }

  function initGSAP() {
    if (reduced || typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.from('#hero-content h1', {
      opacity: 0, y: 40, duration: 1, delay: 0.3, ease: 'power3.out'
    });
    gsap.from('#hero-content .tagline', {
      opacity: 0, y: 30, duration: 0.8, delay: 0.5, ease: 'power3.out'
    });
    gsap.from('#hero-content .hero-cta-group', {
      opacity: 0, y: 20, duration: 0.8, delay: 0.7, ease: 'power3.out'
    });

    gsap.utils.toArray('.prop-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 85%' },
        opacity: 0, y: 50, duration: 0.6, delay: i * 0.1, ease: 'power2.out'
      });
    });

    gsap.utils.toArray('.city-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: { trigger: card, start: 'top 85%' },
        opacity: 0, scale: 0.9, duration: 0.7, delay: i * 0.12, ease: 'back.out(1.4)'
      });
    });

    gsap.utils.toArray('.step').forEach((step, i) => {
      gsap.from(step, {
        scrollTrigger: { trigger: step, start: 'top 85%' },
        opacity: 0, x: i % 2 === 0 ? -30 : 30, duration: 0.6, delay: i * 0.15, ease: 'power2.out'
      });
    });

    initTestimonialCarousel();
  }

  function initTestimonialCarousel() {
    const track = document.querySelector('.testimonials-track');
    if (!track) return;

    const cards = track.querySelectorAll('.testimonial-card');
    if (cards.length < 2) return;

    let index = 0;
    setInterval(() => {
      index = (index + 1) % cards.length;
      gsap.to(track, {
        x: -index * (cards[0].offsetWidth + 32),
        duration: 0.8,
        ease: 'power2.inOut'
      });
    }, 5000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (reduced) {
      window.PearlBoda?.hideLoader();
    } else {
      initThree();
    }
    initGSAP();
  });

  window.addEventListener('beforeunload', () => {
    if (animationId) cancelAnimationFrame(animationId);
    if (renderer) renderer.dispose();
  });
})();
