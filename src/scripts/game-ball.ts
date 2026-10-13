const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-game-ball]'));

if (roots.length > 0) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const initialize = async (root: HTMLElement) => {
    if (root.dataset.initialized === 'true') return;

    const canvas = root.querySelector<HTMLCanvasElement>('[data-game-ball-canvas]');
    if (!canvas) return;

    root.dataset.initialized = 'true';

    try {
      const THREE = await import('three');
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(25, 1, 0.1, 100);
      camera.position.set(0, 0, 3.6);

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const ambientLight = new THREE.AmbientLight(0xfff3d4, 1.7);
      const keyLight = new THREE.DirectionalLight(0xffd08e, 2.8);
      keyLight.position.set(-2, 3, 4);
      scene.add(ambientLight, keyLight);

      const group = new THREE.Group();
      group.rotation.set(0.12, -0.18, -0.12);
      scene.add(group);

      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.86, 32, 20),
        new THREE.MeshStandardMaterial({
          color: 0xd99b57,
          roughness: 0.36,
          metalness: 0.08,
        }),
      );
      group.add(ball);

      const seam = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.018, 8, 64),
        new THREE.MeshBasicMaterial({
          color: 0xffedc4,
          transparent: true,
          opacity: 0.58,
        }),
      );
      seam.rotation.x = 0.7;
      seam.rotation.z = 0.25;
      group.add(seam);

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
        group.rotation.y = -0.18 + Math.sin(time * 0.00055) * 0.18;
        group.rotation.x = 0.12 + Math.cos(time * 0.00042) * 0.07;
        seam.rotation.z = 0.25 + Math.sin(time * 0.00035) * 0.08;
        render();
        requestAnimationFrame(animate);
      };

      const observer = new ResizeObserver(resize);
      observer.observe(root);
      resize();
      root.classList.add('is-ready');
      render();

      if (!reducedMotion) {
        requestAnimationFrame(animate);
      }
    } catch {
      canvas.remove();
    }
  };

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        void initialize(entry.target as HTMLElement);
        visibilityObserver.unobserve(entry.target);
      });
    },
    { rootMargin: '160px' },
  );

  roots.forEach((root) => visibilityObserver.observe(root));
}
