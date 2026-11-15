import { describe, expect, it } from 'vitest';

import { services, serviceStatusLabels } from '../../src/data/services';

describe('servicios del pueblo data', () => {
  it('provides source-backed, status-labelled records without blank optional fields', () => {
    expect(services.length).toBeGreaterThan(0);

    for (const service of services) {
      expect(service.id).not.toBe('');
      expect(service.name).not.toBe('');
      expect(service.summary).not.toBe('');
      expect(service.source.url).toMatch(/^https:\/\//);
      expect(service.source.label).not.toBe('');
      expect(serviceStatusLabels[service.status]).not.toBe('');

      for (const value of [service.address, service.phone, service.hours]) {
        expect(value).not.toBe('');
      }
    }
  });

  it('does not imply current activity from a historical or provisional business listing', () => {
    const provisionalStatuses = new Map([
      ['Udaco Alimentación', 'documentado-provisional'],
      ['Artesanías Molero del Río', 'documentado-provisional'],
      ['Carnicería Dionisio', 'documentado-sin-estado-operativo'],
      ['Frutas Millán C. B.', 'documentado-sin-estado-operativo'],
    ] as const);

    for (const [name, status] of provisionalStatuses) {
      const service = services.find((record) => record.name === name);
      expect(service?.status).toBe(status);
    }
  });

  it('labels the two confirmed hospitality businesses as open without attribution', () => {
    const activeBars = ['Bar Los Arcos', 'Pub Colin’s'];
    for (const name of activeBars) {
      const service = services.find((record) => record.name === name);
      if (!service) throw new Error(`Missing service record: ${name}`);
      expect(service.status).toBe('activo');
      expect(serviceStatusLabels[service.status]).toBe('Abierto');
      expect(service.summary).not.toMatch(/propietario|confirmad[oa]/i);
    }
  });

  it('keeps unverified business candidates provisional', () => {
    const candidateStatuses = new Map([
      ['Carnicería · candidato: Justo Ruiz Gómez', 'documentado-sin-estado-operativo'],
      ['Estanco · candidato; titular por confirmar', 'documentado-sin-estado-operativo'],
    ] as const);

    for (const [name, status] of candidateStatuses) {
      const service = services.find((record) => record.name === name);
      expect(service?.status).toBe(status);
      expect(serviceStatusLabels[status]).not.toBe('Abierto');
      expect(service?.summary).not.toMatch(/está abierto|en funcionamiento/i);
    }
  });

  it('excludes El Sotanillo and does not display unresolved contact details', () => {
    expect(services.some(({ name }) => name.toLowerCase().includes('sotanillo'))).toBe(false);
    expect(
      services.every(
        ({ address, phone, hours }) =>
          address === undefined && phone === undefined && hours === undefined,
      ),
    ).toBe(true);
  });
});
