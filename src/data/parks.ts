import type { ImageMetadata } from 'astro';

export interface ParkSource {
  label: string;
  href: string;
}

export interface ConfirmedParkEquipment {
  name: string;
  source: ParkSource;
}

/**
 * Add a municipal photograph only after its publication permission is recorded.
 * Store the optimized image locally; do not hotlink municipal originals.
 */
export interface AuthorizedMunicipalParkPhoto {
  image: ImageMetadata;
  alt: string;
  credit: string;
  permission: {
    grantedBy: string;
    reference: string;
    grantedAt: string;
  };
}

export interface PublicGreenSpace {
  slug: string;
  name: string;
  description: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  mapUrl: string;
  equipment: ConfirmedParkEquipment[];
  sources: ParkSource[];
  verificationNote?: string;
  photo?: AuthorizedMunicipalParkPhoto;
}

/**
 * The 2024 GeoEIEL layer identifies one georeferenced «Parque y Jardín» point.
 * It has no proper name or listed equipment; the note keeps that limitation visible.
 */
export const parksReviewedAt = '2026-11-16';
export const publicGreenSpaces: PublicGreenSpace[] = [
  {
    slug: 'eiel-parque-jardin-2024',
    name: 'Parque y jardín (registro EIEL 2024)',
    description:
      'Registro georreferenciado en GeoEIEL (fase 2024), clasificado como «Parque y Jardín». La fuente no especifica un nombre propio ni un inventario de equipamientos.',
    location: 'Núcleo urbano · punto de referencia; el perímetro del recinto no está publicado.',
    coordinates: {
      latitude: 39.9457706937704,
      longitude: -2.60033216669301,
    },
    mapUrl:
      'https://www.openstreetmap.org/?mlat=39.9457706937704&mlon=-2.60033216669301#map=18/39.9457706937704/-2.60033216669301',
    equipment: [],
    sources: [
      {
        label: 'GeoEIEL · Parque y Jardín · fase 2024',
        href: 'https://eiel.redsara.es/visor/layer-json/fase:2024-codine:16148/capa:PJ',
      },
      {
        label: 'Visor público GeoEIEL',
        href: 'https://eiel.redsara.es/visor/',
      },
    ],
    verificationNote:
      'La fase 2024 ofrece un punto georreferenciado, no el perímetro. El nombre de uso, el acceso, el estado actual y los equipamientos no están confirmados por la fuente; requieren validación municipal.',
  },
];
