export type GameLocation = {
  id: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  description: string;
};

/**
 * Lugares provisionales del prototipo, centrados en el núcleo urbano.
 * Las coordenadas proceden de geometrías cartografiadas en OpenStreetMap.
 */
export const gameLocations: GameLocation[] = [
  {
    id: 'plaza-del-coso',
    name: 'Plaza del Coso',
    shortName: 'Plaza del Coso',
    latitude: 39.9463,
    longitude: -2.5988,
    radiusMeters: 55,
    description: 'Punto situado en la Plaza del Coso.',
  },
  {
    id: 'iglesia-nuestra-senora',
    name: 'Iglesia de Nuestra Señora de la Asunción',
    shortName: 'Iglesia',
    latitude: 39.94791,
    longitude: -2.59881,
    radiusMeters: 55,
    description: 'Punto situado junto a la iglesia de Nuestra Señora de la Asunción.',
  },
  {
    id: 'ayuntamiento',
    name: 'Ayuntamiento de Palomares del Campo',
    shortName: 'Ayuntamiento',
    latitude: 39.94647,
    longitude: -2.59881,
    radiusMeters: 50,
    description: 'Punto situado junto al Ayuntamiento de Palomares del Campo.',
  },
  {
    id: 'ermita',
    name: 'Ermita',
    shortName: 'Ermita',
    latitude: 39.94644,
    longitude: -2.59802,
    radiusMeters: 50,
    description: 'Punto situado junto a la ermita.',
  },
  {
    id: 'el-jardinillo',
    name: 'El Jardinillo',
    shortName: 'El Jardinillo',
    latitude: 39.94358,
    longitude: -2.59687,
    radiusMeters: 65,
    description: 'Punto situado en El Jardinillo.',
  },
  {
    id: 'polideportivo',
    name: 'Polideportivo de Palomares del Campo',
    shortName: 'Polideportivo',
    latitude: 39.94479,
    longitude: -2.59923,
    radiusMeters: 60,
    description: 'Punto situado en el polideportivo municipal.',
  },
];
