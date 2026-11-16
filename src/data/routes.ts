export interface LocalRoute {
  slug: string;
  title: string;
  summary: string;
  author: string;
  sourceUrl: string;
  embedUrl: string;
  statusLabel: string;
}

export const localRoutes: LocalRoute[] = [
  {
    slug: 'palomares-del-campo-a-la-cantera',
    title: 'Palomares del Campo a La Cantera',
    summary:
      'Ruta publicada en Wikiloc por su autor original. El Ayuntamiento no la presenta como ruta oficial ni la ha verificado sobre el terreno.',
    author: 'Joaquin Alcarria',
    sourceUrl: 'https://es.wikiloc.com/rutas-senderismo/palomares-del-campo-a-la-cantera-54551889',
    embedUrl:
      'https://es.wikiloc.com/wikiloc/embedv2.do?id=54551889&elevation=on&images=on&maptype=H',
    statusLabel: 'Fuente externa · Wikiloc',
  },
];
