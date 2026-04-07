import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { BonfireMap, type BonfireMapHandle } from "../../components/map/BonfireMap";
import { MapHeaderBar } from "../../components/map/MapHeaderBar";
import { QuickActionsGrid } from "../../components/map/QuickActionsGrid";
import { MarkerDetailCard, type SelectedMapItem } from "../../components/map/MarkerDetailCard";
import { Toast } from "../../components/ui/Toast";
import { onFirePress, onCityPickerToggle } from "../../lib/events";
import { StatusPill } from "../../components/broadcast/StatusPill";
import { theme } from "../../constants/theme";
import { CityPickerMenu } from "../../components/map/CityPickerMenu";
import { STATIC_CITIES, buildCityList, nearestCity } from "../../constants/cities";
import type { City } from "../../constants/cities";
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
import { MyLocationButton } from "../../components/map/MyLocationButton";
import { isAdmin } from "../../constants/admins";
import { QUICK_ACTION_OPTIONS } from "../../types";
import type { Profile, StatusBroadcast, StatusType, BroadcastDuration } from "../../types";

export default function MapScreen() {
  const router = useRouter();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);

  const [myBroadcast, setMyBroadcast] = useState<StatusBroadcast | null>(null);
  const [sending, setSending] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [selectedMapItem, setSelectedMapItem] = useState<SelectedMapItem | null>(null);
  const [activeCity, setActiveCity] = useState<City>(STATIC_CITIES[0]);
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

  const mapRef = useRef<BonfireMapHandle>(null);

  useEffect(() => {
    (async () => {
      const [{ data: { user } }, locationResult] = await Promise.all([
        supabase.auth.getUser(),
        Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
          if (status !== "granted") return null;
          return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }),
      ]);

      if (locationResult) {
        const coords: [number, number] = [
          locationResult.coords.longitude,
          locationResult.coords.latitude,
        ];
        setUserCoords(coords);
        updateLastKnownLocation(locationResult.coords.latitude, locationResult.coords.longitude).catch(() => {});
      }

      if (user) {
        setCurrentUserId(user.id);
        const [profile, broadcast] = await Promise.all([
          fetchProfile(user.id),
          fetchMyActiveBroadcast(),
        ]);
        setMyProfile(profile);
        setMyBroadcast(broadcast);
      }
    })();

    const unsubFire = onFirePress(() => {
      setGridOpen((prev) => !prev);
    });

    const unsubCity = onCityPickerToggle(() => {
      setCitySelectorOpen((prev) => !prev);
    });

    return () => { unsubFire(); unsubCity(); };
  }, []);

  // ── City switching ─────────────────────────────────────

  const cities = useMemo(() => buildCityList(userCoords), [userCoords]);

  // Set active city once location resolves
  useEffect(() => {
    if (userCoords) {
      setActiveCity(nearestCity(userCoords[0], userCoords[1]));
    }
  }, [userCoords]);

  const handleCitySelect = useCallback((city: City) => {
    setActiveCity(city);
    setCitySelectorOpen(false);
    mapRef.current?.flyTo(city.center, city.zoom);
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
      setGridOpen(false);
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
        setGridOpen(true);
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
        setMyBroadcast((prev) => prev ? { ...prev, duration } : null);
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

  // ── Grid handlers ───────────────────────────────────────

  const handleGridSelect = useCallback(
    async (statusType: StatusType) => {
      if (sending) return;

      if (!myBroadcast) {
        // Not live → go live with this activity
        await handleQuickAction(statusType);
        return;
      }

      // Live → switch activity
      if (statusType === myBroadcast.status_type) return;
      setSending(true);
      try {
        await updateBroadcastContext(myBroadcast.id, statusType);
        setMyBroadcast((prev) => prev ? { ...prev, status_type: statusType } : null);
        const label = QUICK_ACTION_OPTIONS.find((o) => o.type === statusType)?.label ?? statusType;
        setToastMsg(`Switched to ${label}`);
        setGridOpen(false);
      } catch {
        setToastMsg("Couldn't switch activity");
      } finally {
        setSending(false);
      }
    },
    [myBroadcast, sending, handleQuickAction]
  );

  const handleGridClose = useCallback(async () => {
    if (!myBroadcast) {
      setGridOpen(false);
      return;
    }
    try {
      await endBroadcast(myBroadcast.id);
      await cancelAllReminders();
      setMyBroadcast(null);
      setToastMsg("Broadcast ended");
      setGridOpen(false);
    } catch {
      setToastMsg("Couldn't end broadcast");
    }
  }, [myBroadcast]);

  const handleSparkPress = useCallback(() => {
    setToastMsg("Coming soon");
  }, []);

  const showDevPanel = __DEV__ || isAdmin(myProfile?.university_email);

  const handleMyLocation = useCallback(() => {
    if (activeCity.key !== "current") {
      const currentCity = cities.find((c) => c.key === "current");
      if (currentCity) setActiveCity(currentCity);
    }
    mapRef.current?.flyToUser();
  }, [cities, activeCity.key]);

  const handleMarkerSelect = useCallback((item: SelectedMapItem) => {
    setSelectedMapItem(item);
    setGridOpen(false);
  }, []);

  const handleDismissMarker = useCallback(() => {
    setSelectedMapItem(null);
    setGridOpen(false);
  }, []);

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
          maxBounds={activeCity.bounds}
          minZoomLevel={activeCity.minZoom ?? 11}
          maxZoomLevel={18}
          currentUserId={currentUserId}
          selectedItem={selectedMapItem}
          onMarkerSelect={handleMarkerSelect}
          onMapPress={handleDismissMarker}
          onUserLocationUpdate={setUserCoords}
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

          {selectedMapItem && (
            <MarkerDetailCard
              item={selectedMapItem}
              currentUserId={currentUserId}
              onDismiss={handleDismissMarker}
            />
          )}
        </View>

        {citySelectorOpen && (
          <CityPickerMenu
            cities={cities}
            activeCity={activeCity}
            onSelect={handleCitySelect}
            onDismiss={() => setCitySelectorOpen(false)}
          />
        )}

        {gridOpen && (
          <QuickActionsGrid
            isLive={!!myBroadcast}
            activeStatusType={myBroadcast?.status_type ?? null}
            onSelect={handleGridSelect}
            onClose={handleGridClose}
            onSparkPress={handleSparkPress}
          />
        )}

        <View style={styles.rightControls} pointerEvents="box-none">
          {userCoords && <MyLocationButton onPress={handleMyLocation} />}
          {showDevPanel && (
            <DevPanel userCoords={userCoords} onToast={setToastMsg} />
          )}
        </View>
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
  rightControls: {
    position: "absolute",
    bottom: 160,
    right: 20,
    zIndex: theme.z.fab,
    alignItems: "flex-end",
    gap: 12,
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
