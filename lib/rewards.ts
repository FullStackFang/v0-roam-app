import { supabase } from "./supabase";
import type { UserReward, AvatarConfig, MilestoneDef } from "../types";
import { MILESTONE_DEFS } from "../types";

// ── Queries ──────────────────────────────────────────────────

export async function fetchUserRewards(userId: string): Promise<UserReward[]> {
  const { data, error } = await supabase
    .from("user_rewards")
    .select("*")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchAvatarConfig(userId: string): Promise<AvatarConfig | null> {
  const { data, error } = await supabase
    .from("avatar_config")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function awardMilestone(
  userId: string,
  milestone: MilestoneDef
): Promise<UserReward | null> {
  const { data, error } = await supabase
    .from("user_rewards")
    .upsert(
      {
        user_id: userId,
        reward_key: milestone.key,
        reward_type: milestone.rewardType,
      },
      { onConflict: "user_id,reward_key" }
    )
    .select()
    .single();

  if (error) return null;

  // Auto-equip badge only if user has nothing equipped
  if (milestone.rewardType === "badge") {
    const { data: config } = await supabase
      .from("avatar_config")
      .select("equipped_badge")
      .eq("user_id", userId)
      .maybeSingle();

    if (!config?.equipped_badge) {
      await supabase
        .from("avatar_config")
        .upsert(
          { user_id: userId, equipped_badge: milestone.key },
          { onConflict: "user_id" }
        );
    }
  }

  return data;
}

export async function equipReward(
  userId: string,
  slot: "equipped_badge" | "equipped_accessory" | "equipped_border",
  rewardKey: string | null
): Promise<void> {
  const { error } = await supabase
    .from("avatar_config")
    .upsert(
      { user_id: userId, [slot]: rewardKey, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}

// ── Milestone Checks ─────────────────────────────────────────

const _earnedCache = new Set<string>();

/** Returns the milestone def if newly earned, null if already had it or not yet earned */
export async function checkPrometheus(userId: string): Promise<MilestoneDef | null> {
  const cacheKey = `${userId}:prometheus`;
  if (_earnedCache.has(cacheKey)) return null;

  const milestone = MILESTONE_DEFS.find((m) => m.key === "prometheus")!;

  const { data: existing } = await supabase
    .from("user_rewards")
    .select("id")
    .eq("user_id", userId)
    .eq("reward_key", "prometheus")
    .maybeSingle();

  if (existing) {
    _earnedCache.add(cacheKey);
    return null;
  }

  const { count } = await supabase
    .from("status_broadcasts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (count === 1) {
    await awardMilestone(userId, milestone);
    _earnedCache.add(cacheKey);
    return milestone;
  }

  return null;
}

/** Look up the badge emoji for a given reward_key */
export function getBadgeEmoji(rewardKey: string): string {
  return MILESTONE_DEFS.find((m) => m.key === rewardKey)?.emoji ?? "";
}
