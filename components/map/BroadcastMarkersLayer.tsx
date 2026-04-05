import React, { useEffect, useRef } from "react";
import { ShapeSource, CircleLayer } from "@maplibre/maplibre-react-native";
import { theme } from "../../constants/theme";
import type { StatusBroadcast, Moment } from "../../types";

const DURATION = 3600;
const FRAME_INTERVAL = 100;

// Use theme colors instead of hardcoded hex
const COLOR_LEVEL_3 = theme.heat.a;
const COLOR_LEVEL_2 = theme.heat.c;
const COLOR_LEVEL_1 = theme.heat.e;
const COLOR_MOMENT_3 = theme.heat.a;
const COLOR_MOMENT_2 = theme.heat.b;

interface Props {
  broadcasts: StatusBroadcast[];
  moments: Moment[];
  currentUserId: string | null;
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 2);
}

function markerProps(level: number, r0: number, r1: number, r2: number, color: string) {
  const dotRadius = level === 3 ? 6.5 : level === 2 ? 5.5 : 4.5;
  const maxScale = level === 3 ? 7 : level === 2 ? 5.5 : 4;
  const startOpacity = level === 3 ? 0.7 : level === 2 ? 0.55 : 0.4;

  return {
    color,
    dotRadius,
    ring0radius: dotRadius * (0.4 + r0 * (maxScale - 0.4)),
    ring1radius: dotRadius * (0.4 + r1 * (maxScale - 0.4)),
    ring2radius: dotRadius * (0.4 + r2 * (maxScale - 0.4)),
    ring0opacity: startOpacity * (1 - r0),
    ring1opacity: startOpacity * (1 - r1),
    ring2opacity: startOpacity * (1 - r2),
    showRing1: level >= 2 ? 1 : 0,
    showRing2: level >= 3 ? 1 : 0,
  };
}

function buildGeoJSON(
  broadcasts: StatusBroadcast[],
  moments: Moment[],
  time: number,
  currentUserId: string | null
) {
  const r0 = easeOut((time % DURATION) / DURATION);
  const r1 = easeOut(((time + DURATION * 2 / 3) % DURATION) / DURATION);
  const r2 = easeOut(((time + DURATION / 3) % DURATION) / DURATION);

  const features: any[] = [];

  for (const b of broadcasts) {
    if (b.lat == null || b.lng == null) continue;
    const isMine = currentUserId != null && b.user_id === currentUserId;
    const displayLng = isMine ? b.lng : (b.fuzzy_lng ?? b.lng);
    const displayLat = isMine ? b.lat : (b.fuzzy_lat ?? b.lat);

    const joinCount = b.join_count ?? 0;
    const level = joinCount >= 3 ? 3 : joinCount >= 1 ? 2 : 1;
    const color = level === 3 ? COLOR_LEVEL_3 : level === 2 ? COLOR_LEVEL_2 : COLOR_LEVEL_1;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [displayLng, displayLat] },
      properties: { id: b.id, ...markerProps(level, r0, r1, r2, color) },
    });
  }

  for (const m of moments) {
    const level = m.participant_count >= 5 ? 3 : 2;
    const color = level === 3 ? COLOR_MOMENT_3 : COLOR_MOMENT_2;

    features.push({
      type: "Feature",
      geometry: { type: "Point", coordinates: [m.lng, m.lat] },
      properties: { id: m.id, ...markerProps(level, r0, r1, r2, color) },
    });
  }

  return { type: "FeatureCollection" as const, features };
}

export const BroadcastMarkersLayer = React.memo(function BroadcastMarkersLayer({
  broadcasts,
  moments,
  currentUserId,
}: Props) {
  const startTime = useRef(Date.now());
  const sourceRef = useRef<any>(null);
  const broadcastsRef = useRef(broadcasts);
  const momentsRef = useRef(moments);
  const userIdRef = useRef(currentUserId);
  broadcastsRef.current = broadcasts;
  momentsRef.current = moments;
  userIdRef.current = currentUserId;

  const initialShape = useRef(buildGeoJSON(broadcasts, moments, 0, currentUserId)).current;

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const shape = buildGeoJSON(broadcastsRef.current, momentsRef.current, elapsed, userIdRef.current);
      sourceRef.current?.setNativeProps({ shape });
    }, FRAME_INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <ShapeSource
      ref={sourceRef}
      id="broadcasts-source"
      shape={initialShape}
      hitbox={{ width: 44, height: 44 }}
    >
      <CircleLayer
        id="broadcast-ring2"
        style={{
          circleRadius: ["get", "ring2radius"],
          circleColor: "rgba(0,0,0,0)",
          circleStrokeWidth: 1.5,
          circleStrokeColor: ["get", "color"],
          circleStrokeOpacity: ["*", ["get", "ring2opacity"], ["get", "showRing2"]],
          circlePitchAlignment: "map",
        }}
      />
      <CircleLayer
        id="broadcast-ring1"
        style={{
          circleRadius: ["get", "ring1radius"],
          circleColor: "rgba(0,0,0,0)",
          circleStrokeWidth: 1.5,
          circleStrokeColor: ["get", "color"],
          circleStrokeOpacity: ["*", ["get", "ring1opacity"], ["get", "showRing1"]],
          circlePitchAlignment: "map",
        }}
      />
      <CircleLayer
        id="broadcast-ring0"
        style={{
          circleRadius: ["get", "ring0radius"],
          circleColor: "rgba(0,0,0,0)",
          circleStrokeWidth: 1.5,
          circleStrokeColor: ["get", "color"],
          circleStrokeOpacity: ["get", "ring0opacity"],
          circlePitchAlignment: "map",
        }}
      />
      <CircleLayer
        id="broadcast-dot"
        style={{
          circleRadius: ["get", "dotRadius"],
          circleColor: ["get", "color"],
          circleStrokeWidth: 2,
          circleStrokeColor: "rgba(255,255,255,0.95)",
          circlePitchAlignment: "map",
        }}
      />
    </ShapeSource>
  );
});
