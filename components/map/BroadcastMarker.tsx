import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing, StyleSheet } from "react-native";
import { MarkerView } from "@maplibre/maplibre-react-native";
import { theme, avatarColor } from "../../constants/theme";
import type { StatusBroadcast } from "../../types";

interface BroadcastMarkerProps {
  broadcast: StatusBroadcast;
  onPress: (broadcast: StatusBroadcast) => void;
}

export function BroadcastMarker({ broadcast, onPress }: BroadcastMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isAvailableNow = broadcast.duration === "1h";

  useEffect(() => {
    if (!isAvailableNow) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [isAvailableNow]);

  const initial = broadcast.profile?.display_name?.charAt(0).toUpperCase() ?? "?";
  const bgColor = avatarColor(broadcast.user_id);

  return (
    <MarkerView
      coordinate={[broadcast.lng!, broadcast.lat!]}
      anchor={{ x: 0.5, y: 0.5 }}
      allowOverlap
    >
      <View style={styles.wrap} onTouchEnd={() => onPress(broadcast)}>
        {/* Pulse ring — only for "available now" */}
        {isAvailableNow && (
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
        )}

        {/* Avatar circle */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: bgColor },
            !isAvailableNow && styles.avatarPassive,
          ]}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>
    </MarkerView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accentFill,
    borderWidth: 1,
    borderColor: theme.accentBorder,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
  },
  avatarPassive: {
    opacity: 0.6,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
});
