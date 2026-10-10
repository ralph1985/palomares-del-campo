import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { gameLocations, type GameLocation } from '../data/game-locations';

type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

const mapElement = document.querySelector<HTMLElement>('#game-map');
if (!mapElement) {
  throw new Error('No se ha encontrado el contenedor del mapa del juego.');
}

const locationName = document.querySelector<HTMLElement>('[data-game-location-name]');
const locationDescription = document.querySelector<HTMLElement>('[data-game-location-description]');
const scoreElement = document.querySelector<HTMLElement>('[data-game-score]');
const radiusElement = document.querySelector<HTMLElement>('[data-game-radius]');
const distanceElement = document.querySelector<HTMLElement>('[data-game-distance]');
const accuracyElement = document.querySelector<HTMLElement>('[data-game-accuracy]');
const feedbackElement = document.querySelector<HTMLElement>('[data-game-feedback]');
const locateButton = document.querySelector<HTMLButtonElement>('[data-game-locate]');
const checkButton = document.querySelector<HTMLButtonElement>('[data-game-check]');
const captureButton = document.querySelector<HTMLButtonElement>('[data-game-capture]');
const simulatorSelect = document.querySelector<HTMLSelectElement>('[data-game-simulator]');
const simulateButton = document.querySelector<HTMLButtonElement>('[data-game-simulate]');

const map = L.map(mapElement, {
  center: [39.9464, -2.5988],
  zoom: 16,
  zoomControl: false,
  attributionControl: false,
});

L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  minZoom: 14,
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const activeIcon = L.divIcon({
  className: 'game-ball-icon-wrapper',
  html: '<span class="game-ball-icon" aria-hidden="true"></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const userIcon = L.divIcon({
  className: 'game-user-icon-wrapper',
  html: '<span class="game-user-icon" aria-hidden="true"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const locationMarkers = new Map<string, L.CircleMarker>();
let activeLocationIndex = 0;
let score = 0;
let userMarker: L.Marker | undefined;
let userCoordinates: Coordinates | undefined;
let activeMarker: L.Marker | undefined;

const activeLocation = (): GameLocation => gameLocations[activeLocationIndex];

const distanceInMeters = (from: Coordinates, to: GameLocation): number => {
  const earthRadius = 6_371_000;
  const latitudeDelta = ((to.latitude - from.latitude) * Math.PI) / 180;
  const longitudeDelta = ((to.longitude - from.longitude) * Math.PI) / 180;
  const latitude1 = (from.latitude * Math.PI) / 180;
  const latitude2 = (to.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const formatDistance = (distance: number): string =>
  distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;

const setFeedback = (message: string): void => {
  if (feedbackElement) feedbackElement.textContent = message;
};

const refreshPanel = (): void => {
  const location = activeLocation();
  if (locationName) locationName.textContent = location.name;
  if (locationDescription) locationDescription.textContent = location.description;
  if (scoreElement) scoreElement.textContent = String(score);
  if (radiusElement) radiusElement.textContent = `${location.radiusMeters} m`;
};

const refreshLocationState = (): void => {
  if (!userCoordinates) return;

  const distance = distanceInMeters(userCoordinates, activeLocation());
  const withinRadius = distance <= activeLocation().radiusMeters;
  if (distanceElement) distanceElement.textContent = `${formatDistance(distance)} de la bola`;
  if (accuracyElement) {
    accuracyElement.textContent = userCoordinates.accuracy
      ? `Precisión aproximada: ${Math.round(userCoordinates.accuracy)} m.`
      : 'Posición obtenida por el dispositivo.';
  }
  if (checkButton) checkButton.disabled = false;
  if (captureButton) captureButton.disabled = !withinRadius;
  setFeedback(
    withinRadius
      ? 'Estás dentro del radio. Comprueba la posición para activar la captura.'
      : `Aún estás fuera del radio de captura. Te faltan aproximadamente ${formatDistance(Math.max(distance - activeLocation().radiusMeters, 0))}.`,
  );
};

const renderLocations = (): void => {
  gameLocations.forEach((location, index) => {
    const marker = L.circleMarker([location.latitude, location.longitude], {
      radius: index === activeLocationIndex ? 10 : 6,
      color: index === activeLocationIndex ? '#a05c32' : '#527066',
      weight: index === activeLocationIndex ? 3 : 2,
      fillColor: index === activeLocationIndex ? '#e5b77e' : '#b7d0bc',
      fillOpacity: index === activeLocationIndex ? 0.95 : 0.65,
    }).addTo(map);
    marker.bindTooltip(location.shortName, { direction: 'top', offset: [0, -6] });
    locationMarkers.set(location.id, marker);
  });
};

const renderActiveLocation = (): void => {
  activeMarker?.remove();
  const location = activeLocation();
  activeMarker = L.marker([location.latitude, location.longitude], {
    icon: activeIcon,
    keyboard: false,
    zIndexOffset: 1000,
  })
    .addTo(map)
    .bindTooltip(`Bola activa · ${location.shortName}`, { direction: 'top', offset: [0, -15] });

  locationMarkers.forEach((marker, id) => {
    const isActive = id === location.id;
    marker.setStyle({
      radius: isActive ? 10 : 6,
      color: isActive ? '#a05c32' : '#527066',
      weight: isActive ? 3 : 2,
      fillColor: isActive ? '#e5b77e' : '#b7d0bc',
      fillOpacity: isActive ? 0.95 : 0.65,
    });
  });
};

const updateUserMarker = (coordinates: Coordinates): void => {
  const point: L.LatLngExpression = [coordinates.latitude, coordinates.longitude];
  if (userMarker) {
    userMarker.setLatLng(point);
  } else {
    userMarker = L.marker(point, { icon: userIcon, keyboard: false })
      .addTo(map)
      .bindTooltip('Tu posición aproximada', { direction: 'top', offset: [0, -10] });
  }
};

const setUserCoordinates = (coordinates: Coordinates): void => {
  userCoordinates = coordinates;
  updateUserMarker(coordinates);
  map.setView([coordinates.latitude, coordinates.longitude], 17, { animate: true });
  refreshLocationState();
};

const requestLocation = (): void => {
  if (!window.isSecureContext) {
    setFeedback(
      'La ubicación del dispositivo requiere HTTPS. Esta dirección de prueba usa HTTP; en Vercel funcionará con HTTPS.',
    );
    return;
  }

  if (!navigator.geolocation) {
    setFeedback('Este dispositivo no ofrece geolocalización. Puedes seguir explorando el mapa.');
    return;
  }

  locateButton?.setAttribute('aria-busy', 'true');
  if (locateButton) locateButton.disabled = true;
  setFeedback('Buscando tu posición…');

  navigator.geolocation.getCurrentPosition(
    position => {
      setUserCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      if (locateButton) locateButton.disabled = false;
      locateButton?.removeAttribute('aria-busy');
    },
    error => {
      const message =
        error.code === error.PERMISSION_DENIED
          ? 'El navegador no ha permitido acceder a tu ubicación.'
          : 'No hemos podido obtener una posición precisa. Inténtalo de nuevo.';
      setFeedback(message);
      if (locateButton) locateButton.disabled = false;
      locateButton?.removeAttribute('aria-busy');
    },
    { enableHighAccuracy: true, maximumAge: 15_000, timeout: 12_000 },
  );
};

const checkPosition = (): void => {
  if (!userCoordinates) {
    setFeedback('Primero necesitamos obtener tu posición.');
    return;
  }

  const distance = distanceInMeters(userCoordinates, activeLocation());
  if (distance <= activeLocation().radiusMeters) {
    if (captureButton) captureButton.disabled = false;
    setFeedback('Posición válida en este prototipo. La bola está a tu alcance.');
  } else {
    if (captureButton) captureButton.disabled = true;
    setFeedback(`Todavía estás a ${formatDistance(distance)} de la bola.`);
  }
};

const simulateLocation = (): void => {
  const selectedId = simulatorSelect?.value;
  const location = gameLocations.find(candidate => candidate.id === selectedId);
  if (!location) {
    setFeedback('Elige primero un punto del mapa para simular la posición.');
    return;
  }

  setUserCoordinates({
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: 1,
  });
  setFeedback(`Posición simulada en ${location.shortName}. Ya puedes comprobarla y capturar.`);
};

const captureLocally = (): void => {
  if (!userCoordinates || distanceInMeters(userCoordinates, activeLocation()) > activeLocation().radiusMeters) {
    setFeedback('La captura se ha rechazado: estás fuera del radio.');
    return;
  }

  score += 10;
  activeLocationIndex = (activeLocationIndex + 1) % gameLocations.length;
  renderActiveLocation();
  refreshPanel();
  if (captureButton) captureButton.disabled = true;
  if (checkButton) checkButton.disabled = false;
  setFeedback(`Captura local registrada. +10 puntos. La bola se ha movido a ${activeLocation().shortName}.`);
  map.setView([activeLocation().latitude, activeLocation().longitude], 16, { animate: true });
  refreshLocationState();
};

renderLocations();
renderActiveLocation();
refreshPanel();
locateButton?.addEventListener('click', requestLocation);
checkButton?.addEventListener('click', checkPosition);
captureButton?.addEventListener('click', captureLocally);
simulatorSelect?.addEventListener('change', () => {
  if (simulateButton) simulateButton.disabled = !simulatorSelect.value;
});
simulateButton?.addEventListener('click', simulateLocation);

window.addEventListener('resize', () => map.invalidateSize());
