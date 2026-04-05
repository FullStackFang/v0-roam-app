import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { BonfireMap, type BonfireMapHandle } from "../../components/map/BonfireMap";
import { MapHeaderBar } from "../../components/map/MapHeaderBar";
import { QuickActionsBar } from "../../components/map/QuickActionsBar";
import { Toast } from "../../components/ui/Toast";
import { onFirePress } from "../../lib/events";
import { StatusPill } from "../../components/broadcast/StatusPill";
import { theme } from "../../constants/theme";
import { STATIC_CITIES } from "../../constants/cities";
import {
  goLive,
  fetchMyActiveBroadcast,
  fetchProfile,
  updateBroadcastContext,
  updateBroadcastAvailability,
  endBroadcast,
  toggleBroadcastVisibility,
} from "../../lib/queries";
import { updateLastKnownLocation, scheduleLiveReminder, cancelAllReminders } from "../../lib/notifications";
import { supabase } from "../../lib/supabase";
import { DevPanel } from "../../components/dev/DevPanel";
import type { Profile, StatusBroadcast, StatusType, BroadcastDuration } from "../../types";

export default function MapScreen() {
  const router = useRouter();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  const [myBroadcast, setMyBroadcast] = useState<StatusBroadcast | null>(null);
  const [sending, setSending] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(false);

  const mapRef = useRef<BonfireMapHandle>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setCurrentUserId(user.id);
      fetchProfile(user.id).then(setMyProfile);
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

    const unsubFire = onFirePress(() => {
      setCarouselOpen(true);
    });

    return () => { unsubFire(); };
  }, []);

  // ── Broadcast flow ──────────────────────────────────────

  const handleQuickAction = useCallback(
    async (statusType: StatusType) => {
      if (myBroadcast || sending) return;
      if (!userCoords) {
        setToastMsg("Enable location to go live");
        return;
      }

      setSending(true);
      setCarouselOpen(false);
      try {
        const broadcast = await goLive({
          lat: userCoords[1],
          lng: userCoords[0],
        });
        await updateBroadcastContext(broadcast.id, statusType);
        setMyBroadcast({ ...broadcast, status_type: statusType });
        setToastMsg("You're live");
        scheduleLiveReminder(broadcast.id).catch(() => {});
      } catch (err: any) {
        setToastMsg(err.message);
        setCarouselOpen(true);
      } finally {
        setSending(false);
      }
    },
    [myBroadcast, sending, userCoords]
  );

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
      <MapHeaderBar
        profile={myProfile}
        onProfilePress={() => router.push("/profile")}
      />

      <View style={styles.mapWrapper}>
        <BonfireMap
          ref={mapRef}
          initialCenter={userCoords ?? STATIC_CITIES[0].center}
          initialZoom={userCoords ? 15 : STATIC_CITIES[0].zoom}
          currentUserId={currentUserId}
        />

        <View
          style={styles.controlsOverlay}
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

        {!myBroadcast && carouselOpen && (
          <QuickActionsBar
            onSelect={handleQuickAction}
            onDismiss={() => setCarouselOpen(false)}
          />
        )}

        {__DEV__ && (
          <DevPanel userCoords={userCoords} onToast={setToastMsg} />
        )}
      </View>

      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  mapWrapper: {
    flex: 1,
    position: "relative",
  },
  controlsOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    zIndex: theme.z.controls,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
});
