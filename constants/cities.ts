export interface CityBounds {
  sw: [number, number]; // [lng, lat]
  ne: [number, number]; // [lng, lat]
}

export interface City {
  key: string;
  label: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  bounds: CityBounds;
  minZoom?: number;
}

export const ITHACA: City = {
  key: "ithaca",
  label: "ITHACA",
  center: [-76.4735, 42.4534],
  zoom: 14,
  bounds: { sw: [-76.62, 42.35], ne: [-76.32, 42.55] },
};

export const NYC: City = {
  key: "nyc",
  label: "NEW YORK",
  center: [-73.9857, 40.7484],
  zoom: 13,
  bounds: { sw: [-74.26, 40.49], ne: [-73.70, 40.92] },
};

/** Static cities always shown in the selector. */
export const STATIC_CITIES: City[] = [ITHACA, NYC];

/** Generate a bounding box (~8-9 km each direction) around a coordinate. */
const DYNAMIC_BOUND_OFFSET = 0.08;

export function boundsFromCenter(center: [number, number]): CityBounds {
  return {
    sw: [center[0] - DYNAMIC_BOUND_OFFSET, center[1] - DYNAMIC_BOUND_OFFSET],
    ne: [center[0] + DYNAMIC_BOUND_OFFSET, center[1] + DYNAMIC_BOUND_OFFSET],
  };
}

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
    bounds: boundsFromCenter(userCoords),
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
