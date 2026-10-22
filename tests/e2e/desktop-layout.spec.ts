import { expect, test } from '@playwright/test';

const editorialPages = [
  '/',
  '/agenda/',
  '/alojamientos/',
  '/aviso-legal/',
  '/bandos/',
  '/informacion-practica/',
  '/noticias/',
  '/palomarenos-por-el-mundo/',
  '/politica-de-cookies/',
  '/privacidad/',
  '/rutas/',
  '/sobre-el-pueblo/',
];

test.describe('desktop editorial scale', () => {
  test('keeps page titles, section headings and vertical rhythm proportionate', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const route of editorialPages) {
      await page.goto(route);
      const measurements = await page.locator('main').evaluate((main) => {
        const fontSize = (element: Element) =>
          Number.parseFloat(window.getComputedStyle(element).fontSize);
        const sectionPadding = (element: Element) =>
          Number.parseFloat(window.getComputedStyle(element).paddingBlockStart);
        const headings = Array.from(main.querySelectorAll('h1, h2')).filter(
          (heading) => heading.getClientRects().length > 0,
        );
        const pageTitle = main.querySelector('h1');
        const sections = Array.from(main.querySelectorAll(':scope > section')).filter(
          (section) => section.getClientRects().length > 0,
        );
        const heroes = Array.from(
          main.querySelectorAll('.editorial-hero, .agenda-section, .split-hero'),
        );

        return {
          pageTitle: pageTitle ? fontSize(pageTitle) : 0,
          largestSectionHeading: Math.max(
            0,
            ...headings.filter((heading) => heading.tagName === 'H2').map(fontSize),
          ),
          largestSectionPadding: Math.max(0, ...sections.map(sectionPadding)),
          largestHeroHeight: Math.max(
            0,
            ...heroes.map((hero) => Number.parseFloat(window.getComputedStyle(hero).minHeight)),
          ),
        };
      });

      expect(measurements.pageTitle, `${route} page title`).toBeLessThanOrEqual(96);
      expect(measurements.largestSectionHeading, `${route} section heading`).toBeLessThanOrEqual(
        64,
      );
      expect(measurements.largestSectionPadding, `${route} section spacing`).toBeLessThanOrEqual(
        120,
      );
      expect(measurements.largestHeroHeight, `${route} hero height`).toBeLessThanOrEqual(640);
    }
  });
});
