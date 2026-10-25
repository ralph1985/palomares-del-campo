import { expect, test } from './fixtures';

const imageFixtureSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"></svg>';

const registerAstroImageFixture = async (page: import('@playwright/test').Page): Promise<void> => {
  await page.route(/\/_image/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      headers: { 'x-e2e-astro-image': 'fixture' },
      body: imageFixtureSvg,
    }),
  );
  await page.route(/^https:\/\/palomaresdelcampo\.dipucuenca\.es\//, (route) =>
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: imageFixtureSvg }),
  );
};

test.describe('optimized raster images', () => {
  test('serves responsive images for guide, municipal and bando content', async ({ page }) => {
    await registerAstroImageFixture(page);

    const imageResponses: import('@playwright/test').Response[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/_image')) imageResponses.push(response);
    });
    await page.goto('/que-ver-cerca/segobriga-saelices/');

    const guideImage = page.locator('.guide-featured-image img');
    await expect(guideImage).toHaveAttribute('srcset', /_image/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /_image/);
    const imageResponse = imageResponses[0];
    expect(imageResponse?.headers()['x-e2e-astro-image']).toBe('fixture');
    await expect(guideImage).toHaveAttribute('width', '1280');
    await expect(guideImage).toHaveAttribute('height', '853');
    await expect(guideImage).toHaveAttribute('fetchpriority', 'high');
    await expect(guideImage).toHaveAttribute('loading', 'eager');

    await page.goto('/que-ver-cerca/castillo-torrebuceit/');
    const torrebuceitImages = page.locator('.guide-featured-image img, .gallery-grid img');
    await expect(torrebuceitImages).toHaveCount(3);
    for (const image of await torrebuceitImages.all()) {
      await expect(image).toHaveAttribute('srcset', /_image/);
    }

    await page.goto('/sobre-el-pueblo/');
    const municipalHero = page.locator('.hero-photo img');
    await expect(municipalHero).toHaveAttribute('srcset', /_image/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /_image/);
    await expect(municipalHero).toHaveAttribute('width', '592');
    await expect(municipalHero).toHaveAttribute('height', '890');

    await page.goto('/sobre-el-pueblo/iglesia/');
    const churchHero = page.locator('.church-photo img');
    await expect(churchHero).toHaveAttribute('srcset', /_image/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /_image/);
    const churchGalleryImages = page.locator('.church-gallery-item img');
    await expect(churchGalleryImages).toHaveCount(3);
    for (const image of await churchGalleryImages.all()) {
      await expect(image).toHaveAttribute('srcset', /_image/);
      await expect(image).toHaveAttribute('alt', /.+/);
    }

    await page.goto('/bandos/1648341-clase-practica/');
    const bandoImage = page.locator('.article-attachments img');
    await expect(bandoImage).toHaveAttribute('srcset', /_image/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /_image/);
    await expect(bandoImage).toHaveAttribute('alt', /.+/);
    await expect(bandoImage).toHaveAttribute('loading', 'lazy');
    await expect(bandoImage).toHaveAttribute('width', /\d+/);
    await expect(bandoImage).toHaveAttribute('height', /\d+/);
    const intrinsicWidth = Number(await bandoImage.getAttribute('width'));
    const srcset = (await bandoImage.getAttribute('srcset')) ?? '';
    const responsiveWidths = Array.from(srcset.matchAll(/(\d+)w/g))
      .map((match) => match[1])
      .filter((width): width is string => width !== undefined)
      .map(Number);
    const largestResponsiveWidth = responsiveWidths.reduce(
      (largest, width) => Math.max(largest, width),
      0,
    );
    expect(largestResponsiveWidth).toBeGreaterThan(0);
    expect(largestResponsiveWidth).toBeLessThanOrEqual(intrinsicWidth);
  });
});
