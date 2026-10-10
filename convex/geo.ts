export type ServerCapturePosition = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

export type ServerCaptureLocation = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type ServerCaptureEvaluation = {
  eligible: boolean;
  distanceMeters: number;
  reason: 'eligible' | 'outside-radius' | 'low-accuracy';
};

export const MIN_GPS_ACCURACY_METERS = 100;

export const distanceInMeters = (
  from: Pick<ServerCapturePosition, 'latitude' | 'longitude'>,
  to: Pick<ServerCaptureLocation, 'latitude' | 'longitude'>,
): number => {
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

export const evaluateServerCapture = (
  position: ServerCapturePosition,
  location: ServerCaptureLocation,
): ServerCaptureEvaluation => {
  const distanceMeters = distanceInMeters(position, location);

  if (position.accuracy !== undefined && position.accuracy > MIN_GPS_ACCURACY_METERS) {
    return { eligible: false, distanceMeters, reason: 'low-accuracy' };
  }

  if (distanceMeters > location.radiusMeters) {
    return { eligible: false, distanceMeters, reason: 'outside-radius' };
  }

  return { eligible: true, distanceMeters, reason: 'eligible' };
};
