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
    await expect(overlay).not.toBeVisible();

    const articleLink = page.locator('.news-card').first().locator('h3 a');
    const title = await articleLink.innerText();
    const href = await articleLink.getAttribute('href');
    if (!href) throw new Error('The first news card has no destination URL.');
    const destination = new URL(href, page.url());

    await articleLink.click({ noWaitAfter: true });

    await expect(overlay).toHaveAttribute('data-phase', 'outgoing', { timeout: 3000 });
    await expect.poll(() => sceneRequests).toBeGreaterThan(0);
    await expect(overlay).toHaveAttribute('data-renderer', 'three-css3d');
    const toolbarConnections = await page
      .locator('html')
      .getAttribute('data-transition-test-toolbar-connections');
    expect(toolbarConnections).toBe('1');
    await expect(overlay.locator('astro-dev-toolbar')).toHaveCount(0);
    await expect(overlay.locator('[data-page-transition-face="source"] main h1')).toHaveText(
      'Noticias',
    );
    await expect(overlay.locator('[data-page-transition-face="destination"] main h1')).toHaveText(
      title,
    );

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

    const menuLink = menu.locator('a[href="/noticias/"]');
    await expect(menuLink).toBeVisible();
    const href = await menuLink.getAttribute('href');
    if (!href) throw new Error('The menu destination link has no URL.');
    const destination = new URL(href, page.url());
    await menuLink.click({ noWaitAfter: true });

    const overlay = page.locator('[data-page-transition-overlay]');
    await expect(overlay).toHaveAttribute('data-phase', 'outgoing', { timeout: 3000 });
    await expect(menu).toHaveAttribute('aria-hidden', 'false');
    await expect(menu).not.toHaveAttribute('inert');
    await expect(page.locator('body').first()).toHaveClass(/menu-is-open/);
    const sourceFace = overlay.locator('[data-page-transition-face="source"]');
    const sourceMenu = sourceFace.locator('#site-menu');
    await expect(sourceFace).toHaveClass(/menu-is-open/);
    await expect(sourceMenu).toHaveAttribute('aria-hidden', 'false');
    await expect(sourceMenu).not.toHaveAttribute('inert');
    await expect(sourceMenu.locator('a[href="/noticias/"]')).toBeVisible();
    await expect(sourceFace.locator('[data-menu-backdrop]')).not.toHaveAttribute('hidden');

    const destinationFace = overlay.locator('[data-page-transition-face="destination"]');
    await expect(destinationFace.locator('#site-menu')).toHaveCount(0);
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

    const overlay = page.locator('[data-page-transition-overlay]');
    await expect(overlay).toHaveAttribute('data-phase', 'fallback-outgoing', {
      timeout: 1500,
    });
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

    const overlay = page.locator('[data-page-transition-overlay]');
    await expect(overlay).toHaveAttribute('data-phase', 'outgoing', { timeout: 3000 });
    const bounds = await overlay.boundingBox();
    if (!bounds) throw new Error('The mobile transition overlay has no visible bounds.');
    expect(bounds).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });

    const caption = await page.locator('.page-transition-copy').boundingBox();
    expect(caption).toBeNull();
    await expect(
      overlay.locator('[data-page-transition-face="destination"] main h1'),
    ).toBeVisible();
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
