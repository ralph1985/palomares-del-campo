import { expect, test } from './fixtures';

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

  test('renders images and documents attached to a bando', async ({ page }) => {
    const attachmentResponse = page.waitForResponse((response) =>
      response.url().includes('/userFiles/'),
    );
    await page.goto('/bandos/1648341-clase-practica/');
    const imageResponse = await attachmentResponse;

    await expect(page.getByRole('heading', { name: 'Recursos del comunicado' })).toBeVisible();
    const attachedImage = page.locator('.article-attachments img');
    await expect(attachedImage).toBeVisible();
    await expect(attachedImage).toHaveAttribute('alt', /.+/);
    expect(imageResponse.headers()['x-e2e-bando-asset']).toBe('fixture');

    await page.goto('/bandos/1658990-horarios-autobus-de-linea/');
    await expect(page.getByRole('heading', { name: 'Recursos del comunicado' })).toBeVisible();
    const documentLinks = page
      .getByRole('region', { name: 'Recursos del comunicado' })
      .getByRole('link');
    const pdfLinks = await documentLinks.all();
    expect(pdfLinks.length).toBeGreaterThan(0);
    for (const link of pdfLinks) {
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', /\.pdf$/i);
    }
  });

  test('filters bandos by publication year and restores it from the URL', async ({ page }) => {
    await page.goto('/bandos/');

    const year = page.getByRole('combobox', { name: 'Año' });
    await year.selectOption('2025');
    await expect(page.locator('[data-bando-card]:visible')).not.toHaveCount(0);
    expect(new URL(page.url()).searchParams.get('year')).toBe('2025');

    await page.reload();
    await expect(year).toHaveValue('2025');
    await expect(page.locator('[data-bando-card]:visible')).not.toHaveCount(0);
  });

  test('opens a bando from its card without repeating the summary', async ({ page }) => {
    await page.goto('/bandos/');

    const card = page.getByRole('article').filter({
      has: page.getByRole('heading', { name: 'HORARIOS AUTOBÚS DE LINEA', exact: true }),
    });
    const cardTime = card.locator('time');
    await expect(cardTime).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/);
    const publishedAt = await cardTime.getAttribute('datetime');
    if (publishedAt === null) throw new Error('Bando card is missing its publication date.');
    const summary = await card.locator('p').innerText();
    const articleLink = card.getByRole('link', {
      name: 'HORARIOS AUTOBÚS DE LINEA',
      exact: true,
    });
    const href = await articleLink.getAttribute('href');
    if (!href) throw new Error('Bando card is missing its article URL.');
    const destination = new URL(href, page.url());

    await articleLink.click({ noWaitAfter: true });
    await page.waitForURL((url) => url.pathname === destination.pathname, {
      waitUntil: 'commit',
      timeout: 3000,
    });

    await expect(
      page.getByRole('heading', { name: 'HORARIOS AUTOBÚS DE LINEA', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.article-content')).toContainText('LUNES');
    await expect(page.locator('.article-content')).not.toContainText(summary);
    await expect(page.locator('[data-page-transition-face]')).toHaveCount(0);
    await expect(page.locator('article time')).toHaveAttribute('datetime', publishedAt);
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
    await expect(page.locator('[data-bando-card]:visible')).not.toHaveCount(0);
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
