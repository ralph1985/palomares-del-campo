export interface RouteSource {
  label: string;
  href: string;
}

export interface LocalRoute {
  slug: string;
  title: string;
  summary: string;
  distanceKm: number;
  durationMinutes: number;
  difficulty: 'Fácil' | 'Moderada' | 'Difícil';
  elevationGainMetres: number;
  accessibilityNote: string;
  statusLabel: string;
  routeSource: RouteSource;
  contextSource: RouteSource;
  sourceUpdatedAt: string;
  reviewedAt: string;
}

// TODO(AYTO)[RUT-01]: Validar sobre el terreno el GPX externo (trazado, firme, cruces, seguridad, accesibilidad y vigencia); no presentarlo como ruta municipal hasta recibir confirmación local.
// TODO(AYTO)[RUT-02]: Confirmar que el trazado, origen/destino y denominación local son correctos y que puede recomendarse a visitantes; las métricas se mostrarán como estimaciones derivadas de la traza validada.
// TODO(AYTO)[RUT-03]: Confirmar la autorización para volver a alojar y ofrecer la descarga del GPX de Komoot; si no existe permiso, enlazar solo a la ficha original.
export const localRoutes: LocalRoute[] = [
  {
    slug: 'campos-palomares-del-campo',
    title: 'Paseo por los campos de Palomares del Campo',
    summary:
      'Recorrido a pie por los caminos rurales de Palomares del Campo. La ruta está publicada en Komoot y no es un itinerario municipal señalizado.',
    distanceKm: 5.13,
    durationMinutes: 81,
    difficulty: 'Fácil',
    elevationGainMetres: 50,
    accessibilityNote:
      'La fuente lo describe como de fácil acceso y apto para todos los niveles. Conviene confirmar el estado del firme antes de salir.',
    statusLabel: 'Recomendación externa',
    routeSource: {
      label: 'Ver ruta en Komoot',
      href: 'https://www.komoot.com/smarttour/e1154591619/hiking-through-the-fields-of-palomares-del-campo',
    },
    contextSource: {
      label: 'Turismo de Castilla-La Mancha',
      href: 'https://www.turismocastillalamancha.es/es/destinos/encanto-rural/cuenca/palomares-del-campo',
    },
    sourceUpdatedAt: '2024-07-26',
    reviewedAt: '2026-11-15',
  },
];
