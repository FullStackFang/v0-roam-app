import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("joins", {
      name: "Joins",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("nearby", {
      name: "Nearby Activity",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
    });
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.LOW,
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "8158c149-2eeb-4d18-9142-6e115928dff3",
  });
  const token = tokenData.data;

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("profiles")
      .update({ push_token: token })
      .eq("id", user.id);
  }

  return token;
}

export async function updateLastKnownLocation(lat: number, lng: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ last_known_lat: lat, last_known_lng: lng })
    .eq("id", user.id);
}

export async function scheduleLiveReminder(broadcastId: string): Promise<string | undefined> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Still live!",
      body: "You've been broadcasting for 30 minutes",
      data: { type: "live_reminder", broadcast_id: broadcastId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 30 * 60,
    },
  });
  return id;
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
