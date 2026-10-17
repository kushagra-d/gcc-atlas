"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, CircleHelp, Info, RotateCcw, SearchX } from "lucide-react";
import { CONFLICTS, MATRIX, STATES, STATE_META } from "@/lib/data/incentives";
import { DEFAULT_INPUTS, FX_INR_PER_USD, computeAll, fmtMoney, monthsUntil } from "@/lib/calc";
import type { CalcInputs, Line, StateResult } from "@/lib/calc";
import { cn, fmtDate } from "@/lib/utils";
import type { StateName } from "@/lib/types";
import { Button, Card, ConfidenceTag, Pill, SectionTitle, Segmented, SourceTag, Toggle } from "./ui";

export default function IncentiveMatrix({ focusState }: { focusState?: StateName }) {
  const [visible, setVisible] = useState<StateName[]>(STATES);
  const [onlyDiffs, setOnlyDiffs] = useState(false);
  const [focus, setFocus] = useState<StateName | undefined>(focusState);
  const [group, setGroup] = useState<"All" | (typeof MATRIX)[number]["group"]>("All");
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULT_INPUTS);
  const [usd, setUsd] = useState(false);

  const results = useMemo(() => computeAll(inputs), [inputs]);

  const cols = STATES.filter((s) => visible.includes(s));
  const groups = ["All", ...Array.from(new Set(MATRIX.map((r) => r.group)))] as const;

  const rows = MATRIX.filter((r) => group === "All" || r.group === group).filter((r) => {
    if (!onlyDiffs) return true;
    const texts = new Set(cols.map((s) => r.cells[s].text));
    return texts.size > 1;
  });

  function toggleState(s: StateName) {
    setVisible((v) => (v.includes(s) ? (v.length > 2 ? v.filter((x) => x !== s) : v) : STATES.filter((x) => v.includes(x) || x === s)));
  }

  return (
    <div className="space-y-8">
      {/* State header cards */}
      <section aria-label="State overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STATES.map((s) => {
          const m = STATE_META[s];
          const left = m.validUntil ? monthsUntil(m.validUntil) : null;
          const on = visible.includes(s);
          return (
            <Card
              key={s}
              className={cn("p-4 transition", focus === s && "border-brand ring-2 ring-brand-soft", !on && "opacity-50")}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{s}</h3>
                  <p className="mt-0.5 text-[12px] text-muted">{m.instrument}</p>
                </div>
                <Pill tone={m.status === "In force" ? "ok" : m.status === "Draft" ? "warn" : "info"}>{m.status}</Pill>
              </div>
              <p className="mt-3 text-[13px] text-ink">{m.tagline}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] text-faint">
                <CalendarClock className="size-3.5" aria-hidden /> Last verified {fmtDate(m.lastVerified)}
              </p>
              {left !== null && left <= 8 && (
                <p className="mt-2 flex items-start gap-1.5 rounded-md bg-warn-soft px-2 py-1.5 text-[12px] text-warn">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Window closes in about {left} months
                </p>
              )}
              <button
                onClick={() => toggleState(s)}
                aria-pressed={on}
                className="mt-3 text-[12px] font-medium text-brand hover:underline"
              >
                {on ? "Hide from comparison" : "Include in comparison"}
              </button>
            </Card>
          );
        })}
      </section>

      {/* Calculator */}
      <section aria-labelledby="calc-title" className="space-y-4">
        <SectionTitle
          title="Seat-count calculator"
          hint="Estimate what each state could return for your centre. Only rules found in reviewed sources are modelled; everything else is flagged."
          right={
            <div className="flex items-center gap-3">
              <Segmented label="Currency" value={usd ? "usd" : "inr"} onChange={(v) => setUsd(v === "usd")} options={[{ value: "inr", label: "₹ Cr" }, { value: "usd", label: "US$" }]} />
              <Button variant="ghost" size="sm" onClick={() => setInputs(DEFAULT_INPUTS)}>
                <RotateCcw className="size-3.5" /> Reset
              </Button>
            </div>
          }
        />
        <span id="calc-title" className="sr-only">Seat-count calculator</span>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="space-y-5 p-4 sm:p-5">
            <Slider
              label="Seats"
              value={inputs.seats}
              min={50}
              max={2000}
              step={50}
              onChange={(v) => setInputs({ ...inputs, seats: v })}
              display={`${inputs.seats.toLocaleString()} seats`}
              hint={inputs.seats < 200 ? "Under 200 seats: Tamil Nadu's scheme won't apply." : undefined}
            />
            <Slider label="Average CTC per seat" value={inputs.ctcLakh} min={8} max={60} step={1} onChange={(v) => setInputs({ ...inputs, ctcLakh: v })} display={`₹${inputs.ctcLakh} lakh`} />
            <Slider label="Fixed capex per seat" value={inputs.capexPerSeatLakh} min={2} max={15} step={0.5} onChange={(v) => setInputs({ ...inputs, capexPerSeatLakh: v })} display={`₹${inputs.capexPerSeatLakh} lakh`} />
            <Slider label="Innovation-lab capex" value={inputs.labCapexCr} min={0} max={20} step={1} onChange={(v) => setInputs({ ...inputs, labCapexCr: v })} display={`₹${inputs.labCapexCr} Cr`} />
            <Slider label="Stamp duty payable" value={inputs.stampDutyCr} min={0} max={10} step={0.2} onChange={(v) => setInputs({ ...inputs, stampDutyCr: v })} display={`₹${inputs.stampDutyCr.toFixed(1)} Cr`} hint="On your lease or purchase, before any waiver." />

            <div>
              <p className="mb-1.5 text-[12px] font-medium text-muted">Location</p>
              <Segmented
                label="Location"
                className="w-full [&>button]:flex-1"
                value={inputs.location}
                onChange={(v) => setInputs({ ...inputs, location: v })}
                options={[{ value: "metro", label: "Metro hub" }, { value: "beyond", label: "Beyond metro" }]}
              />
            </div>
            <div>
              <label htmlFor="premises" className="mb-1.5 block text-[12px] font-medium text-muted">Premises (affects Maharashtra stamp duty)</label>
              <select
                id="premises"
                value={inputs.premises}
                onChange={(e) => setInputs({ ...inputs, premises: e.target.value as CalcInputs["premises"] })}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px] text-ink outline-none focus:border-brand"
              >
                <option value="sez">SEZ / STPI unit</option>
                <option value="public">Public IT park</option>
                <option value="private">Private IT park</option>
                <option value="other">Other commercial</option>
              </select>
            </div>
            <Slider label="Hires domiciled in the state" value={inputs.domiciledShare} min={0} max={100} step={5} onChange={(v) => setInputs({ ...inputs, domiciledShare: v })} display={`${inputs.domiciledShare}%`} hint="Tamil Nadu payroll subsidy only." />
            <Slider label="Roles at ₹1 lakh/month or more" value={inputs.seniorShare} min={0} max={100} step={5} onChange={(v) => setInputs({ ...inputs, seniorShare: v })} display={`${inputs.seniorShare}%`} hint="Tamil Nadu payroll subsidy only." />
            <Slider label="Skilling spend per head" value={inputs.skillCostPerHead} min={10000} max={100000} step={5000} onChange={(v) => setInputs({ ...inputs, skillCostPerHead: v })} display={`₹${inputs.skillCostPerHead.toLocaleString()}`} />
            <Toggle checked={inputs.fortuneParent} onChange={(v) => setInputs({ ...inputs, fortuneParent: v })} label="Parent is Fortune 1000 / Forbes Global 2000" />
          </Card>

          <div className="space-y-4">
            <ResultBars results={results} visible={cols} usd={usd} />
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2">
              {cols.map((s) => (
                <StateBreakdown key={s} r={results[s]} usd={usd} />
              ))}
            </div>
            <p className="flex items-start gap-2 text-[12px] text-faint">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Indicative model from public summaries, not legal or tax advice. US$ uses an assumed ₹{FX_INR_PER_USD}/US$. Confirm every rate against the notified government order before budgeting.
            </p>
          </div>
        </div>
      </section>

      {/* Matrix */}
      <section aria-labelledby="matrix-title" className="space-y-4">
        <SectionTitle
          title="Policy comparison"
          hint="Every cell is source-tagged. 'Not found' means the reviewed sources are silent, not that the incentive is absent."
          right={
            <div className="flex flex-wrap items-center gap-3">
              <Toggle checked={onlyDiffs} onChange={setOnlyDiffs} label="Only rows that differ" />
            </div>
          }
        />
        <span id="matrix-title" className="sr-only">Policy comparison</span>
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="Matrix group">
          {groups.map((g) => (
            <button
              key={g}
              role="tab"
              aria-selected={group === g}
              onClick={() => setGroup(g)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                group === g ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface-2 text-muted hover:text-ink",
              )}
            >
              {g}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <SearchX className="size-6 text-faint" aria-hidden />
            <p className="text-sm font-medium text-ink">No differing rows in this group</p>
            <p className="text-[13px] text-muted">Switch off "Only rows that differ" or pick another group.</p>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 180 + cols.length * 260 }}>
                <thead>
                  <tr className="border-b border-line bg-surface-2">
                    <th className="sticky left-0 z-10 w-44 bg-surface-2 px-4 py-3 text-[11px] font-medium uppercase tracking-wide text-faint">Dimension</th>
                    {cols.map((s) => (
                      <th key={s} className="px-4 py-3">
                        <button onClick={() => setFocus(focus === s ? undefined : s)} className={cn("text-sm font-semibold hover:text-brand", focus === s ? "text-brand" : "text-ink")}>
                          {s}
                        </button>
                        <p className="text-[11px] font-normal text-faint">{STATE_META[s].instrument}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id} className="align-top">
                      <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-3.5 text-[13px] font-medium text-ink">
                        {r.label}
                        <span className="mt-0.5 block text-[11px] font-normal text-faint">{r.group}</span>
                      </th>
                      {cols.map((s) => {
                        const cell = r.cells[s];
                        const missing = cell.src === "none";
                        return (
                          <td key={s} className={cn("px-4 py-3.5", focus === s && "bg-brand-soft/40")}>
                            <p className={cn("text-[13px] leading-relaxed", missing ? "flex items-start gap-1.5 text-faint" : "text-ink")}>
                              {missing && <CircleHelp className="mt-0.5 size-3.5 shrink-0" aria-hidden />}
                              {cell.text}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <ConfidenceTag level={cell.conf} />
                              {!missing && <SourceTag id={cell.src} />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      {/* Conflicts */}
      <section aria-labelledby="conf-title" className="space-y-4">
        <SectionTitle title="Where sources disagree" hint="Atlas surfaces conflicts rather than silently picking a number." />
        <span id="conf-title" className="sr-only">Where sources disagree</span>
        <div className="grid gap-3 md:grid-cols-2">
          {CONFLICTS.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-warn" aria-hidden />
                <h3 className="text-sm font-semibold text-ink">{c.title}</h3>
                <Pill>{c.state}</Pill>
              </div>
              <p className="mt-2 text-[13px] text-muted">{c.detail}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.sources.map((id) => (
                  <SourceTag key={id} id={id} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, display, hint }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; display: string; hint?: string }) {
  const id = `s-${label.replace(/\W+/g, "-")}`;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="text-[12px] font-medium text-muted">{label}</label>
        <output htmlFor={id} className="tnum text-[13px] font-medium text-ink">{display}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--brand-strong)]" />
      {hint && <p className="mt-0.5 text-[11px] text-faint">{hint}</p>}
    </div>
  );
}

function ResultBars({ results, visible, usd }: { results: Record<StateName, StateResult>; visible: StateName[]; usd: boolean }) {
  const max = Math.max(0.0001, ...visible.map((s) => results[s].y3));
  const best = visible.reduce((a, b) => (results[b].y3 > results[a].y3 ? b : a), visible[0]);
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Modelled incentive value</h3>
        <span className="text-[12px] text-muted">Year 1 and 3-year total</span>
      </div>
      <ul className="mt-4 space-y-4">
        {visible.map((s) => {
          const r = results[s];
          const pct1 = (r.y1 / max) * 100;
          const pct3 = (r.y3 / max) * 100;
          const low = r.minConf === "Low";
          return (
            <li key={s}>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-medium text-ink">
                  {s}
                  {s === best && r.y3 > 0 && <Pill tone="ok">Highest</Pill>}
                  <ConfidenceTag level={r.minConf} />
                </span>
                <span className="tnum text-[13px] text-ink">
                  {fmtMoney(r.y3, usd)} <span className="text-faint">3-yr</span>
                </span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-surface-3" role="img" aria-label={`${s}: ${fmtMoney(r.y1, usd)} in year one, ${fmtMoney(r.y3, usd)} over three years`}>
                <div className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", low ? "bg-brand/35" : "bg-brand/40")} style={{ width: `${pct3}%` }} />
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-500", low ? "bg-[repeating-linear-gradient(45deg,var(--brand-strong),var(--brand-strong)_4px,transparent_4px,transparent_8px)]" : "bg-brand-strong")}
                  style={{ width: `${pct1}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-faint">Year 1: {fmtMoney(r.y1, usd)}{low && " · striped = Low-confidence inputs"}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

const STATUS_ICON: Record<Line["status"], React.ReactNode> = {
  modelled: <CheckCircle2 className="size-3.5 text-ok" aria-label="Modelled" />,
  unquantified: <CircleHelp className="size-3.5 text-warn" aria-label="Unquantified" />,
  not_found: <SearchX className="size-3.5 text-faint" aria-label="Not found" />,
  ineligible: <AlertTriangle className="size-3.5 text-bad" aria-label="Not eligible" />,
};

function StateBreakdown({ r, usd }: { r: StateResult; usd: boolean }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">{r.state}</h3>
        <span className="tnum text-[13px] font-medium text-ink">{fmtMoney(r.y3, usd)}</span>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {r.lines.map((l) => (
          <li key={l.label} className="py-2.5">
            <div className="flex items-start justify-between gap-3">
              <span className="flex items-start gap-2 text-[13px] text-ink">
                <span className="mt-0.5">{STATUS_ICON[l.status]}</span>
                {l.label}
              </span>
              <span className="tnum shrink-0 text-[13px] text-ink">
                {l.status === "modelled" ? fmtMoney(l.years[0] + l.years[1] + l.years[2], usd) : l.status === "unquantified" ? "n/q" : l.status === "not_found" ? "n/f" : "n/a"}
              </span>
            </div>
            <p className="ml-[22px] mt-0.5 text-[12px] text-muted">{l.note}</p>
            {l.status === "modelled" && (
              <div className="ml-[22px] mt-1.5 flex flex-wrap items-center gap-1.5">
                <ConfidenceTag level={l.conf} />
                <SourceTag id={l.src} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {r.warnings.map((w) => (
        <p key={w} className="mt-2 flex items-start gap-1.5 rounded-md bg-warn-soft px-2 py-1.5 text-[12px] text-warn">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {w}
        </p>
      ))}
      <p className="mt-2 text-[11px] text-faint">n/q = available but unquantified · n/f = not found · n/a = not eligible</p>
    </Card>
  );
}
