import { expect, test } from './fixtures';

const pageRoutes = [
  '/',
  '/noticias/',
  '/bandos/',
  '/alojamientos/',
  '/aviso-legal/',
  '/politica-de-cookies/',
  '/informacion-practica/',
  '/rutas/',
  '/privacidad/',
  '/agenda/',
  '/palomarenos-por-el-mundo/',
  '/que-ver-cerca/',
  '/sobre-el-pueblo/',
  '/juego/',
];

for (const route of pageRoutes) {
  test(`page hero at ${route} exposes one labelled H1`, async ({ page }) => {
    await page.goto(route);

    const main = page.getByRole('main');
    const heading = main.getByRole('heading', { level: 1 });
    await expect(heading).toHaveCount(1);
    await expect(heading).toBeVisible();

    const headingId = await heading.getAttribute('id');
    expect(headingId).toBeTruthy();
    await expect(main.locator(`section[aria-labelledby="${headingId}"]`)).toHaveCount(1);
  });
}
