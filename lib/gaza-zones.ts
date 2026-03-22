import type { TimeUrgencyTier } from "./time-urgency";
import type { CriticalityTier } from "@/types/incident-json";
import { getTimeUrgencyTier, mostUrgentTier } from "./time-urgency";

/** Bounds as [[south, west], [north, east]] (Leaflet / OSM convention). */
export type ZoneBounds = [[number, number], [number, number]];

export type GazaSubZone = {
  id: string;
  name: string;
  /** Polygon as [lat, lng][] — traces actual region outline. */
  polygon: [number, number][];
  /** Bounding box for quick rejection. */
  bounds: ZoneBounds;
};

/** Simplified Gaza Strip outline (demo geometry, not a legal boundary). */
export const GAZA_STRIP_POLYGON: [number, number][] = [
  [31.59, 34.22],
  [31.59, 34.56],
  [31.21, 34.54],
  [31.21, 34.22],
  [31.59, 34.22],
];

export const GAZA_FLY_BOUNDS: ZoneBounds = [
  [31.2, 34.2],
  [31.61, 34.58],
];

/**
 * Gaza governorate polygons — simplified traces of actual administrative boundaries.
 * Based on UN OCHA / OSM reference data. Coordinates [lat, lng].
 */
export const GAZA_SUB_ZONES: GazaSubZone[] = [
  {
    id: "north",
    name: "North Gaza",
    bounds: [[31.52, 34.48], [31.59, 34.56]],
    polygon: [
      [31.59, 34.48],
      [31.585, 34.52],
      [31.58, 34.55],
      [31.565, 34.54],
      [31.545, 34.52],
      [31.535, 34.48],
      [31.53, 34.45],
      [31.525, 34.44],
      [31.52, 34.46],
      [31.52, 34.49],
      [31.535, 34.51],
      [31.555, 34.49],
      [31.575, 34.48],
      [31.59, 34.48],
    ],
  },
  {
    id: "gaza_city",
    name: "Gaza City",
    bounds: [[31.45, 34.42], [31.52, 34.52]],
    polygon: [
      [31.52, 34.44],
      [31.518, 34.46],
      [31.51, 34.48],
      [31.5, 34.47],
      [31.49, 34.45],
      [31.48, 34.44],
      [31.47, 34.43],
      [31.46, 34.425],
      [31.455, 34.43],
      [31.46, 34.44],
      [31.47, 34.46],
      [31.48, 34.49],
      [31.49, 34.5],
      [31.505, 34.5],
      [31.515, 34.48],
      [31.52, 34.46],
      [31.52, 34.44],
    ],
  },
  {
    id: "central",
    name: "Central / Deir al-Balah",
    bounds: [[31.36, 34.32], [31.45, 34.48]],
    polygon: [
      [31.45, 34.42],
      [31.445, 34.44],
      [31.44, 34.45],
      [31.43, 34.46],
      [31.42, 34.46],
      [31.41, 34.45],
      [31.395, 34.44],
      [31.38, 34.42],
      [31.37, 34.38],
      [31.365, 34.35],
      [31.36, 34.33],
      [31.355, 34.32],
      [31.36, 34.34],
      [31.37, 34.37],
      [31.39, 34.4],
      [31.41, 34.42],
      [31.43, 34.44],
      [31.44, 34.43],
      [31.45, 34.42],
    ],
  },
  {
    id: "khan_yunis",
    name: "Khan Yunis",
    bounds: [[31.28, 34.28], [31.36, 34.42]],
    polygon: [
      [31.36, 34.32],
      [31.355, 34.34],
      [31.35, 34.36],
      [31.34, 34.37],
      [31.33, 34.38],
      [31.32, 34.38],
      [31.31, 34.36],
      [31.3, 34.34],
      [31.29, 34.32],
      [31.285, 34.3],
      [31.28, 34.28],
      [31.282, 34.3],
      [31.29, 34.33],
      [31.3, 34.36],
      [31.32, 34.38],
      [31.34, 34.39],
      [31.35, 34.38],
      [31.36, 34.35],
      [31.36, 34.32],
    ],
  },
  {
    id: "south",
    name: "Rafah / South",
    bounds: [[31.21, 34.22], [31.28, 34.36]],
    polygon: [
      [31.28, 34.28],
      [31.275, 34.3],
      [31.27, 34.31],
      [31.26, 34.32],
      [31.25, 34.32],
      [31.24, 34.31],
      [31.23, 34.29],
      [31.22, 34.27],
      [31.215, 34.25],
      [31.21, 34.23],
      [31.21, 34.25],
      [31.22, 34.28],
      [31.24, 34.3],
      [31.26, 34.32],
      [31.27, 34.33],
      [31.28, 34.31],
      [31.28, 34.28],
    ],
  },
];

/** Point-in-polygon test (ray casting). Polygon is [lat, lng][]; uses lng as x, lat as y. */
export function pointInPolygon(
  lat: number,
  lng: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [yi, xi] = polygon[i]; // lat, lng
    const [yj, xj] = polygon[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Generate a rounded-rectangle polygon from bounds. Radius as fraction of smaller dimension (0–0.5). */
export function boundsToRoundedPolygon(
  bounds: ZoneBounds,
  radiusFraction = 0.15
): [number, number][] {
  const [[south, west], [north, east]] = bounds;
  const dLat = north - south;
  const dLng = east - west;
  const r = Math.min(dLat, dLng) * radiusFraction;
  const steps = 6;
  const points: [number, number][] = [];

  const arc = (
    cx: number,
    cy: number,
    startAngle: number,
    endAngle: number
  ) => {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = startAngle + t * (endAngle - startAngle);
      points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };

  const deg = Math.PI / 180;
  arc(south + r, west + r, 180 * deg, 270 * deg);
  arc(south + r, east - r, 90 * deg, 180 * deg);
  arc(north - r, east - r, 0, 90 * deg);
  arc(north - r, west + r, 270 * deg, 360 * deg);
  points.push(points[0]);
  return points;
}

export function pointInBounds(
  lat: number,
  lng: number,
  bounds: ZoneBounds
): boolean {
  const [[south, west], [north, east]] = bounds;
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

export function getZoneForPoint(lat: number, lng: number): GazaSubZone | null {
  for (const z of GAZA_SUB_ZONES) {
    if (pointInBounds(lat, lng, z.bounds) && pointInPolygon(lat, lng, z.polygon)) {
      return z;
    }
  }
  return null;
}

export function incidentsInZone<T extends { lat: number; lng: number }>(
  incidents: T[],
  zone: GazaSubZone
): T[] {
  return incidents.filter((inc) => pointInPolygon(inc.lat, inc.lng, zone.polygon));
}

export function zoneDisplayUrgency<T extends { reportedAt: Date | string }>(
  incidents: T[]
): TimeUrgencyTier | null {
  const tiers = incidents.map((i) => getTimeUrgencyTier(i.reportedAt));
  return mostUrgentTier(tiers);
}

/** For MapIncident (JSON format) — uses criticality field directly. */
const CRITICALITY_RANK: Record<CriticalityTier, number> = {
  critical: 0,
  "needs support": 1,
  cleanup: 2,
};

export function zoneDisplayCriticality<T extends { criticality: CriticalityTier }>(
  incidents: T[]
): CriticalityTier | null {
  if (!incidents.length) return null;
  return incidents.reduce((best, i) =>
    CRITICALITY_RANK[i.criticality] < CRITICALITY_RANK[best.criticality]
      ? i
      : best
  ).criticality;
}
