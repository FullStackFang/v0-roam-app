import { Wine, Coffee, Footprints, Sparkles, Utensils, MessageCircle } from "lucide-react-native";
import type { StatusType } from "../types";
import type { ElementType } from "react";

export const STATUS_ICONS: Partial<Record<StatusType, ElementType>> = {
  up_for_drinks: Wine,
  up_for_dinner: Utensils,
  grabbing_coffee: Coffee,
  walk: Footprints,
  open: Sparkles,
  custom: MessageCircle,
};
