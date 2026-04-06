import React from "react";
import { MarkerView } from "@maplibre/maplibre-react-native";
import { BroadcastMarker } from "./BroadcastMarker";
import type { StatusBroadcast, Moment } from "../../types";

interface Props {
  broadcasts: StatusBroadcast[];
  moments: Moment[];
  currentUserId: string | null;
  selectedId: string | null;
  onMarkerPress: (item: { type: "broadcast"; data: StatusBroadcast } | { type: "moment"; data: Moment }) => void;
}

export const BroadcastMarkersLayer = React.memo(function BroadcastMarkersLayer({
  broadcasts,
  moments,
  currentUserId,
  selectedId,
  onMarkerPress,
}: Props) {
  return (
    <>
      {broadcasts.map((b) => {
        if (b.lat == null || b.lng == null) return null;

        const isMine = currentUserId != null && b.user_id === currentUserId;
        const lng = isMine ? b.lng : (b.fuzzy_lng ?? b.lng);
        const lat = isMine ? b.lat : (b.fuzzy_lat ?? b.lat);

        return (
          <MarkerView
            key={b.id}
            coordinate={[lng, lat]}
            anchor={{ x: 0.5, y: 0.5 }}
            allowOverlap
          >
            <BroadcastMarker
              statusType={b.status_type}
              isSelected={selectedId === b.id}
              onPress={() => onMarkerPress({ type: "broadcast", data: b })}
            />
          </MarkerView>
        );
      })}

      {moments.map((m) => (
        <MarkerView
          key={m.id}
          coordinate={[m.lng, m.lat]}
          anchor={{ x: 0.5, y: 0.5 }}
          allowOverlap
        >
          <BroadcastMarker
            statusType={m.status_type}
            isMoment
            isSelected={selectedId === m.id}
            onPress={() => onMarkerPress({ type: "moment", data: m })}
          />
        </MarkerView>
      ))}
    </>
  );
});
