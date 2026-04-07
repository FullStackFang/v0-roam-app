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
    fontFamily: theme.fonts.sansBold,
    fontSize: 12,
    color: theme.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingTop: 20,
    paddingBottom: 8,
    paddingHorizontal: 14,
    backgroundColor: theme.accentTint,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    alignSelf: "flex-start",
    overflow: "hidden",
  } as any,
});
