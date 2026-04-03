export interface City {
  key: string;
  label: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
}

export const ITHACA: City = {
  key: "ithaca",
  label: "ITHACA",
  center: [-76.4735, 42.4534],
  zoom: 14,
};

export const NYC: City = {
  key: "nyc",
  label: "NEW YORK",
  center: [-73.9857, 40.7484],
  zoom: 13,
};

/** Static cities always shown in the selector. */
export const STATIC_CITIES: City[] = [ITHACA, NYC];

/**
 * Build the full city list. If the user granted location,
 * "Current Location" appears first.
 */
export function buildCityList(userCoords: [number, number] | null): City[] {
  if (!userCoords) return STATIC_CITIES;

  const current: City = {
    key: "current",
    label: "CURRENT LOCATION",
    center: userCoords,
    zoom: 14,
  };
  return [current, ...STATIC_CITIES];
}

/** Pick the nearest city to a given [lng, lat] coordinate. */
export function nearestCity(lng: number, lat: number): City {
  let best = STATIC_CITIES[0];
  let bestDist = Infinity;
  for (const city of STATIC_CITIES) {
    const dx = city.center[0] - lng;
    const dy = city.center[1] - lat;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return best;
}
