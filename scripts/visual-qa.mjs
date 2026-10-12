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

const browser = await chromium.launch();
const page = await browser.newPage();
const failures = [];
const consoleErrors = [];

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
    const result = await page.evaluate(() => {
      const isVisible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      };
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

      const parseColor = (value) => {
        const match = value.match(/rgba?\(([^)]+)\)/);
        if (!match) return null;
        const parts = match[1]
          .split(/[\s, /]+/)
          .filter(Boolean)
          .map(Number);
        if (parts.length < 3) return null;
        return { r: parts[0], g: parts[1], b: parts[2], a: parts[3] ?? 1 };
      };
      const luminance = ({ r, g, b }) => {
        const channel = (value) => {
          const normalized = value / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
      };
      const contrast = (foreground, background) => {
        const light = Math.max(luminance(foreground), luminance(background));
        const dark = Math.min(luminance(foreground), luminance(background));
        return (light + 0.05) / (dark + 0.05);
      };
      const backgroundFor = (element) => {
        let current = element;
        while (current instanceof HTMLElement) {
          const color = parseColor(getComputedStyle(current).backgroundColor);
          if (color && color.a >= 0.9) return color;
          current = current.parentElement;
        }
        return { r: 244, g: 241, b: 233, a: 1 };
      };
      const contrastFailures = [];
      const candidates = document.querySelectorAll(
        'h1,h2,h3,h4,p,a,button,label,small,dt,dd,th,td,figcaption',
      );
      for (const element of candidates) {
        if (!(element instanceof HTMLElement) || !isVisible(element)) continue;
        if (element.closest('.leaflet-control-attribution')) continue;
        const directText = [...element.childNodes]
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent ?? '')
          .join(' ')
          .trim();
        if (!directText) continue;
        const style = getComputedStyle(element);
        const foreground = parseColor(style.color);
        const background = backgroundFor(element);
        if (!foreground || foreground.a === 0) continue;
        const ratio = contrast(foreground, background);
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
    });

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
