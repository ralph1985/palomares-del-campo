import { expect, test } from '@playwright/test';

test.describe('current affairs sections', () => {
  test('shows an honest empty agenda state', async ({ page }) => {
    await page.goto('/agenda/');

    await expect(page).toHaveTitle(/Agenda/);
    await expect(page.getByRole('heading', { level: 1, name: 'Agenda' })).toBeVisible();
    await expect(page.getByText('No hay actividades publicadas todavía.')).toBeVisible();
    await expect(page.locator('[data-current-affairs-empty]')).toHaveAttribute(
      'data-section',
      'agenda',
    );
  });

  test('wraps long URLs in bando cards on narrow screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/bandos/');

    const card = page.locator('[data-bando-card]').filter({ hasText: 'Visita Virgen de Lourdes' });
    await expect(card).toBeVisible();
    const widths = await card.evaluate((element) => ({
      card: element.scrollWidth,
      cardClient: element.clientWidth,
      paragraphs: [...element.querySelectorAll('p')].map((paragraph) => ({
        scrollWidth: paragraph.scrollWidth,
        clientWidth: paragraph.clientWidth,
      })),
    }));
    expect(widths.card).toBeLessThanOrEqual(widths.cardClient);
    expect(
      widths.paragraphs.every((paragraph) => paragraph.scrollWidth <= paragraph.clientWidth),
    ).toBe(true);
  });

  test('wraps long source URLs on narrow bando pages', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/bandos/1646075-visita-virgen-de-lourdes-a-nuestro-pueblo');

    await expect(page.locator('.article-content a')).toBeVisible();
    const widths = await page.evaluate(() => {
      const article = document.querySelector<HTMLElement>('.article-shell');
      const link = document.querySelector<HTMLElement>('.article-content a');
      const articleRect = article?.getBoundingClientRect();
      const linkRect = link?.getBoundingClientRect();
      return {
        article: article?.scrollWidth ?? 0,
        articleClient: article?.clientWidth ?? 0,
        linkRight: linkRect?.right ?? 0,
        articleRight: articleRect?.right ?? 0,
      };
    });
    expect(widths.article).toBeLessThanOrEqual(widths.articleClient);
  });

  test('does not repeat the bando summary in the detail body', async ({ page }) => {
    await page.goto('/bandos/1659178-horarios-autobus-de-linea/');

    await expect(page.locator('.article-description')).toHaveCount(0);
    await expect(page.locator('.article-content')).toContainText(
      'NUEVOS HORARIOS DE AUTOBÚS DE LÍNEA',
    );
  });
  test('shows sourced municipal bandos and keeps the old path compatible', async ({ page }) => {
    await page.goto('/bandos/');

    await expect(page).toHaveTitle(/Bandos/);
    await expect(page.getByRole('heading', { level: 1, name: 'Bandos' })).toBeVisible();
    await expect(page.locator('[data-bando-card]')).not.toHaveCount(0);
    await expect(page.getByText('Palomares del Campo Informa').first()).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Ver comunicado original/ }).first(),
    ).toHaveAttribute('href', /https:\/\/www\.bandomovil\.com\//);

    await page.getByLabel('Buscar por título').fill('autobús');
    await expect(page.locator('[data-bando-card]:visible')).not.toHaveCount(0);
    await page.getByLabel('Buscar por título').fill('texto que no existe');
    await expect(page.getByText('No hay bandos que coincidan con estos filtros.')).toBeVisible();
    await page.getByLabel('Buscar por título').fill('autobús');

    await page.locator('[data-bando-card] h2 a').first().click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Fuente original:')).toBeVisible();
    await expect(page.getByRole('link', { name: /Palomares del Campo Informa/ })).toBeVisible();

    await page.goto('/avisos/');
    await expect(page).toHaveURL(/\/bandos\/$/);

    await page.goto('/');
    await page.getByRole('button', { name: 'Explorar' }).click();
    const menu = page.locator('#site-menu');
    await expect(menu.getByRole('link', { name: /Bandos/ })).toHaveAttribute('href', '/bandos/');
    await expect(menu.getByRole('link', { name: /Agenda/ })).toHaveAttribute('href', '/agenda/');
  });
});
