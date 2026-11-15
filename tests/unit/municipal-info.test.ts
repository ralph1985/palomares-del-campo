import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { describe, expect, it } from 'vitest';

import PracticalInfoPage from '../../src/pages/informacion-practica.astro';
import { municipalInfo, municipalInfoReviewedAt } from '../../src/data/municipal-info';
import { municipalContact } from '../../src/data/site-footer';

const render = async (component: AstroComponentFactory) => {
  const container = await AstroContainer.create();
  return container.renderToString(component);
};

describe('municipal information provenance', () => {
  it('keeps the Sede office contact distinct from the PLACSP contracting contact', () => {
    expect(municipalInfo.contact.email).toBe('palomaresdelcampo@dipucuenca.es');
    expect(municipalInfo.contractingContact).toMatchObject({
      email: 'ayto.palomares@gmail.com',
      nif: 'P1615700J',
    });
    expect(municipalContact.email).toBe(municipalInfo.contact.email);
    expect(municipalContact.contractingEmail).toBe('ayto.palomares@gmail.com');
  });

  it('keeps the council roster unpublished when the official page is stale', () => {
    expect(municipalInfo.corporation.members).toHaveLength(0);
    expect(municipalInfo.corporation.status).toMatch(/no se ha podido confirmar/i);
    expect(municipalInfo.corporation.source.href).toBe(
      'https://palomaresdelcampo.dipucuenca.es/index.php/joomla/smart-search',
    );
  });

  it('preserves the exact dated bus notice and marks the schedule as changeable', () => {
    expect(municipalInfo.transport.publishedAt).toBe('2026-10-09');
    expect(municipalInfo.transport.publishedTime).toBe('20:05:06');
    expect(municipalInfo.transport.source.href).toBe(
      'https://www.bandomovil.com/palomaresdelcampo/1659178/0',
    );
    expect(municipalInfo.transport.routes[0]?.entries).toEqual([
      { day: 'Lunes', time: '07:45' },
      { day: 'Martes', time: '08:34' },
      { day: 'Jueves', time: '08:34' },
      { day: 'Viernes', time: '07:45' },
      { day: 'Domingo', time: '17:30' },
    ]);
    expect(municipalInfoReviewedAt).toBe('2026-11-15');
  });

  it('renders the two email contexts and the stale-roster warning with visible sources', async () => {
    const html = await render(PracticalInfoPage);

    expect(html).toContain('Correo de oficina (Sede): palomaresdelcampo@dipucuenca.es');
    expect(html).toContain('ayto.palomares@gmail.com');
    expect(html).toContain('Correo indicado en la ficha de contratación (PLACSP)');
    expect(html).toContain('NIF que muestra la ficha: P1615700J');
    expect(html).toMatch(/No se ha podido confirmar una composición municipal vigente/i);
    expect(html).not.toContain('María Dolores Pérez Moreno');
    expect(html).toContain('su vigencia actual no está confirmada');
    expect(html).toContain('https://palomaresdelcampo.sedelectronica.es/ownership');
    expect(html).toContain('https://www.bandomovil.com/palomaresdelcampo/1659178/0');
  });
});
