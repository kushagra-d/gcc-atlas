"use client";

import { useMemo, useState } from "react";
import { Clock, MapPin, MessageSquarePlus, Search, ShieldCheck, ThumbsUp, Users } from "lucide-react";
import { BADGES, CATEGORIES } from "@/lib/data/providers";
import { CITIES } from "@/lib/data/gccs";
import { SCORE_WEIGHTS, atlasScore, avgRating, scoreParts } from "@/lib/score";
import { useAtlas } from "@/lib/store";
import { cn, fmtDate } from "@/lib/utils";
import type { BadgeLevel, Provider, ProviderCategory } from "@/lib/types";
import { BADGE_HINTS, Button, Card, DeliveryBadge, Drawer, EmptyState, Pill, ScoreRing, SourceTag, Stars } from "./ui";

type Sort = "score" | "speed" | "seats" | "rating";

export default function ProviderScorecard({ initialCity, initialCategory }: { initialCity?: string; initialCategory?: ProviderCategory }) {
  const { providers, openSubmit } = useAtlas();
  const [cat, setCat] = useState<"All" | ProviderCategory>(initialCategory ?? "All");
  const [badge, setBadge] = useState<"All" | BadgeLevel>("All");
  const [city, setCity] = useState(initialCity ?? "");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("score");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return providers
      .filter((p) => (cat === "All" || p.category === cat) && (badge === "All" || p.badge === badge) && (!city || p.cities.includes(city)) && (!needle || `${p.name} ${p.blurb}`.toLowerCase().includes(needle)))
      .map((p) => ({ p, score: atlasScore(p), rating: avgRating(p.reviews) }))
      .sort((a, b) => {
        switch (sort) {
          case "speed":
            return a.p.daysToDay1 - b.p.daysToDay1;
          case "seats":
            return b.p.seatsHired - a.p.seatsHired;
          case "rating":
            return (b.rating ?? 0) - (a.rating ?? 0);
          default:
            return b.score - a.score;
        }
      });
  }, [providers, cat, badge, city, q, sort]);

  const selected = providers.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      {/* Methodology */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <ShieldCheck className="size-4 text-ok" aria-hidden /> How delivery badges work
          </h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {BADGES.slice()
              .reverse()
              .map((b) => (
                <li key={b} className="space-y-1.5">
                  <DeliveryBadge level={b} />
                  <p className="text-[12px] text-muted">{BADGE_HINTS[b].hint}</p>
                </li>
              ))}
          </ul>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-ink">Neutrality commitment</h3>
          <p className="mt-2 text-[13px] text-muted">
            Rankings use delivery evidence only. Payment never changes a score, and any paid placement is labelled. Providers shown here are <span className="text-ink">synthetic profiles</span> for the prototype.
          </p>
        </Card>
      </div>

      {/* Controls */}
      <Card className="space-y-3 p-3 sm:p-4">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="Provider category">
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cat === c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                cat === c ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface-2 text-muted hover:text-ink",
              )}
            >
              {c}
              <span className="tnum ml-1.5 text-[11px] opacity-70">{c === "All" ? providers.length : providers.filter((p) => p.category === c).length}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search providers"
              aria-label="Search providers"
              className="w-full rounded-lg border border-line bg-surface-2 py-2 pl-9 pr-3 text-[13px] text-ink placeholder:text-faint outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            />
          </div>
          <Select label="Badge" value={badge} onChange={(v) => setBadge(v as typeof badge)} options={[["All", "All badges"], ...BADGES.map((b) => [b, b] as [string, string])]} />
          <Select label="City" value={city} onChange={setCity} options={[["", "All cities"], ...CITIES.map((c) => [c, c] as [string, string])]} />
          <Select
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            options={[
              ["score", "Atlas Score"],
              ["speed", "Fastest to Day 1"],
              ["seats", "Most seats hired"],
              ["rating", "Peer rating"],
            ]}
          />
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="No providers match"
          body="Try another category or city. Know a provider that should be listed? Tell us."
          action={
            <Button
              onClick={() => {
                setCat("All");
                setBadge("All");
                setCity("");
                setQ("");
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ p, score, rating }) => (
            <ProviderCard key={p.id} p={p} score={score} rating={rating} onOpen={() => setSelectedId(p.id)} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line-strong p-4">
        <p className="text-[13px] text-muted">Worked with a provider? Your feedback upgrades their badge and sharpens everyone's shortlist.</p>
        <Button variant="primary" onClick={() => openSubmit({ type: "feedback" })}>
          <MessageSquarePlus className="size-3.5" /> Add provider feedback
        </Button>
      </div>

      <ProviderDrawer p={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className="flex items-center gap-2 text-[13px] text-muted">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-ink outline-none focus:border-brand md:w-auto">
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProviderCard({ p, score, rating, onOpen }: { p: Provider; score: number; rating: number | null; onOpen: () => void }) {
  const { intros, requestIntro } = useAtlas();
  const asked = intros.includes(p.id);
  const live = p.reviews.filter((r) => !r.pending).length;
  return (
    <Card className="flex flex-col p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start gap-3">
        <ScoreRing value={score} label="Atlas Score" />
        <div className="min-w-0 flex-1">
          <button onClick={onOpen} className="block w-full text-left">
            <p className="truncate text-sm font-semibold text-ink hover:text-brand">{p.name}</p>
          </button>
          <p className="text-[12px] text-muted">
            {p.category} · {p.priceBand}
          </p>
        </div>
        <DeliveryBadge level={p.badge} className="shrink-0" />
      </div>
      <p className="mt-3 line-clamp-2 text-[13px] text-muted">{p.blurb}</p>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Metric label="Centres" value={p.centresSetUp} />
        <Metric label={p.seatsHired ? "Seats hired" : "Seats hired"} value={p.seatsHired ? p.seatsHired.toLocaleString() : "n/a"} />
        <Metric label="Days to Day 1" value={p.daysToDay1} />
      </dl>

      <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden /> {p.cities.slice(0, 3).join(", ")}
          {p.cities.length > 3 && ` +${p.cities.length - 3}`}
        </span>
        <span className="flex items-center gap-1.5">
          {rating !== null ? (
            <>
              <Stars value={rating} size={12} /> <span className="tnum text-ink">{rating.toFixed(1)}</span> <span className="text-faint">({live})</span>
            </>
          ) : (
            <span className="text-faint">No reviews yet</span>
          )}
        </span>
      </div>

      <div className="mt-auto flex gap-2 pt-4">
        <Button className="flex-1" onClick={onOpen}>
          Scorecard
        </Button>
        <Button className="flex-1" variant={asked ? "ghost" : "primary"} disabled={asked} onClick={() => requestIntro(p.id, p.name)}>
          {asked ? "Intro requested" : "Request intro"}
        </Button>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface-2 px-2 py-2">
      <dd className="tnum text-sm font-semibold text-ink">{value}</dd>
      <dt className="text-[10px] text-faint">{label}</dt>
    </div>
  );
}

function ProviderDrawer({ p, onClose }: { p: Provider | null; onClose: () => void }) {
  const { openSubmit, helpful, voteHelpful, intros, requestIntro } = useAtlas();
  if (!p) return null;
  const score = atlasScore(p);
  const parts = scoreParts(p);
  const rating = avgRating(p.reviews);
  const asked = intros.includes(p.id);

  return (
    <Drawer
      open
      onClose={onClose}
      title={p.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-1.5">
          {p.category} · est. {p.founded} · {p.priceBand} <DeliveryBadge level={p.badge} />
        </span>
      }
      footer={
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" disabled={asked} onClick={() => requestIntro(p.id, p.name)}>
            {asked ? "Intro requested" : "Request intro"}
          </Button>
          <Button
            onClick={() => {
              onClose();
              openSubmit({ type: "feedback", providerId: p.id });
            }}
          >
            <MessageSquarePlus className="size-3.5" /> Write a review
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-[13px] text-muted">{p.blurb}</p>

        <section className="flex items-center gap-4 rounded-xl border border-line bg-surface-2 p-4">
          <ScoreRing value={score} size={68} label="Atlas Score" />
          <div>
            <p className="text-sm font-medium text-ink">Atlas Score {score}/100</p>
            <p className="text-[12px] text-muted">Delivery evidence only. Payment is not an input.</p>
          </div>
        </section>

        <section aria-labelledby="breakdown">
          <h3 id="breakdown" className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-faint">Score breakdown</h3>
          <ul className="space-y-2.5">
            {SCORE_WEIGHTS.map((w) => {
              const v = parts[w.key];
              return (
                <li key={w.key}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="text-muted">{w.label} <span className="text-faint">· weight {w.weight}</span></span>
                    <span className="tnum text-ink">{(v * w.weight).toFixed(0)}/{w.weight}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-brand-strong" style={{ width: `${v * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="delivery">
          <h3 id="delivery" className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-faint">Delivery record</h3>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<Users className="size-3.5" />} label="Centres set up" value={String(p.centresSetUp)} />
            <Stat icon={<Users className="size-3.5" />} label="Seats hired" value={p.seatsHired ? p.seatsHired.toLocaleString() : "n/a"} />
            <Stat icon={<Clock className="size-3.5" />} label="Median days to Day 1" value={String(p.daysToDay1)} />
          </div>
          <p className="mt-2 text-[12px] text-faint">Cities: {p.cities.join(", ")}</p>
        </section>

        <section aria-labelledby="evidence">
          <h3 id="evidence" className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-faint">Evidence behind the badge</h3>
          <ul className="space-y-2">
            {p.evidence.map((e) => (
              <li key={e} className="flex items-start gap-2 text-[13px] text-ink">
                <ShieldCheck className={cn("mt-0.5 size-4 shrink-0", p.badge === "Claimed" ? "text-faint" : "text-ok")} aria-hidden />
                {e}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-1.5">
            <SourceTag id={p.badge === "Client-verified" ? "atlas" : p.badge === "Evidenced" ? "co" : "community"} />
          </div>
        </section>

        <section aria-labelledby="reviews">
          <div className="mb-2 flex items-center justify-between">
            <h3 id="reviews" className="text-[12px] font-semibold uppercase tracking-wide text-faint">Peer reviews ({p.reviews.length})</h3>
            {rating !== null && (
              <span className="flex items-center gap-1.5 text-[13px]">
                <Stars value={rating} size={14} /> <span className="tnum text-ink">{rating.toFixed(1)}</span>
              </span>
            )}
          </div>
          {p.reviews.length === 0 ? (
            <EmptyState title="No reviews yet" body="Be the first peer to review this provider." />
          ) : (
            <ul className="space-y-3">
              {p.reviews.map((r) => {
                const voted = helpful.includes(r.id);
                return (
                  <li key={r.id} className="rounded-xl border border-line p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Stars value={r.rating} size={13} />
                        {r.verified && <Pill tone="ok">Verified peer</Pill>}
                        {r.pending && <Pill tone="warn">Pending review</Pill>}
                      </div>
                      <span className="tnum text-[12px] text-faint">{fmtDate(r.date)}</span>
                    </div>
                    <p className="mt-2 text-[13px] text-ink">{r.text}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-[12px] text-muted">{r.author}</p>
                      <button
                        onClick={() => voteHelpful(r.id)}
                        aria-pressed={voted}
                        className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition-colors", voted ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-3")}
                      >
                        <ThumbsUp className="size-3.5" aria-hidden /> Helpful <span className="tnum">{r.helpful + (voted ? 1 : 0)}</span>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Drawer>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] text-faint">
        {icon} {label}
      </p>
      <p className="tnum mt-1 text-base font-semibold text-ink">{value}</p>
    </div>
  );
}
