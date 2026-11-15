export interface LocalRoute {
  slug: string;
  title: string;
  summary: string;
  gpxUrl: string;
  statusLabel: string;
}

export const localRoutes: LocalRoute[] = [
  {
    slug: 'campos-palomares-osm-provisional',
    title: 'Trazado cartográfico provisional por los campos',
    summary:
      'Línea planificada a partir de datos de OpenStreetMap. El acceso y las condiciones de los caminos no se han confirmado.',
    gpxUrl: '/routes/campos-palomares-osm-provisional.gpx',
    statusLabel: 'Trazado cartográfico provisional',
  },
];
