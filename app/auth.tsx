import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";
import { theme } from "../constants/theme";

const redirectUrl = Linking.createURL("auth");

function AnimatedButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, theme.spring.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, theme.spring.bouncy);
  }, []);

  return (
    <Animated.View
      style={[
        styles.button,
        disabled && { opacity: 0.55 },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={styles.buttonInner}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleAuth = async () => {
    if (!email.endsWith("@cornell.edu")) {
      Alert.alert(
        "Cornell Only",
        "Bonfire is currently available to Cornell students only. Please use your @cornell.edu email."
      );
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        Alert.alert(
          "Check your email",
          "We sent a confirmation link to your Cornell email."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Brand mark */}
        <View style={styles.brandBlock}>
          <Text style={styles.logo}>bonfire</Text>
          <Text style={styles.tagline}>
            See who's out. Join in.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              placeholder="netid@cornell.edu"
              placeholderTextColor={theme.muted}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={[styles.input, passwordFocused && styles.inputFocused]}
              placeholder="Password"
              placeholderTextColor={theme.muted}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry
            />
          </View>

          <AnimatedButton
            label={isSignUp ? "Create Account" : "Sign In"}
            onPress={handleAuth}
            disabled={loading}
          />

          <Pressable onPress={() => setIsSignUp(!isSignUp)}>
            <Text style={styles.switchText}>
              {isSignUp
                ? "Already have an account? Sign in"
                : "New to Bonfire? Create account"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>
          Currently available at Cornell University
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  brandBlock: {
    marginBottom: 56,
  },
  logo: {
    fontFamily: theme.fonts.headingBlack,
    fontSize: 48,
    color: theme.text,
    letterSpacing: -1.2,
    marginBottom: 10,
  },
  tagline: {
    fontFamily: theme.fonts.sans,
    fontSize: 16,
    color: theme.muted,
    lineHeight: 24,
  },
  form: {
    gap: 18,
  },
  inputLabel: {
    fontFamily: theme.fonts.sansMedium,
    fontSize: 12,
    color: theme.muted,
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  input: {
    fontFamily: theme.fonts.sans,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: theme.radius.md,
    borderCurve: "continuous",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: theme.text,
  } as any,
  inputFocused: {
    borderColor: theme.accent,
    boxShadow: "0px 0px 0px 3px rgba(255,87,51,0.10), 0px 1px 3px rgba(26,27,30,0.04)",
  } as any,
  button: {
    backgroundColor: theme.accent,
    borderRadius: theme.radius.full,
    borderCurve: "continuous",
    marginTop: 6,
    overflow: "hidden",
    boxShadow: theme.shadow.fab,
  } as any,
  buttonInner: {
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: theme.fonts.sansSemiBold,
    color: "#fff",
    fontSize: 15,
  },
  switchText: {
    fontFamily: theme.fonts.sans,
    fontSize: 13,
    color: theme.muted,
    textAlign: "center",
    marginTop: 2,
  },
  footer: {
    fontFamily: theme.fonts.sans,
    fontSize: 11,
    color: theme.muted,
    textAlign: "center",
    position: "absolute",
    bottom: 48,
    left: 32,
    right: 32,
    letterSpacing: 0.2,
  },
});
