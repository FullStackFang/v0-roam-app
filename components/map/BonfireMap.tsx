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
  type Location,
  MapView,
  Camera,
  UserLocation,
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
  flyToUser: () => void;
}

interface BonfireMapProps {
  initialCenter: [number, number];
  initialZoom: number;
  maxBounds?: { sw: [number, number]; ne: [number, number] };
  minZoomLevel?: number;
  maxZoomLevel?: number;
  currentUserId: string | null;
  selectedItem: SelectedMapItem | null;
  onMarkerSelect: (item: SelectedMapItem) => void;
  onMapPress: () => void;
  onUserLocationUpdate?: (coords: [number, number]) => void;
}

export const BonfireMap = forwardRef<BonfireMapHandle, BonfireMapProps>(
  function BonfireMap(
    { initialCenter, initialZoom, maxBounds, minZoomLevel, maxZoomLevel, currentUserId, selectedItem, onMarkerSelect, onMapPress, onUserLocationUpdate },
    ref,
  ) {
    const [soloBroadcasts, setSoloBroadcasts] = useState<StatusBroadcast[]>([]);
    const [moments, setMoments] = useState<Moment[]>([]);
    const userLocationRef = useRef<[number, number] | null>(null);
    const channelName = useRef(`broadcasts-realtime-${Math.random().toString(36).slice(2)}`);

    // Reactive camera target — drives Camera props instead of imperative setNativeProps
    const [cameraTarget, setCameraTarget] = useState<{
      center: [number, number];
      zoom: number;
      duration: number;
      seq: number;
    } | null>(null);
    const seqRef = useRef(0);

    useImperativeHandle(ref, () => ({
      flyTo: (center: [number, number], zoom: number) => {
        seqRef.current += 1;
        setCameraTarget({ center, zoom, duration: 2000, seq: seqRef.current });
      },
      flyToUser: () => {
        const coords = userLocationRef.current;
        if (!coords) return;
        seqRef.current += 1;
        setCameraTarget({ center: coords, zoom: 15, duration: 800, seq: seqRef.current });
      },
    }));

    const handleUserLocationUpdate = useCallback(
      (location: Location) => {
        const coords: [number, number] = [
          location.coords.longitude,
          location.coords.latitude,
        ];
        userLocationRef.current = coords;
        onUserLocationUpdate?.(coords);
      },
      [onUserLocationUpdate],
    );

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

    return (
      <MapView
        style={{ flex: 1 }}
        mapStyle={STYLE_URL}
        logoEnabled={false}
        attributionEnabled={false}
        onPress={onMapPress}
      >
        <Camera
          defaultSettings={{
            centerCoordinate: initialCenter,
            zoomLevel: initialZoom,
          }}
          centerCoordinate={cameraTarget?.center}
          zoomLevel={cameraTarget?.zoom}
          animationMode="flyTo"
          animationDuration={cameraTarget?.duration ?? 0}
          maxBounds={maxBounds ? { ne: maxBounds.ne, sw: maxBounds.sw } : undefined}
          minZoomLevel={minZoomLevel}
          maxZoomLevel={maxZoomLevel}
        />

        <UserLocation
          animated
          renderMode="normal"
          minDisplacement={5}
          onUpdate={handleUserLocationUpdate}
        />

        <BroadcastMarkersLayer
          broadcasts={soloBroadcasts}
          moments={moments}
          currentUserId={currentUserId}
          selectedId={selectedId}
          onMarkerPress={onMarkerSelect}
        />
      </MapView>
    );
  }
);
