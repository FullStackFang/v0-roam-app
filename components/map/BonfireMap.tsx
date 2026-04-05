import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import MapLibreGL, {
  type CameraRef,
  MapView,
  Camera,
} from "@maplibre/maplibre-react-native";
import { supabase } from "../../lib/supabase";
import { fetchActiveBroadcastsWithJoins, computeMoments } from "../../lib/queries";
import { BroadcastMarker } from "./BroadcastMarker";
import { MomentClusterMarker } from "./MomentClusterMarker";
import type { StatusBroadcast, Moment } from "../../types";

MapLibreGL.setAccessToken(null);

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export interface BonfireMapHandle {
  flyTo: (center: [number, number], zoom: number) => void;
}

interface BonfireMapProps {
  initialCenter: [number, number];
  initialZoom: number;
  onMapPress: () => void;
  onMarkerPress?: (broadcast: StatusBroadcast) => void;
}

export const BonfireMap = forwardRef<BonfireMapHandle, BonfireMapProps>(
  function BonfireMap(
    { initialCenter, initialZoom, onMapPress, onMarkerPress },
    ref
  ) {
    const [soloBroadcasts, setSoloBroadcasts] = useState<StatusBroadcast[]>([]);
    const [moments, setMoments] = useState<Moment[]>([]);
    const cameraRef = useRef<CameraRef>(null);

    useImperativeHandle(ref, () => ({
      flyTo: (center: [number, number], zoom: number) => {
        cameraRef.current?.setCamera({
          centerCoordinate: center,
          zoomLevel: zoom,
          animationDuration: 2000,
          animationMode: "flyTo",
        });
      },
    }));

    const loadBroadcasts = useCallback(async () => {
      try {
        const broadcasts = await fetchActiveBroadcastsWithJoins();
        const { moments: m, soloBroadcasts: solo } = computeMoments(broadcasts);
        setMoments(m);
        setSoloBroadcasts(solo);
      } catch (err) {
        console.warn("Error loading broadcasts:", err);
      }
    }, []);

    useEffect(() => {
      loadBroadcasts();
    }, [loadBroadcasts]);

    useEffect(() => {
      const channel = supabase
        .channel("broadcasts-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "status_broadcasts" },
          () => loadBroadcasts()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [loadBroadcasts]);

    const handleMarkerPress = useCallback(
      (broadcast: StatusBroadcast) => {
        onMarkerPress?.(broadcast);
      },
      [onMarkerPress]
    );

    return (
      <MapView
        style={{ flex: 1 }}
        mapStyle={STYLE_URL}
        onPress={onMapPress}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: initialCenter,
            zoomLevel: initialZoom,
          }}
        />

        {soloBroadcasts
          .filter((b) => b.lat != null && b.lng != null)
          .map((b) => (
            <BroadcastMarker
              key={b.id}
              broadcast={b}
              onPress={handleMarkerPress}
            />
          ))}

        {moments.map((m) => (
          <MomentClusterMarker
            key={m.id}
            moment={m}
            onPress={() => {}}
          />
        ))}
      </MapView>
    );
  }
);
