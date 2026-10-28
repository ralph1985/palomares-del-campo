export {};

const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-about-emblem]'));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const smallScreen = window.matchMedia('(max-width: 42rem)').matches;

if (reducedMotion || smallScreen) {
  roots.forEach((root) => root.querySelector('[data-about-emblem-canvas]')?.remove());
} else if (roots.length > 0) {
  const initialize = async (root: HTMLElement) => {
    if (root.dataset.initialized === 'true') return;

    const canvas = root.querySelector<HTMLCanvasElement>('[data-about-emblem-canvas]');
    if (!canvas) return;

    root.dataset.initialized = 'true';

    try {
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      camera.position.z = 3.25;

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const group = new THREE.Group();
      group.rotation.y = -0.12;
      scene.add(group);

      const geometry = new THREE.PlaneGeometry(1.4, 2.42, 16, 24);
      const backing = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: 0x203f34,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.72,
        }),
      );
      backing.position.z = -0.06;
      backing.scale.set(1.02, 1.02, 1);
      group.add(backing);

      const texture = new THREE.TextureLoader().load(
        '/brand/escudo-palomares-del-campo.svg',
        (loadedTexture) => {
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          const emblem = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({
              map: loadedTexture,
              side: THREE.DoubleSide,
              transparent: true,
            }),
          );
          group.add(emblem);
          root.classList.add('is-ready');
          render();

          if (!reducedMotion) {
            requestAnimationFrame(animate);
          }
        },
        undefined,
        () => {
          renderer.dispose();
          canvas.remove();
        },
      );
      texture.colorSpace = THREE.SRGBColorSpace;

      const resize = () => {
        const bounds = root.getBoundingClientRect();
        const width = Math.max(1, bounds.width);
        const height = Math.max(1, bounds.height);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const render = () => renderer.render(scene, camera);
      const animate = (time: number) => {
        if (!root.isConnected) return;
        group.rotation.y = -0.12 + Math.sin(time * 0.00045) * 0.12;
        group.rotation.x = Math.cos(time * 0.00032) * 0.035;
        render();
        requestAnimationFrame(animate);
      };

      const observer = new ResizeObserver(resize);
      observer.observe(root);
      resize();
    } catch {
      canvas.remove();
    }
  };

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        visibilityObserver.unobserve(entry.target);
        if (!(entry.target instanceof HTMLElement)) return;
        void initialize(entry.target);
      });
    },
    { rootMargin: '160px' },
  );

  roots.forEach((root) => visibilityObserver.observe(root));
}
