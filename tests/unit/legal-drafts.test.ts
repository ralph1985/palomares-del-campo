import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const legalNotice = readFileSync('src/pages/aviso-legal.astro', 'utf8');
const privacy = readFileSync('src/pages/privacidad/index.astro', 'utf8');
const cookies = readFileSync('src/pages/politica-de-cookies.astro', 'utf8');
const drafts = [legalNotice, privacy, cookies];

describe('borradores de información legal', () => {
  it('mantiene las tres páginas expresamente provisionales', () => {
    expect(legalNotice).toContain('Aviso provisional');
    expect(privacy).toContain('Borrador informativo sujeto a validación municipal');
    expect(cookies).toContain('Borrador provisional');
  });

  it('asocia cada cuestión municipal pendiente a un único ID concreto', () => {
    const ids = drafts.flatMap((page) => page.match(/LEG-\d{2}/g) ?? []);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual([
      'LEG-01',
      'LEG-02',
      'LEG-03',
      'LEG-04',
      'LEG-05',
      'LEG-06',
      'LEG-07',
      'LEG-08',
      'LEG-09',
      'LEG-10',
      'LEG-11',
      'LEG-12',
      'LEG-13',
      'LEG-14',
      'LEG-15',
      'LEG-16',
      'LEG-17',
      'LEG-18',
    ]);
  });

  it('does not expose technical TODO markers in visitor-facing copy', () => {
    const visitorFacingSource = drafts
      .map((page) => page.replace(/<!--[\s\S]*?-->/g, ''))
      .join(' ');
    expect(visitorFacingSource).not.toContain('TODO(AYTO)');
  });

  it('identifica almacenamiento web y no afirma la ausencia total de tecnologías', () => {
    expect(cookies).toContain('sessionStorage');
    expect(cookies).toContain('localStorage');
    expect(cookies).toContain('No es una certificación de ausencia');
    expect(cookies).not.toContain('Actualmente esta web no instala cookies');
  });

  it('conserva referencias a procesos y proveedores descritos como provisionales', () => {
    expect(privacy).toContain('Palomareños por el mundo');
    expect(privacy).toContain('Convex');
    expect(privacy).toContain('Resend');
    expect(privacy).toContain('Cloudflare Turnstile');
    expect(cookies).toContain('OpenStreetMap');
  });
});
