import React, { useEffect, useRef } from "react";
import { Animated, Text, StyleSheet } from "react-native";
import { theme } from "../../constants/theme";

interface ToastProps {
  message: string | null;
  onHide: () => void;
}

export function Toast({ message, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (message) {
      // Spring entrance — feels physical, not robotic
      Animated.parallel([
        Animated.spring(opacity, {
          toValue: 1,
          ...theme.spring.gentle,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          ...theme.spring.gentle,
        }),
        Animated.spring(scale, {
          toValue: 1,
          ...theme.spring.gentle,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -8,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.95,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, 2600);

      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 118,
    alignSelf: "center",
    zIndex: 50,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 20,
    // Tinted shadow
    shadowColor: "#1A1B1E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  text: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 13,
    color: theme.text,
  },
});
