// Maidenhead Grid Locator (QTH) calculation utilities for amateur radio

export interface Coordinates {
  lat: number;
  lon: number;
}

export function gridToLatLon(grid: string): Coordinates | null {
  const clean = grid.trim().toUpperCase();
  if (clean.length < 4) return null;

  const f1 = clean.charCodeAt(0) - 65;
  const f2 = clean.charCodeAt(1) - 65;
  const s1 = parseInt(clean[2], 10);
  const s2 = parseInt(clean[3], 10);

  if (f1 < 0 || f1 > 17 || f2 < 0 || f2 > 17 || isNaN(s1) || isNaN(s2)) {
    return null;
  }

  let lon = f1 * 20 - 180 + s1 * 2;
  let lat = f2 * 10 - 90 + s2 * 1;

  if (clean.length >= 6) {
    const subs1 = clean.charCodeAt(4) - 65;
    const subs2 = clean.charCodeAt(5) - 65;
    if (subs1 >= 0 && subs1 <= 23 && subs2 >= 0 && subs2 <= 23) {
      lon += (subs1 + 0.5) * (2 / 24);
      lat += (subs2 + 0.5) * (1 / 24);
    } else {
      lon += 1;
      lat += 0.5;
    }
  } else {
    lon += 1;
    lat += 0.5;
  }

  return { lat, lon };
}

export function latLonToGrid(lat: number, lon: number): string {
  let adjLon = lon + 180;
  let adjLat = lat + 90;

  adjLon = Math.max(0, Math.min(359.9999, adjLon));
  adjLat = Math.max(0, Math.min(179.9999, adjLat));

  const f1 = String.fromCharCode(65 + Math.floor(adjLon / 20));
  const f2 = String.fromCharCode(65 + Math.floor(adjLat / 10));

  const remLon = adjLon % 20;
  const remLat = adjLat % 10;

  const s1 = Math.floor(remLon / 2);
  const s2 = Math.floor(remLat / 1);

  const subLon = (remLon % 2) / (2 / 24);
  const subLat = (remLat % 1) / (1 / 24);

  const subs1 = String.fromCharCode(97 + Math.floor(subLon));
  const subs2 = String.fromCharCode(97 + Math.floor(subLat));

  return `${f1}${f2}${s1}${s2}${subs1}${subs2}`;
}

export function calculateDistanceAndBearing(gridA: string, gridB: string): {
  distanceKm: number;
  distanceMiles: number;
  bearingDeg: number;
} | null {
  const coordA = gridToLatLon(gridA);
  const coordB = gridToLatLon(gridB);

  if (!coordA || !coordB) return null;

  const R = 6371; // Earth radius in km
  const dLat = ((coordB.lat - coordA.lat) * Math.PI) / 180;
  const dLon = ((coordB.lon - coordA.lon) * Math.PI) / 180;

  const lat1Rad = (coordA.lat * Math.PI) / 180;
  const lat2Rad = (coordB.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const distanceMiles = distanceKm * 0.621371;

  // Bearing calculation
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  let bearingDeg = (Math.atan2(y, x) * 180) / Math.PI;
  bearingDeg = (bearingDeg + 360) % 360;

  return {
    distanceKm: Math.round(distanceKm),
    distanceMiles: Math.round(distanceMiles),
    bearingDeg: Math.round(bearingDeg),
  };
}
