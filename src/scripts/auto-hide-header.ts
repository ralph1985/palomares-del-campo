const initializeAutoHideHeader = () => {
  const headers = document.querySelectorAll<HTMLElement>('[data-auto-hide-header]');
  if (headers.length === 0) return;

  let lastScrollY = window.scrollY;
  let downwardDistance = 0;
  let upwardDistance = 0;

  const setHidden = (hidden: boolean) => {
    headers.forEach((header) => header.classList.toggle('is-hidden', hidden));
  };

  headers.forEach((header) => {
    header.addEventListener('focusin', () => {
      downwardDistance = 0;
      upwardDistance = 0;
      setHidden(false);
    });
  });

  const updateHeader = () => {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    if (currentScrollY <= 8 || document.body.classList.contains('menu-is-open')) {
      downwardDistance = 0;
      upwardDistance = 0;
      setHidden(false);
    } else if (scrollDelta > 0) {
      downwardDistance += scrollDelta;
      upwardDistance = 0;

      if (downwardDistance >= 48) setHidden(true);
    } else if (scrollDelta < 0) {
      upwardDistance += Math.abs(scrollDelta);
      downwardDistance = 0;

      if (upwardDistance >= 8) setHidden(false);
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
