import { describe, expect, it } from 'vitest';
import { selectMapMarkers } from '../../src/scripts/palomarenos-map-data';

describe('selectMapMarkers', () => {
  it('keeps valid public records and drops invalid coordinates', () => {
    const result = selectMapMarkers([
      {
        id: 'madrid',
        displayName: 'Ana López',
        city: 'Madrid',
        country: 'España',
        latitude: 40.4168,
        longitude: -3.7038,
        story: 'Vuelvo al pueblo siempre que puedo.',
      },
      {
        id: 'invalid',
        displayName: 'Registro inválido',
        city: 'Sin mapa',
        country: 'España',
        latitude: 95,
        longitude: 10,
        story: 'No debería aparecer.',
      },
    ]);

    expect(result).toEqual([
      {
        id: 'madrid',
        displayName: 'Ana López',
        city: 'Madrid',
        country: 'España',
        latitude: 40.4168,
        longitude: -3.7038,
        story: 'Vuelvo al pueblo siempre que puedo.',
      },
    ]);
  });

  it('returns an empty list when there are no approved map records', () => {
    expect(selectMapMarkers([])).toEqual([]);
    expect(
      selectMapMarkers([
        {
          id: 'unlocated',
          displayName: 'Sin coordenadas',
          city: 'Madrid',
          country: 'España',
          story: 'Pendiente de revisión.',
        },
      ]),
    ).toEqual([]);
  });
});
