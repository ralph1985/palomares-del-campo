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
 * Keep this list limited to spaces identified and confirmed for public display.
 * GeoEIEL and OSM research candidates remain documented, not presented as park cards.
 */
export const publicGreenSpaces: PublicGreenSpace[] = [];
