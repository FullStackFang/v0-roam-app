import * as Haptics from "expo-haptics";

export function selectionAsync() {
  try {
    Haptics.selectionAsync();
  } catch {}
}

export function impactAsync(style: Haptics.ImpactFeedbackStyle) {
  try {
    Haptics.impactAsync(style);
  } catch {}
}

export function notificationAsync(type: Haptics.NotificationFeedbackType) {
  try {
    Haptics.notificationAsync(type);
  } catch {}
}

export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;
