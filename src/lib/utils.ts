import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371e3;
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1),
    Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function calculateVariablePace(
  coords: [number, number][],
  targetPace: number,
  variabilityPercent: number
): number[] {
  if (coords.length === 0) return [];

  const variablePaces = coords.map((_, i) => {
    // Create deterministic but varied pace based on position
    const seed = i * 0.1;
    const noise = Math.sin(seed) * Math.cos(seed * 1.7) * Math.sin(seed * 2.3);
    const variability = (variabilityPercent / 100) * targetPace;
    return targetPace + noise * variability;
  });

  return variablePaces;
}

export function generateCircleCoordinates(
  center: [number, number],
  zoom: number,
  baseRadiusKm: number = 1
): [number, number][] {
  const points = 20; // Reduced to meet Mapbox API limitation
  const coordinates: [number, number][] = [];

  // Adjust radius based on zoom level - higher zoom = smaller radius
  // Zoom 10 = base radius, each zoom level halves/doubles the radius
  const zoomFactor = Math.pow(2, 13 - zoom);
  const radiusKm = baseRadiusKm * zoomFactor;

  // Convert radius from km to degrees (approximate)
  const radiusLng = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
  const radiusLat = radiusKm / 110.54;

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const lng = center[0] + radiusLng * Math.cos(angle);
    const lat = center[1] + radiusLat * Math.sin(angle);
    coordinates.push([lng, lat]);
  }

  return coordinates;
}

export function generateHeartCoordinates(
  center: [number, number],
  zoom: number,
  baseSize: number = 0.01
): [number, number][] {
  const coordinates: [number, number][] = [];
  const points = 20; // Reduced to meet Mapbox API limitation

  // Adjust size based on zoom level - higher zoom = smaller size
  // Zoom 10 = base size, each zoom level halves/doubles the size
  const zoomFactor = Math.pow(2, 13 - zoom);
  const size = baseSize * zoomFactor;

  for (let i = 0; i <= points; i++) {
    const t = (i / points) * 2 * Math.PI;

    // Heart equation: x = 16sin³(t), y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    // Scale and translate to the center
    const lng = center[0] + (x * size) / 16;
    const lat = center[1] + (y * size) / 16;
    coordinates.push([lng, lat]);
  }

  return coordinates;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
