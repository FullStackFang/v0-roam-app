import "react-native-url-polyfill/auto";
import "../global.css";
import React, { useEffect, useState, useRef } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from "@expo-google-fonts/nunito";
import {
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
} from "@expo-google-fonts/nunito-sans";
import { supabase } from "../lib/supabase";
import { registerForPushNotifications } from "../lib/notifications";
import { clearMomentsCache } from "../lib/queries";
import type { Session } from "@supabase/supabase-js";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const pushRegistered = useRef(false);
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      clearMomentsCache();
      if (session && !pushRegistered.current) {
        pushRegistered.current = true;
        registerForPushNotifications().catch(() => {});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!fontsLoaded || !authReady) return;

    const inAuthGroup = segments[0] === "auth";
    const inTabs = segments[0] === "(tabs)";

    if (!session && !inAuthGroup) {
      router.replace("/auth");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)/map");
    } else if (session && !inTabs) {
      router.replace("/(tabs)/map");
    }

    // Hide splash AFTER routing decision — no blank frame
    SplashScreen.hideAsync();
  }, [session, authReady, fontsLoaded, segments]);

  if (!fontsLoaded || !authReady) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" options={{ presentation: "modal" }} />
        <Stack.Screen name="auth" />
        <Stack.Screen name="index" />
      </Stack>
    </SafeAreaProvider>
  );
}
