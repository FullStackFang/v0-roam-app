import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { BonfireMap, type BonfireMapHandle } from "../../components/map/BonfireMap";
import { TopBar } from "../../components/map/TopBar";
import { Toast } from "../../components/ui/Toast";
import { StatusFAB } from "../../components/broadcast/StatusFAB";
import { BroadcastSheet } from "../../components/broadcast/BroadcastSheet";
import { theme } from "../../constants/theme";
import {
  STATIC_CITIES,
  buildCityList,
  nearestCity,
  type City,
} from "../../constants/cities";

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [city, setCity] = useState<City>(STATIC_CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const mapRef = useRef<BonfireMapHandle>(null);

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
  }, []);

  const cities = buildCityList(userCoords);

  const handleCityToggle = useCallback(() => {
    setCityOpen((prev) => !prev);
  }, []);

  const handleCitySelect = useCallback((selected: City) => {
    setCity(selected);
    setCityOpen(false);
    mapRef.current?.flyTo(selected.center, selected.zoom);
  }, []);

  const handleMapPress = () => {
    if (cityOpen) setCityOpen(false);
  };

  return (
    <View style={styles.container}>
      <BonfireMap
        ref={mapRef}
        initialCenter={city.center}
        initialZoom={city.zoom}
        onMapPress={handleMapPress}
      />

      <View style={[styles.controlsOverlay, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <TopBar
          cities={cities}
          activeCity={city}
          isOpen={cityOpen}
          onToggle={handleCityToggle}
          onSelect={handleCitySelect}
        />
      </View>

      {/* FAB + Broadcast sheet */}
      {!broadcastOpen && (
        <StatusFAB onPress={() => setBroadcastOpen(true)} />
      )}
      <BroadcastSheet
        visible={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        onBroadcast={() => setToastMsg("You're live")}
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
});
