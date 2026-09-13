// ===== Forge core — hero WebGL scene =====
// Self-contained module: doesn't depend on load order relative to
// other scripts. If the CDN import fails (offline, blocked network),
// this silently no-ops and the hero still reads fine — the card
// border, corner marks and HUD text around it carry the visual.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

(function initForgeScene() {
  const canvas = document.getElementById('forgeCanvas');
  const container = canvas ? canvas.closest('.hero-visual') : null;
  if (!canvas || !container) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.innerWidth < 720;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    return; // no WebGL support — hero HUD chrome still stands on its own
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  function resize() {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  const SIGNAL = 0x1e8a52; // deep emerald — legible line-art against the white card
  const VIOLET = 0x2fa968; // secondary emerald tone, for fragment variety (same hue family)

  // --- Core: wireframe icosahedron, the "forged" solid ---
  const coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
  const coreEdges = new THREE.EdgesGeometry(coreGeo);
  const coreMat = new THREE.LineBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0 });
  const core = new THREE.LineSegments(coreEdges, coreMat);
  scene.add(core);

  const dotMat = new THREE.MeshBasicMaterial({ color: SIGNAL, transparent: true, opacity: 0 });
  const dot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), dotMat);
  scene.add(dot);

  // --- Fragments: raw material flying in and settling into orbit ---
  const FRAG_COUNT = isSmall ? 7 : 12;
  const fragments = [];
  for (let i = 0; i < FRAG_COUNT; i++) {
    const size = 0.09 + Math.random() * 0.09;
    const geo = new THREE.TetrahedronGeometry(size);
    const edges = new THREE.EdgesGeometry(geo);
    const color = i % 3 === 0 ? VIOLET : SIGNAL;
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0 });
    const mesh = new THREE.LineSegments(edges, mat);

    const phi = Math.acos(-1 + (2 * i) / FRAG_COUNT);
    const theta = Math.sqrt(FRAG_COUNT * Math.PI) * phi;
    const r = 2.5 + Math.random() * 0.5;
    const finalPos = new THREE.Vector3(
      r * Math.cos(theta) * Math.sin(phi),
      r * Math.sin(theta) * Math.sin(phi),
      r * Math.cos(phi) * 0.6
    );
    const startPos = finalPos.clone().multiplyScalar(2.8 + Math.random() * 1.6);

    mesh.position.copy(reduced ? finalPos : startPos);
    scene.add(mesh);
    fragments.push({
      mesh, mat, finalPos, startPos,
      delay: 0.15 + i * 0.06,
      duration: 1.5 + Math.random() * 0.6,
      spin: 0.003 + Math.random() * 0.004,
    });
  }

  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }

  // --- Mouse parallax tilt (desktop only, ignored under reduced motion) ---
  let targetTiltX = 0, targetTiltY = 0;
  if (!reduced) {
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      targetTiltX = ((e.clientY - rect.top) / rect.height - 0.5) * 0.5;
      targetTiltY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
    });
    container.addEventListener('mouseleave', () => { targetTiltX = 0; targetTiltY = 0; });
  }

  // --- Visibility gating: don't spend cycles off-screen or on a hidden tab ---
  let isIntersecting = true;
  new IntersectionObserver((entries) => {
    entries.forEach((en) => { isIntersecting = en.isIntersecting; });
  }, { threshold: 0.05 }).observe(container);

  let tabVisible = true;
  document.addEventListener('visibilitychange', () => { tabVisible = !document.hidden; });

  const clock = new THREE.Clock();
  let tiltX = 0, tiltY = 0;

  function tick() {
    requestAnimationFrame(tick);
    if (!isIntersecting || !tabVisible) return;
    const t = clock.getElapsedTime();

    // assembly-in (runs once near the start; harmless no-op after)
    if (!reduced) {
      fragments.forEach((f) => {
        const p = Math.min(Math.max((t - f.delay) / f.duration, 0), 1);
        const e = easeOutCubic(p);
        f.mesh.position.lerpVectors(f.startPos, f.finalPos, e);
        f.mat.opacity = 0.75 * Math.min(p * 2, 1);
        f.mesh.rotation.x += f.spin;
        f.mesh.rotation.y += f.spin * 1.4;
      });
      const coreP = Math.min(t / 1.4, 1);
      const coreE = easeOutCubic(coreP);
      core.scale.setScalar(0.3 + 0.7 * coreE);
      coreMat.opacity = 0.85 * coreE;
      dotMat.opacity = coreE;

      core.rotation.y += 0.0022;
      core.rotation.x += 0.0009;
      tiltX += (targetTiltX - tiltX) * 0.04;
      tiltY += (targetTiltY - tiltY) * 0.04;
      scene.rotation.x = tiltX;
      scene.rotation.y = tiltY + t * 0.02;
    } else {
      // reduced motion: render one settled, static frame
      fragments.forEach((f) => { f.mat.opacity = 0.75; f.mesh.position.copy(f.finalPos); });
      core.scale.setScalar(1);
      coreMat.opacity = 0.85;
      dotMat.opacity = 1;
    }

    renderer.render(scene, camera);
  }
  tick();
})();