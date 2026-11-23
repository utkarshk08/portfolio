import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/*
 * A small kinetic instrument, built entirely from geometry.
 * No external models, texture requests, post-processing chain, or animation library.
 */
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const noop = () => {};
const inertScene = () => ({ setMode: noop, setMotion: noop, setProgress: noop, destroy: noop });

function annularSection(outer, inner, start, end, depth, bevel = 0.035) {
  const shape = new THREE.Shape();
  shape.moveTo(Math.cos(start) * outer, Math.sin(start) * outer);
  shape.absarc(0, 0, outer, start, end, false);
  shape.lineTo(Math.cos(end) * inner, Math.sin(end) * inner);
  shape.absarc(0, 0, inner, end, start, true);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, curveSegments: 48,
    bevelEnabled: true, bevelSegments: 3,
    bevelSize: bevel, bevelThickness: bevel,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeBoundingSphere();
  return geometry;
}

function asteriskGeometry() {
  // Eight broad, square-ended rays, matching the portfolio's small star mark.
  const shape = new THREE.Shape();
  const rayHalfWidth = 0.105;
  const tip = 0.80;
  const root = 0.27;
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8;
    const next = a + TAU / 8;
    const c = Math.cos(a), s = Math.sin(a);
    const points = [
      [c * tip + s * rayHalfWidth, s * tip - c * rayHalfWidth],
      [c * tip - s * rayHalfWidth, s * tip + c * rayHalfWidth],
      [Math.cos((a + next) / 2) * root, Math.sin((a + next) / 2) * root],
    ];
    points.forEach(([x, y], p) => {
      if (i === 0 && p === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.32, steps: 1, bevelEnabled: true,
    bevelThickness: 0.045, bevelSize: 0.04, bevelSegments: 4,
  });
  geometry.translate(0, 0, -0.16);
  return geometry;
}

function pose(x, y, z, rx, ry, rz) {
  return {
    position: new THREE.Vector3(x, y, z),
    rotation: new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
  };
}

export function initScene(container, { motion = true } = {}) {
  if (!container) return inertScene();
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch {
    container.dataset.scene = 'fallback';
    return inertScene();
  }

  let scene, environment;
  let disposed = false, contextLost = false, visible = true;
  let requestedMotion = Boolean(motion), motionEnabled = requestedMotion && !reducedQuery.matches;
  let raf = 0, elapsed = 0, previousTime = 0, mode = 0;
  let progress = 0, targetProgress = 0;
  let pointerX = 0, pointerY = 0, smoothPointerX = 0, smoothPointerY = 0;
  let dragYaw = 0, dragPitch = 0, smoothDragYaw = 0, smoothDragPitch = 0;
  let velocityYaw = 0, velocityPitch = 0, activePointer = null;
  let previousPointerX = 0, previousPointerY = 0, lastPointerTime = 0;
  let firstRender = false;
  const parts = [];
  const fragments = [];
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;outline:none;';
  container.append(canvas);

  try {
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    environment = pmrem.fromScene(room, 0.035).texture;
    scene.environment = environment;
    scene.environmentRotation.set(0.15, 0.72, -0.12);
    room.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
    camera.position.set(0, 0.05, 8.9);
    camera.lookAt(0, 0, 0);

    const assembly = new THREE.Group();
    const instrument = new THREE.Group();
    assembly.add(instrument);
    scene.add(assembly);

    const chrome = new THREE.MeshPhysicalMaterial({
      color: 0xbfc7c5, metalness: 1, roughness: 0.18,
      clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.25,
    });
    const porcelain = new THREE.MeshPhysicalMaterial({
      color: 0xf4f0e4, metalness: 0.72, roughness: 0.2,
      clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.05,
    });
    const darkMetal = new THREE.MeshPhysicalMaterial({
      color: 0x272b2d, metalness: 0.95, roughness: 0.22,
      clearcoat: 0.6, envMapIntensity: 1.5,
    });
    const orange = new THREE.MeshPhysicalMaterial({
      color: 0xff521d, metalness: 0.28, roughness: 0.26,
      clearcoat: 1, clearcoatRoughness: 0.12,
      emissive: 0xf4360a, emissiveIntensity: 0.08, envMapIntensity: 1.1,
    });
    const enamel = new THREE.MeshPhysicalMaterial({
      color: 0xe6400c, metalness: 0.4, roughness: 0.25,
      clearcoat: 0.8, envMapIntensity: 0.85,
    });
    const engraving = new THREE.MeshStandardMaterial({ color: 0x676b67, metalness: 0.65, roughness: 0.38 });
    const warmWhite = new THREE.MeshStandardMaterial({ color: 0xf3e9d1, metalness: 0.2, roughness: 0.4 });

    const key = new THREE.DirectionalLight(0xfff5df, 4);
    key.position.set(-3.5, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xd9e7f1, 3.3);
    rim.position.set(4, 1.5, -2);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffffff, 1.8);
    fill.position.set(0, -3, 4);
    scene.add(fill);
    const coreLight = new THREE.PointLight(0xff3e08, 7.5, 5.5, 2);
    coreLight.position.set(0.4, 0.25, 0.65);
    instrument.add(coreLight);

    const fastenerGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.045, 16);
    fastenerGeometry.rotateX(Math.PI / 2);
    const slotGeometry = new THREE.BoxGeometry(0.047, 0.009, 0.004);
    const tickGeometry = new THREE.BoxGeometry(0.018, 0.065, 0.01);

    function makeRing(radius, width, depth, segments, material, accent, poses) {
      const group = new THREE.Group();
      const gap = segments === 2 ? 0.12 : 0.085;
      for (let i = 0; i < segments; i++) {
        const start = i * TAU / segments + gap;
        const end = (i + 1) * TAU / segments - gap;
        const mid = (start + end) / 2;
        const piece = new THREE.Group();
        const body = new THREE.Mesh(annularSection(radius, radius - width, start, end, depth), material);
        piece.add(body);

        // An inset track catches a fine second reflection across the broad face.
        const track = new THREE.Mesh(
          annularSection(radius - width * 0.25, radius - width * 0.30, start + 0.025, end - 0.025, 0.009, 0.004),
          accent,
        );
        track.position.z = depth / 2 + 0.037;
        piece.add(track);

        for (const a of [start + 0.11, end - 0.11]) {
          const bolt = new THREE.Mesh(fastenerGeometry, chrome);
          const r = radius - width * 0.64;
          bolt.position.set(Math.cos(a) * r, Math.sin(a) * r, depth / 2 + 0.036);
          const slot = new THREE.Mesh(slotGeometry, darkMetal);
          slot.position.z = 0.025;
          slot.rotation.z = a;
          bolt.add(slot);
          piece.add(bolt);
        }

        for (let t = 0; t < 5; t++) {
          const a = mid + (t - 2) * 0.045;
          const tick = new THREE.Mesh(tickGeometry, t === 2 ? orange : engraving);
          const r = radius - width * 0.64;
          tick.position.set(Math.cos(a) * r, Math.sin(a) * r, depth / 2 + 0.042);
          tick.rotation.z = a - Math.PI / 2;
          piece.add(tick);
        }
        group.add(piece);
        fragments.push({ group: piece, directionX: Math.cos(mid), directionY: Math.sin(mid), amount: 0 });
      }
      group.position.copy(poses[0].position);
      group.quaternion.copy(poses[0].rotation);
      instrument.add(group);
      parts.push({ group, poses });
      return group;
    }

    makeRing(2.08, 0.30, 0.22, 3, chrome, darkMetal, [
      pose(0, 0, 0, 0.30, -0.46, -0.34),
      pose(-0.16, 0.36, -0.72, 0.14, -0.22, -0.34),
      pose(0, 0, 0, 1.04, -0.25, 0.04),
    ]);
    makeRing(1.68, 0.30, 0.30, 2, porcelain, chrome, [
      pose(0, 0, 0.06, 1.03, 0.55, 0.75),
      pose(-0.54, -0.02, 0.18, 0.38, 0.30, 0.18),
      pose(0, 0, 0.05, 0.12, 1.12, 0.68),
    ]);
    makeRing(1.20, 0.23, 0.23, 3, darkMetal, orange, [
      pose(0, 0, 0.07, -0.72, -0.56, 0.46),
      pose(0.45, -0.35, 0.64, -0.24, -0.25, 0.46),
      pose(0, 0, 0.08, -0.72, -0.22, -0.72),
    ]);

    const core = new THREE.Group();
    const star = new THREE.Mesh(asteriskGeometry(), [orange, enamel]);
    star.rotation.z = Math.PI / 8;
    core.add(star);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.37, 48), darkMetal);
    collar.rotation.x = Math.PI / 2;
    core.add(collar);
    const pin = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.15, 0.045, 3, 0.025), porcelain);
    pin.position.z = 0.205;
    pin.rotation.z = Math.PI / 4;
    core.add(pin);
    instrument.add(core);
    parts.push({ group: core, poses: [
      pose(0, 0, 0.17, 0.10, -0.08, 0),
      pose(0.07, -0.20, 1.02, 0.12, -0.20, -0.18),
      pose(0, 0, 0.19, -0.28, 0.44, Math.PI / 4),
    ] });

    // A small pair of radial runners gives the centre a mechanical, connected feel.
    const runnerGeometry = new RoundedBoxGeometry(0.08, 0.47, 0.08, 2, 0.018);
    const runners = new THREE.Group();
    for (const sign of [-1, 1]) {
      const runner = new THREE.Mesh(runnerGeometry, chrome);
      runner.position.set(0, sign * 0.89, 0);
      runners.add(runner);
      const stop = new THREE.Mesh(new RoundedBoxGeometry(0.15, 0.08, 0.13, 2, 0.018), orange);
      stop.position.set(0, sign * 1.04, 0);
      runners.add(stop);
    }
    core.add(runners);

    // Restrained registration markers, kept on the instrument rather than a particle field.
    const rear = new THREE.Group();
    const rearGeometry = annularSection(2.30, 2.285, -0.55, 0.68, 0.012, 0.004);
    const rearArc = new THREE.Mesh(rearGeometry, warmWhite);
    rearArc.material.transparent = true;
    rearArc.material.opacity = 0.33;
    rear.add(rearArc);
    const rearArc2 = new THREE.Mesh(rearGeometry, warmWhite);
    rearArc2.rotation.z = Math.PI;
    rear.add(rearArc2);
    rear.rotation.set(0.3, -0.45, -0.34);
    rear.position.z = -0.09;
    instrument.add(rear);

    const rotationEuler = new THREE.Euler();
    const neutralRotation = new THREE.Quaternion();
    let spread = 0;
    function update(dt, immediate = false) {
      const smooth = immediate ? 1 : 1 - Math.exp(-dt * 5.5);
      const pointerSmooth = immediate ? 1 : 1 - Math.exp(-dt * 3.8);
      progress += (targetProgress - progress) * smooth;
      smoothPointerX += (pointerX - smoothPointerX) * pointerSmooth;
      smoothPointerY += (pointerY - smoothPointerY) * pointerSmooth;
      smoothDragYaw += (dragYaw - smoothDragYaw) * smooth;
      smoothDragPitch += (dragPitch - smoothDragPitch) * smooth;
      if (activePointer === null && motionEnabled) {
        dragYaw += velocityYaw * dt;
        dragPitch = clamp(dragPitch + velocityPitch * dt, -0.65, 0.65);
        const friction = Math.exp(-dt * 7);
        velocityYaw *= friction;
        velocityPitch *= friction;
      }
      spread += ((mode === 1 ? 0.16 : 0) - spread) * smooth;
      parts.forEach(({ group, poses }) => {
        const target = poses[mode];
        group.position.lerp(target.position, smooth);
        group.quaternion.slerp(target.rotation, smooth);
      });
      fragments.forEach(fragment => {
        fragment.group.position.x = fragment.directionX * spread;
        fragment.group.position.y = fragment.directionY * spread;
      });

      const breathe = motionEnabled ? elapsed : 0;
      rotationEuler.set(
        smoothPointerY * 0.10 + smoothDragPitch + Math.sin(breathe * 0.27) * 0.035 + progress * 0.18,
        smoothPointerX * 0.17 + smoothDragYaw + Math.sin(breathe * 0.19) * 0.13 - progress * 0.24,
        Math.sin(breathe * 0.17) * 0.045,
      );
      neutralRotation.setFromEuler(rotationEuler);
      instrument.quaternion.copy(neutralRotation);
      assembly.position.y = Math.sin(breathe * 0.62) * 0.055 + 0.06 - progress * 0.16;
      const scale = mode === 1 ? 0.94 : 1;
      const size = assembly.scale.x + (scale - assembly.scale.x) * smooth;
      assembly.scale.setScalar(size);
      star.rotation.z = Math.PI / 8 + (mode === 2 ? breathe * 0.15 : Math.sin(breathe * 0.29) * 0.09);
      rear.rotation.z = -0.34 - (mode === 2 ? breathe * 0.08 : 0);
      coreLight.intensity = 7.5 + (motionEnabled ? Math.sin(breathe * 0.72) * 0.9 : 0);
    }

    function render() {
      if (disposed || contextLost) return;
      try {
        renderer.render(scene, camera);
        if (!firstRender) {
          firstRender = true;
          container.dataset.scene = 'ready';
        }
      } catch {
        container.dataset.scene = 'fallback';
        contextLost = true;
        stop();
      }
    }

    function tick(timestamp) {
      raf = 0;
      if (!canAnimate()) return;
      const dt = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.04) : 1 / 60;
      previousTime = timestamp;
      elapsed += dt;
      update(dt);
      render();
      if (canAnimate()) raf = requestAnimationFrame(tick);
    }
    function canAnimate() { return motionEnabled && visible && !document.hidden && !disposed && !contextLost; }
    function start() {
      if (canAnimate() && !raf) {
        previousTime = 0;
        raf = requestAnimationFrame(tick);
      }
    }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; previousTime = 0; }
    function resize() {
      if (disposed || contextLost) return;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 600 ? 1.25 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = 8.9 / Math.min(1, camera.aspect / 0.94);
      camera.updateProjectionMatrix();
      update(1 / 60, !motionEnabled);
      render();
      start();
    }

    function onPointerMove(event) {
      if (!motionEnabled) return;
      const bounds = container.getBoundingClientRect();
      pointerX = clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1);
      pointerY = clamp(((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1);
      if (activePointer !== event.pointerId) return;
      const dx = event.clientX - previousPointerX;
      const dy = event.clientY - previousPointerY;
      const now = performance.now();
      const dt = Math.max(0.016, (now - lastPointerTime) / 1000);
      const yawChange = dx / bounds.width * 3.7;
      const pitchChange = dy / bounds.height * 2.1;
      dragYaw += yawChange;
      dragPitch = clamp(dragPitch + pitchChange, -0.65, 0.65);
      velocityYaw = clamp(yawChange / dt, -2.2, 2.2);
      velocityPitch = clamp(pitchChange / dt, -0.8, 0.8);
      previousPointerX = event.clientX;
      previousPointerY = event.clientY;
      lastPointerTime = now;
    }
    function onPointerDown(event) {
      if (!motionEnabled || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
      activePointer = event.pointerId;
      previousPointerX = event.clientX;
      previousPointerY = event.clientY;
      lastPointerTime = performance.now();
      velocityYaw = velocityPitch = 0;
      canvas.style.cursor = 'grabbing';
      container.dataset.dragging = 'true';
      try { canvas.setPointerCapture(event.pointerId); } catch { /* Detached input is harmless. */ }
    }
    function onPointerEnd(event) {
      if (activePointer !== event.pointerId) return;
      activePointer = null;
      canvas.style.cursor = motionEnabled ? 'grab' : 'default';
      delete container.dataset.dragging;
      try { if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); } catch { /* No captured pointer. */ }
    }
    function onPointerLeave() { if (activePointer === null) pointerX = pointerY = 0; }
    function onVisibility() { if (document.hidden) stop(); else { render(); start(); } }
    function onPreferenceChange() {
      motionEnabled = requestedMotion && !reducedQuery.matches;
      if (!motionEnabled) { stop(); update(0, true); render(); }
      else start();
    }
    function onContextLost(event) {
      event.preventDefault();
      contextLost = true;
      container.dataset.scene = 'fallback';
      stop();
    }
    function onContextRestored() {
      contextLost = false;
      firstRender = false;
      resize();
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerEnd);
    canvas.addEventListener('pointercancel', onPointerEnd);
    canvas.addEventListener('lostpointercapture', onPointerEnd);
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    document.addEventListener('visibilitychange', onVisibility);
    reducedQuery.addEventListener?.('change', onPreferenceChange);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0.01 });
    observer.observe(container);
    if (!motionEnabled) canvas.style.cursor = 'default';
    update(0, true);
    resize();

    return {
      setMode(index) {
        if (disposed) return;
        mode = clamp(Math.round(Number(index) || 0), 0, 2);
        velocityYaw = velocityPitch = 0;
        if (!motionEnabled) { update(0, true); render(); }
        else start();
      },
      setMotion(enabled) {
        if (disposed) return;
        requestedMotion = Boolean(enabled);
        motionEnabled = requestedMotion && !reducedQuery.matches;
        canvas.style.cursor = motionEnabled ? 'grab' : 'default';
        if (!motionEnabled) {
          stop();
          pointerX = pointerY = 0;
          velocityYaw = velocityPitch = 0;
          activePointer = null;
          delete container.dataset.dragging;
          update(0, true);
          render();
        } else start();
      },
      setProgress(value) {
        targetProgress = clamp(Number(value) || 0, 0, 1);
        if (!motionEnabled) { update(0, true); render(); }
      },
      destroy() {
        if (disposed) return;
        disposed = true;
        stop();
        resizeObserver.disconnect();
        observer.disconnect();
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointerup', onPointerEnd);
        canvas.removeEventListener('pointercancel', onPointerEnd);
        canvas.removeEventListener('lostpointercapture', onPointerEnd);
        container.removeEventListener('pointermove', onPointerMove);
        container.removeEventListener('pointerleave', onPointerLeave);
        canvas.removeEventListener('webglcontextlost', onContextLost);
        canvas.removeEventListener('webglcontextrestored', onContextRestored);
        document.removeEventListener('visibilitychange', onVisibility);
        reducedQuery.removeEventListener?.('change', onPreferenceChange);
        const geometries = new Set();
        const materials = new Set();
        scene.traverse(node => {
          if (node.geometry) geometries.add(node.geometry);
          if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => materials.add(material));
        });
        geometries.forEach(geometry => geometry.dispose());
        materials.forEach(material => material.dispose());
        environment.dispose();
        renderer.dispose();
        canvas.remove();
        delete container.dataset.scene;
      },
    };
  } catch (error) {
    environment?.dispose();
    renderer.dispose();
    canvas.remove();
    container.dataset.scene = 'fallback';
    console.warn('The 3D scene is unavailable; using the static artwork.', error);
    return inertScene();
  }
}
