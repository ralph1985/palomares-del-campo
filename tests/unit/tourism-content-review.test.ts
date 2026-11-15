import { describe, expect, it } from 'vitest';
import { ruralAccommodations } from '../../src/data/accommodations';
import { nearbyPlaces } from '../../src/data/nearby-places';

const sanCristobal = ruralAccommodations.find(
  (accommodation) => accommodation.name === 'Casa Rural San Cristóbal',
);

describe('tourism content provenance', () => {
  it('does not publish a disputed capacity as a settled numeric fact', () => {
    expect(sanCristobal).toBeDefined();
    expect(sanCristobal?.capacity).toMatch(/por confirmar/i);
    expect(sanCristobal?.summary).toMatch(/discrepan en la capacidad/i);
    expect(sanCristobal?.source.href).toBe(
      'https://www.tuscasasrurales.com/casa-rural-san-cristobal-f20825.htm',
    );
    expect(sanCristobal?.officialSource?.href).toBe('https://www.casaruralsancristobalcuenca.es/');
  });

  it('retains approximate route estimates for Huete and Ciudad Encantada', () => {
    expect(
      nearbyPlaces.find((place) => place.slug === 'huete-lapis-specularis')?.routeEstimate,
    ).toEqual({
      distanceKm: 36.4,
      durationMinutes: 38,
      destinationLabel: 'Casco urbano de Huete',
    });
    expect(nearbyPlaces.find((place) => place.slug === 'ciudad-encantada')?.routeEstimate).toEqual({
      distanceKm: 78.9,
      durationMinutes: 73,
      destinationLabel: 'Acceso a la Ciudad Encantada',
    });
  });

  it('keeps only the rounded route estimates verified against OSM', () => {
    const expectedEstimates = [
      ['segobriga-saelices', 28.1, 38],
      ['ucles', 41.7, 40],
      ['belmonte', 54.7, 62],
      ['cuenca', 55, 46],
      ['villa-romana-noheda', 61.1, 50],
      ['mota-del-cuervo', 69.9, 73],
    ] as const;

    for (const [slug, distanceKm, durationMinutes] of expectedEstimates) {
      expect(nearbyPlaces.find((place) => place.slug === slug)?.routeEstimate).toMatchObject({
        distanceKm,
        durationMinutes,
      });
    }
  });
});
