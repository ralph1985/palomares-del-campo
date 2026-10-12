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
    await expect(page.locator('.article-meta')).toContainText('9 de octubre de 2026');
    await expect(
      page.locator('.article-meta').getByText('Ayuntamiento de Palomares del Campo', {
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(page.locator('.article-content')).toContainText(
      'NUEVOS HORARIOS DE AUTOBÚS DE LÍNEA',
    );
  });
  test('renders images and documents attached to a bando', async ({ page }) => {
    await page.goto('/bandos/1648341-clase-practica/');

    await expect(page.getByRole('heading', { name: 'Recursos del comunicado' })).toBeVisible();
    await expect(page.locator('.article-attachments img')).toHaveAttribute(
      'src',
      'https://www.bandomovil.com/userFiles/j3/j3a7jIMG-20260924-WA0000.jpg',
    );

    await page.goto('/bandos/1658990-horarios-autobus-de-linea/');
    await expect(page.getByRole('heading', { name: 'Recursos del comunicado' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'HORARIOSOCUELLAMOSCUENCAFUENTELESPINO.pdf' }),
    ).toHaveAttribute('href', /HORARIOSOCUELLAMOSCUENCAFUENTELESPINO\.pdf$/);
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

    const search = page.getByRole('searchbox', { name: 'Buscar en bandos' });
    await search.fill('autobus linea');
    await expect(page.locator('[data-bando-card]:visible')).not.toHaveCount(0);
    expect(new URL(page.url()).searchParams.get('q')).toBe('autobus linea');

    await search.fill('autobús');
    const accentedQueryMatches = await page.locator('[data-bando-card]:visible').count();
    await search.fill('autobus');
    await expect(page.locator('[data-bando-card]:visible')).toHaveCount(accentedQueryMatches);

    await search.fill('plaza de toros');
    await expect(page.locator('[data-bando-card]:visible')).not.toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Limpiar búsqueda' })).toBeVisible();

    await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
    await expect(search).toHaveValue('');
    expect(new URL(page.url()).searchParams.has('q')).toBe(false);

    await page.goto('/bandos/?q=autobus');
    await expect(search).toHaveValue('autobus');
    await expect(page.locator('[data-bando-card]:visible')).not.toHaveCount(0);

    await search.fill('texto que no existe');
    await expect(page.getByText('No hay bandos que coincidan con estos filtros.')).toBeVisible();
    await search.fill('autobús');

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
