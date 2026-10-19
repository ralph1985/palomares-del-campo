import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js';

const TRANSITION_DURATION_MS = 640;
const DESTINATION_FACE_HOLD_MS = 110;
const STYLESHEET_TIMEOUT_MS = 1_300;

const createError = (message: string) => new Error(message);

const waitForStylesheet = (link: HTMLLinkElement, signal: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(
      () => finish(createError('A destination page stylesheet did not load in time.')),
      STYLESHEET_TIMEOUT_MS,
    );

    const finish = (error?: unknown) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      link.removeEventListener('load', onLoad);
      link.removeEventListener('error', onError);
      signal.removeEventListener('abort', onAbort);
      if (error !== undefined) reject(error);
      else resolve();
    };
    const onLoad = () => finish();
    const onError = () => finish(createError('A destination page stylesheet failed to load.'));
    const onAbort = () => finish(new DOMException('Page transition was aborted.', 'AbortError'));

    if (signal.aborted) {
      onAbort();
      return;
    }
    link.addEventListener('load', onLoad, { once: true });
    link.addEventListener('error', onError, { once: true });
    signal.addEventListener('abort', onAbort, { once: true });
  });

const loadDestinationDocument = async (url: URL, signal: AbortSignal): Promise<Document> => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { Accept: 'text/html' },
    signal,
  });
  if (!response.ok) throw createError(`The destination page returned HTTP ${response.status}.`);
  if (new URL(response.url).origin !== window.location.origin) {
    throw createError('The destination page redirected outside this site.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('text/html')) {
    throw createError('The destination route did not return an HTML page.');
  }

  const documentCopy = new DOMParser().parseFromString(await response.text(), 'text/html');
  documentCopy
    .querySelectorAll(
      [
        'script',
        'noscript',
        'iframe',
        'object',
        'embed',
        'video',
        'audio',
        'astro-dev-toolbar',
        'astro-dev-toolbar-toggle',
        'meta[http-equiv="refresh"]',
        '[data-page-transition-overlay]',
        '#site-menu',
        '[data-menu-backdrop]',
        'link[rel="modulepreload"]',
        'link[as="script"]',
      ].join(','),
    )
    .forEach((node) => node.remove());
  documentCopy.body.classList.remove('menu-is-open');

  documentCopy.querySelectorAll('*').forEach((element) => {
    element.getAttributeNames().forEach((attribute) => {
      if (attribute.toLowerCase().startsWith('on')) element.removeAttribute(attribute);
    });
  });

  const base = documentCopy.head.querySelector('base') ?? documentCopy.createElement('base');
  base.href = url.href;
  documentCopy.head.prepend(base);
  return documentCopy;
};

const appendDestinationStyles = async (
  destinationDocument: Document,
  destinationUrl: URL,
  addedStyles: HTMLElement[],
  signal: AbortSignal,
): Promise<void> => {
  const waits: Promise<void>[] = [];
  const loadedStylesheets = new Set(
    Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]')).map(
      (link) => link.href,
    ),
  );

  destinationDocument.querySelectorAll<HTMLStyleElement>('style').forEach((style) => {
    const copy = document.createElement('style');
    Array.from(style.attributes).forEach((attribute) => {
      copy.setAttribute(attribute.name, attribute.value);
    });
    copy.textContent = style.textContent;
    copy.dataset.pageTransitionStyle = 'true';
    document.head.append(copy);
    addedStyles.push(copy);
  });

  destinationDocument
    .querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"]')
    .forEach((sourceLink) => {
      const rawHref = sourceLink.getAttribute('href');
      if (!rawHref) return;
      const href = new URL(rawHref, destinationUrl);
      if (href.origin !== window.location.origin || loadedStylesheets.has(href.href)) return;

      const copy = document.createElement('link');
      Array.from(sourceLink.attributes).forEach((attribute) => {
        copy.setAttribute(attribute.name, attribute.value);
      });
      copy.href = href.href;
      copy.dataset.pageTransitionStyle = 'true';
      addedStyles.push(copy);
      waits.push(waitForStylesheet(copy, signal));
      document.head.append(copy);
      loadedStylesheets.add(href.href);
    });

  await Promise.all(waits);
};

const copyFormState = (source: HTMLElement, copy: HTMLElement) => {
  const sourceControls = source.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >('input, textarea, select');
  const copiedControls = copy.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >('input, textarea, select');

  sourceControls.forEach((sourceControl, index) => {
    const copiedControl = copiedControls.item(index);
    if (!copiedControl) return;

    if (sourceControl instanceof HTMLInputElement && copiedControl instanceof HTMLInputElement) {
      copiedControl.value = sourceControl.value;
      copiedControl.checked = sourceControl.checked;
    } else if (
      sourceControl instanceof HTMLTextAreaElement &&
      copiedControl instanceof HTMLTextAreaElement
    ) {
      copiedControl.value = sourceControl.value;
    } else if (
      sourceControl instanceof HTMLSelectElement &&
      copiedControl instanceof HTMLSelectElement
    ) {
      Array.from(copiedControl.options).forEach((option, optionIndex) => {
        option.selected = sourceControl.options.item(optionIndex)?.selected ?? false;
      });
    }
  });
};

const restoreScrollPositions = (body: HTMLElement) => {
  body
    .querySelectorAll<HTMLElement>(
      '[data-page-transition-scroll-top], [data-page-transition-scroll-left]',
    )
    .forEach((element) => {
      const { pageTransitionScrollTop, pageTransitionScrollLeft } = element.dataset;
      if (pageTransitionScrollTop !== undefined) {
        element.scrollTop = Number(pageTransitionScrollTop);
        delete element.dataset.pageTransitionScrollTop;
      }
      if (pageTransitionScrollLeft !== undefined) {
        element.scrollLeft = Number(pageTransitionScrollLeft);
        delete element.dataset.pageTransitionScrollLeft;
      }
    });
};

const createPageFace = (
  sourceBody: HTMLElement,
  face: 'source' | 'destination',
  width: number,
  height: number,
): HTMLElement => {
  const preserveOpenMenu = face === 'source' && sourceBody.classList.contains('menu-is-open');
  const body = document.createElement('body');
  Array.from(sourceBody.attributes).forEach((attribute) => {
    body.setAttribute(attribute.name, attribute.value);
  });
  body.replaceChildren(...Array.from(sourceBody.childNodes, (node) => node.cloneNode(true)));
  body.dataset.pageTransitionFace = face;
  body.setAttribute('aria-hidden', 'true');
  body.inert = true;
  if (!preserveOpenMenu) {
    body.classList.remove('menu-is-open');
    body.querySelectorAll('#site-menu, [data-menu-backdrop]').forEach((node) => node.remove());
  }
  body.style.width = `${width}px`;
  body.style.height = `${height}px`;
  body.style.minWidth = `${width}px`;
  body.style.minHeight = `${height}px`;
  body.style.maxWidth = `${width}px`;
  body.style.maxHeight = `${height}px`;
  body.style.margin = '0';
  body.style.position = 'relative';
  body.style.overflow = 'auto';
  body.style.overscrollBehavior = 'none';
  body.style.pointerEvents = 'none';
  body.style.scrollbarWidth = 'none';

  body.querySelectorAll('astro-island').forEach((island) => {
    island.replaceWith(...Array.from(island.childNodes, (node) => node.cloneNode(true)));
  });

  body
    .querySelectorAll(
      [
        'script',
        'style',
        'noscript',
        'iframe',
        'object',
        'embed',
        'video',
        'audio',
        'canvas',
        'astro-dev-toolbar',
        'astro-dev-toolbar-toggle',
        '[data-page-transition-overlay]',
      ].join(','),
    )
    .forEach((node) => node.remove());

  body.querySelectorAll('*').forEach((element) => {
    element.getAttributeNames().forEach((attribute) => {
      if (attribute.toLowerCase().startsWith('on')) element.removeAttribute(attribute);
    });
  });

  return body;
};

const createBrandPanel = (label: string, width: number, height: number): HTMLDivElement => {
  const panel = document.createElement('div');
  panel.className = 'page-transition-cube-panel';
  panel.style.width = `${width}px`;
  panel.style.height = `${height}px`;
  panel.setAttribute('aria-hidden', 'true');

  const eyebrow = document.createElement('span');
  eyebrow.textContent = 'Palomares del Campo';
  const title = document.createElement('strong');
  title.textContent = label;
  panel.append(eyebrow, title);
  return panel;
};

export const playPageTransition = async (
  sceneHost: HTMLDivElement,
  destinationHref: string,
  sourceBodySnapshot: HTMLElement,
  signal: AbortSignal,
  onRendererReady: () => void,
): Promise<void> => {
  const destinationUrl = new URL(destinationHref, window.location.href);
  if (destinationUrl.origin !== window.location.origin) {
    throw createError('Only same-origin pages can be placed on the transition cube.');
  }

  const addedStyles: HTMLElement[] = [];
  let renderer: CSS3DRenderer | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let resizeHandler: (() => void) | undefined;
  let animationFrame = 0;
  let faceHoldTimer = 0;
  let resourcesReleased = false;

  const cleanup = () => {
    if (resourcesReleased) return;
    resourcesReleased = true;
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    if (faceHoldTimer) window.clearTimeout(faceHoldTimer);
    resizeObserver?.disconnect();
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    window.removeEventListener('pagehide', cleanup);
    renderer?.domElement.remove();
    addedStyles.forEach((style) => style.remove());
  };

  try {
    const destinationDocument = await loadDestinationDocument(destinationUrl, signal);
    await appendDestinationStyles(destinationDocument, destinationUrl, addedStyles, signal);

    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const depth = width;
    const sourceFace = createPageFace(sourceBodySnapshot, 'source', width, height);
    copyFormState(document.body, sourceFace);
    const destinationFace = createPageFace(destinationDocument.body, 'destination', width, height);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 1, 100_000);
    const viewDistance = height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.z = viewDistance + depth / 2;
    camera.lookAt(0, 0, 0);

    const cube = new THREE.Group();
    scene.add(cube);

    const sourceObject = new CSS3DObject(sourceFace);
    sourceObject.position.z = depth / 2;
    cube.add(sourceObject);

    const destinationObject = new CSS3DObject(destinationFace);
    destinationObject.position.x = depth / 2;
    destinationObject.rotation.y = Math.PI / 2;
    cube.add(destinationObject);

    const back = new CSS3DObject(createBrandPanel('Un lugar con memoria', width, height));
    back.position.z = -depth / 2;
    back.rotation.y = Math.PI;
    cube.add(back);

    const left = new CSS3DObject(createBrandPanel('Otra perspectiva', depth, height));
    left.position.x = -depth / 2;
    left.rotation.y = -Math.PI / 2;
    cube.add(left);

    const top = new CSS3DObject(createBrandPanel('Un pueblo, muchas historias', width, depth));
    top.position.y = height / 2;
    top.rotation.x = -Math.PI / 2;
    cube.add(top);

    const bottom = new CSS3DObject(createBrandPanel('Palomares del Campo', width, depth));
    bottom.position.y = -height / 2;
    bottom.rotation.x = Math.PI / 2;
    cube.add(bottom);

    renderer = new CSS3DRenderer();
    renderer.domElement.className = 'page-transition-cube-renderer';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.pointerEvents = 'none';
    renderer.setSize(width, height);
    sceneHost.replaceChildren(renderer.domElement);

    const resize = () => {
      const nextWidth = Math.max(1, window.innerWidth);
      const nextHeight = Math.max(1, window.innerHeight);
      const nextDepth = nextWidth;
      renderer?.setSize(nextWidth, nextHeight);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      const nextViewDistance =
        nextHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      camera.position.z = nextViewDistance + nextDepth / 2;
      sourceFace.style.width = `${nextWidth}px`;
      sourceFace.style.height = `${nextHeight}px`;
      destinationFace.style.width = `${nextWidth}px`;
      destinationFace.style.height = `${nextHeight}px`;
      sourceObject.position.z = nextDepth / 2;
      destinationObject.position.x = nextDepth / 2;
      back.position.z = -nextDepth / 2;
      left.position.x = -nextDepth / 2;
      [back.element, left.element].forEach((element) => {
        element.style.height = `${nextHeight}px`;
      });
      [top.element, bottom.element].forEach((element) => {
        element.style.width = `${nextWidth}px`;
        element.style.height = `${nextDepth}px`;
      });
      top.position.y = nextHeight / 2;
      bottom.position.y = -nextHeight / 2;
    };

    resizeHandler = resize;
    window.addEventListener('resize', resize, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(sceneHost);
    }
    resize();
    renderer.render(scene, camera);
    sourceFace.scrollTop = window.scrollY;
    restoreScrollPositions(sourceFace);
    renderer.render(scene, camera);
    onRendererReady();

    return await new Promise<void>((resolve, reject) => {
      let settled = false;
      const stopAnimation = () => {
        if (animationFrame) window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      };
      const abort = () => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        stopAnimation();
        cleanup();
        reject(new DOMException('Page transition was aborted.', 'AbortError'));
      };
      const complete = () => {
        if (settled) return;
        settled = true;
        signal.removeEventListener('abort', abort);
        stopAnimation();
        resizeObserver?.disconnect();
        if (resizeHandler) window.removeEventListener('resize', resizeHandler);
        window.addEventListener('pagehide', cleanup, { once: true });
        resolve();
      };

      if (signal.aborted) {
        abort();
        return;
      }
      signal.addEventListener('abort', abort, { once: true });

      const startedAt = performance.now();
      const renderFrame = (time: number) => {
        if (signal.aborted) {
          abort();
          return;
        }

        const progress = Math.min(1, Math.max(0, (time - startedAt) / TRANSITION_DURATION_MS));
        const eased = progress * progress * (3 - 2 * progress);
        cube.rotation.y = (-Math.PI / 2) * eased;

        try {
          renderer?.render(scene, camera);
        } catch (error) {
          if (settled) return;
          settled = true;
          signal.removeEventListener('abort', abort);
          stopAnimation();
          cleanup();
          reject(error);
          return;
        }

        if (progress >= 1) {
          stopAnimation();
          faceHoldTimer = window.setTimeout(complete, DESTINATION_FACE_HOLD_MS);
        } else {
          animationFrame = window.requestAnimationFrame(renderFrame);
        }
      };

      animationFrame = window.requestAnimationFrame(renderFrame);
    });
  } catch (error) {
    cleanup();
    throw error;
  }
};
