import { expect, test } from './fixtures';

test.describe('Three.js page transitions', () => {
  test('preloads the destination page as the other cube face before navigation', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      class TestDevToolbar extends HTMLElement {
        connectedCallback() {
          const root = document.documentElement;
          const previous = Number(root.dataset.transitionTestToolbarConnections ?? '0');
          root.dataset.transitionTestToolbarConnections = String(previous + 1);
        }
      }
      customElements.define('astro-dev-toolbar', TestDevToolbar);
    });

    let sceneRequests = 0;
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.resourceType() === 'fetch' && request.headers().accept?.includes('text/html')) {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
      await route.continue();
    });
    page.on('request', (request) => {
      if (request.url().includes('page-transition-scene')) sceneRequests += 1;
    });

    await page.goto('/noticias/');
    await expect(page.locator('body')).toHaveAttribute('data-page-transitions-enabled', 'true');
    expect(sceneRequests).toBe(0);
    await page.evaluate(() => {
      document.body.append(document.createElement('astro-dev-toolbar'));
    });
    await expect(page.locator('html')).toHaveAttribute(
      'data-transition-test-toolbar-connections',
      '1',
    );

    const overlay = page.locator('[data-page-transition-overlay]');
    await expect(overlay).toHaveCount(1);
    await expect(overlay).toHaveAttribute('data-effect', 'cube');
    await expect(overlay.locator('.page-transition-copy')).toHaveCount(0);
    await expect(overlay).not.toBeVisible();

    const articleLink = page.locator('.news-card').first().locator('h3 a');
    const title = await articleLink.innerText();
    const href = await articleLink.getAttribute('href');
    if (!href) throw new Error('The first news card has no destination URL.');
    const destination = new URL(href, page.url());

    await articleLink.click({ noWaitAfter: true });

    const preparingHandle = await page.waitForFunction(() => {
      const transitionOverlay = document.querySelector<HTMLElement>(
        '[data-page-transition-overlay]',
      );
      if (transitionOverlay?.dataset.phase !== 'preparing') return false;
      const liveMain = document.querySelector('html > body > main');
      return {
        phase: transitionOverlay.dataset.phase,
        pageState: document.documentElement.dataset.pageTransitionState,
        mainVisibility: liveMain ? getComputedStyle(liveMain).visibility : 'missing',
      };
    });
    const preparingState = (await preparingHandle.jsonValue()) as {
      phase: string;
      pageState: string | undefined;
      mainVisibility: string;
    };
    expect(preparingState).toEqual({
      phase: 'preparing',
      pageState: 'outgoing',
      mainVisibility: 'visible',
    });

    const outgoingHandle = await page.waitForFunction(
      () => {
        const transitionOverlay = document.querySelector<HTMLElement>(
          '[data-page-transition-overlay]',
        );
        if (transitionOverlay?.dataset.phase !== 'outgoing') return false;
        const liveMain = document.querySelector('html > body > main');
        return {
          phase: transitionOverlay.dataset.phase,
          renderer: transitionOverlay.dataset.renderer,
          mainVisibility: liveMain ? getComputedStyle(liveMain).visibility : 'missing',
          veilOpacity: getComputedStyle(transitionOverlay, '::before').opacity,
          toolbarConnections: document.documentElement.getAttribute(
            'data-transition-test-toolbar-connections',
          ),
          overlayToolbarCount: transitionOverlay.querySelectorAll('astro-dev-toolbar').length,
          sourceTitle: transitionOverlay
            .querySelector('[data-page-transition-face="source"] main h1')
            ?.textContent?.trim(),
          destinationTitle: transitionOverlay
            .querySelector('[data-page-transition-face="destination"] main h1')
            ?.textContent?.trim(),
        };
      },
      undefined,
      { timeout: 3000 },
    );
    const outgoingState = (await outgoingHandle.jsonValue()) as {
      phase: string;
      renderer: string | undefined;
      mainVisibility: string;
      veilOpacity: string;
      toolbarConnections: string | null;
      overlayToolbarCount: number;
      sourceTitle: string | undefined;
      destinationTitle: string | undefined;
    };
    expect(sceneRequests).toBeGreaterThan(0);
    expect(outgoingState).toMatchObject({
      phase: 'outgoing',
      renderer: 'three-css3d',
      mainVisibility: 'hidden',
      veilOpacity: '0',
      toolbarConnections: '1',
      overlayToolbarCount: 0,
      sourceTitle: 'Noticias',
      destinationTitle: title,
    });

    await page.waitForURL((url) => url.pathname === destination.pathname, {
      waitUntil: 'commit',
      timeout: 3000,
    });
    await expect(page.locator('[data-page-transition-face]')).toHaveCount(0);
    await expect(page.locator('article')).toBeVisible();
  });

  test('keeps the open menu on the outgoing face and closes it on the destination', async ({
    page,
  }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Explorar' });
    const menu = page.locator('#site-menu').first();
    await toggle.click();
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await expect(menu).not.toHaveAttribute('inert');
    await menu.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });

    const menuLink = menu.locator('a[href="/juego/"]');
    await expect(menuLink).toBeInViewport();
    expect(await menu.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    const href = await menuLink.getAttribute('href');
    if (!href) throw new Error('The menu destination link has no URL.');
    const destination = new URL(href, page.url());
    await menuLink.click({ noWaitAfter: true });

    const overlay = page.locator('[data-page-transition-overlay]');
    await expect(overlay).toHaveAttribute('data-phase', 'outgoing', { timeout: 3000 });
    const menuState = await page.evaluate(() => {
      const overlayElement = document.querySelector('[data-page-transition-overlay]');
      const sourceFaceElement = overlayElement?.querySelector<HTMLElement>(
        '[data-page-transition-face="source"]',
      );
      const destinationFaceElement = overlayElement?.querySelector<HTMLElement>(
        '[data-page-transition-face="destination"]',
      );
      const liveMenu = document.querySelector('#site-menu');
      const sourceMenu = sourceFaceElement?.querySelector('#site-menu');
      const sourceMenuLink = sourceMenu?.querySelector('a[href="/juego/"]');
      const liveMenuLink = liveMenu?.querySelector('a[href="/juego/"]');
      const sourceBackdrop = sourceFaceElement?.querySelector('[data-menu-backdrop]');

      return {
        phase: overlayElement?.getAttribute('data-phase'),
        renderer: overlayElement?.getAttribute('data-renderer'),
        liveMenuOpen:
          document.body.classList.contains('menu-is-open') &&
          liveMenu?.getAttribute('aria-hidden') === 'false' &&
          !liveMenu.hasAttribute('inert'),
        sourceMenuOpen:
          Boolean(sourceFaceElement?.classList.contains('menu-is-open')) &&
          sourceMenu?.getAttribute('aria-hidden') === 'false' &&
          !sourceMenu.hasAttribute('inert'),
        sourceMenuLinkVisible:
          Boolean(sourceMenuLink?.getClientRects().length) &&
          sourceMenuLink?.ownerDocument.defaultView?.getComputedStyle(sourceMenuLink).visibility ===
            'visible',
        sourceBackdropVisible: Boolean(sourceBackdrop && !sourceBackdrop.hasAttribute('hidden')),
        destinationMenuCount: destinationFaceElement?.querySelectorAll('#site-menu').length ?? -1,
        liveMenuScrollTop: liveMenu?.scrollTop ?? -1,
        sourceMenuScrollTop: sourceMenu?.scrollTop ?? -1,
        liveMenuLinkVisible: Boolean(liveMenuLink?.getClientRects().length),
      };
    });
    const { liveMenuScrollTop, sourceMenuScrollTop, ...menuVisibilityState } = menuState;
    expect(menuVisibilityState).toEqual({
      phase: 'outgoing',
      renderer: 'three-css3d',
      liveMenuOpen: true,
      sourceMenuOpen: true,
      sourceMenuLinkVisible: true,
      sourceBackdropVisible: true,
      destinationMenuCount: 0,
      liveMenuLinkVisible: true,
    });
    expect(liveMenuScrollTop).toBeGreaterThan(0);
    expect(sourceMenuScrollTop).toBe(liveMenuScrollTop);

    await page.waitForURL((url) => url.pathname === destination.pathname, {
      waitUntil: 'commit',
      timeout: 3000,
    });

    await expect(page.locator('#site-menu')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#site-menu')).toHaveAttribute('inert', '');
  });

  test('keeps navigation working when the Three.js scene cannot load', async ({ page }) => {
    await page.route('**/*page-transition-scene*', (route) => route.abort());
    await page.goto('/noticias/');
    const articleLink = page.locator('.news-card').first().locator('h3 a');
    const href = await articleLink.getAttribute('href');
    if (!href) throw new Error('The first news card has no destination URL.');
    const destination = new URL(href, page.url());

    await articleLink.click({ noWaitAfter: true });

    const fallbackVeilHandle = await page.waitForFunction(
      () => {
        const transitionOverlay = document.querySelector<HTMLElement>(
          '[data-page-transition-overlay]',
        );
        if (transitionOverlay?.dataset.phase !== 'fallback-outgoing') return false;
        const opacity = Number(getComputedStyle(transitionOverlay, '::before').opacity);
        return opacity > 0 ? opacity : false;
      },
      undefined,
      { timeout: 1500 },
    );
    expect(Number(await fallbackVeilHandle.jsonValue())).toBeGreaterThan(0);
    await page.waitForURL((url) => url.pathname === destination.pathname, {
      waitUntil: 'commit',
      timeout: 3000,
    });
    await expect(page.locator('main h1')).toBeVisible();
  });

  test('fits the cube transition to a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/noticias/');
    await page.locator('.news-card').first().locator('h3 a').click({ noWaitAfter: true });

    const outgoingHandle = await page.waitForFunction(
      () => {
        const transitionOverlay = document.querySelector<HTMLElement>(
          '[data-page-transition-overlay]',
        );
        if (
          transitionOverlay?.dataset.phase !== 'outgoing' ||
          transitionOverlay.dataset.renderer !== 'three-css3d'
        ) {
          return false;
        }
        const destinationHeading = transitionOverlay.querySelector<HTMLElement>(
          '[data-page-transition-face="destination"] main h1',
        );
        const bounds = transitionOverlay.getBoundingClientRect();
        return {
          phase: transitionOverlay.dataset.phase,
          renderer: transitionOverlay.dataset.renderer,
          destinationHeadingVisible: destinationHeading
            ? Boolean(destinationHeading.getClientRects().length) &&
              getComputedStyle(destinationHeading).visibility === 'visible'
            : false,
          overlayBounds: {
            x: Math.round(bounds.x),
            y: Math.round(bounds.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
          },
          temporaryCopyCount: transitionOverlay.querySelectorAll('.page-transition-copy').length,
        };
      },
      undefined,
      { timeout: 3000 },
    );
    const outgoingState = (await outgoingHandle.jsonValue()) as {
      phase: string;
      renderer: string;
      destinationHeadingVisible: boolean;
      overlayBounds: { x: number; y: number; width: number; height: number };
      temporaryCopyCount: number;
    };
    expect(outgoingState).toEqual({
      phase: 'outgoing',
      renderer: 'three-css3d',
      destinationHeadingVisible: true,
      overlayBounds: { x: 0, y: 0, width: 390, height: 844 },
      temporaryCopyCount: 0,
    });
  });

  test('skips the 3D scene when reduced motion is requested', async ({ page }) => {
    let sceneRequests = 0;
    page.on('request', (request) => {
      if (request.url().includes('page-transition-scene')) sceneRequests += 1;
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/noticias/');

    await page.locator('.news-card').first().locator('h3 a').click();

    await expect(page).toHaveURL(/\/noticias\/[^/]+\/?$/);
    expect(sceneRequests).toBe(0);
  });
});
