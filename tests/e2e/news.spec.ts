import { expect, test } from '@playwright/test';

test.describe('editorial news', () => {
  test('shows the published news archive', async ({ page }) => {
    await page.goto('/noticias/');

    await expect(page.getByRole('heading', { name: 'Noticias', exact: true })).toBeVisible();
    await expect(page.locator('.news-card')).toHaveCount(4);
    await expect(page.getByText('4 noticias publicadas')).toBeVisible();
  });

  test('opens a news article from its archive card', async ({ page }) => {
    await page.goto('/noticias/');
    const firstCard = page.locator('.news-card').first();
    const title = await firstCard.locator('h3 a').innerText();

    await firstCard.locator('h3 a').click();

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.locator('article')).toBeVisible();
    await expect(page.getByText('Fuente original:')).toBeVisible();
    await expect(page.getByRole('link', { name: /Voces de Cuenca|La Cerca|Encastillalamancha|Castilla-La Mancha Media/ })).toBeVisible();
  });
});
