import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, StyleSheet } from "react-native";
import * as Location from "expo-location";
import { RoamMap, type RoamMapHandle } from "../components/map/RoamMap";
import { TopBar } from "../components/map/TopBar";
import { TimeToggle } from "../components/map/TimeToggle";
import { FilterBar } from "../components/map/FilterBar";
import { SpotCard } from "../components/map/SpotCard";
import { Toast } from "../components/ui/Toast";
import { theme } from "../constants/theme";
import {
  STATIC_CITIES,
  buildCityList,
  nearestCity,
  type City,
} from "../constants/cities";
import type { Venue, Checkin, FilterCategory, TimeFilter } from "../types";

export default function MapScreen() {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("tonight");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [city, setCity] = useState<City>(STATIC_CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);

  const mapRef = useRef<RoamMapHandle>(null);

  // On mount: request location, store coords, pick nearest city
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
    // Cinematic flyTo — the camera does a zoom-out arc over 2 seconds
    mapRef.current?.flyTo(selected.center, selected.zoom);
  }, []);

  const handleVenuePress = (venue: Venue, checkin: Checkin | null) => {
    setSelectedVenue(venue);
    setSelectedCheckin(checkin);
  };

  const handleMapPress = () => {
    setSelectedVenue(null);
    setSelectedCheckin(null);
    if (cityOpen) setCityOpen(false);
  };

  return (
    <View style={styles.container}>
      <RoamMap
        ref={mapRef}
        filter={filter}
        timeFilter={timeFilter}
        initialCenter={city.center}
        initialZoom={city.zoom}
        onVenuePress={handleVenuePress}
        onMapPress={handleMapPress}
      />
      <TopBar
        cities={cities}
        activeCity={city}
        isOpen={cityOpen}
        onToggle={handleCityToggle}
        onSelect={handleCitySelect}
      />
      <TimeToggle value={timeFilter} onChange={setTimeFilter} />
      <FilterBar value={filter} onChange={setFilter} />
      <SpotCard
        venue={selectedVenue}
        checkin={selectedCheckin}
        onClose={handleMapPress}
        onToast={setToastMsg}
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
});
