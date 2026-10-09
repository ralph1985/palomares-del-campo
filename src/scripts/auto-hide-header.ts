const initializeAutoHideHeader = () => {
  const headers = document.querySelectorAll<HTMLElement>('[data-auto-hide-header]');
  if (headers.length === 0) return;

  let lastScrollY = window.scrollY;

  const setHidden = (hidden: boolean) => {
    headers.forEach((header) => header.classList.toggle('is-hidden', hidden));
  };

  headers.forEach((header) => {
    header.addEventListener('focusin', () => setHidden(false));
  });

  const updateHeader = () => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    if (currentScrollY <= 8 || scrollDelta < -4 || document.body.classList.contains('menu-is-open')) {
      setHidden(false);
    } else if (scrollDelta > 4) {
      setHidden(true);
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener('scroll', updateHeader, { passive: true });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAutoHideHeader, { once: true });
} else {
  initializeAutoHideHeader();
}
