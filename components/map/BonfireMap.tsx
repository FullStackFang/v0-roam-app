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
import type { SelectedMapItem } from "./MarkerDetailCard";

MapLibreGL.setAccessToken(null);

const STYLE_URL = "https://tiles.openfreemap.org/styles/bright";

export interface BonfireMapHandle {
  flyTo: (center: [number, number], zoom: number) => void;
}

interface BonfireMapProps {
  initialCenter: [number, number];
  initialZoom: number;
  currentUserId: string | null;
  selectedItem: SelectedMapItem | null;
  onMarkerSelect: (item: SelectedMapItem) => void;
  onMapPress: () => void;
}

export const BonfireMap = forwardRef<BonfireMapHandle, BonfireMapProps>(
  function BonfireMap(
    { initialCenter, initialZoom, currentUserId, selectedItem, onMarkerSelect, onMapPress },
    ref,
  ) {
    const [soloBroadcasts, setSoloBroadcasts] = useState<StatusBroadcast[]>([]);
    const [moments, setMoments] = useState<Moment[]>([]);
    const cameraRef = useRef<CameraRef>(null);
    const channelName = useRef(`broadcasts-realtime-${Math.random().toString(36).slice(2)}`);

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
        .channel(channelName.current)
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

    const selectedId = selectedItem?.data.id ?? null;

    const handleMarkerPress = useCallback(
      (item: SelectedMapItem) => {
        onMarkerSelect(item);

        // Fly to the tapped marker
        const coords: [number, number] =
          item.type === "broadcast"
            ? [
                currentUserId === item.data.user_id
                  ? item.data.lng!
                  : ((item.data as StatusBroadcast).fuzzy_lng ?? item.data.lng!),
                currentUserId === item.data.user_id
                  ? item.data.lat!
                  : ((item.data as StatusBroadcast).fuzzy_lat ?? item.data.lat!),
              ]
            : [item.data.lng, item.data.lat];

        cameraRef.current?.setCamera({
          centerCoordinate: coords,
          animationDuration: 800,
          animationMode: "flyTo",
        });
      },
      [onMarkerSelect, currentUserId],
    );

    return (
      <MapView
        style={{ flex: 1 }}
        mapStyle={STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={onMapPress}
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
          selectedId={selectedId}
          onMarkerPress={handleMarkerPress}
        />
      </MapView>
    );
  }
);
