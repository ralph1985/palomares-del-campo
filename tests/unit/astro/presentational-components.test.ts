import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { describe, expect, it } from 'vitest';

import AccommodationCard from '../../../src/components/accommodations/AccommodationCard.astro';
import HeritageCard from '../../../src/components/about/HeritageCard.astro';
import CurrentAffairsEmptyState from '../../../src/components/current-affairs/CurrentAffairsEmptyState.astro';
import GamePrivacyNotice from '../../../src/components/game/GamePrivacyNotice.astro';
import ActionLink from '../../../src/components/ui/ActionLink.astro';
import Button from '../../../src/components/ui/Button.astro';
import CollectionCardMeta from '../../../src/components/ui/CollectionCardMeta.astro';
import ExternalLink from '../../../src/components/ui/ExternalLink.astro';
import type { HeritageFeature } from '../../../src/data/about-palomares';
import type { RuralAccommodation } from '../../../src/data/accommodations';

const render = async (
  component: AstroComponentFactory,
  props: Record<string, unknown> = {},
  slots: Record<string, string> = {},
) => {
  const container = await AstroContainer.create();
  return container.renderToString(component, { props, slots });
};

describe('GamePrivacyNotice.astro', () => {
  it('distinguishes local demonstration copy from remote-game copy', async () => {
    const localHtml = await render(GamePrivacyNotice, { hasRemoteGame: false });
    const remoteHtml = await render(GamePrivacyNotice, { hasRemoteGame: true });

    expect(localHtml).toContain('>Modo local</h3>');
    expect(localHtml).toContain(
      'Esta demostración funciona en local y no representa todavía una partida multijugador real.',
    );
    expect(remoteHtml).toContain('>Partida remota</h3>');
    expect(remoteHtml).toContain(
      'La partida remota comparte únicamente el estado necesario para jugar.',
    );
    expect(remoteHtml).not.toContain('no representa todavía una partida multijugador real');
    expect(localHtml).toContain('real. Las ubicaciones del juego son provisionales');
    expect(remoteHtml).toContain('jugar. Las ubicaciones del juego son provisionales');
  });
});

describe('CurrentAffairsEmptyState.astro', () => {
  it('uses the selected section in its data marker and accessible heading relationship', async () => {
    for (const section of ['agenda', 'avisos'] as const) {
      const title = section === 'agenda' ? 'Agenda' : 'Avisos';
      const html = await render(CurrentAffairsEmptyState, {
        section,
        eyebrow: 'Información municipal',
        title,
        description: 'Consulta la información disponible.',
        emptyMessage: 'No hay contenido publicado en este momento.',
      });

      expect(html).toContain(`data-section="${section}"`);
      expect(html).toContain(`aria-labelledby="${section}-title"`);
      expect(html).toContain(`id="${section}-title"`);
      expect(html).toContain(`>${title}</h1>`);
      expect(html).toContain('href="/"');
    }
  });
});

const minimalAccommodation = {
  name: 'Casa de prueba',
  location: 'Horcajada de la Torre',
  area: 'Alrededores',
  category: 'Casa rural',
  capacity: 'Hasta 6 plazas',
  summary: 'Alojamiento de ejemplo para comprobar la ficha.',
  source: {
    label: 'Ficha del alojamiento',
    href: 'https://example.test/alojamiento',
  },
} satisfies RuralAccommodation;

const detailedAccommodation = {
  ...minimalAccommodation,
  name: 'Casa completa de prueba',
  rooms: '3 dormitorios',
  bathrooms: '2 baños',
  officialSource: {
    label: 'Sitio oficial',
    href: 'https://example.test/oficial',
  },
} satisfies RuralAccommodation;

describe('AccommodationCard.astro', () => {
  it('omits absent optional facts and marks the nearby dark variant', async () => {
    const html = await render(AccommodationCard, {
      accommodation: minimalAccommodation,
      variant: 'dark',
    });

    expect(html).toContain('accommodation-card--dark');
    expect(html).toContain('Hasta 6 plazas');
    expect(html).not.toContain('Distribución');
    expect(html).not.toContain('Baños');
    expect(html).not.toContain('Sitio oficial');
    expect(html).toContain('href="https://example.test/alojamiento"');
  });

  it('renders supplied room, bathroom, and official-source details', async () => {
    const html = await render(AccommodationCard, {
      accommodation: detailedAccommodation,
    });

    expect(html).not.toContain('accommodation-card--dark');
    expect(html).toContain('3 dormitorios');
    expect(html).toContain('2 baños');
    expect(html).toContain('Sitio oficial');
    expect(html).toContain('href="https://example.test/oficial"');
  });
});

const heritageFeature = {
  eyebrow: 'Patrimonio',
  title: 'Iglesia de prueba',
  description: 'Descripción breve de la iglesia.',
  body: 'Texto ampliado que explica el valor del lugar.',
  source: {
    label: 'Fuente municipal',
    href: 'https://example.test/patrimonio',
  },
} satisfies HeritageFeature;

describe('HeritageCard.astro', () => {
  it('applies the offset only to odd positions and preserves its source link', async () => {
    const evenHtml = await render(HeritageCard, { ...heritageFeature, index: 0 });
    const oddHtml = await render(HeritageCard, { ...heritageFeature, index: 1 });

    expect(evenHtml).not.toContain('heritage-card--offset');
    expect(oddHtml).toContain('heritage-card--offset');
    expect(oddHtml).toContain('Iglesia de prueba');
    expect(oddHtml).toContain('target="_blank"');
    expect(oddHtml).toContain('rel="noopener noreferrer"');
  });
});

describe('ActionLink.astro', () => {
  it('renders the default and explicit visual variants while forwarding link attributes', async () => {
    const defaultHtml = await render(
      ActionLink,
      { href: '/agenda/', 'aria-label': 'Consultar agenda' },
      { default: 'Agenda' },
    );
    const underlineHtml = await render(
      ActionLink,
      { href: '/avisos/', variant: 'underline' },
      { default: 'Avisos' },
    );
    const solidHtml = await render(
      ActionLink,
      { href: '/juego/', variant: 'solid', class: 'custom-action' },
      { default: 'Jugar' },
    );

    expect(defaultHtml).toContain('data-ui-variant="text"');
    expect(defaultHtml).toContain('aria-label="Consultar agenda"');
    expect(defaultHtml).toContain('ui-action-link-text');
    expect(defaultHtml).toContain('>Agenda</a>');
    expect(underlineHtml).toContain('ui-action-link-underline');
    expect(underlineHtml).toContain('data-ui-variant="underline"');
    expect(solidHtml).toContain('ui-action-link-solid');
    expect(solidHtml).toContain('custom-action');
    expect(solidHtml).toContain('>Jugar</a>');
  });
});

describe('ExternalLink.astro', () => {
  it('opens external destinations safely and forwards descriptive attributes', async () => {
    const html = await render(
      ExternalLink,
      {
        href: 'https://example.test/recurso',
        title: 'Abrir el recurso externo',
        class: 'source-link',
      },
      { default: 'Fuente' },
    );

    expect(html).toContain('href="https://example.test/recurso"');
    expect(html).toContain('title="Abrir el recurso externo"');
    expect(html).toContain('class="ui-external-link source-link"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('>Fuente</a>');
  });
});

describe('Button.astro', () => {
  it('defaults to secondary and preserves native button state and type', async () => {
    const html = await render(
      Button,
      { type: 'button', disabled: true, 'aria-label': 'Continuar' },
      { default: 'Continuar' },
    );

    expect(html).toContain('data-ui-variant="secondary"');
    expect(html).toContain('game-button-secondary');
    expect(html).toContain('type="button"');
    expect(html).toContain('disabled');
    expect(html).toContain('aria-label="Continuar"');
    expect(html).toContain('>Continuar</button>');
  });

  it('renders each supported explicit game-action variant', async () => {
    for (const variant of ['primary', 'secondary', 'capture', 'simulator'] as const) {
      const html = await render(Button, { type: 'button', variant }, { default: 'Acción' });

      expect(html).toContain(`data-ui-variant="${variant}"`);
      expect(html).toContain(`game-button-${variant}`);
    }
  });
});

describe('CollectionCardMeta.astro', () => {
  it('renders a machine-readable date and its Spanish display value', async () => {
    const html = await render(CollectionCardMeta, {
      date: new Date('2026-06-01T12:00:00.000Z'),
      context: 'Noticias',
    });

    expect(html).toContain('datetime="2026-06-01T12:00:00.000Z"');
    expect(html).toContain('>1 de junio de 2026</time>');
    expect(html).toContain('Noticias');
  });
});
