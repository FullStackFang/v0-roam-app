import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from "react";
import MapLibreGL, {
  type CameraRef,
  MapView,
  Camera,
} from "@maplibre/maplibre-react-native";
import { supabase } from "../../lib/supabase";
import { fetchActiveBroadcastsWithJoins, computeMomentsCached } from "../../lib/queries";
import { debounce } from "../../lib/debounce";
import { BroadcastMarkersLayer } from "./BroadcastMarkersLayer";
import type { StatusBroadcast, Moment } from "../../types";

MapLibreGL.setAccessToken(null);

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

export interface BonfireMapHandle {
  flyTo: (center: [number, number], zoom: number) => void;
}

interface BonfireMapProps {
  initialCenter: [number, number];
  initialZoom: number;
  currentUserId: string | null;
}

export const BonfireMap = forwardRef<BonfireMapHandle, BonfireMapProps>(
  function BonfireMap({ initialCenter, initialZoom, currentUserId }, ref) {
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
        const { moments: m, soloBroadcasts: solo } = computeMomentsCached(broadcasts);
        setMoments(m);
        setSoloBroadcasts(solo);
      } catch (err) {
        console.warn("Error loading broadcasts:", err);
      }
    }, []);

    const debouncedLoad = useMemo(() => debounce(loadBroadcasts, 500), [loadBroadcasts]);

    useEffect(() => {
      loadBroadcasts();
    }, [loadBroadcasts]);

    useEffect(() => {
      const channel = supabase
        .channel("broadcasts-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "status_broadcasts" },
          () => debouncedLoad()
        )
        .subscribe();

      return () => {
        debouncedLoad.cancel();
        supabase.removeChannel(channel);
      };
    }, [debouncedLoad]);

    return (
      <MapView
        style={{ flex: 1 }}
        mapStyle={STYLE_URL}
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

        <BroadcastMarkersLayer
          broadcasts={soloBroadcasts}
          moments={moments}
          currentUserId={currentUserId}
        />
      </MapView>
    );
  }
);
