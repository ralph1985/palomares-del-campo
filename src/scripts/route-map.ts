import L from 'leaflet';

type RoutePoint = [number, number];

type RouteWaypoint = {
  name: string;
  position: RoutePoint;
};

type ParsedRoute = {
  track: RoutePoint[];
  waypoints: RouteWaypoint[];
};

const parseCoordinate = (value: string | null): number => {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate)) throw new Error('Coordenada GPX no válida.');
  return coordinate;
};

const parseGpx = (xml: string): ParsedRoute => {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error('El GPX no tiene un XML válido.');

  const track = Array.from(document.querySelectorAll('trkpt')).map(
    (point) =>
      [
        parseCoordinate(point.getAttribute('lat')),
        parseCoordinate(point.getAttribute('lon')),
      ] as RoutePoint,
  );

  const waypoints = Array.from(document.querySelectorAll('wpt')).map((waypoint) => ({
    name: waypoint.querySelector('name')?.textContent?.trim() || 'Punto de interés',
    position: [
      parseCoordinate(waypoint.getAttribute('lat')),
      parseCoordinate(waypoint.getAttribute('lon')),
    ] as RoutePoint,
  }));

  if (track.length < 2) throw new Error('El GPX no contiene un trazado suficiente.');
  return { track, waypoints };
};

const setMapState = (element: HTMLElement, status: 'loading' | 'ready' | 'error'): void => {
  element.dataset.mapStatus = status;
  element.setAttribute('aria-busy', String(status === 'loading'));
  const statusElement =
    element.parentElement?.querySelector<HTMLElement>('[data-route-map-status]');
  if (!statusElement) return;
  statusElement.textContent =
    status === 'ready'
      ? 'Mapa cargado. Puedes ampliar, desplazarlo y consultar los puntos de interés.'
      : status === 'error'
        ? 'No se ha podido cargar el mapa. Puedes descargar el GPX para consultar el trazado.'
        : 'Cargando mapa…';
  statusElement.dataset.state = status;
};

const initialiseMap = async (element: HTMLElement): Promise<void> => {
  setMapState(element, 'loading');

  try {
    const map = L.map(element, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const url = element.dataset.gpxUrl;
    if (!url) throw new Error('El mapa no tiene un GPX asociado.');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`No se pudo descargar el GPX (${response.status}).`);

    const route = parseGpx(await response.text());
    const routeLine = L.polyline(route.track, {
      className: 'route-track-line',
      color: '#a05c32',
      weight: 5,
      opacity: 0.9,
      lineJoin: 'round',
    }).addTo(map);
    const layers: L.Layer[] = [routeLine];

    route.waypoints.forEach((waypoint) => {
      const marker = L.circleMarker(waypoint.position, {
        className: 'route-waypoint-marker',
        radius: 7,
        color: '#19342d',
        weight: 3,
        fillColor: '#e5b77e',
        fillOpacity: 1,
      }).addTo(map);
      marker.bindTooltip(waypoint.name, { direction: 'top', offset: [0, -8] });
      layers.push(marker);
    });

    map.fitBounds(L.featureGroup(layers).getBounds(), { padding: [24, 24] });
    setMapState(element, 'ready');
  } catch (error) {
    console.error('No se pudo inicializar el mapa de la ruta.', error);
    setMapState(element, 'error');
  }
};

document.querySelectorAll<HTMLElement>('[data-route-map]').forEach((element) => {
  void initialiseMap(element);
});
