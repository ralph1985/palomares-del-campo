import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ConvexClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { selectMapMarkers, type PalomarenoMapMarker } from './palomarenos-map-data';
import { isE2EFixtureMode } from './e2e-fixture-mode';

type MapStatus = 'loading' | 'ready' | 'empty' | 'config' | 'error';

const isE2EFixture = isE2EFixtureMode({
  development: import.meta.env.DEV,
  flag: import.meta.env.PUBLIC_E2E_TEST_MODE,
});

const setMapState = (element: HTMLElement, status: MapStatus, message: string): void => {
  element.dataset.mapStatus = status;
  element.setAttribute('aria-busy', String(status === 'loading'));
  const statusElement = element.parentElement?.querySelector<HTMLElement>(
    '[data-palomarenos-map-status]',
  );
  if (statusElement) statusElement.textContent = message;
};

const createPopupContent = (marker: PalomarenoMapMarker): HTMLElement => {
  const content = document.createElement('article');
  content.className = 'world-map-popup';

  const title = document.createElement('h3');
  title.textContent = marker.displayName;
  content.append(title);

  const place = document.createElement('p');
  place.textContent = `${marker.city}, ${marker.country}`;
  content.append(place);

  const story = document.createElement('p');
  story.className = 'world-map-popup-story';
  story.textContent = marker.story;
  content.append(story);

  return content;
};

const initialiseMap = async (element: HTMLElement): Promise<void> => {
  const convexUrl = isE2EFixture ? '' : element.dataset.convexUrl?.trim();
  if (!convexUrl && !isE2EFixture) {
    element.textContent = 'El mapa estará disponible cuando se configure el servicio de datos.';
    setMapState(element, 'config', 'Mapa pendiente de configuración.');
    return;
  }

  setMapState(element, 'loading', 'Cargando historias aprobadas…');
  let map: L.Map | undefined;
  let client: ConvexClient | undefined;

  try {
    const activeMap = L.map(element, {
      scrollWheelZoom: false,
      zoomControl: true,
      attributionControl: true,
    });
    map = activeMap;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(activeMap);

    client = convexUrl ? new ConvexClient(convexUrl) : undefined;
    const records = client ? await client.query(api.palomarenos.listApproved, {}) : [];
    const markers = selectMapMarkers(records);

    if (markers.length === 0) {
      activeMap.setView([40.4, -3.7], 2);
      setMapState(element, 'empty', 'Todavía no hay historias aprobadas para mostrar.');
      return;
    }

    const layers = markers.map((marker) => {
      const point = L.circleMarker([marker.latitude, marker.longitude], {
        className: 'world-map-marker',
        radius: 8,
        color: '#19342d',
        weight: 2,
        fillColor: '#a05c32',
        fillOpacity: 0.95,
      }).addTo(activeMap);
      point.bindPopup(createPopupContent(marker));
      return point;
    });

    activeMap.fitBounds(L.featureGroup(layers).getBounds(), { padding: [32, 32], maxZoom: 5 });
    setMapState(
      element,
      'ready',
      `${markers.length} historia${markers.length === 1 ? '' : 's'} en el mapa.`,
    );
  } catch (error) {
    console.error('No se pudo inicializar el mapa de palomareños.', error);
    map?.remove();
    element.textContent = 'No se han podido cargar las historias ahora mismo.';
    setMapState(element, 'error', 'No se ha podido cargar el mapa. Inténtalo más tarde.');
  } finally {
    client?.close();
  }
};

document.querySelectorAll<HTMLElement>('[data-palomarenos-map]').forEach((element) => {
  void initialiseMap(element);
});
