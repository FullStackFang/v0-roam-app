import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../../constants/theme";
import { FeedList } from "../../components/feed/FeedList";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const dayName = DAYS[new Date().getDay()];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feed</Text>
          <Text style={styles.subtitle}>{dayName}</Text>
        </View>
      </View>

      <FeedList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  title: {
    fontFamily: theme.fonts.headingHeavy,
    fontSize: 32,
    color: theme.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
    marginTop: 1,
  },
});
