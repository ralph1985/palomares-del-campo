const STORAGE_KEY = 'palomares-page-transition';
const SCENE_LOAD_TIMEOUT_MS = 1_200;
const SCENE_RUN_TIMEOUT_MS = 3_800;
const FALLBACK_OUTGOING_MS = 220;
const SETTLE_MS = 260;

type TransitionScene = typeof import('./page-transition-scene');

const overlay = document.querySelector<HTMLDivElement>('[data-page-transition-overlay]');
const sceneHost = overlay?.querySelector<HTMLDivElement>('[data-page-transition-scene]');
const pageRoot = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const wait = (duration: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, duration));

const cloneCurrentBody = (): HTMLElement => {
  const copy = document.createElement('body');
  Array.from(document.body.attributes).forEach((attribute) => {
    copy.setAttribute(attribute.name, attribute.value);
  });
  copy.replaceChildren(...Array.from(document.body.childNodes, (node) => node.cloneNode(true)));
  copy.scrollTop = window.scrollY;
  return copy;
};

const loadScene = (): Promise<TransitionScene> =>
  new Promise((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error('Three.js transition scene did not load in time.')),
      SCENE_LOAD_TIMEOUT_MS,
    );

    void import('./page-transition-scene').then(
      (scene) => {
        window.clearTimeout(timeout);
        resolve(scene);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });

const playScene = async (
  destinationUrl: string,
  sourceBodySnapshot: HTMLElement,
): Promise<void> => {
  if (!sceneHost || !overlay) throw new Error('The page transition scene is unavailable.');

  const abortController = new AbortController();
  const timeout = window.setTimeout(() => abortController.abort(), SCENE_RUN_TIMEOUT_MS);

  try {
    const { playPageTransition } = await loadScene();
    await playPageTransition(
      sceneHost,
      destinationUrl,
      sourceBodySnapshot,
      abortController.signal,
      () => {
        overlay.dataset.renderer = 'three-css3d';
        overlay.dataset.phase = 'outgoing';
      },
    );
  } finally {
    window.clearTimeout(timeout);
  }
};

const revealPage = () => {
  pageRoot.removeAttribute('data-page-transition-state');
  if (!overlay) return;

  overlay.dataset.phase = 'settling';
  window.setTimeout(() => {
    if (overlay.dataset.phase !== 'settling') return;
    overlay.dataset.phase = 'idle';
    overlay.dataset.renderer = 'none';
  }, SETTLE_MS);
};

const playFallback = async () => {
  if (!overlay) return;
  overlay.dataset.renderer = 'css';
  overlay.dataset.phase = 'fallback-outgoing';
  await wait(FALLBACK_OUTGOING_MS);
};

const startIncomingTransition = () => {
  if (!overlay || pageRoot.dataset.pageTransitionState !== 'incoming') return;

  overlay.dataset.renderer = 'none';
  revealPage();
};

const getTransitionLink = (
  event: MouseEvent,
): { link: HTMLAnchorElement; destination: URL } | null => {
  if (!(event.target instanceof Element)) return null;
  const link = event.target.closest<HTMLAnchorElement>('a[href]');
  if (!link || link.hasAttribute('data-no-page-transition') || link.hasAttribute('download')) {
    return null;
  }
  if (link.relList.contains('external') || (link.target && link.target.toLowerCase() !== '_self')) {
    return null;
  }

  let destination: URL;
  try {
    destination = new URL(link.href, window.location.href);
  } catch {
    return null;
  }

  const current = new URL(window.location.href);
  if (
    destination.origin !== current.origin ||
    (destination.pathname === current.pathname && destination.search === current.search)
  ) {
    return null;
  }

  return { link, destination };
};

if (overlay && sceneHost) {
  startIncomingTransition();

  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented) return;
      const navigation = getTransitionLink(event);
      if (!navigation) return;

      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        reducedMotion.matches
      ) {
        return;
      }

      if (overlay.dataset.phase !== 'idle') {
        event.preventDefault();
        return;
      }

      const sourceBodySnapshot = cloneCurrentBody();
      event.preventDefault();
      pageRoot.dataset.pageTransitionState = 'outgoing';
      overlay.dataset.phase = 'preparing';
      overlay.dataset.renderer = 'loading';

      void playScene(navigation.destination.href, sourceBodySnapshot)
        .catch(() => playFallback())
        .then(() => {
          try {
            window.sessionStorage.setItem(STORAGE_KEY, 'incoming');
          } catch {
            // Storage can be disabled; the destination still loads normally.
          }
          window.location.assign(navigation.destination.href);
        });
    },
    true,
  );

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    pageRoot.removeAttribute('data-page-transition-state');
    overlay.dataset.phase = 'idle';
    overlay.dataset.renderer = 'none';
  });
}
