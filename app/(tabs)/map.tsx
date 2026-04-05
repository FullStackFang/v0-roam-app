import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { BonfireMap, type BonfireMapHandle } from "../../components/map/BonfireMap";
import { Toast } from "../../components/ui/Toast";
import { StatusFAB } from "../../components/broadcast/StatusFAB";
import { ContextSheet } from "../../components/broadcast/ContextSheet";
import { StatusPill } from "../../components/broadcast/StatusPill";
import { theme } from "../../constants/theme";
import { STATIC_CITIES } from "../../constants/cities";
import {
  goLive,
  fetchMyActiveBroadcast,
  updateBroadcastContext,
  updateBroadcastAvailability,
  endBroadcast,
  toggleBroadcastVisibility,
} from "../../lib/queries";
import { updateLastKnownLocation, scheduleLiveReminder, cancelAllReminders } from "../../lib/notifications";
import { supabase } from "../../lib/supabase";
import { DevPanel } from "../../components/dev/DevPanel";
import type { StatusBroadcast, StatusType, BroadcastDuration } from "../../types";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [myBroadcast, setMyBroadcast] = useState<StatusBroadcast | null>(null);
  const [contextSheetVisible, setContextSheetVisible] = useState(false);
  const [sending, setSending] = useState(false);

  const mapRef = useRef<BonfireMapHandle>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id ?? null);
    });

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
      updateLastKnownLocation(loc.coords.latitude, loc.coords.longitude).catch(() => {});
    })();

    fetchMyActiveBroadcast().then(setMyBroadcast);
  }, []);

  // ── Broadcast flow ──────────────────────────────────────

  const handleFabPress = useCallback(async () => {
    if (myBroadcast) return;
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
      scheduleLiveReminder(broadcast.id).catch(() => {});
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
      } catch {}
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

  const handleToggleVisibility = useCallback(async () => {
    if (!myBroadcast) return;
    const newVisibility = !myBroadcast.is_visible;
    try {
      await toggleBroadcastVisibility(myBroadcast.id, newVisibility);
      setMyBroadcast((prev) => prev ? { ...prev, is_visible: newVisibility } : null);
      setToastMsg(newVisibility ? "You're visible again" : "You're invisible");
    } catch {
      setToastMsg("Couldn't update visibility");
    }
  }, [myBroadcast]);

  const handleEndBroadcast = useCallback(async () => {
    if (!myBroadcast) return;
    try {
      await endBroadcast(myBroadcast.id);
      await cancelAllReminders();
      setMyBroadcast(null);
      setToastMsg("Broadcast ended");
    } catch {
      setToastMsg("Couldn't end broadcast");
    }
  }, [myBroadcast]);

  return (
    <View style={styles.container}>
      <BonfireMap
        ref={mapRef}
        initialCenter={userCoords ?? STATIC_CITIES[0].center}
        initialZoom={userCoords ? 15 : STATIC_CITIES[0].zoom}
        currentUserId={currentUserId}
      />

      <View
        style={[styles.controlsOverlay, { paddingTop: insets.top + 8 }]}
        pointerEvents="box-none"
      >
        <View style={styles.topRow} pointerEvents="box-none">
          {myBroadcast && (
            <StatusPill
              broadcast={myBroadcast}
              onChangeAvailability={handleChangeAvailability}
              onToggleVisibility={handleToggleVisibility}
              onEndBroadcast={handleEndBroadcast}
            />
          )}
        </View>
      </View>

      <StatusFAB
        onPress={handleFabPress}
        isLive={myBroadcast !== null}
      />

      <ContextSheet
        visible={contextSheetVisible}
        onSelect={handleContextSelect}
        onSkip={handleContextSkip}
      />

      {__DEV__ && (
        <DevPanel userCoords={userCoords} onToast={setToastMsg} />
      )}

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
