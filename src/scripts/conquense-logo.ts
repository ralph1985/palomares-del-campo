const credits = document.querySelectorAll<HTMLElement>('[data-conquense-logo]');

const initializeCredit = async (credit: HTMLElement) => {
  const canvas = credit.querySelector<HTMLCanvasElement>('[data-conquense-logo-canvas]');
  if (!canvas) return;

  try {
    const THREE = await import('three');
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    camera.position.z = 4.5;

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(
      '/brand/conquense-dev-logo-light.webp',
      () => credit.classList.add('is-ready'),
      undefined,
      () => {
        canvas.hidden = true;
      },
    );
    const heightTexture = textureLoader.load('/brand/conquense-dev-logo-height.webp');
    texture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.PlaneGeometry(3.65, 1.237, 240, 80);
    const logo = new THREE.Group();
    const reliefMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      color: 0x527b68,
      opacity: 0.82,
      side: THREE.DoubleSide,
    });

    for (let depth = 5; depth > 0; depth -= 1) {
      const layer = new THREE.Mesh(geometry, reliefMaterial);
      layer.position.z = -depth * 0.018;
      logo.add(layer);
    }

    const face = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: texture,
        displacementMap: heightTexture,
        displacementScale: 0.055,
        displacementBias: -0.018,
        transparent: true,
        side: THREE.DoubleSide,
      }),
    );
    logo.add(face);
    scene.add(logo);

    const resize = () => {
      const width = canvas.clientWidth || 1;
      const height = canvas.clientHeight || 1;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isVisible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    visibilityObserver.observe(credit);

    const animate = (time: number) => {
      requestAnimationFrame(animate);

      if (isVisible && !reducedMotion) {
        logo.rotation.y = time * 0.0008;
        logo.rotation.x = Math.sin(time * 0.0007) * 0.035;
      }

      if (isVisible) renderer.render(scene, camera);
    };

    requestAnimationFrame(animate);
  } catch {
    canvas.hidden = true;
  }
};

credits.forEach((credit) => void initializeCredit(credit));
