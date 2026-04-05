/**
 * Format remaining time until expiry as a human-readable string.
 *
 * "long" (default): "42 min left" / "1h 15m left"
 * "short":          "42m"         / "1h 15m"
 */
export function formatTimeLeft(
  expiresAt: string,
  format: "long" | "short" = "long"
): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return format === "short" ? "0m" : "0 min left";

  const min = format === "short" ? Math.ceil(ms / 60000) : Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;

  if (format === "short") {
    return min < 60 ? `${min}m` : `${h}h ${m}m`;
  }
  return min < 60 ? `${min} min left` : `${h}h ${m}m left`;
}
