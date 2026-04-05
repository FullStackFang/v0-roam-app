import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { BonfireMap, type BonfireMapHandle } from "../../components/map/BonfireMap";
import { TopBar } from "../../components/map/TopBar";
import { Toast } from "../../components/ui/Toast";
import { StatusFAB } from "../../components/broadcast/StatusFAB";
import { ContextSheet } from "../../components/broadcast/ContextSheet";
import { StatusPill } from "../../components/broadcast/StatusPill";
import { theme } from "../../constants/theme";
import {
  STATIC_CITIES,
  buildCityList,
  nearestCity,
  type City,
} from "../../constants/cities";
import {
  goLive,
  fetchMyActiveBroadcast,
  updateBroadcastContext,
  updateBroadcastAvailability,
  endBroadcast,
} from "../../lib/queries";
import type { StatusBroadcast, StatusType, BroadcastDuration } from "../../types";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [city, setCity] = useState<City>(STATIC_CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);

  // Broadcast state
  const [myBroadcast, setMyBroadcast] = useState<StatusBroadcast | null>(null);
  const [contextSheetVisible, setContextSheetVisible] = useState(false);
  const [sending, setSending] = useState(false);

  const mapRef = useRef<BonfireMapHandle>(null);

  // Get location + check for existing broadcast on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: [number, number] = [
        loc.coords.longitude,
        loc.coords.latitude,
      ];
      setUserCoords(coords);
      setCity(nearestCity(coords[0], coords[1]));
    })();

    fetchMyActiveBroadcast().then(setMyBroadcast);
  }, []);

  const cities = useMemo(() => buildCityList(userCoords), [userCoords]);

  const handleCityToggle = useCallback(() => {
    setCityOpen((prev) => !prev);
  }, []);

  const handleCitySelect = useCallback((selected: City) => {
    setCity(selected);
    setCityOpen(false);
    mapRef.current?.flyTo(selected.center, selected.zoom);
  }, []);

  const handleMapPress = useCallback(() => {
    setCityOpen(false);
  }, []);

  // ── Broadcast flow ──────────────────────────────────────

  const handleFabPress = useCallback(async () => {
    if (myBroadcast) return; // Already live — status pill handles changes
    if (!userCoords) {
      setToastMsg("Enable location to go live");
      return;
    }

    setSending(true);
    try {
      const broadcast = await goLive({
        lat: userCoords[1],
        lng: userCoords[0],
      });
      setMyBroadcast(broadcast);
      setContextSheetVisible(true);
      setToastMsg("You're live");
    } catch (err: any) {
      setToastMsg(err.message);
    } finally {
      setSending(false);
    }
  }, [myBroadcast, userCoords]);

  const handleContextSelect = useCallback(
    async (statusType: StatusType) => {
      if (!myBroadcast) return;
      try {
        await updateBroadcastContext(myBroadcast.id, statusType);
        setMyBroadcast((prev) =>
          prev ? { ...prev, status_type: statusType } : null
        );
      } catch {
        // Silently fail — context is optional
      }
      setContextSheetVisible(false);
    },
    [myBroadcast]
  );

  const handleContextSkip = useCallback(() => {
    setContextSheetVisible(false);
  }, []);

  const handleChangeAvailability = useCallback(
    async (duration: BroadcastDuration) => {
      if (!myBroadcast) return;
      try {
        await updateBroadcastAvailability(myBroadcast.id, duration);
        const updated = await fetchMyActiveBroadcast();
        setMyBroadcast(updated);
      } catch {
        setToastMsg("Couldn't update availability");
      }
    },
    [myBroadcast]
  );

  const handleEndBroadcast = useCallback(async () => {
    if (!myBroadcast) return;
    try {
      await endBroadcast(myBroadcast.id);
      setMyBroadcast(null);
      setToastMsg("You're hidden");
    } catch {
      setToastMsg("Couldn't end broadcast");
    }
  }, [myBroadcast]);

  return (
    <View style={styles.container}>
      <BonfireMap
        ref={mapRef}
        initialCenter={city.center}
        initialZoom={city.zoom}
        onMapPress={handleMapPress}
      />

      <View
        style={[styles.controlsOverlay, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topRow} pointerEvents="box-none">
          <TopBar
            cities={cities}
            activeCity={city}
            isOpen={cityOpen}
            onToggle={handleCityToggle}
            onSelect={handleCitySelect}
          />
          {myBroadcast && (
            <StatusPill
              broadcast={myBroadcast}
              onChangeAvailability={handleChangeAvailability}
              onEndBroadcast={handleEndBroadcast}
            />
          )}
        </View>
      </View>

      {/* FAB — always visible */}
      <StatusFAB
        onPress={handleFabPress}
        isLive={myBroadcast !== null}
      />

      {/* Context sheet — shown after going live */}
      <ContextSheet
        visible={contextSheetVisible}
        onSelect={handleContextSelect}
        onSkip={handleContextSkip}
      />

      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  controlsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
});
