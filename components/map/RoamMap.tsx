import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import MapLibreGL, {
  type CameraRef,
  MapView,
  Camera,
  ShapeSource,
  HeatmapLayer,
  MarkerView,
} from "@maplibre/maplibre-react-native";
import { theme } from "../../constants/theme";
import { supabase } from "../../lib/supabase";
import {
  fetchVenues,
  fetchActiveCheckins,
  fetchActivityPoints,
  fetchActiveBroadcasts,
  getActivityLevel,
  getHeatColor,
  filterVenuesByCategory,
} from "../../lib/queries";
import type {
  Venue,
  Checkin,
  ActivityPointCollection,
  StatusBroadcast,
  FilterCategory,
  TimeFilter,
} from "../../types";

// Initialize MapLibre
MapLibreGL.setAccessToken(null);

const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";

export interface RoamMapHandle {
  flyTo: (center: [number, number], zoom: number) => void;
}

interface RoamMapProps {
  filter: FilterCategory;
  timeFilter: TimeFilter;
  initialCenter: [number, number];
  initialZoom: number;
  onVenuePress: (venue: Venue, checkin: Checkin | null) => void;
  onMapPress: () => void;
}

interface MarkerData {
  venue: Venue;
  level: 1 | 2 | 3;
  color: string;
  checkin: Checkin | null;
}

function AnimatedMarker({
  marker,
  onPress,
}: {
  marker: MarkerData;
  onPress: () => void;
}) {
  const ringAnims = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const durations = { 3: 3600, 2: 4500, 1: 6000 };
    const ringCount = marker.level;
    const duration = durations[marker.level];

    ringAnims.forEach((anim, i) => {
      if (i >= ringCount) return;
      const delay = (duration / ringCount) * i;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    return () => ringAnims.forEach((a) => a.stopAnimation());
  }, [marker.level]);

  const dotSize = { 3: 13, 2: 11, 1: 9 }[marker.level];
  const maxScale = { 3: 7, 2: 5.5, 1: 4 }[marker.level];
  const startOpacity = { 3: 0.7, 2: 0.55, 1: 0.4 }[marker.level];

  return (
    <MarkerView
      coordinate={[marker.venue.lng, marker.venue.lat]}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        style={{ width: 100, height: 100, alignItems: "center", justifyContent: "center" }}
        onTouchEnd={onPress}
      >
        {ringAnims.slice(0, marker.level).map((anim, i) => (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              borderWidth: marker.level === 3 ? 1.5 : marker.level === 2 ? 1.2 : 1,
              borderColor: marker.color,
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [startOpacity, 0],
              }),
              transform: [
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, maxScale],
                  }),
                },
              ],
            }}
          />
        ))}

        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: marker.color,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.95)",
            shadowColor: marker.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: marker.level === 3 ? 10 : marker.level === 2 ? 7 : 4,
            elevation: 4,
          }}
        />
      </View>
    </MarkerView>
  );
}

export const RoamMap = forwardRef<RoamMapHandle, RoamMapProps>(
  function RoamMap(
    { filter, timeFilter, initialCenter, initialZoom, onVenuePress, onMapPress },
    ref
  ) {
    const [venues, setVenues] = useState<Venue[]>([]);
    const [checkins, setCheckins] = useState<Checkin[]>([]);
    const [activityPoints, setActivityPoints] =
      useState<ActivityPointCollection | null>(null);
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
        const [v, c, ap, b] = await Promise.all([
          fetchVenues(),
          fetchActiveCheckins(),
          fetchActivityPoints(),
          fetchActiveBroadcasts(),
        ]);
        setVenues(v);
        setCheckins(c);
        setActivityPoints(ap);
        setBroadcasts(b);
      } catch (err) {
        console.warn("Error loading map data:", err);
      }
    }, []);

    useEffect(() => {
      loadData();
    }, [loadData]);

    // Realtime subscriptions
    useEffect(() => {
      const checkinsChannel = supabase
        .channel("checkins-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "checkins" },
          () => loadData()
        )
        .subscribe();

      const broadcastsChannel = supabase
        .channel("broadcasts-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "status_broadcasts" },
          () => loadData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(checkinsChannel);
        supabase.removeChannel(broadcastsChannel);
      };
    }, [loadData]);

    const filteredVenues = filterVenuesByCategory(venues, filter);

    const markers: MarkerData[] = filteredVenues.map((venue, index) => {
      const venueCheckins = checkins.filter((c) => c.venue_id === venue.id);
      const avgScore =
        venueCheckins.length > 0
          ? venueCheckins.reduce((sum, c) => sum + c.activity_score, 0) /
            venueCheckins.length
          : 0.2;
      const level = getActivityLevel(avgScore);
      const color = getHeatColor(level, index);
      const latestCheckin =
        venueCheckins.length > 0
          ? venueCheckins.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )[0]
          : null;

      return { venue, level, color, checkin: latestCheckin };
    });

    const heatmapGeoJSON = activityPoints ?? {
      type: "FeatureCollection" as const,
      features: [],
    };

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

          <ShapeSource id="heatmap-source" shape={heatmapGeoJSON}>
            <HeatmapLayer
              id="heatmap-layer"
              sourceID="heatmap-source"
              style={{
                heatmapWeight: [
                  "interpolate",
                  ["linear"],
                  ["get", "weight"],
                  0, 0,
                  1, 1,
                ],
                heatmapIntensity: [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0, 1,
                  18, 3,
                ],
                heatmapColor: [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0, "rgba(0,0,0,0)",
                  0.2, theme.cool,
                  0.5, theme.warm,
                  0.8, "#F05030",
                  1, theme.heat.a,
                ],
                heatmapRadius: [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  0, 2,
                  18, 30,
                ],
                heatmapOpacity: 0.7,
              }}
            />
          </ShapeSource>

          {markers.map((m) => (
            <AnimatedMarker
              key={m.venue.id}
              marker={m}
              onPress={() => onVenuePress(m.venue, m.checkin)}
            />
          ))}

          {/* Broadcast avatar markers */}
          {broadcasts
            .filter((b) => b.profile)
            .map((b) => {
              // Use a venue location as fallback (first venue in list near campus)
              // In future, broadcasts will carry their own lat/lng
              const venueMatch = venues.find((v) =>
                checkins.some(
                  (c) => c.user_id === b.user_id && c.venue_id === v.id
                )
              );
              if (!venueMatch) return null;

              const initial = b.profile!.display_name.charAt(0).toUpperCase();
              return (
                <MarkerView
                  key={`broadcast-${b.id}`}
                  coordinate={[venueMatch.lng + 0.0003, venueMatch.lat + 0.0003]}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={broadcastStyles.wrap}>
                    {/* Glow ring */}
                    <View style={broadcastStyles.glow} />
                    {/* Avatar circle */}
                    <View style={broadcastStyles.avatar}>
                      <Text style={broadcastStyles.avatarText}>{initial}</Text>
                    </View>
                  </View>
                </MarkerView>
              );
            })}
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

const broadcastStyles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(240,77,44,0.15)",
    borderWidth: 1,
    borderColor: "rgba(240,77,44,0.25)",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.accent,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
});
