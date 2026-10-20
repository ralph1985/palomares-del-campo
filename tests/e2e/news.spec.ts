import { expect, test } from '@playwright/test';

test.describe('editorial news', () => {
  test('filters news by publication year and restores it from the URL', async ({ page }) => {
    await page.goto('/noticias/');
    await expect(page.getByRole('heading', { name: 'Noticias', exact: true })).toBeVisible();

    const year = page.getByRole('combobox', { name: 'Año' });
    const cards = page.locator('[data-news-card]');
    await year.selectOption('2025');
    await expect(cards.filter({ has: page.locator('time[datetime^="2025"]') })).toHaveCount(4);
    await expect(page.locator('[data-news-card]:visible')).toHaveCount(4);
    expect(new URL(page.url()).searchParams.get('year')).toBe('2025');

    await page.reload();
    await expect(year).toHaveValue('2025');
    await expect(page.locator('[data-news-card]:visible')).toHaveCount(4);
  });
  test('opens a news article from its archive card', async ({ page }) => {
    await page.goto('/noticias/');
    const firstCard = page.locator('.news-card').first();
    const title = await firstCard.locator('h3 a').innerText();

    await firstCard.locator('h3 a').click();
    await expect(page).toHaveURL(/\/noticias\/[^/]+\/?$/);

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.locator('article')).toBeVisible();
    await expect(page.getByText('Fuente original:')).toBeVisible();
    await expect(page.locator('.article-source a')).toHaveAttribute('href', /^https:\/\//);
  });
});
