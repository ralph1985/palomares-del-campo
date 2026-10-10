import type { GameLocation } from '../data/game-locations';

export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type CaptureEvaluation = {
  eligible: boolean;
  distanceMeters: number;
  reason: 'eligible' | 'outside-radius' | 'low-accuracy';
};

export const MIN_GPS_ACCURACY_METERS = 100;

/** Distancia aproximada entre dos puntos geográficos usando Haversine. */
export const distanceInMeters = (from: GeoPosition, to: GeoPosition): number => {
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

export const evaluateCapture = (
  position: GeoPosition,
  location: GameLocation,
): CaptureEvaluation => {
  const distanceMeters = distanceInMeters(position, location);

  if (position.accuracy !== undefined && position.accuracy > MIN_GPS_ACCURACY_METERS) {
    return { eligible: false, distanceMeters, reason: 'low-accuracy' };
  }

  if (distanceMeters > location.radiusMeters) {
    return { eligible: false, distanceMeters, reason: 'outside-radius' };
  }

  return { eligible: true, distanceMeters, reason: 'eligible' };
};

/** Desplaza un punto en metros, útil para escenarios controlados del simulador. */
export const offsetPosition = (
  location: GameLocation,
  northMeters: number,
  eastMeters = 0,
  accuracy = 1,
): GeoPosition => ({
  latitude: location.latitude + northMeters / 111_320,
  longitude:
    location.longitude + eastMeters / (111_320 * Math.cos((location.latitude * Math.PI) / 180)),
  accuracy,
});
