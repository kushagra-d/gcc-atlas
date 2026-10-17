import type { BadgeLevel, Provider, Review } from "./types";

/**
 * Atlas Score is computed from delivery evidence only. Payment never enters the
 * formula; sponsored placement (if ever offered) is disclosed separately.
 */
export const SCORE_WEIGHTS = [
  { key: "badge", label: "Verification level", weight: 40 },
  { key: "speed", label: "Time to Day 1", weight: 25 },
  { key: "rating", label: "Peer rating", weight: 25 },
  { key: "volume", label: "Review volume", weight: 10 },
] as const;

const BADGE_POINTS: Record<BadgeLevel, number> = {
  Claimed: 0.25,
  Evidenced: 0.65,
  "Client-verified": 1,
};

export function avgRating(reviews: Review[]): number | null {
  const live = reviews.filter((r) => !r.pending);
  if (!live.length) return null;
  return live.reduce((s, r) => s + r.rating, 0) / live.length;
}

export function scoreParts(p: Provider) {
  const rating = avgRating(p.reviews);
  const speed = Math.min(1, Math.max(0, (120 - p.daysToDay1) / 90)); // 30d → 1, 120d → 0
  return {
    badge: BADGE_POINTS[p.badge],
    speed,
    rating: rating === null ? 0.5 : rating / 5, // neutral prior when unreviewed
    volume: Math.min(1, p.reviews.filter((r) => !r.pending).length / 4),
  };
}

export function atlasScore(p: Provider): number {
  const parts = scoreParts(p);
  const total = SCORE_WEIGHTS.reduce((s, w) => s + parts[w.key] * w.weight, 0);
  return Math.round(total);
}
