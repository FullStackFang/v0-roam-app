import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { MarkerView } from "@maplibre/maplibre-react-native";
import { theme, avatarColor } from "../../constants/theme";
import type { Moment } from "../../types";

interface MomentClusterMarkerProps {
  moment: Moment;
  onPress: (moment: Moment) => void;
}

export function MomentClusterMarker({ moment, onPress }: MomentClusterMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const shown = moment.all_profiles.slice(0, 3);

  return (
    <MarkerView
      coordinate={[moment.lng, moment.lat]}
      anchor={{ x: 0.5, y: 0.5 }}
      allowOverlap
    >
      <View style={styles.wrap} onTouchEnd={() => onPress(moment)}>
        {/* Pulse ring */}
        <Animated.View
          style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]}
        />

        {/* Overlapping avatars */}
        <View style={styles.avatarGroup}>
          {shown.map((p, i) => (
            <View
              key={p.id}
              style={[
                styles.avatar,
                {
                  backgroundColor: avatarColor(p.id),
                  marginLeft: i > 0 ? -8 : 0,
                  zIndex: shown.length - i,
                },
              ]}
            >
              <Text style={styles.avatarText}>
                {p.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
        </View>

        {/* Count badge */}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{moment.participant_count}</Text>
        </View>
      </View>
    </MarkerView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(224,138,60,0.12)",
    borderWidth: 1,
    borderColor: "rgba(224,138,60,0.25)",
  },
  avatarGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
  },
  countBadge: {
    position: "absolute",
    top: 2,
    right: 6,
    backgroundColor: theme.warm,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  countText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },
});
