import type { Confidence, Gcc, HeadcountBand } from "./types";

const CONF_RANK: Record<Confidence, number> = { Low: 1, Medium: 2, High: 3 };
const RANK_CONF: Confidence[] = ["Low", "Low", "Medium", "High"];

export const BAND_RANK: Record<HeadcountBand, number> = { "<1k": 1, "1k–5k": 2, "5k–10k": 3, "10k+": 4 };

/** A record is only as trustworthy as its weakest field. */
export function overallConfidence(g: Gcc): Confidence {
  if (g.origin === "community") return g.reviewStatus === "Published" ? "Medium" : "Low";
  const min = Math.min(...Object.values(g.prov).map(([, c]) => CONF_RANK[c]));
  return RANK_CONF[min];
}

export const confRank = (c: Confidence) => CONF_RANK[c];

export function isPending(g: Gcc): boolean {
  return g.origin === "community" && g.reviewStatus !== "Published";
}
