import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { gameLocations, type GameLocation } from '../data/game-locations';
import { evaluateCapture, offsetPosition, type GeoPosition } from '../game/geo';
import { captureLocation, createInitialGameState, type LocalGameState } from '../game/session';
import {
  connectRemoteGame,
  loadPlayerIdentity,
  storePlayerIdentity,
  type PlayerIdentity,
  type RemoteGameAdapter,
  type RemoteGameState,
} from './convex-game';

type Coordinates = GeoPosition;

const mapElement = document.querySelector<HTMLElement>('#game-map');
if (!mapElement) {
  throw new Error('No se ha encontrado el contenedor del mapa del juego.');
}

const locationName = document.querySelector<HTMLElement>('[data-game-location-name]');
const locationDescription = document.querySelector<HTMLElement>('[data-game-location-description]');
const scoreElement = document.querySelector<HTMLElement>('[data-game-score]');
const capturesElement = document.querySelector<HTMLElement>('[data-game-captures]');
const radiusElement = document.querySelector<HTMLElement>('[data-game-radius]');
const distanceElement = document.querySelector<HTMLElement>('[data-game-distance]');
const accuracyElement = document.querySelector<HTMLElement>('[data-game-accuracy]');
const feedbackElement = document.querySelector<HTMLElement>('[data-game-feedback]');
const locateButton = document.querySelector<HTMLButtonElement>('[data-game-locate]');
const checkButton = document.querySelector<HTMLButtonElement>('[data-game-check]');
const captureButton = document.querySelector<HTMLButtonElement>('[data-game-capture]');
const simulatorSelect = document.querySelector<HTMLSelectElement>('[data-game-simulator]');
const scenarioSelect = document.querySelector<HTMLSelectElement>('[data-game-scenario]');
const simulateButton = document.querySelector<HTMLButtonElement>('[data-game-simulate]');
const playerForm = document.querySelector<HTMLFormElement>('[data-game-player-form]');
const nicknameInput = document.querySelector<HTMLInputElement>('[data-game-nickname]');
const joinButton = document.querySelector<HTMLButtonElement>('[data-game-join]');
const playerFeedbackElement = document.querySelector<HTMLElement>('[data-game-player-feedback]');
const gameSection = mapElement.closest<HTMLElement>('[data-convex-url]');
const convexUrl = gameSection?.dataset.convexUrl ?? '';

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
let gameState: LocalGameState = createInitialGameState(gameLocations);
let userMarker: L.Marker | undefined;
let userCoordinates: Coordinates | undefined;
let positionChecked = false;
let activeMarker: L.Marker | undefined;
let remoteGame: RemoteGameAdapter | undefined;
let remoteBallVersion = 0;
let playerIdentity: PlayerIdentity = loadPlayerIdentity();

const activeLocation = (): GameLocation =>
  gameLocations.find((location) => location.id === gameState.activeLocationId) ?? gameLocations[0];

const formatDistance = (distance: number): string =>
  distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;

const setFeedback = (message: string): void => {
  if (feedbackElement) feedbackElement.textContent = message;
};

const setPlayerFeedback = (message: string, error = false): void => {
  if (!playerFeedbackElement) return;
  playerFeedbackElement.textContent = message;
  if (error) playerFeedbackElement.dataset.state = 'error';
  else delete playerFeedbackElement.dataset.state;
};

const applyRemoteState = (state: RemoteGameState): void => {
  remoteBallVersion = state.ball.version;
  gameState = {
    activeLocationId: state.ball.locationId,
    score: gameState.score,
    captures: gameState.captures,
  };
  renderActiveLocation();
  refreshPanel();
  refreshLocationState();
};

const applyRemotePlayer = (
  player: { nickname: string; score: number; captures: number } | null,
): void => {
  if (!player) return;
  gameState = { ...gameState, score: player.score, captures: player.captures };
  refreshPanel();
};

const refreshPanel = (): void => {
  const location = activeLocation();
  if (locationName) locationName.textContent = location.name;
  if (locationDescription) locationDescription.textContent = location.description;
  if (scoreElement) scoreElement.textContent = String(gameState.score);
  if (capturesElement) capturesElement.textContent = String(gameState.captures);
  if (radiusElement) radiusElement.textContent = `${location.radiusMeters} m`;
};

const refreshLocationState = (): void => {
  if (!userCoordinates) return;

  const evaluation = evaluateCapture(userCoordinates, activeLocation());
  if (distanceElement)
    distanceElement.textContent = `${formatDistance(evaluation.distanceMeters)} de la bola`;
  if (accuracyElement) {
    accuracyElement.textContent = userCoordinates.accuracy
      ? `Precisión aproximada: ${Math.round(userCoordinates.accuracy)} m.`
      : 'Posición obtenida por el dispositivo.';
  }
  if (checkButton) checkButton.disabled = false;
  if (captureButton) {
    captureButton.disabled =
      Boolean(convexUrl && !remoteGame) || !evaluation.eligible || !positionChecked;
  }
  if (evaluation.reason === 'eligible') {
    setFeedback('Estás dentro del radio. Comprueba la posición para activar la captura.');
  } else if (evaluation.reason === 'low-accuracy') {
    setFeedback('La posición es poco precisa para validar una captura.');
  } else {
    setFeedback(
      `Aún estás fuera del radio de captura. Te faltan aproximadamente ${formatDistance(Math.max(evaluation.distanceMeters - activeLocation().radiusMeters, 0))}.`,
    );
  }
};

const renderLocations = (): void => {
  gameLocations.forEach((location) => {
    const isActive = location.id === activeLocation().id;
    const marker = L.circleMarker([location.latitude, location.longitude], {
      radius: isActive ? 10 : 6,
      color: isActive ? '#a05c32' : '#527066',
      weight: isActive ? 3 : 2,
      fillColor: isActive ? '#e5b77e' : '#b7d0bc',
      fillOpacity: isActive ? 0.95 : 0.65,
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
  positionChecked = false;
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
    (position) => {
      setUserCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      if (locateButton) locateButton.disabled = false;
      locateButton?.removeAttribute('aria-busy');
    },
    (error) => {
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

  const evaluation = evaluateCapture(userCoordinates, activeLocation());
  if (evaluation.eligible) {
    positionChecked = true;
    if (captureButton) captureButton.disabled = false;
    setFeedback('Posición válida en este prototipo. La bola está a tu alcance.');
  } else if (evaluation.reason === 'low-accuracy') {
    positionChecked = false;
    if (captureButton) captureButton.disabled = true;
    setFeedback('La posición tiene poca precisión para validar la captura.');
  } else {
    positionChecked = false;
    if (captureButton) captureButton.disabled = true;
    setFeedback(`Todavía estás a ${formatDistance(evaluation.distanceMeters)} de la bola.`);
  }
};

const connectPlayer = async (): Promise<void> => {
  const nickname = nicknameInput?.value.trim() ?? '';
  if (!nickname) {
    setPlayerFeedback('Escribe un nick para entrar.', true);
    nicknameInput?.focus();
    return;
  }
  if (!convexUrl) {
    setPlayerFeedback('El backend de desarrollo no está configurado.', true);
    return;
  }

  if (joinButton) joinButton.disabled = true;
  setPlayerFeedback('Entrando en la partida…');
  remoteGame?.dispose();
  remoteGame = undefined;
  const nextIdentity = { ...playerIdentity, nickname };

  try {
    remoteGame = await connectRemoteGame(convexUrl, nextIdentity, {
      onState: applyRemoteState,
      onPlayer: applyRemotePlayer,
    });
    playerIdentity = nextIdentity;
    storePlayerIdentity(playerIdentity);
    setPlayerFeedback(
      remoteGame.identity.nickname === nickname
        ? `Dentro como ${nickname}.`
        : 'Dentro de la partida.',
    );
    refreshLocationState();
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown';
    const message =
      reason === 'nickname-taken'
        ? 'Ese nick ya está ocupado.'
        : reason === 'no-active-season'
          ? 'Todavía no hay una temporada activa.'
          : 'No hemos podido conectar con la partida.';
    setPlayerFeedback(message, true);
  } finally {
    if (joinButton) joinButton.disabled = false;
  }
};

const simulateLocation = (): void => {
  const selectedId = simulatorSelect?.value;
  const location = gameLocations.find((candidate) => candidate.id === selectedId);
  if (!location) {
    setFeedback('Elige primero un punto del mapa para simular la posición.');
    return;
  }

  const scenario = scenarioSelect?.value ?? 'exact';
  const position =
    scenario === 'edge'
      ? offsetPosition(location, Math.max(location.radiusMeters - 3, 0))
      : scenario === 'outside'
        ? offsetPosition(location, location.radiusMeters + 60)
        : scenario === 'low-accuracy'
          ? offsetPosition(location, 0, 0, 150)
          : offsetPosition(location, 0, 0, 1);

  setUserCoordinates(position);
  const scenarioLabel =
    scenario === 'edge'
      ? 'cerca del límite'
      : scenario === 'outside'
        ? 'fuera del radio'
        : scenario === 'low-accuracy'
          ? 'con precisión insuficiente'
          : 'en el centro del punto';
  setFeedback(`Posición simulada en ${location.shortName}, ${scenarioLabel}.`);
};

const captureLocally = async (): Promise<void> => {
  if (!userCoordinates) {
    setFeedback('Primero necesitamos obtener o simular tu posición.');
    return;
  }

  if (!positionChecked) {
    setFeedback('Comprueba tu posición antes de capturar la bola.');
    return;
  }

  const evaluation = evaluateCapture(userCoordinates, activeLocation());
  if (!evaluation.eligible) {
    setFeedback(
      evaluation.reason === 'low-accuracy'
        ? 'La captura se ha rechazado: la posición no tiene suficiente precisión.'
        : 'La captura se ha rechazado: estás fuera del radio.',
    );
    return;
  }

  if (remoteGame) {
    if (captureButton) captureButton.disabled = true;
    try {
      const result = await remoteGame.capture(userCoordinates, remoteBallVersion);
      positionChecked = false;
      if (result.status === 'accepted') {
        setFeedback(
          result.duplicate
            ? 'La captura ya estaba registrada.'
            : `Captura confirmada. +${result.points ?? 0} puntos.`,
        );
      } else if (result.status === 'stale-ball') {
        setFeedback('Otro jugador se ha adelantado. La bola ha cambiado de lugar.');
      } else if (result.status === 'low-accuracy') {
        setFeedback('Convex ha rechazado la captura por falta de precisión.');
      } else if (result.status === 'outside-radius') {
        setFeedback('Convex ha rechazado la captura: estás fuera del radio.');
      } else {
        setFeedback(`La captura no se ha podido registrar (${result.status}).`);
      }
    } catch {
      setFeedback('No hemos podido registrar la captura en Convex.');
      if (captureButton) captureButton.disabled = false;
    }
    return;
  }

  gameState = captureLocation(gameState, gameLocations);
  positionChecked = false;
  renderActiveLocation();
  refreshPanel();
  if (captureButton) captureButton.disabled = true;
  if (checkButton) checkButton.disabled = false;
  setFeedback(
    `Captura local registrada. +10 puntos. La bola se ha movido a ${activeLocation().shortName}.`,
  );
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
playerForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  void connectPlayer();
});
if (nicknameInput) nicknameInput.value = playerIdentity.nickname;
if (convexUrl && playerIdentity.nickname) void connectPlayer();
else if (!convexUrl)
  setPlayerFeedback('Modo local: introduce un nick cuando el backend esté disponible.');

window.addEventListener('resize', () => map.invalidateSize());
