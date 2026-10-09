import * as THREE from 'three';

const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const close = document.querySelector<HTMLButtonElement>('[data-menu-close]');
const menu = document.querySelector<HTMLElement>('#site-menu');
const backdrop = document.querySelector<HTMLButtonElement>('[data-menu-backdrop]');
const sceneCanvas = document.querySelector<HTMLCanvasElement>('#menu-scene');

if (toggle && close && menu && backdrop) {
  let isOpen = false;

  const setMenuOpen = (open: boolean) => {
    isOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-is-open', open);
    backdrop.hidden = !open;

    if (open) {
      menu.removeAttribute('inert');
      menu.querySelector<HTMLElement>('a, button')?.focus();
    } else {
      menu.setAttribute('inert', '');
      toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setMenuOpen(!isOpen));
  close.addEventListener('click', () => setMenuOpen(false));
  backdrop.addEventListener('click', () => setMenuOpen(false));

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setMenuOpen(false);
  });
}

if (sceneCanvas && menu) {
  let renderer: THREE.WebGLRenderer;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas: sceneCanvas,
      alpha: true,
      antialias: true,
    });
  } catch {
    sceneCanvas.hidden = true;
  }

  if (renderer) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.z = 6;

    const constellation = new THREE.Group();
    const globe = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.18, 2),
      new THREE.MeshBasicMaterial({
        color: 0xb7ddc2,
        transparent: true,
        opacity: 0.5,
        wireframe: true,
      }),
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.012, 12, 96),
      new THREE.MeshBasicMaterial({
        color: 0xe8c38a,
        transparent: true,
        opacity: 0.72,
      }),
    );
    ring.rotation.set(0.72, 0.16, -0.35);
    constellation.add(globe, ring);

    const starPositions = new Float32Array(180 * 3);
    for (let index = 0; index < starPositions.length; index += 3) {
      starPositions[index] = (Math.random() - 0.5) * 5.5;
      starPositions[index + 1] = (Math.random() - 0.5) * 4.5;
      starPositions[index + 2] = (Math.random() - 0.5) * 2.5;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0xdbeedb,
        size: 0.035,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      }),
    );

    scene.add(constellation, stars);

    const resize = () => {
      const width = sceneCanvas.clientWidth || 1;
      const height = sceneCanvas.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(sceneCanvas);
    resize();

    const pointer = { x: 0, y: 0 };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    menu.addEventListener('pointermove', (event) => {
      const bounds = menu.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 0.35;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 0.2;
    });

    const animate = (time: number) => {
      requestAnimationFrame(animate);

      if (!menu.classList.contains('is-open')) return;

      const seconds = time * 0.00035;
      constellation.rotation.y = reducedMotion ? 0.25 : seconds + pointer.x;
      constellation.rotation.x = reducedMotion ? -0.08 : Math.sin(seconds * 1.7) * 0.08 + pointer.y;
      ring.rotation.z = reducedMotion ? -0.35 : seconds * 1.4 - 0.35;
      stars.rotation.y = reducedMotion ? 0 : -seconds * 0.25;
      renderer.render(scene, camera);
    };

    requestAnimationFrame(animate);
  }
}
