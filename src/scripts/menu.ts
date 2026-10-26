const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const closeButton = document.querySelector<HTMLButtonElement>('[data-menu-close]');
const menu = document.querySelector<HTMLElement>('#site-menu');
const backdrop = document.querySelector<HTMLButtonElement>('[data-menu-backdrop]');
const sceneCanvas = document.querySelector<HTMLCanvasElement>('#menu-scene');

if (toggle && closeButton && menu && backdrop) {
  let isOpen = false;
  let sceneInitialization: Promise<void> | undefined;
  const desktopMenu = window.matchMedia('(min-width: 72rem)');

  const loadScene = () => {
    if (!sceneCanvas || !menu) return Promise.resolve();

    sceneInitialization ??= import('./menu-scene')
      .then(({ initializeMenuScene }) => initializeMenuScene(sceneCanvas, menu))
      .catch(() => {
        sceneCanvas.hidden = true;
      });
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

  const syncDesktopMenu = () => {
    if (desktopMenu.matches) {
      isOpen = true;
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      menu.classList.add('is-open');
      menu.removeAttribute('inert');
      backdrop.hidden = true;
      document.body.classList.remove('menu-is-open');
      return;
    }

    if (isOpen) setMenuOpen(false);
  };

  syncDesktopMenu();
  desktopMenu.addEventListener('change', syncDesktopMenu);

  toggle.addEventListener('click', () => setMenuOpen(!isOpen));
  closeButton.addEventListener('click', () => setMenuOpen(false));
  backdrop.addEventListener('click', () => setMenuOpen(false));

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
      setMenuOpen(false);
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen) setMenuOpen(false);
  });
}
