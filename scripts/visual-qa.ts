import { chromium } from '@playwright/test';

const baseUrl = process.env.VISUAL_QA_BASE_URL ?? 'http://127.0.0.1:4321';
const routes = [
  '/',
  '/sobre-el-pueblo/',
  '/bandos/',
  '/noticias/',
  '/agenda/',
  '/informacion-practica/',
  '/rutas/',
  '/alojamientos/',
  '/juego/',
];
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
];

function inspectViewport() {
  type RgbColor = { r: number; g: number; b: number; a: number };

  const overflow = {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  };
  const focus =
    document.activeElement instanceof HTMLElement
      ? {
          tag: document.activeElement.tagName,
          focusVisible: document.activeElement.matches(':focus-visible'),
          outline: getComputedStyle(document.activeElement).outlineStyle,
        }
      : null;
  const contrastFailures: Array<{ text: string; ratio: number; minimum: number }> = [];
  const candidates = document.querySelectorAll<HTMLElement>(
    'h1,h2,h3,h4,p,a,button,label,small,dt,dd,th,td,figcaption',
  );

  for (const element of candidates) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      rect.width === 0 ||
      rect.height === 0
    ) {
      continue;
    }
    if (element.closest('.leaflet-control-attribution')) continue;

    const directTextParts: string[] = [];
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) directTextParts.push(node.textContent ?? '');
    }
    const directText = directTextParts.join(' ').trim();
    if (!directText) continue;

    const foregroundMatch = style.color.match(/rgba?\(([^)]+)\)/);
    if (!foregroundMatch) continue;
    const foregroundColor = foregroundMatch[1];
    if (foregroundColor === undefined) continue;
    const foregroundParts = foregroundColor
      .split(/[\s, /]+/)
      .filter(Boolean)
      .map(Number);
    const [redChannel, greenChannel, blueChannel, alphaChannel] = foregroundParts;
    if (redChannel === undefined || greenChannel === undefined || blueChannel === undefined) {
      continue;
    }
    const foreground: RgbColor = {
      r: redChannel,
      g: greenChannel,
      b: blueChannel,
      a: alphaChannel ?? 1,
    };
    if (foreground.a === 0) continue;

    let background: RgbColor = { r: 244, g: 241, b: 233, a: 1 };
    let current: HTMLElement | null = element;
    while (current instanceof HTMLElement) {
      const backgroundMatch = getComputedStyle(current).backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (backgroundMatch) {
        const backgroundColor = backgroundMatch[1];
        if (backgroundColor === undefined) {
          current = current.parentElement;
          continue;
        }
        const backgroundParts = backgroundColor
          .split(/[\s, /]+/)
          .filter(Boolean)
          .map(Number);
        const [backgroundRed, backgroundGreen, backgroundBlue, backgroundAlpha] = backgroundParts;
        if (
          backgroundRed !== undefined &&
          backgroundGreen !== undefined &&
          backgroundBlue !== undefined
        ) {
          const candidate: RgbColor = {
            r: backgroundRed,
            g: backgroundGreen,
            b: backgroundBlue,
            a: backgroundAlpha ?? 1,
          };
          if (candidate.a >= 0.9) {
            background = candidate;
            break;
          }
        }
      }
      current = current.parentElement;
    }

    const foregroundRed = foreground.r / 255;
    const foregroundGreen = foreground.g / 255;
    const foregroundBlue = foreground.b / 255;
    const foregroundLuminance =
      0.2126 *
        (foregroundRed <= 0.03928
          ? foregroundRed / 12.92
          : ((foregroundRed + 0.055) / 1.055) ** 2.4) +
      0.7152 *
        (foregroundGreen <= 0.03928
          ? foregroundGreen / 12.92
          : ((foregroundGreen + 0.055) / 1.055) ** 2.4) +
      0.0722 *
        (foregroundBlue <= 0.03928
          ? foregroundBlue / 12.92
          : ((foregroundBlue + 0.055) / 1.055) ** 2.4);
    const backgroundRed = background.r / 255;
    const backgroundGreen = background.g / 255;
    const backgroundBlue = background.b / 255;
    const backgroundLuminance =
      0.2126 *
        (backgroundRed <= 0.03928
          ? backgroundRed / 12.92
          : ((backgroundRed + 0.055) / 1.055) ** 2.4) +
      0.7152 *
        (backgroundGreen <= 0.03928
          ? backgroundGreen / 12.92
          : ((backgroundGreen + 0.055) / 1.055) ** 2.4) +
      0.0722 *
        (backgroundBlue <= 0.03928
          ? backgroundBlue / 12.92
          : ((backgroundBlue + 0.055) / 1.055) ** 2.4);
    const ratio =
      (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
      (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
    const large =
      Number.parseFloat(style.fontSize) >= 24 || Number.parseInt(style.fontWeight, 10) >= 700;
    const minimum = large ? 3 : 4.5;
    if (ratio < minimum) {
      contrastFailures.push({
        text: directText.slice(0, 48),
        ratio: Number(ratio.toFixed(2)),
        minimum,
      });
    }
  }

  return { overflow, focus, contrastFailures };
}

const browser = await chromium.launch();
const page = await browser.newPage();
const failures: string[] = [];
const consoleErrors: string[] = [];

page.on('pageerror', (error) => consoleErrors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});

for (const viewport of viewports) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  for (const route of routes) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded' });
    const status = response?.status() ?? 0;
    if (status !== 200) failures.push(`${viewport.name} ${route}: HTTP ${status}`);

    await page.keyboard.press('Tab');
    const result = await page.evaluate(inspectViewport);

    if (result.overflow.scrollWidth > result.overflow.clientWidth + 1) {
      failures.push(
        `${viewport.name} ${route}: horizontal overflow ${result.overflow.scrollWidth}/${result.overflow.clientWidth}`,
      );
    }
    if (!result.focus || result.focus.outline === 'none') {
      failures.push(`${viewport.name} ${route}: focused global control has no visible outline`);
    }
    for (const failure of result.contrastFailures) {
      failures.push(
        `${viewport.name} ${route}: contrast ${failure.ratio} < ${failure.minimum} (${failure.text})`,
      );
    }
  }
}

await browser.close();

if (consoleErrors.length > 0) {
  failures.push(`browser console errors: ${consoleErrors.join(' | ')}`);
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Visual QA passed: ${routes.length} routes × ${viewports.length} viewports; no overflow, focus, contrast, HTTP, or console failures.`,
);
