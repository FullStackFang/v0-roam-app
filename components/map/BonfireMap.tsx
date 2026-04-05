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
import { fetchActiveBroadcasts } from "../../lib/queries";
import { BroadcastMarker } from "./BroadcastMarker";
import type { StatusBroadcast } from "../../types";

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
    const [broadcasts, setBroadcasts] = useState<StatusBroadcast[]>([]);
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
        const b = await fetchActiveBroadcasts();
        setBroadcasts(b);
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

        {broadcasts
          .filter((b) => b.lat != null && b.lng != null)
          .map((b) => (
            <BroadcastMarker
              key={b.id}
              broadcast={b}
              onPress={handleMarkerPress}
            />
          ))}
      </MapView>
    );
  }
);
