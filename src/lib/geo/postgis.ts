/**
 * DigitalNexCare PostGIS Spatial & Geo Experience Layer
 * Provides SQL generators for PostgreSQL PostGIS extensions (`ST_DWithin`, `ST_DistanceSphere`, `ST_MakePoint`)
 * and high-precision spatial distance calculations with auto-expanding radius logic for South African healthcare search.
 */

import { SouthAfricanProvince } from '../supabase/database.types';
import { calculateDistanceKm, calculateTravelEstimate, TravelEstimate } from '../geo';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface NearbyLocationResult<T> {
  item: T;
  distanceKm: number;
  travelEstimate: TravelEstimate;
}

// Major South African Provincial & City Hub Coordinates
export const SA_PROVINCE_CENTROIDS: Record<SouthAfricanProvince, GeoCoordinate> = {
  Gauteng: { latitude: -26.2041, longitude: 28.0473 }, // Johannesburg / Pretoria corridor
  'Western Cape': { latitude: -33.9249, longitude: 18.4241 }, // Cape Town
  'KwaZulu-Natal': { latitude: -29.8587, longitude: 31.0218 }, // Durban
  'Eastern Cape': { latitude: -33.9608, longitude: 25.6022 }, // Gqeberha / East London
  'Free State': { latitude: -29.112, longitude: 26.215 }, // Bloemfontein
  Limpopo: { latitude: -23.9045, longitude: 29.4689 }, // Polokwane
  Mpumalanga: { latitude: -25.4753, longitude: 30.9694 }, // Mbombela / Nelspruit
  'North West': { latitude: -25.856, longitude: 25.6403 }, // Mahikeng / Rustenburg
  'Northern Cape': { latitude: -28.7282, longitude: 24.7499 }, // Kimberley
};

export class PostGisService {
  /**
   * Generate PostGIS SQL snippet for searching practitioners within a radius
   */
  static generatePostGisRadiusQuery(
    userLat: number,
    userLng: number,
    radiusKm: number,
    limit: number = 50
  ): string {
    const radiusMeters = radiusKm * 1000;
    return `
      SELECT 
        p.*,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography
        ) / 1000.0 AS distance_km
      FROM practitioners p
      WHERE 
        ST_DWithin(
          ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${userLng}, ${userLat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_km ASC
      LIMIT ${limit};
    `.trim();
  }

  /**
   * Sort items by distance with auto-expansion if radius yields fewer than minimum desired results
   */
  static sortNearbyWithExpansion<T extends { coordinates?: GeoCoordinate | null }>(
    items: T[],
    userCoords: GeoCoordinate,
    initialRadiusKm: number = 10,
    minResults: number = 3
  ): { results: NearbyLocationResult<T>[]; expandedRadiusKm: number } {
    let radius = initialRadiusKm;
    const expansionSteps = [initialRadiusKm, 25, 50, 100, 250];

    for (const currentRadius of expansionSteps) {
      radius = currentRadius;
      const matched = items
        .filter((item) => item.coordinates && item.coordinates.latitude && item.coordinates.longitude)
        .map((item) => {
          const dist = calculateDistanceKm(
            userCoords.latitude,
            userCoords.longitude,
            item.coordinates!.latitude,
            item.coordinates!.longitude
          );
          return {
            item,
            distanceKm: dist,
            travelEstimate: calculateTravelEstimate(dist),
          };
        })
        .filter((res) => res.distanceKm <= currentRadius)
        .sort((a, b) => a.distanceKm - b.distanceKm);

      if (matched.length >= minResults || currentRadius === expansionSteps[expansionSteps.length - 1]) {
        return {
          results: matched,
          expandedRadiusKm: radius,
        };
      }
    }

    return { results: [], expandedRadiusKm: radius };
  }
}
