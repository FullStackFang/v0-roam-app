import React from "react";
import { Text, StyleSheet } from "react-native";
import { theme } from "../../constants/theme";

interface BucketHeaderProps {
  title: string;
}

export function BucketHeader({ title }: BucketHeaderProps) {
  return <Text style={styles.header}>{title}</Text>;
}

const styles = StyleSheet.create({
  header: {
    fontFamily: theme.fonts.sansSemiBold,
    fontSize: 11,
    color: theme.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    paddingTop: 20,
    paddingBottom: 8,
  },
});
