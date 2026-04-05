import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import { View, StyleSheet } from "react-native";
import MapLibreGL, {
  type CameraRef,
  MapView,
  Camera,
} from "@maplibre/maplibre-react-native";
import { theme } from "../../constants/theme";
import { supabase } from "../../lib/supabase";
import {
  fetchVenues,
  fetchActiveBroadcasts,
} from "../../lib/queries";
import type { Venue, StatusBroadcast } from "../../types";

// Initialize MapLibre
MapLibreGL.setAccessToken(null);

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export interface BonfireMapHandle {
  flyTo: (center: [number, number], zoom: number) => void;
}

interface BonfireMapProps {
  initialCenter: [number, number];
  initialZoom: number;
  onMapPress: () => void;
}

export const BonfireMap = forwardRef<BonfireMapHandle, BonfireMapProps>(
  function BonfireMap({ initialCenter, initialZoom, onMapPress }, ref) {
    const [venues, setVenues] = useState<Venue[]>([]); // TODO: Phase 1 — remove if venues are no longer needed
    const [broadcasts, setBroadcasts] = useState<StatusBroadcast[]>([]);
    const cameraRef = useRef<CameraRef>(null);

    // Expose flyTo to parent via ref
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

    const loadData = useCallback(async () => {
      try {
        const [v, b] = await Promise.all([
          fetchVenues(),
          fetchActiveBroadcasts(),
        ]);
        setVenues(v);
        setBroadcasts(b);
      } catch (err) {
        console.warn("Error loading map data:", err);
      }
    }, []);

    useEffect(() => {
      loadData();
    }, [loadData]);

    // Realtime subscription for broadcasts
    useEffect(() => {
      const broadcastsChannel = supabase
        .channel("broadcasts-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "status_broadcasts" },
          () => loadData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(broadcastsChannel);
      };
    }, [loadData]);

    // TODO: Phase 1 — add broadcast avatar markers with proper lat/lng

    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
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
        </MapView>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
