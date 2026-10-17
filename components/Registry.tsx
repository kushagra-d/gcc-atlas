"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  Building2,
  Download,
  Filter,
  LayoutGrid,
  MapPin,
  Rows3,
  Search,
  SlidersHorizontal,
  Star,
  TriangleAlert,
  Users,
  X,
} from "lucide-react";
import { BANDS, CITIES, FUNCTIONS, SECTORS } from "@/lib/data/gccs";
import { BAND_RANK, confRank, isPending, overallConfidence } from "@/lib/gcc";
import { useAtlas } from "@/lib/store";
import { CITY_STATE, cn, downloadCsv, fmtDate } from "@/lib/utils";
import type { Navigate } from "@/lib/nav";
import type { Gcc, HeadcountBand, StateName } from "@/lib/types";
import { Button, Card, ConfidenceTag, Drawer, EmptyState, Pill, Segmented, SourceTag } from "./ui";

type Sort = "scale" | "name" | "fresh" | "confidence";

const STATS = [
  { label: "GCCs in India", value: "2,117", note: "centres, FY26" },
  { label: "Units across them", value: "3,728", note: "sites; not the same as centres" },
  { label: "Est. FY26 revenue", value: "$98.4B", note: "from $64.6B in FY24" },
  { label: "Professionals", value: "2.36M", note: "employed" },
];

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export default function Registry({ onNavigate }: { onNavigate: Navigate }) {
  const { gccs, shortlist, openSubmit } = useAtlas();
  const [q, setQ] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [bands, setBands] = useState<HeadcountBand[]>([]);
  const [fns, setFns] = useState<string[]>([]);
  const [sector, setSector] = useState("");
  const [minConf, setMinConf] = useState<"any" | "Medium" | "High">("any");
  const [starred, setStarred] = useState(false);
  const [sort, setSort] = useState<Sort>("scale");
  const [view, setView] = useState<"table" | "cards">("table");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeCount = cities.length + bands.length + fns.length + (sector ? 1 : 0) + (minConf !== "any" ? 1 : 0) + (starred ? 1 : 0);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = gccs.filter((g) => {
      if (needle && !`${g.name} ${g.parent} ${g.sector} ${g.cities.join(" ")}`.toLowerCase().includes(needle)) return false;
      if (cities.length && !g.cities.some((c) => cities.includes(c))) return false;
      if (bands.length && !bands.includes(g.band)) return false;
      if (fns.length && !g.functions.some((f) => fns.includes(f))) return false;
      if (sector && g.sector !== sector) return false;
      if (minConf !== "any" && confRank(overallConfidence(g)) < confRank(minConf)) return false;
      if (starred && !shortlist.includes(g.id)) return false;
      return true;
    });
    const by: Record<Sort, (a: Gcc, b: Gcc) => number> = {
      scale: (a, b) => BAND_RANK[b.band] - BAND_RANK[a.band] || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
      fresh: (a, b) => b.lastVerified.localeCompare(a.lastVerified),
      confidence: (a, b) => confRank(overallConfidence(b)) - confRank(overallConfidence(a)) || a.name.localeCompare(b.name),
    };
    return out.sort(by[sort]);
  }, [gccs, q, cities, bands, fns, sector, minConf, starred, shortlist, sort]);

  const selected = gccs.find((g) => g.id === selectedId) ?? null;

  function clearAll() {
    setQ("");
    setCities([]);
    setBands([]);
    setFns([]);
    setSector("");
    setMinConf("any");
    setStarred(false);
  }

  function exportCsv() {
    downloadCsv("gcc-atlas-registry.csv", [
      ["Name", "Parent HQ", "Sector", "India cities", "Units", "Headcount band", "Functions", "Confidence", "Last verified"],
      ...results.map((g) => [g.name, g.parent, g.sector, g.cities.join("; "), g.units, g.band, g.functions.join("; "), overallConfidence(g), g.lastVerified]),
    ]);
  }

  return (
    <div className="space-y-5">
      {/* Market context from the strategy deck */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} className="px-4 py-3.5">
            <p className="text-[12px] text-muted">{s.label}</p>
            <p className="tnum mt-1 text-2xl font-semibold tracking-tight text-ink">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-faint">{s.note}</p>
          </Card>
        ))}
      </div>
      <p className="text-[12px] text-faint">
        Market totals: Nasscom-Zinnov India GCC Landscape FY26. The table below is an illustrative sample of the registry, not the full {STATS[0].value}.
      </p>

      {/* Search + controls */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search company, parent country, sector or city"
              aria-label="Search the registry"
              className="w-full rounded-lg border border-line bg-surface-2 py-2.5 pl-9 pr-9 text-sm text-ink placeholder:text-faint outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink">
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setFiltersOpen((v) => !v)} aria-expanded={filtersOpen} className="lg:hidden">
              <SlidersHorizontal className="size-3.5" /> Filters{activeCount > 0 && ` (${activeCount})`}
            </Button>
            <label className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-muted">
              <ArrowUpDown className="size-3.5" aria-hidden />
              <span className="sr-only">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent text-ink outline-none">
                <option value="scale">Largest first</option>
                <option value="name">Name A–Z</option>
                <option value="fresh">Recently verified</option>
                <option value="confidence">Highest confidence</option>
              </select>
            </label>
            <Segmented
              label="View"
              value={view}
              onChange={setView}
              options={[
                { value: "table", label: <Rows3 className="size-4" aria-label="Table view" /> },
                { value: "cards", label: <LayoutGrid className="size-4" aria-label="Card view" /> },
              ]}
            />
            <Button variant="secondary" onClick={exportCsv} disabled={!results.length} title="Export the filtered list as CSV">
              <Download className="size-3.5" /> CSV
            </Button>
          </div>
        </div>

        <div className={cn("mt-4 space-y-3 border-t border-line pt-4", filtersOpen ? "block" : "hidden lg:block")}>
          <ChipRow label="City" items={CITIES} selected={cities} onToggle={(v) => setCities(toggle(cities, v))} />
          <ChipRow label="Scale" items={BANDS} selected={bands} onToggle={(v) => setBands(toggle(bands, v))} suffix=" staff" />
          <ChipRow label="Function" items={FUNCTIONS} selected={fns} onToggle={(v) => setFns(toggle(fns, v))} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-[13px] text-muted">
              Sector
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-ink outline-none focus:border-brand">
                <option value="">All sectors</option>
                {SECTORS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[13px] text-muted">
              Confidence
              <select value={minConf} onChange={(e) => setMinConf(e.target.value as typeof minConf)} className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-ink outline-none focus:border-brand">
                <option value="any">Any</option>
                <option value="Medium">Medium or better</option>
                <option value="High">High only</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
              <input type="checkbox" checked={starred} onChange={(e) => setStarred(e.target.checked)} className="size-4 accent-[var(--brand-strong)]" />
              Shortlist only ({shortlist.length})
            </label>
            {activeCount > 0 && (
              <button onClick={clearAll} className="ml-auto text-[13px] text-brand hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between text-[13px] text-muted" aria-live="polite">
        <span>
          Showing <span className="tnum font-medium text-ink">{results.length}</span> of <span className="tnum">{gccs.length}</span> sample GCCs
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">
          <Filter className="size-3.5" aria-hidden /> Every field carries a source and confidence tag
        </span>
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="No GCCs match these filters"
          body="Loosen a filter, or tell us about a centre we're missing. Community submissions feed the registry."
          action={
            <div className="flex gap-2">
              <Button onClick={clearAll}>Clear filters</Button>
              <Button variant="primary" onClick={() => openSubmit({ type: "gcc" })}>
                Submit a GCC
              </Button>
            </div>
          }
        />
      ) : view === "table" ? (
        <TableView rows={results} onOpen={setSelectedId} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((g) => (
            <GccCard key={g.id} g={g} onOpen={() => setSelectedId(g.id)} />
          ))}
        </div>
      )}

      <GccDrawer g={selected} onClose={() => setSelectedId(null)} onNavigate={onNavigate} />
    </div>
  );
}

function ChipRow<T extends string>({ label, items, selected, onToggle, suffix = "" }: { label: string; items: readonly T[]; selected: T[]; onToggle: (v: T) => void; suffix?: string }) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      <span className="w-16 shrink-0 text-[12px] font-medium text-muted">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${label} filter`}>
        {items.map((it) => {
          const on = selected.includes(it);
          return (
            <button
              key={it}
              onClick={() => onToggle(it)}
              aria-pressed={on}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                on ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {it}
              {suffix}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StarBtn({ id, name }: { id: string; name: string }) {
  const { shortlist, toggleShortlist } = useAtlas();
  const on = shortlist.includes(id);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleShortlist(id);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from shortlist` : `Add ${name} to shortlist`}
      className="rounded-md p-1.5 text-faint hover:bg-surface-3 hover:text-warn"
    >
      <Star className={cn("size-4", on && "fill-warn text-warn")} />
    </button>
  );
}

function NameCell({ g }: { g: Gcc }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-[13px] font-semibold text-brand" aria-hidden>
        {g.name.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{g.name}</p>
        <p className="truncate text-[12px] text-muted">
          {g.parent} · {g.sector}
        </p>
      </div>
    </div>
  );
}

function Tags({ g }: { g: Gcc }) {
  return (
    <>
      {isPending(g) && <Pill tone="warn">Community · pending review</Pill>}
      {g.origin === "community" && !isPending(g) && <Pill tone="ok">Community · published</Pill>}
      {g.tag && <Pill tone="brand">{g.tag}</Pill>}
      {g.conflict && (
        <Pill tone="warn">
          <TriangleAlert className="size-3" aria-hidden /> Sources differ
        </Pill>
      )}
    </>
  );
}

function TableView({ rows, onOpen }: { rows: Gcc[]; onOpen: (id: string) => void }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-wide text-faint">
              <th className="px-4 py-2.5 font-medium">Company</th>
              <th className="px-3 py-2.5 font-medium">Cities</th>
              <th className="px-3 py-2.5 font-medium">Scale</th>
              <th className="px-3 py-2.5 font-medium">Functions</th>
              <th className="px-3 py-2.5 font-medium">Confidence</th>
              <th className="px-3 py-2.5 font-medium">Verified</th>
              <th className="w-10 px-2 py-2.5" aria-label="Shortlist" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((g) => (
              <tr
                key={g.id}
                onClick={() => onOpen(g.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpen(g.id);
                  }
                }}
                tabIndex={0}
                className="cursor-pointer align-top transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
              >
                <td className="px-4 py-3">
                  <NameCell g={g} />
                  <div className="mt-1.5 flex flex-wrap gap-1 pl-12">
                    <Tags g={g} />
                  </div>
                </td>
                <td className="px-3 py-3 text-[13px] text-ink">
                  <span className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-faint" aria-hidden />
                    {g.cities.join(", ")}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="tnum text-sm font-medium text-ink">{g.band}</p>
                  <p className="text-[11px] text-faint">
                    {g.units} unit{g.units > 1 ? "s" : ""}
                  </p>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {g.functions.slice(0, 2).map((f) => (
                      <Pill key={f}>{f}</Pill>
                    ))}
                    {g.functions.length > 2 && <Pill>+{g.functions.length - 2}</Pill>}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <ConfidenceTag level={overallConfidence(g)} />
                </td>
                <td className="tnum px-3 py-3 text-[12px] text-muted">{fmtDate(g.lastVerified)}</td>
                <td className="px-2 py-3">
                  <StarBtn id={g.id} name={g.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function GccCard({ g, onOpen }: { g: Gcc; onOpen: () => void }) {
  return (
    <Card className="group flex flex-col p-4 transition-colors hover:border-line-strong">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onOpen} className="min-w-0 text-left">
          <NameCell g={g} />
        </button>
        <StarBtn id={g.id} name={g.name} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <Tags g={g} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <dt className="text-[11px] text-faint">Cities</dt>
          <dd className="text-ink">{g.cities.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-faint">Scale</dt>
          <dd className="tnum text-ink">
            {g.band} · {g.units} unit{g.units > 1 ? "s" : ""}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-1">
        {g.functions.map((f) => (
          <Pill key={f}>{f}</Pill>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between pt-4">
        <ConfidenceTag level={overallConfidence(g)} />
        <button onClick={onOpen} className="text-[12px] font-medium text-brand hover:underline">
          View provenance
        </button>
      </div>
    </Card>
  );
}

function GccDrawer({ g, onClose, onNavigate }: { g: Gcc | null; onClose: () => void; onNavigate: Navigate }) {
  const { shortlist, toggleShortlist, openSubmit } = useAtlas();
  if (!g) return null;
  const primaryState = CITY_STATE[g.cities[0]];
  const hasMatrix = primaryState === "Karnataka" || primaryState === "Telangana" || primaryState === "Maharashtra" || primaryState === "Tamil Nadu";
  const on = shortlist.includes(g.id);
  const rows: { label: string; value: string; prov: Gcc["prov"]["location"] }[] = [
    { label: "India locations", value: g.cities.join(", "), prov: g.prov.location },
    { label: "Headcount band", value: `${g.band} staff`, prov: g.prov.headcount },
    { label: "Functions", value: g.functions.join(", "), prov: g.prov.functions },
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      title={g.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-1.5">
          {g.parent} · {g.sector} <Tags g={g} />
        </span>
      }
      footer={
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => toggleShortlist(g.id)}>
            <Star className={cn("size-3.5", on && "fill-warn text-warn")} /> {on ? "Shortlisted" : "Add to shortlist"}
          </Button>
          <Button
            onClick={() => {
              onClose();
              openSubmit({ type: "expansion", gccId: g.id });
            }}
          >
            Report an update
          </Button>
          {hasMatrix && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onNavigate("incentives", { state: primaryState as StateName });
              }}
            >
              Compare {primaryState} incentives
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <section aria-labelledby="entity">
          <h3 id="entity" className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-faint">
            <Building2 className="size-3.5" /> Entity
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Mini label="Centre (entity)" value="1" />
            <Mini label="Units (sites)" value={String(g.units)} />
            <Mini label="Confidence" value={<ConfidenceTag level={overallConfidence(g)} />} />
          </div>
          <p className="mt-2 text-[12px] text-faint">
            Atlas counts centres and units separately, so 2,117 and 3,728 are never conflated. Last verified {fmtDate(g.lastVerified)}.
          </p>
        </section>

        <section aria-labelledby="fields">
          <h3 id="fields" className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-faint">
            Fields and provenance
          </h3>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {rows.map((r) => (
              <li key={r.label} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] text-faint">{r.label}</p>
                  <p className="text-sm text-ink">{r.value}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:justify-end">
                  <SourceTag id={r.prov[0]} />
                  <ConfidenceTag level={isPending(g) ? "Low" : r.prov[1]} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {g.conflict && (
          <section aria-labelledby="conflict" className="rounded-xl border border-warn/30 bg-warn-soft p-4">
            <h3 id="conflict" className="flex items-center gap-2 text-sm font-semibold text-warn">
              <TriangleAlert className="size-4" /> Sources disagree: {g.conflict.field}
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[g.conflict.a, g.conflict.b].map((s) => (
                <div key={s.src} className="rounded-lg bg-surface/60 p-3">
                  <p className="text-[11px] text-faint">{s.src}</p>
                  <p className="text-[13px] text-ink">{s.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-ink">
              <span className="font-medium">Atlas resolution:</span> {g.conflict.resolution}
            </p>
            <p className="mt-1 text-[11px] text-faint">Illustrative example of the conflict-resolution workflow.</p>
          </section>
        )}

        {isPending(g) && (
          <p className="flex items-start gap-2 rounded-xl border border-line bg-surface-2 p-3 text-[13px] text-muted">
            <Users className="mt-0.5 size-4 shrink-0" /> Submitted by the community. It is shown with Low confidence until a reviewer approves it. Use the contribution queue to simulate approval.
          </p>
        )}
      </div>
    </Drawer>
  );
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] text-faint">{label}</p>
      <div className="tnum mt-1 text-base font-semibold text-ink">{value}</div>
    </div>
  );
}
