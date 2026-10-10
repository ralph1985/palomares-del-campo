const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const closeButton = document.querySelector<HTMLButtonElement>('[data-menu-close]');
const menu = document.querySelector<HTMLElement>('#site-menu');
const backdrop = document.querySelector<HTMLButtonElement>('[data-menu-backdrop]');
const sceneCanvas = document.querySelector<HTMLCanvasElement>('#menu-scene');

if (toggle && closeButton && menu && backdrop) {
  let isOpen = false;
  let sceneInitialization: Promise<void> | undefined;

  const loadScene = () => {
    if (!sceneCanvas || !menu) return Promise.resolve();

    sceneInitialization ??= import('./menu-scene').then(({ initializeMenuScene }) =>
      initializeMenuScene(sceneCanvas, menu),
    );
    return sceneInitialization;
  };

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
      void loadScene();
    } else {
      menu.setAttribute('inert', '');
      toggle.focus();
    }
  };

  toggle.addEventListener('click', () => setMenuOpen(!isOpen));
  closeButton.addEventListener('click', () => setMenuOpen(false));
  backdrop.addEventListener('click', () => setMenuOpen(false));

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setMenuOpen(false);
  });
}
