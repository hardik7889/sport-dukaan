/* ============================================================
   Sport Dukaan — 3D hero layer (Three.js scene + 3D type + tilt)
   Sab kuch graceful: THREE na mile to flat hero, error nahi.
   ============================================================ */
(function () {
  'use strict';
  var tiltBound = false;
  var sceneHost = null;   // jis element par scene chal raha hai
  var rafId = null;
  var parallaxBound = false;

  /* Ek line ko letter spans mein todo (arc wala 3D text) */
  function split3D() {
    document.querySelectorAll('.split-3d').forEach(function (el) {
      if (el.getAttribute('data-built') === '1') return;
      const text = el.textContent;
      el.textContent = '';
      el.setAttribute('data-built', '1');
      [...text].forEach(function (ch, i) {
        const s = document.createElement('i');
        s.textContent = ch === ' ' ? '\u00A0' : ch;
        s.style.setProperty('--i', i);
        el.appendChild(s);
      });
    });
  }

  /* Card par mouse se 3D tilt */
  function attachTilt() {
    if (tiltBound) return;
    tiltBound = true;
    document.addEventListener('pointermove', function (e) {
      const card = e.target.closest ? e.target.closest('.tilt') : null;
      document.querySelectorAll('.tilt.live').forEach(function (c) {
        if (c !== card) {
          c.classList.remove('live');
          c.style.transform = '';
        }
      });
      if (!card) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.classList.add('live');
      card.style.transform =
        'perspective(900px) rotateX(' + (-py * 7).toFixed(2) + 'deg) rotateY(' + (px * 9).toFixed(2) + 'deg) translateZ(6px)';
    }, { passive: true });
  }

  function stopLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function startScene(host) {
    if (host.querySelector('canvas')) return;   // is host par pehle se scene hai
    stopLoop();
    let w = host.clientWidth || 1, h = host.clientHeight || 1;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    cam.position.z = 9;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);

    const N = 850;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const points = new THREE.Points(pg, new THREE.PointsMaterial({
      color: 0x5ee7ff, size: 0.05, transparent: true, opacity: 0.75
    }));
    scene.add(points);

    const ico = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.3, 1),
      new THREE.MeshBasicMaterial({ color: 0x5ee7ff, wireframe: true, transparent: true, opacity: 0.32 })
    );
    scene.add(ico);

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(5.4, 0.02, 8, 90),
      new THREE.MeshBasicMaterial({ color: 0xff5fa2, transparent: true, opacity: 0.5 })
    );
    torus.rotation.x = Math.PI / 2.4;
    scene.add(torus);

    const torus2 = new THREE.Mesh(
      new THREE.TorusGeometry(6.6, 0.012, 8, 90),
      new THREE.MeshBasicMaterial({ color: 0xb6ff5c, transparent: true, opacity: 0.28 })
    );
    torus2.rotation.x = Math.PI / 1.9;
    scene.add(torus2);

    if (!parallaxBound) {
      parallaxBound = true;
      window.addEventListener('pointermove', function (e) {
        window.__holoMx = e.clientX / window.innerWidth - 0.5;
        window.__holoMy = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });
    }
    let mx = 0, my = 0;

    window.addEventListener('resize', function () {
      w = host.clientWidth || 1; h = host.clientHeight || 1;
      cam.aspect = w / h; cam.updateProjectionMatrix();
      renderer.setSize(w, h);
    });

    sceneHost = host;
    (function loop(t) {
      if (sceneHost !== host) return;   // naya scene bana diya, yeh band
      rafId = requestAnimationFrame(loop);
      mx += ((window.__holoMx || 0) * 1.8 - mx) * 0.05;
      my += ((window.__holoMy || 0) * -1.2 - my) * 0.05;
      points.rotation.y = t * 0.00012;
      ico.rotation.x = t * 0.00025;
      ico.rotation.y = t * 0.00035;
      torus.rotation.z = t * 0.0002;
      torus2.rotation.z = -t * 0.00015;
      cam.position.x += (mx - cam.position.x) * 0.05;
      cam.position.y += (my - cam.position.y) * 0.05;
      cam.lookAt(0, 0, 0);
      renderer.render(scene, cam);
    })(0);
  }

  function boot() {
    split3D();
    attachTilt();
    var host = document.getElementById('holo-bg');
    if (!host) return;
    if (window.THREE) {
      try { startScene(host); }
      catch (err) { host.classList.add('no-webgl'); }
    } else {
      host.classList.add('no-webgl');
    }
  }

  window.holoBoot = boot;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
