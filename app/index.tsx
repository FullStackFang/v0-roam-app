import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { RoamMap } from "../components/map/RoamMap";
import { TopBar } from "../components/map/TopBar";
import { TimeToggle } from "../components/map/TimeToggle";
import { FilterBar } from "../components/map/FilterBar";
import { SpotCard } from "../components/map/SpotCard";
import { Toast } from "../components/ui/Toast";
import { theme } from "../constants/theme";
import type { Venue, Checkin, FilterCategory, TimeFilter } from "../types";

export default function MapScreen() {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("tonight");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedCheckin, setSelectedCheckin] = useState<Checkin | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleVenuePress = (venue: Venue, checkin: Checkin | null) => {
    setSelectedVenue(venue);
    setSelectedCheckin(checkin);
  };

  const handleMapPress = () => {
    setSelectedVenue(null);
    setSelectedCheckin(null);
  };

  return (
    <View style={styles.container}>
      <RoamMap
        filter={filter}
        timeFilter={timeFilter}
        onVenuePress={handleVenuePress}
        onMapPress={handleMapPress}
      />
      <TopBar />
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
