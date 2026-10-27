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

const parseRgb = (color: string): [number, number, number] => {
  const channels = color.match(/[\d.]+/g)?.map(Number);
  const [red, green, blue] = channels ?? [];
  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Unsupported computed color: ${color}`);
  }
  return [red, green, blue];
};

const relativeLuminance = (color: string): number => {
  const channels = parseRgb(color).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const [red, green, blue] = channels;
  if (red === undefined || green === undefined || blue === undefined) {
    throw new Error(`Could not calculate luminance for: ${color}`);
  }
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

const contrastRatio = (foreground: string, background: string): number => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
};

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

test('keeps the homepage spotlight while using a quieter interior masthead', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const homeTitle = page.getByRole('heading', { level: 1 });
  const homeTitleSize = await homeTitle.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  const homeSurface = await page
    .locator('.home-hero')
    .evaluate((element) => getComputedStyle(element).backgroundColor);

  await page.goto('/noticias/');

  const interiorHero = page.locator('.editorial-hero');
  const interiorTitle = page.getByRole('heading', { level: 1 });
  const interiorTitleSize = await interiorTitle.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  const interiorSurface = await interiorHero.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );

  expect(homeTitleSize).toBeGreaterThan(interiorTitleSize);
  expect(interiorTitleSize).toBeLessThanOrEqual(72);
  expect(interiorSurface).not.toBe(homeSurface);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const homeMobileTitleSize = await page
    .getByRole('heading', { level: 1 })
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));

  await page.goto('/noticias/');
  const interiorMobileTitleSize = await page
    .getByRole('heading', { level: 1 })
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));

  expect(homeMobileTitleSize).toBeGreaterThan(interiorMobileTitleSize);
});

test('separates paper editorial heroes from the shared site header', async ({ page }) => {
  const routes = [
    '/noticias/',
    '/bandos/',
    '/agenda/',
    '/rutas/',
    '/que-ver-cerca/',
    '/aviso-legal/',
    '/politica-de-cookies/',
    '/privacidad/',
  ];
  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of routes) {
      await page.goto(route);
      const surfaces = await page.evaluate(() => {
        const header = document.querySelector<HTMLElement>('.site-header');
        const hero = document.querySelector<HTMLElement>('main .editorial-hero');
        if (!header || !hero) throw new Error('Missing site header or editorial hero');
        const resolveToken = (token: string): string => {
          const probe = document.createElement('span');
          probe.style.backgroundColor = `var(${token})`;
          document.body.append(probe);
          const color = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return color;
        };
        return {
          header: getComputedStyle(header).backgroundColor,
          hero: getComputedStyle(hero).backgroundColor,
          paper: resolveToken('--color-paper'),
          surface: resolveToken('--color-surface'),
        };
      });

      expect(surfaces.header, `${route} header should use the paper token`).toBe(surfaces.paper);
      expect(surfaces.hero, `${route} hero should use the surface token`).toBe(surfaces.surface);
      expect(
        surfaces.hero,
        `${route} should separate its hero from the ${viewport.name} header`,
      ).not.toBe(surfaces.header);
    }
  }
});

test('keeps editorial eyebrow labels at AA contrast on their rendered surfaces', async ({
  page,
}) => {
  const cases = [
    { route: '/', surface: '.audience-section', label: '.audience-eyebrow' },
    {
      route: '/alojamientos/',
      surface: '.editorial-hero--sage',
      label: '.editorial-hero--sage .eyebrow',
    },
    {
      route: '/informacion-practica/',
      surface: '.services-section',
      label: '.services-section .eyebrow',
    },
    {
      route: '/informacion-practica/',
      surface: '.editorial-hero--sage',
      label: '.editorial-hero--sage .eyebrow',
    },
    { route: '/rutas/', surface: '.routes-section', label: '.routes-heading .eyebrow' },
    {
      route: '/sobre-el-pueblo/',
      surface: '.split-hero--heritage',
      label: '.split-hero--heritage .eyebrow',
    },
    {
      route: '/sobre-el-pueblo/',
      surface: '.heritage-section',
      label: '.heritage-section .eyebrow',
    },
    {
      route: '/sobre-el-pueblo/',
      surface: '.traditions-section',
      label: '.traditions-section .eyebrow',
    },
    {
      route: '/que-ver-cerca/',
      surface: '.nearby-section--alternate',
      label: '.nearby-section--alternate .eyebrow',
    },
    {
      route: '/aviso-legal/',
      surface: '.editorial-hero',
      label: '.editorial-hero .eyebrow',
    },
    {
      route: '/politica-de-cookies/',
      surface: '.editorial-hero',
      label: '.editorial-hero .eyebrow',
    },
    {
      route: '/privacidad/',
      surface: '.editorial-hero',
      label: '.editorial-hero .eyebrow',
    },
    {
      route: '/palomarenos-por-el-mundo/',
      surface: '.editorial-hero--sage',
      label: '.editorial-hero--sage .eyebrow',
    },
    {
      route: '/',
      surface: '.news-section',
      label: '.news-section .news-eyebrow',
    },
    {
      route: '/sobre-el-pueblo/iglesia/',
      surface: '.art-card--chapels',
      label: '.art-card--chapels .card-index',
    },
    {
      route: '/informacion-practica/',
      surface: '.services-section',
      label: '.services-section .service-index',
    },
    {
      route: '/que-ver-cerca/castillo-torrebuceit/',
      surface: '.visit-panel',
      label: '.visit-panel .eyebrow',
    },
  ];

  for (const item of cases) {
    await page.goto(item.route);
    const surface = page.locator(item.surface);
    const label = page.locator(item.label).first();
    await expect(surface).toBeVisible();
    await expect(label).toBeVisible();

    const colors = await page.evaluate(
      ({ surfaceSelector, labelSelector }) => {
        const surfaceElement = document.querySelector<HTMLElement>(surfaceSelector);
        const labelElement = document.querySelector<HTMLElement>(labelSelector);
        if (!surfaceElement || !labelElement) {
          throw new Error(`Missing contrast target: ${surfaceSelector} / ${labelSelector}`);
        }
        return {
          foreground: getComputedStyle(labelElement).color,
          background: getComputedStyle(surfaceElement).backgroundColor,
        };
      },
      { surfaceSelector: item.surface, labelSelector: item.label },
    );

    expect(
      contrastRatio(colors.foreground, colors.background),
      `${item.route} ${item.label} on ${item.surface}`,
    ).toBeGreaterThanOrEqual(4.5);
  }
});

test('keeps heritage links readable on hover and keyboard focus', async ({ page }) => {
  await page.goto('/sobre-el-pueblo/');

  const cases = [
    {
      surfaceSelector: '.split-hero--heritage',
      linkSelector: '.split-hero--heritage .hero-link',
    },
    {
      surfaceSelector: '.traditions-section',
      linkSelector: '.traditions-section .source-link',
    },
  ];

  for (const item of cases) {
    const link = page.locator(item.linkSelector).first();
    await expect(link).toBeVisible();
    await link.hover();
    const linkBounds = await link.boundingBox();
    if (!linkBounds) throw new Error(`Missing hover bounds: ${item.linkSelector}`);
    await page.mouse.move(
      linkBounds.x + linkBounds.width / 2,
      linkBounds.y + linkBounds.height / 2,
    );
    await expect(link).toHaveCSS('color', 'rgb(145, 79, 44)');

    await page.evaluate(() => {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) activeElement.blur();
    });

    let focused = false;
    for (let attempt = 0; attempt < 30 && !focused; attempt += 1) {
      await page.mouse.move(0, 0);
      await page.keyboard.press('Tab');
      focused = await link.evaluate((element) => document.activeElement === element);
    }
    expect(focused, `${item.linkSelector} should be reachable with the keyboard`).toBe(true);
    await expect
      .poll(() => link.evaluate((element) => element.matches(':focus-visible')))
      .toBe(true);
    await expect(link).toHaveCSS('color', 'rgb(145, 79, 44)');

    const colors = await page.evaluate(({ surfaceSelector, linkSelector }) => {
      const surface = document.querySelector<HTMLElement>(surfaceSelector);
      const target = document.querySelector<HTMLElement>(linkSelector);
      if (!surface || !target) {
        throw new Error(`Missing contrast target: ${surfaceSelector} / ${linkSelector}`);
      }
      return {
        foreground: getComputedStyle(target).color,
        background: getComputedStyle(surface).backgroundColor,
      };
    }, item);

    expect(
      contrastRatio(colors.foreground, colors.background),
      `${item.linkSelector} on ${item.surfaceSelector} with keyboard focus`,
    ).toBeGreaterThanOrEqual(4.5);
  }
});

test('keeps the deferred video control at AA contrast on hover and keyboard focus', async ({
  page,
}) => {
  await page.goto('/que-ver-cerca/castillo-torrebuceit/');

  const button = page.getByRole('button', {
    name: 'Reproducir vídeo: Torrebuceit desde el aire',
  });
  await expect(button).toBeVisible();

  const checkContrast = async () => {
    const colors = await page.evaluate(() => {
      const control = document.querySelector<HTMLElement>('.video-launch');
      const surface = control?.parentElement;
      if (!control || !surface) throw new Error('Missing deferred video control surface');
      return {
        foreground: getComputedStyle(control).color,
        background: getComputedStyle(surface).backgroundColor,
      };
    });
    expect(contrastRatio(colors.foreground, colors.background)).toBeGreaterThanOrEqual(4.5);
  };

  await checkContrast();
  await button.hover();
  await checkContrast();

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  let focused = false;
  for (let attempt = 0; attempt < 30 && !focused; attempt += 1) {
    await page.mouse.move(0, 0);
    await page.keyboard.press('Tab');
    focused = await button.evaluate((element) => document.activeElement === element);
  }
  expect(focused).toBe(true);
  await expect(button).toHaveCSS('outline-style', 'solid');
  await checkContrast();
});
