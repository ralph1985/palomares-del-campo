export type PalomarenoMapMarker = {
  id: string;
  displayName: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  story: string;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null;

const isCoordinate = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

export const selectMapMarkers = (records: readonly unknown[]): PalomarenoMapMarker[] =>
  records.flatMap((record) => {
    if (!isRecord(record)) return [];
    if (
      typeof record.id !== 'string' ||
      typeof record.displayName !== 'string' ||
      typeof record.city !== 'string' ||
      typeof record.country !== 'string' ||
      typeof record.story !== 'string' ||
      !isCoordinate(record.latitude, -90, 90) ||
      !isCoordinate(record.longitude, -180, 180)
    ) {
      return [];
    }

    return [
      {
        id: record.id,
        displayName: record.displayName,
        city: record.city,
        country: record.country,
        latitude: record.latitude,
        longitude: record.longitude,
        story: record.story,
      },
    ];
  });
