/**
 * DigitalNexCare South Africa Geolocation & Travel Distance Utility
 */

export interface TravelEstimate {
  distanceKm: number;
  driveMinutes: number;
  walkMinutes: number;
  driveText: string;
  walkText: string;
  summaryText: string;
}

// Calculate Haversine distance in Kilometers between two GPS coordinates
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Format duration in minutes into a clean readable string
export function formatMinutes(mins: number): string {
  if (mins < 1) return '1 min';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return remainingMins > 0 ? `${hours} hr ${remainingMins} min` : `${hours} hr`;
}

// Calculate driving and walking estimates based on distance
export function calculateTravelEstimate(distanceKm: number): TravelEstimate {
  // Driving calculation in South African urban/suburban zones (~40 km/h average)
  const driveMinutes = Math.max(1, Math.round((distanceKm / 40) * 60));
  
  // Walking calculation (~4.8 km/h average pace)
  const walkMinutes = Math.max(1, Math.round((distanceKm / 4.8) * 60));

  const driveText = `${formatMinutes(driveMinutes)} drive`;
  const walkText = `${formatMinutes(walkMinutes)} walk`;
  const summaryText = `${formatMinutes(driveMinutes)} by car • ${formatMinutes(walkMinutes)} walking`;

  return {
    distanceKm,
    driveMinutes,
    walkMinutes,
    driveText,
    walkText,
    summaryText,
  };
}

// Generate Google Maps Directions URL with mode
export function getDirectionsUrl(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: 'driving' | 'walking' = 'driving'
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}&travelmode=${mode}`;
}
