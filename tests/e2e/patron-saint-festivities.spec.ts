import { expect, test } from './fixtures';

test.describe('patron saint festivities', () => {
  test('explains both feasts and serves correctly credited ermita photographs', async ({
    page,
  }) => {
    await page.goto('/sobre-el-pueblo/');

    const guide = page.locator('#tradiciones');
    await expect(
      guide.getByRole('heading', { name: 'Dos fiestas patronales, una misma memoria' }),
    ).toBeVisible();
    await expect(guide).toContainText('La Virgen de la Cabeza');
    await expect(guide).toContainText('Santo Cristo de la Paz');
    await expect(guide).toContainText('ofrecimiento de los niños');
    await expect(guide).toContainText('peñas');

    const photographs = guide.locator('.traditions-gallery figure');
    await expect(photographs).toHaveCount(2);

    for (const photograph of await photographs.all()) {
      const image = photograph.getByRole('img');
      await expect(image).toHaveAttribute('alt', /.+/);
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      await expect(photograph.getByRole('link', { name: /Wikimedia Commons/ })).toHaveAttribute(
        'href',
        /commons\.wikimedia\.org\/wiki\/File:/,
      );
      await expect(photograph.getByRole('link', { name: /CC BY-SA 4\.0/ })).toHaveAttribute(
        'href',
        'https://creativecommons.org/licenses/by-sa/4.0/',
      );
    }

    await page.setViewportSize({ width: 390, height: 844 });
    const documentWidth = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(documentWidth).toBe(0);
  });
});
