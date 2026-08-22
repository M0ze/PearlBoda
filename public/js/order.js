/**
 * PearlBoda Order Page — multi-step form, validation, 3D map preview, Socket.IO
 */
(function () {
  'use strict';

  const reduced = window.PearlBoda?.prefersReducedMotion ?? false;
  const CITY_COORDS = {
    Hioma: { x: -2, y: 0, color: 0x2e7d32 },
    Kampala: { x: 0, y: 0, color: 0xe65100 },
    Fortportal: { x: 2, y: 0, color: 0x1565c0 }
  };

  let currentStep = 1;
  const totalSteps = 3;
  let mapScene, mapRenderer, mapCamera, pickupPin, dropoffPin, bikeIcon;
  let currentRideId = null;
  let socket = null;

  const form = document.getElementById('rideForm');
  const progressFill = document.getElementById('progressFill');
  const statusPanel = document.getElementById('rideStatus');
  const modal = document.getElementById('confirmModal');

  function initMapPreview() {
    const canvas = document.getElementById('order-map-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    mapScene = new THREE.Scene();
    mapScene.background = new THREE.Color(0x1a1a2e);

    mapCamera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    mapCamera.position.set(0, 4, 5);
    mapCamera.lookAt(0, 0, 0);

    mapRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    mapRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
    mapRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 6),
      new THREE.MeshStandardMaterial({ color: 0x2d2d44, roughness: 0.9 })
    );
    ground.rotation.x = -Math.PI / 2;
    mapScene.add(ground);

    const gridHelper = new THREE.GridHelper(8, 8, 0x4a4a68, 0x3d3d55);
    mapScene.add(gridHelper);

    Object.entries(CITY_COORDS).forEach(([name, { x, y, color }]) => {
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2 })
      );
      marker.rotation.x = Math.PI / 2;
      marker.position.set(x, 0.03, y);
      marker.userData.city = name;
      mapScene.add(marker);
    });

    const pinGeo = new THREE.ConeGeometry(0.12, 0.35, 8);
    const pickupMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 });
    const dropoffMat = new THREE.MeshStandardMaterial({ color: 0xe65100 });

    pickupPin = new THREE.Mesh(pinGeo, pickupMat);
    pickupPin.position.set(0, 0.2, 0);
    pickupPin.visible = false;
    mapScene.add(pickupPin);

    dropoffPin = new THREE.Mesh(pinGeo, dropoffMat);
    dropoffPin.position.set(2, 0.2, 0);
    dropoffPin.visible = false;
    mapScene.add(dropoffPin);

    bikeIcon = createMiniBike();
    bikeIcon.visible = false;
    mapScene.add(bikeIcon);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(3, 5, 3);
    mapScene.add(light);
    mapScene.add(new THREE.AmbientLight(0xffffff, 0.4));

    function animate() {
      requestAnimationFrame(animate);
      if (bikeIcon.visible && !reduced) {
        bikeIcon.rotation.y += 0.02;
        bikeIcon.position.y = 0.3 + Math.sin(Date.now() * 0.003) * 0.05;
      }
      mapRenderer.render(mapScene, mapCamera);
    }
    animate();

    window.addEventListener('resize', () => {
      if (!canvas.clientWidth) return;
      mapCamera.aspect = canvas.clientWidth / canvas.clientHeight;
      mapCamera.updateProjectionMatrix();
      mapRenderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
  }

  function createMiniBike() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0xffc107 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.15), mat);
    body.position.y = 0.15;
    g.add(body);
    return g;
  }

  function updateMapPreview() {
    const pickup = document.getElementById('pickupCity')?.value;
    const dropoff = document.getElementById('dropoffCity')?.value;
    const pickupLoc = document.getElementById('pickupLocation')?.value;
    const dropoffLoc = document.getElementById('dropoffLocation')?.value;

    const routePickup = document.getElementById('routePickup');
    const routeDropoff = document.getElementById('routeDropoff');
    if (routePickup) {
      routePickup.textContent = pickup
        ? `${pickup}${pickupLoc ? ' — ' + pickupLoc : ''}` : 'Select pickup city';
    }
    if (routeDropoff) {
      routeDropoff.textContent = dropoff
        ? `${dropoff}${dropoffLoc ? ' — ' + dropoffLoc : ''}` : 'Select dropoff city';
    }

    if (!pickupPin || !dropoffPin || !bikeIcon) return;

    if (pickup && CITY_COORDS[pickup]) {
      pickupPin.position.set(CITY_COORDS[pickup].x, 0.2, CITY_COORDS[pickup].y);
      pickupPin.visible = true;
    } else {
      pickupPin.visible = false;
    }

    if (dropoff && CITY_COORDS[dropoff]) {
      dropoffPin.position.set(CITY_COORDS[dropoff].x, 0.2, CITY_COORDS[dropoff].y);
      dropoffPin.visible = true;
    } else {
      dropoffPin.visible = false;
    }

    if (pickup && dropoff && CITY_COORDS[pickup] && CITY_COORDS[dropoff]) {
      const mid = {
        x: (CITY_COORDS[pickup].x + CITY_COORDS[dropoff].x) / 2,
        y: (CITY_COORDS[pickup].y + CITY_COORDS[dropoff].y) / 2
      };
      bikeIcon.position.set(mid.x, 0.3, mid.y);
      bikeIcon.visible = true;
    } else {
      bikeIcon.visible = false;
    }
  }

  function showStep(step) {
    currentStep = step;
    document.querySelectorAll('.form-step').forEach(el => {
      el.classList.toggle('active', parseInt(el.dataset.step, 10) === step);
    });
    document.querySelectorAll('.progress-step').forEach(el => {
      const s = parseInt(el.dataset.step, 10);
      el.classList.toggle('active', s === step);
      el.classList.toggle('completed', s < step);
    });
    if (progressFill) {
      progressFill.style.width = `${((step - 1) / (totalSteps - 1)) * 80}%`;
    }
  }

  function validateField(input) {
    const group = input.closest('.form-group');
    if (!group) return true;

    let valid = true;
    let errorMsg = '';

    if (input.required && !String(input.value).trim()) {
      valid = false;
      errorMsg = 'This field is required';
    } else if (input.id === 'phone' && input.value) {
      valid = /^[0-9]{9,15}$/.test(input.value.replace(/\s/g, ''));
      errorMsg = 'Enter a valid phone number (9–15 digits)';
    } else if (input.id === 'passengerName' && input.value.length < 2) {
      valid = false;
      errorMsg = 'Name must be at least 2 characters';
    }

    group.classList.toggle('valid', valid && String(input.value).trim() !== '');
    group.classList.toggle('invalid', !valid);
    const errEl = group.querySelector('.field-error');
    if (errEl) errEl.textContent = errorMsg;

    return valid;
  }

  function validateStep(step) {
    const stepEl = document.querySelector(`.form-step[data-step="${step}"]`);
    const inputs = stepEl.querySelectorAll('input, select');
    let allValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) allValid = false;
    });
    return allValid;
  }

  function initFormNavigation() {
    document.getElementById('btnNext')?.addEventListener('click', () => {
      if (validateStep(currentStep) && currentStep < totalSteps) {
        showStep(currentStep + 1);
      }
    });

    document.getElementById('btnPrev')?.addEventListener('click', () => {
      if (currentStep > 1) showStep(currentStep - 1);
    });

    form?.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('input', () => {
        validateField(input);
        updateMapPreview();
      });
      input.addEventListener('change', updateMapPreview);
    });
  }

  function initGeolocation() {
    document.getElementById('geoBtn')?.addEventListener('click', () => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = document.getElementById('pickupLocation');
          if (loc) {
            loc.value = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
            validateField(loc);
            updateMapPreview();
          }
        },
        () => showMessage('Could not get your location. Please enter manually.', 'error')
      );
    });
  }

  function loadCities() {
    const pickupSelect = document.getElementById('pickupCity');
    const dropoffSelect = document.getElementById('dropoffCity');
    if (!pickupSelect || !dropoffSelect) return;

    fetch('/api/cities')
      .then(r => r.json())
      .then(cities => {
        cities.forEach(city => {
          [pickupSelect, dropoffSelect].forEach(select => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.textContent = city;
            select.appendChild(opt);
          });
        });
      })
      .catch(() => showMessage('Could not load cities.', 'error'));
  }

  function initSocket() {
    if (typeof io === 'undefined') return;
    socket = io();

    socket.on('ride_accepted', (data) => {
      if (data.rideId === currentRideId) {
        updateStatus(`Ride accepted by ${data.driver_name}! They are on their way.`, 'success');
      }
    });

    socket.on('location_update', (data) => {
      if (currentRideId) {
        updateStatus(`Driver location: ${data.location}`, 'info');
      }
    });

    socket.on('ride_completed', () => {
      updateStatus('Ride completed! Thank you for using PearlBoda.', 'success');
    });
  }

  function updateStatus(text, type) {
    if (!statusPanel) return;
    statusPanel.textContent = text;
    statusPanel.className = `ride-status-panel ${type}`;
  }

  function showMessage(text, type) {
    const el = document.getElementById('formMessage');
    if (!el) return;
    el.textContent = text;
    el.className = `message ${type}`;
    setTimeout(() => { el.textContent = ''; el.className = 'message'; }, 5000);
  }

  function showConfirmModal(rideId) {
    if (!modal) return;
    document.getElementById('confirmRideId').textContent = `#${rideId}`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    if (!reduced) initCelebration();
  }

  function initCelebration() {
    const canvas = document.getElementById('celebration-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(200, 200);

    const particles = [];
    for (let i = 0; i < 30; i++) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: [0xe65100, 0xffc107, 0x2e7d32][i % 3] })
      );
      mesh.userData.v = {
        x: (Math.random() - 0.5) * 0.08,
        y: 0.02 + Math.random() * 0.06,
        z: (Math.random() - 0.5) * 0.08
      };
      mesh.position.set((Math.random() - 0.5) * 2, -1, (Math.random() - 0.5) * 2);
      scene.add(mesh);
      particles.push(mesh);
    }

    let frame = 0;
    function animate() {
      if (frame++ > 180) return;
      requestAnimationFrame(animate);
      particles.forEach(p => {
        p.position.x += p.userData.v.x;
        p.position.y += p.userData.v.y;
        p.position.z += p.userData.v.z;
        p.userData.v.y -= 0.001;
      });
      renderer.render(scene, camera);
    }
    animate();
  }

  function initFormSubmit() {
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateStep(currentStep)) return;

      const formData = {
        passenger_name: document.getElementById('passengerName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        pickup_city: document.getElementById('pickupCity').value,
        dropoff_city: document.getElementById('dropoffCity').value,
        pickup_location: document.getElementById('pickupLocation').value.trim() || null,
        dropoff_location: document.getElementById('dropoffLocation').value.trim() || null,
        ride_time: document.getElementById('rideTime').value
      };

      fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(r => r.json())
        .then(data => {
          if (data.error) {
            showMessage(data.error, 'error');
          } else {
            currentRideId = data.id;
            socket?.emit('join_ride', { rideId: currentRideId, role: 'customer' });
            updateStatus('Waiting for a driver to accept your ride...', 'info');
            showConfirmModal(data.id);
            form.reset();
            showStep(1);
            document.querySelectorAll('.form-group').forEach(g => {
              g.classList.remove('valid', 'invalid');
            });
            updateMapPreview();
          }
        })
        .catch(() => showMessage('Something went wrong. Please try again.', 'error'));
    });
  }

  document.getElementById('modalClose')?.addEventListener('click', () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  });

  document.addEventListener('DOMContentLoaded', () => {
    initMapPreview();
    initFormNavigation();
    initGeolocation();
    loadCities();
    initSocket();
    initFormSubmit();
    showStep(1);
  });
})();
