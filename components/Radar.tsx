"use client";

import { useMemo, useState } from "react";
import {
  BellPlus,
  BellRing,
  Briefcase,
  Building,
  CalendarClock,
  FileCheck2,
  Handshake,
  Landmark,
  MapPin,
  Megaphone,
  Radar as RadarIcon,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { ENTRANTS, SIGNAL_TYPES, SIGNAL_WEIGHTS, WINDOWS, scoreEntrant } from "@/lib/data/radar";
import { type LeadStatus, useAtlas } from "@/lib/store";
import { CITY_STATE, cn, fmtDate } from "@/lib/utils";
import type { Navigate } from "@/lib/nav";
import type { Entrant, SignalType, StateName } from "@/lib/types";
import { Button, Card, ConfidenceTag, Drawer, EmptyState, Pill, Segmented, ScoreRing, SourceTag } from "./ui";

const SIGNAL_ICON: Record<SignalType, LucideIcon> = {
  "MCA incorporation": Landmark,
  "India-head hire": UserPlus,
  "Job-post spike": Briefcase,
  "SEZ/STPI approval": FileCheck2,
  "State MoU": Handshake,
  "Real-estate LOI": Building,
  Press: Megaphone,
};

type Role = "entrant" | "provider" | "state";

const ROLES: { value: Role; label: string; blurb: string }[] = [
  { value: "entrant", label: "Entrant", blurb: "See who is arriving in your city and follow the pipeline." },
  { value: "provider", label: "Broker / recruiter", blurb: "Read the signal evidence, claim the lead, log the outcome." },
  { value: "state", label: "State agency", blurb: "Watch the pipeline of likely entrants and compare policy against peer states." },
];

const LEAD_STYLE: Record<LeadStatus, "neutral" | "info" | "ok" | "bad"> = { New: "neutral", Claimed: "info", Won: "ok", Lost: "bad" };

export default function Radar({ onNavigate }: { onNavigate: Navigate }) {
  const { leads, alerts } = useAtlas();
  const [role, setRole] = useState<Role>("provider");
  const [windows, setWindows] = useState<string[]>([]);
  const [signals, setSignals] = useState<SignalType[]>([]);
  const [city, setCity] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const scored = useMemo(() => ENTRANTS.map((e) => ({ e, score: scoreEntrant(e) })), []);
  const cities = useMemo(() => Array.from(new Set(ENTRANTS.map((e) => e.likelyCity))).sort(), []);

  const rows = useMemo(
    () =>
      scored
        .filter(({ e, score }) => {
          if (windows.length && !windows.includes(e.window)) return false;
          if (signals.length && !e.signals.some((s) => signals.includes(s.type))) return false;
          if (city && e.likelyCity !== city) return false;
          return score >= minScore;
        })
        .sort((a, b) => b.score - a.score),
    [scored, windows, signals, city, minScore],
  );

  const byState = useMemo(() => {
    const m = new Map<string, number>();
    scored.forEach(({ e }) => {
      const st = CITY_STATE[e.likelyCity] ?? "Other";
      m.set(st, (m.get(st) ?? 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [scored]);

  const selected = scored.find((x) => x.e.id === selectedId) ?? null;
  const maxState = Math.max(...byState.map(([, n]) => n));
  const roleMeta = ROLES.find((r) => r.value === role)!;
  const claimed = Object.values(leads).filter((s) => s === "Claimed").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-brand/25 bg-brand-soft p-4">
        <div className="flex items-start gap-3">
          <RadarIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-ink">Simulated feed · Radar v1 (rules-based)</p>
            <p className="mt-0.5 max-w-2xl text-[13px] text-muted">
              Every entrant here is fictional. Atlas scores each one from public signals: weighted by signal type, and discounted by evidence confidence. ML scoring arrives in Radar v2.
            </p>
          </div>
        </div>
        <Segmented label="View Radar as" value={role} onChange={setRole} options={ROLES.map((r) => ({ value: r.value, label: r.label }))} />
      </div>
      <p className="-mt-2 text-[13px] text-muted">
        <span className="font-medium text-ink">{roleMeta.label} view:</span> {roleMeta.blurb}
      </p>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[12px] font-medium text-muted">Entry window</span>
                {WINDOWS.map((w) => (
                  <Chip key={w} on={windows.includes(w)} onClick={() => setWindows((l) => (l.includes(w) ? l.filter((x) => x !== w) : [...l, w]))}>
                    {w}
                  </Chip>
                ))}
              </div>
              <label className="flex items-center gap-2 text-[13px] text-muted">
                Likely city
                <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-ink outline-none focus:border-brand">
                  <option value="">All</option>
                  {cities.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-[13px] text-muted">
                Min score <span className="tnum w-6 text-ink">{minScore}</span>
                <input type="range" min={0} max={90} step={5} value={minScore} onChange={(e) => setMinScore(Number(e.target.value))} aria-label="Minimum radar score" className="w-28 accent-[var(--brand-strong)]" />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] font-medium text-muted">Signal</span>
              {SIGNAL_TYPES.map((s) => {
                const Icon = SIGNAL_ICON[s];
                return (
                  <Chip key={s} on={signals.includes(s)} onClick={() => setSignals((l) => (l.includes(s) ? l.filter((x) => x !== s) : [...l, s]))}>
                    <Icon className="size-3" aria-hidden /> {s}
                  </Chip>
                );
              })}
            </div>
          </Card>

          <p className="text-[13px] text-muted" aria-live="polite">
            <span className="tnum font-medium text-ink">{rows.length}</span> likely entrants · {alerts.length} alert{alerts.length === 1 ? "" : "s"} set
            {role === "provider" && ` · ${claimed} lead${claimed === 1 ? "" : "s"} claimed`}
          </p>

          {rows.length === 0 ? (
            <EmptyState
              title="No entrants match"
              body="Lower the minimum score or clear a signal filter."
              action={
                <Button
                  onClick={() => {
                    setWindows([]);
                    setSignals([]);
                    setCity("");
                    setMinScore(0);
                  }}
                >
                  Reset filters
                </Button>
              }
            />
          ) : (
            <ul className="space-y-3">
              {rows.map(({ e, score }) => (
                <li key={e.id}>
                  <EntrantRow e={e} score={score} role={role} lead={leads[e.id]} alerted={alerts.includes(e.id)} onOpen={() => setSelectedId(e.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-ink">{role === "state" ? "Pipeline by state" : "Where entrants are heading"}</h3>
            <ul className="mt-3 space-y-2.5">
              {byState.map(([st, n]) => (
                <li key={st}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="text-ink">{st}</span>
                    <span className="tnum text-muted">{n}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-brand-strong transition-all" style={{ width: `${(n / maxState) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            {role === "state" && (
              <Button className="mt-4 w-full" onClick={() => onNavigate("incentives")}>
                Compare your policy against peers
              </Button>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-ink">How the score works</h3>
            <p className="mt-1 text-[12px] text-muted">Sum of signal weights × evidence confidence (High 1.0, Medium 0.8, Low 0.5), capped at 98.</p>
            <ul className="mt-3 space-y-1.5">
              {SIGNAL_TYPES.map((s) => {
                const Icon = SIGNAL_ICON[s];
                return (
                  <li key={s} className="flex items-center justify-between text-[12px]">
                    <span className="flex items-center gap-2 text-muted">
                      <Icon className="size-3.5" aria-hidden /> {s}
                    </span>
                    <span className="tnum text-ink">+{SIGNAL_WEIGHTS[s]}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>

      <EntrantDrawer item={selected} role={role} onClose={() => setSelectedId(null)} onNavigate={onNavigate} />
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
        on ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

function EntrantRow({ e, score, role, lead, alerted, onOpen }: { e: Entrant; score: number; role: Role; lead?: LeadStatus; alerted: boolean; onOpen: () => void }) {
  const types = Array.from(new Set(e.signals.map((s) => s.type)));
  return (
    <Card className="transition-colors hover:border-line-strong">
      <button onClick={onOpen} className="flex w-full items-start gap-4 p-4 text-left">
        <ScoreRing value={score} size={52} label="Radar score" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-ink">{e.name}</p>
            <Pill tone="neutral">{e.hq}</Pill>
            <Pill tone="info">
              <CalendarClock className="size-3" aria-hidden /> {e.window}
            </Pill>
            {alerted && (
              <Pill tone="brand">
                <BellRing className="size-3" aria-hidden /> Alert on
              </Pill>
            )}
            {role === "provider" && lead && lead !== "New" && <Pill tone={LEAD_STYLE[lead]}>{lead}</Pill>}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-muted">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" aria-hidden /> {e.likelyCity}
            </span>
            <span>{e.sector}</span>
            <span className="tnum">{e.seatsEst} seats</span>
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {types.map((t) => {
              const Icon = SIGNAL_ICON[t];
              return (
                <span key={t} className="inline-flex items-center gap-1 rounded-md bg-surface-3 px-1.5 py-0.5 text-[11px] text-muted">
                  <Icon className="size-3" aria-hidden /> {t}
                </span>
              );
            })}
            <span className="tnum text-[11px] text-faint">{e.signals.length} signal{e.signals.length > 1 ? "s" : ""}</span>
          </div>
        </div>
      </button>
    </Card>
  );
}

function EntrantDrawer({ item, role, onClose, onNavigate }: { item: { e: Entrant; score: number } | null; role: Role; onClose: () => void; onNavigate: Navigate }) {
  const { leads, setLead, alerts, toggleAlert, toast, openSubmit } = useAtlas();
  if (!item) return null;
  const { e, score } = item;
  const lead = leads[e.id] ?? "New";
  const alerted = alerts.includes(e.id);
  const state = CITY_STATE[e.likelyCity];
  const sorted = [...e.signals].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Drawer
      open
      onClose={onClose}
      title={e.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-1.5">
          {e.hq} · {e.sector} <Pill tone="info">Entry {e.window}</Pill> <Pill>Fictional</Pill>
        </span>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              toggleAlert(e.id);
              toast(alerted ? "Alert removed." : `You will be alerted when ${e.name} shows a new signal.`);
            }}
          >
            {alerted ? <BellRing className="size-3.5" /> : <BellPlus className="size-3.5" />} {alerted ? "Alert on" : "Set alert"}
          </Button>
          <Button onClick={() => openSubmit({ type: "gcc" })}>Add a signal we missed</Button>
          {(state === "Karnataka" || state === "Telangana" || state === "Maharashtra" || state === "Tamil Nadu") && (
            <Button
              variant="ghost"
              onClick={() => {
                onClose();
                onNavigate("incentives", { state: state as StateName });
              }}
            >
              {state} incentives
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4 rounded-xl border border-line bg-surface-2 p-4">
          <ScoreRing value={score} size={64} label="Radar score" />
          <div className="text-[13px]">
            <p className="font-medium text-ink">Radar score {score}/100</p>
            <p className="mt-0.5 text-muted">
              Likely city <span className="text-ink">{e.likelyCity}</span> · {e.seatsEst} seats · {e.functions.join(", ")}
            </p>
          </div>
        </div>

        {role === "provider" && (
          <section aria-labelledby="lead" className="rounded-xl border border-line p-4">
            <h3 id="lead" className="text-sm font-semibold text-ink">Lead workflow</h3>
            <div className="mt-2 flex items-center gap-2 text-[13px] text-muted">
              Status <Pill tone={LEAD_STYLE[lead]}>{lead}</Pill>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {lead === "New" && (
                <Button
                  variant="primary"
                  onClick={() => {
                    setLead(e.id, "Claimed");
                    toast(`Lead claimed: ${e.name}. Other providers see it as taken for 14 days.`);
                  }}
                >
                  Claim lead
                </Button>
              )}
              {lead === "Claimed" && (
                <>
                  <Button onClick={() => setLead(e.id, "Won")}>Log outcome: won</Button>
                  <Button onClick={() => setLead(e.id, "Lost")}>Log outcome: lost</Button>
                  <Button variant="ghost" onClick={() => setLead(e.id, "New")}>Release</Button>
                </>
              )}
              {(lead === "Won" || lead === "Lost") && (
                <>
                  <p className="w-full text-[13px] text-muted">
                    {lead === "Won" ? "Logged. If the client confirms, this upgrades your Scorecard badge to Client-verified." : "Logged. Outcomes stay private to you."}
                  </p>
                  <Button variant="ghost" onClick={() => setLead(e.id, "Claimed")}>Reopen</Button>
                </>
              )}
            </div>
          </section>
        )}

        {role === "state" && state && (
          <section className="rounded-xl border border-line p-4 text-[13px] text-muted">
            <p className="font-medium text-ink">State view</p>
            <p className="mt-1">
              Likely landing in <span className="text-ink">{state}</span> in {e.window}. Use the incentive matrix to see how your policy compares against peers for a {e.seatsEst}-seat centre.
            </p>
          </section>
        )}

        <section aria-labelledby="evidence">
          <h3 id="evidence" className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-faint">
            Signal evidence ({sorted.length})
          </h3>
          <ol className="relative space-y-4 border-l border-line pl-5">
            {sorted.map((s, i) => {
              const Icon = SIGNAL_ICON[s.type];
              return (
                <li key={i} className="relative">
                  <span className="absolute -left-[27px] top-0.5 grid size-[18px] place-items-center rounded-full border border-line bg-surface text-brand">
                    <Icon className="size-2.5" aria-hidden />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{s.type}</p>
                    <span className="tnum text-[12px] text-faint">{fmtDate(s.date)}</span>
                    <span className="tnum text-[11px] text-muted">+{Math.round(SIGNAL_WEIGHTS[s.type] * (s.conf === "High" ? 1 : s.conf === "Medium" ? 0.8 : 0.5))} pts</span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{s.evidence}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <SourceTag id={s.src} />
                    <ConfidenceTag level={s.conf} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </Drawer>
  );
}
