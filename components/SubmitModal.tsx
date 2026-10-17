"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Building2, Check, Link2, Loader2, MessageSquarePlus, Rocket, Sparkles, TriangleAlert } from "lucide-react";
import { CITIES, FUNCTIONS, SECTORS } from "@/lib/data/gccs";
import { useAtlas } from "@/lib/store";
import { cn, normalise, todayIso } from "@/lib/utils";
import type { Navigate } from "@/lib/nav";
import type { Gcc, GccFunction, HeadcountBand, Review, Submission, SubmissionStatus, SubmissionType } from "@/lib/types";
import { Button, Field, Modal, Pill, Stars, Toggle, inputCls } from "./ui";

const TYPES: { value: SubmissionType; label: string; icon: typeof Building2; blurb: string; credits: number }[] = [
  { value: "gcc", label: "New GCC setup", icon: Building2, blurb: "A centre we don't list yet", credits: 50 },
  { value: "expansion", label: "Expansion", icon: Rocket, blurb: "New site, seats or function", credits: 30 },
  { value: "feedback", label: "Provider feedback", icon: MessageSquarePlus, blurb: "Rate a delivery partner", credits: 40 },
];

const PIPELINE: SubmissionStatus[] = ["Ingested", "Entity-resolved", "Scored", "In human review", "Published"];
const STEP_HINT: Record<SubmissionStatus, string> = {
  Ingested: "Received and checksummed",
  "Entity-resolved": "Matched against parents and aliases",
  Scored: "Confidence assigned from source quality",
  "In human review": "Waiting for a reviewer",
  Published: "Live with a source tag",
};

const BANDS: HeadcountBand[] = ["<1k", "1k–5k", "5k–10k", "10k+"];

interface Values {
  name: string;
  parent: string;
  sector: string;
  city: string;
  band: HeadcountBand | "";
  functions: GccFunction[];
  goLive: string;
  url: string;
  relation: string;
  email: string;
  gccId: string;
  kind: string;
  seats: string;
  announced: string;
  summary: string;
  providerId: string;
  engagement: string;
  rating: number;
  days: string;
  hired: string;
  recommend: boolean;
  text: string;
  wasClient: boolean;
  proof: string;
  consent: boolean;
}

const INITIAL: Values = {
  name: "", parent: "", sector: "", city: "", band: "", functions: [], goLive: "", url: "", relation: "", email: "",
  gccId: "", kind: "New site", seats: "", announced: "", summary: "",
  providerId: "", engagement: "", rating: 0, days: "", hired: "", recommend: true, text: "", wasClient: false, proof: "",
  consent: false,
};

type Errors = Partial<Record<keyof Values, string>>;

const isUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

function validate(type: SubmissionType, v: Values): Errors {
  const e: Errors = {};
  if (type !== "feedback") {
    if (!isUrl(v.url)) e.url = "Add a public link (https://…) so a reviewer can check it.";
  }
  if (type === "gcc") {
    if (v.name.trim().length < 2) e.name = "Enter the company or centre name.";
    if (v.parent.trim().length < 2) e.parent = "Enter the parent's HQ country.";
    if (!v.city) e.city = "Pick the main India city.";
    if (!v.band) e.band = "Pick a headcount band.";
    if (!v.functions.length) e.functions = "Pick at least one function.";
    if (!v.relation) e.relation = "Tell us how you know this.";
  }
  if (type === "expansion") {
    if (!v.gccId) e.gccId = "Choose the GCC that is expanding.";
    if (!v.city) e.city = "Pick the city.";
    const n = Number(v.seats);
    if (!v.seats || !Number.isFinite(n) || n <= 0 || n > 50000) e.seats = "Enter incremental seats between 1 and 50,000.";
    if (!v.announced) e.announced = "When was this announced?";
    else if (v.announced > todayIso()) e.announced = "The date can't be in the future.";
  }
  if (type === "feedback") {
    if (!v.providerId) e.providerId = "Choose the provider.";
    if (!v.engagement) e.engagement = "What did they do for you?";
    if (!v.rating) e.rating = "Give a star rating.";
    if (v.text.trim().length < 40) e.text = `Write at least 40 characters (${v.text.trim().length}/40).`;
    if (v.days && (!Number.isFinite(Number(v.days)) || Number(v.days) < 1 || Number(v.days) > 730)) e.days = "Days must be between 1 and 730.";
    if (v.hired && (!Number.isFinite(Number(v.hired)) || Number(v.hired) < 0)) e.hired = "Enter a valid seat count.";
  }
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "That email doesn't look right.";
  if (!v.consent) e.consent = "Please confirm before submitting.";
  return e;
}

export default function SubmitModal({ onNavigate }: { onNavigate: Navigate }) {
  const { submitModalOpen, closeSubmit, submitPreset } = useAtlas();
  return (
    <Modal
      open={submitModalOpen}
      onClose={closeSubmit}
      title="Submit intelligence"
      subtitle="Every submission is source-checked and human-reviewed before it is published."
      width="max-w-3xl"
    >
      <SubmitBody preset={submitPreset} onClose={closeSubmit} onNavigate={onNavigate} />
    </Modal>
  );
}

function SubmitBody({ preset, onClose, onNavigate }: { preset: ReturnType<typeof useAtlas>["submitPreset"]; onClose: () => void; onNavigate: Navigate }) {
  const { gccs, providers, addSubmission, submissions } = useAtlas();
  const [type, setType] = useState<SubmissionType>(preset?.type ?? "gcc");
  const [v, setV] = useState<Values>({ ...INITIAL, gccId: preset?.gccId ?? "", providerId: preset?.providerId ?? "" });
  const [errors, setErrors] = useState<Errors>({});
  const [dupAck, setDupAck] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((s) => ({ ...s, [k]: val }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // Entity resolution: does this name already exist?
  const dup = useMemo(() => {
    if (type !== "gcc" || normalise(v.name).length < 4) return null;
    const n = normalise(v.name);
    return gccs.find((g) => normalise(g.name) === n || normalise(g.name).startsWith(n) || n.startsWith(normalise(g.name))) ?? null;
  }, [type, v.name, gccs]);

  const done = doneId ? submissions.find((s) => s.id === doneId) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(type, v);
    if (type === "gcc" && dup && !dupAck) errs.name = errs.name ?? "This looks like an existing entity. Choose how to proceed below.";
    setErrors(errs);
    if (Object.keys(errs).length) {
      const first = document.querySelector<HTMLElement>("[data-invalid='true']");
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    const id = `sub-${Date.now().toString(36)}`;
    const base = { id, createdAt: new Date().toISOString(), status: "Ingested" as SubmissionStatus };
    let sub: Submission;

    if (type === "gcc") {
      const gcc: Gcc = {
        id: `community-${normalise(v.name)}-${id}`,
        name: v.name.trim(),
        parent: v.parent.trim(),
        sector: v.sector || "Other",
        cities: [v.city],
        units: 1,
        band: v.band as HeadcountBand,
        functions: v.functions,
        lastVerified: todayIso(),
        prov: { location: ["community", "Low"], headcount: ["community", "Low"], functions: ["community", "Low"] },
        origin: "community",
        reviewStatus: "Ingested",
      };
      sub = { ...base, type, title: `New GCC: ${gcc.name}`, credits: 50, gcc };
    } else if (type === "expansion") {
      const g = gccs.find((x) => x.id === v.gccId);
      sub = {
        ...base,
        type,
        title: `Expansion: ${g?.name ?? "GCC"} (+${Number(v.seats).toLocaleString()} seats, ${v.city})`,
        credits: 30,
        expansion: { gccId: v.gccId, gccName: g?.name ?? "", summary: v.summary.trim() || v.kind, city: v.city, seats: Number(v.seats) },
      };
    } else {
      const p = providers.find((x) => x.id === v.providerId);
      const review: Review = {
        id: `rev-${id}`,
        author: `${v.wasClient ? "Client" : "Peer"}, ${v.engagement.toLowerCase()} engagement`,
        verified: v.wasClient && !!v.proof,
        rating: v.rating,
        date: todayIso(),
        text: v.text.trim(),
        helpful: 0,
        pending: true,
      };
      sub = {
        ...base,
        type,
        title: `Feedback: ${p?.name ?? "Provider"} (${v.rating}★)`,
        credits: 40 + (v.proof ? 20 : 0),
        feedback: { providerId: v.providerId, review, days: v.days ? Number(v.days) : undefined, seats: v.hired ? Number(v.hired) : undefined },
      };
    }

    window.setTimeout(() => {
      addSubmission(sub);
      setDoneId(sub.id);
      setSubmitting(false);
    }, 650);
  }

  /* ───── Success ───── */
  if (done) {
    const idx = PIPELINE.indexOf(done.status);
    return (
      <div className="space-y-6 px-5 py-6 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
            <Check className="size-5" aria-hidden />
          </span>
          <div>
            <h3 className="text-base font-semibold text-ink">Thanks. Your submission is in the pipeline.</h3>
            <p className="mt-0.5 text-[13px] text-muted">{done.title}</p>
            <p className="mt-2 flex items-center gap-2 text-[13px] text-ink">
              <Sparkles className="size-4 text-warn" aria-hidden /> +{done.credits} Atlas credits <span className="text-faint">· unlock earlier Radar previews</span>
            </p>
          </div>
        </div>

        <ol className="space-y-1" aria-live="polite" aria-label="Review pipeline">
          {PIPELINE.map((s, i) => {
            const state = i < idx ? "done" : i === idx ? (s === "Published" ? "done" : "active") : "todo";
            return (
              <li key={s} className="flex items-center gap-3 rounded-lg px-3 py-2">
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border text-[11px]",
                    state === "done" && "border-ok bg-ok-soft text-ok",
                    state === "active" && "border-brand bg-brand-soft text-brand",
                    state === "todo" && "border-line text-faint",
                  )}
                >
                  {state === "done" ? <Check className="size-3.5" aria-hidden /> : state === "active" ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : i + 1}
                </span>
                <div className="flex-1">
                  <p className={cn("text-[13px] font-medium", state === "todo" ? "text-faint" : "text-ink")}>{s}</p>
                  <p className="text-[12px] text-faint">{STEP_HINT[s]}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="rounded-lg border border-line bg-surface-2 p-3 text-[12px] text-muted">
          In the prototype, open <span className="font-medium text-ink">Contributions</span> in the header to simulate a reviewer approving it. Until then it appears on the site as <Pill tone="warn">pending review</Pill> with Low confidence.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={onClose}>Done</Button>
          <Button
            onClick={() => {
              setDoneId(null);
              setV({ ...INITIAL });
              setDupAck(false);
              setSubmitting(false);
            }}
          >
            Submit another
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              onClose();
              onNavigate(done.type === "feedback" ? "providers" : "registry", { registryTab: "registry" });
            }}
          >
            See it in {done.type === "feedback" ? "Scorecard" : "Registry"} <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  /* ───── Form ───── */
  const err = (k: keyof Values) => errors[k];
  const invalid = (k: keyof Values) => (errors[k] ? "true" : undefined);

  return (
    <form onSubmit={submit} noValidate className="px-5 py-5 sm:px-6">
      <div role="tablist" aria-label="Submission type" className="grid gap-2 sm:grid-cols-3">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const on = type === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setType(t.value);
                setErrors({});
              }}
              className={cn("flex items-start gap-3 rounded-xl border p-3 text-left transition-colors", on ? "border-brand bg-brand-soft" : "border-line bg-surface-2 hover:border-line-strong")}
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", on ? "text-brand" : "text-muted")} aria-hidden />
              <span>
                <span className="block text-[13px] font-medium text-ink">{t.label}</span>
                <span className="block text-[12px] text-muted">{t.blurb}</span>
                <span className="tnum mt-1 block text-[11px] text-faint">+{t.credits} credits</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {type === "gcc" && (
          <>
            <div className="sm:col-span-2" data-invalid={invalid("name")}>
              <Field label="Company or centre name" required error={err("name")} htmlFor="f-name">
                <input id="f-name" className={inputCls} value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Acme Technology Centre" aria-invalid={!!err("name")} autoComplete="off" />
              </Field>
              {dup && !dupAck && (
                <div className="mt-2 rounded-lg border border-warn/30 bg-warn-soft p-3 text-[13px]">
                  <p className="flex items-center gap-2 font-medium text-warn">
                    <TriangleAlert className="size-4" aria-hidden /> Looks like “{dup.name}” is already in the Registry
                  </p>
                  <p className="mt-1 text-muted">Entity resolution matched this name against {dup.cities.join(", ")}. Is this an expansion instead?</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setType("expansion");
                        setV((s) => ({ ...s, gccId: dup.id }));
                      }}
                    >
                      Report as expansion
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setDupAck(true)}>
                      Different entity, continue
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div data-invalid={invalid("parent")}>
              <Field label="Parent HQ country" required error={err("parent")} htmlFor="f-parent">
                <input id="f-parent" className={inputCls} value={v.parent} onChange={(e) => set("parent", e.target.value)} placeholder="e.g. United States" aria-invalid={!!err("parent")} />
              </Field>
            </div>
            <Field label="Sector" htmlFor="f-sector">
              <select id="f-sector" className={inputCls} value={v.sector} onChange={(e) => set("sector", e.target.value)}>
                <option value="">Select a sector</option>
                {SECTORS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
                <option>Other</option>
              </select>
            </Field>
            <div data-invalid={invalid("city")}>
              <Field label="Main India city" required error={err("city")} htmlFor="f-city">
                <select id="f-city" className={inputCls} value={v.city} onChange={(e) => set("city", e.target.value)} aria-invalid={!!err("city")}>
                  <option value="">Select a city</option>
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div data-invalid={invalid("band")}>
              <Field label="Headcount band" required error={err("band")} htmlFor="f-band">
                <select id="f-band" className={inputCls} value={v.band} onChange={(e) => set("band", e.target.value as HeadcountBand)} aria-invalid={!!err("band")}>
                  <option value="">Select a band</option>
                  {BANDS.map((b) => (
                    <option key={b} value={b}>{b} staff</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="sm:col-span-2" data-invalid={invalid("functions")}>
              <Field label="Functions" required error={err("functions")}>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Functions">
                  {FUNCTIONS.map((f) => {
                    const on = v.functions.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        aria-pressed={on}
                        onClick={() => set("functions", on ? v.functions.filter((x) => x !== f) : [...v.functions, f])}
                        className={cn("rounded-full border px-3 py-1.5 text-[12px] transition-colors", on ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface-2 text-muted hover:text-ink")}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
            <Field label="Go-live month" hint="Optional" htmlFor="f-golive">
              <input id="f-golive" type="month" className={inputCls} value={v.goLive} onChange={(e) => set("goLive", e.target.value)} />
            </Field>
            <div data-invalid={invalid("relation")}>
              <Field label="How do you know this?" required error={err("relation")} htmlFor="f-rel">
                <select id="f-rel" className={inputCls} value={v.relation} onChange={(e) => set("relation", e.target.value)} aria-invalid={!!err("relation")}>
                  <option value="">Select</option>
                  <option>I work at the company</option>
                  <option>I'm a service provider to it</option>
                  <option>Public information only</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {type === "expansion" && (
          <>
            <div className="sm:col-span-2" data-invalid={invalid("gccId")}>
              <Field label="Which GCC is expanding?" required error={err("gccId")} htmlFor="f-gcc">
                <select id="f-gcc" className={inputCls} value={v.gccId} onChange={(e) => set("gccId", e.target.value)} aria-invalid={!!err("gccId")}>
                  <option value="">Select a GCC</option>
                  {[...gccs].sort((a, b) => a.name.localeCompare(b.name)).map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Type of expansion" htmlFor="f-kind">
              <select id="f-kind" className={inputCls} value={v.kind} onChange={(e) => set("kind", e.target.value)}>
                <option>New site</option>
                <option>Headcount growth</option>
                <option>New function</option>
                <option>New leadership</option>
              </select>
            </Field>
            <div data-invalid={invalid("city")}>
              <Field label="City" required error={err("city")} htmlFor="f-city2">
                <select id="f-city2" className={inputCls} value={v.city} onChange={(e) => set("city", e.target.value)} aria-invalid={!!err("city")}>
                  <option value="">Select a city</option>
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div data-invalid={invalid("seats")}>
              <Field label="Incremental seats" required error={err("seats")} htmlFor="f-seats">
                <input id="f-seats" inputMode="numeric" className={inputCls} value={v.seats} onChange={(e) => set("seats", e.target.value.replace(/[^\d]/g, ""))} placeholder="e.g. 500" aria-invalid={!!err("seats")} />
              </Field>
            </div>
            <div data-invalid={invalid("announced")}>
              <Field label="Announcement date" required error={err("announced")} htmlFor="f-ann">
                <input id="f-ann" type="date" max={todayIso()} className={inputCls} value={v.announced} onChange={(e) => set("announced", e.target.value)} aria-invalid={!!err("announced")} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="What changed?" hint="Optional, one or two lines." htmlFor="f-sum">
                <textarea id="f-sum" rows={2} className={inputCls} value={v.summary} onChange={(e) => set("summary", e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {type === "feedback" && (
          <>
            <div data-invalid={invalid("providerId")}>
              <Field label="Provider" required error={err("providerId")} htmlFor="f-prov">
                <select id="f-prov" className={inputCls} value={v.providerId} onChange={(e) => set("providerId", e.target.value)} aria-invalid={!!err("providerId")}>
                  <option value="">Select a provider</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} · {p.category}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div data-invalid={invalid("engagement")}>
              <Field label="What did they do for you?" required error={err("engagement")} htmlFor="f-eng">
                <select id="f-eng" className={inputCls} value={v.engagement} onChange={(e) => set("engagement", e.target.value)} aria-invalid={!!err("engagement")}>
                  <option value="">Select</option>
                  <option>Entity set-up</option>
                  <option>Payroll / EOR</option>
                  <option>Site search / lease</option>
                  <option>Hiring</option>
                  <option>Compliance</option>
                </select>
              </Field>
            </div>
            <div data-invalid={invalid("rating")}>
              <Field label="Overall rating" required error={err("rating")}>
                <Stars value={v.rating} onChange={(n) => set("rating", n)} size={24} />
              </Field>
            </div>
            <Field label="Would you recommend them?">
              <Toggle checked={v.recommend} onChange={(c) => set("recommend", c)} label={v.recommend ? "Yes, I would" : "No"} />
            </Field>
            <div data-invalid={invalid("days")}>
              <Field label="Days to Day 1" hint="Optional. Feeds the delivery record." error={err("days")} htmlFor="f-days">
                <input id="f-days" inputMode="numeric" className={inputCls} value={v.days} onChange={(e) => set("days", e.target.value.replace(/[^\d]/g, ""))} placeholder="e.g. 45" />
              </Field>
            </div>
            <div data-invalid={invalid("hired")}>
              <Field label="Seats they delivered" hint="Optional." error={err("hired")} htmlFor="f-hired">
                <input id="f-hired" inputMode="numeric" className={inputCls} value={v.hired} onChange={(e) => set("hired", e.target.value.replace(/[^\d]/g, ""))} placeholder="e.g. 120" />
              </Field>
            </div>
            <div className="sm:col-span-2" data-invalid={invalid("text")}>
              <Field label="Your review" required error={err("text")} htmlFor="f-text" hint="Stick to facts: scope, timeline, outcome. No personal data.">
                <textarea id="f-text" rows={4} className={inputCls} value={v.text} onChange={(e) => set("text", e.target.value)} aria-invalid={!!err("text")} />
              </Field>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-line bg-surface-2 p-3">
              <Toggle checked={v.wasClient} onChange={(c) => set("wasClient", c)} label="I was the client. I can confirm delivery." />
              {v.wasClient && (
                <div className="mt-3">
                  <Field label="Proof of engagement" hint="Optional (+20 credits). An invoice or engagement letter helps upgrade the provider to Client-verified. Not uploaded in the prototype." htmlFor="f-proof">
                    <input
                      id="f-proof"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => set("proof", e.target.files?.[0]?.name ?? "")}
                      className="block w-full text-[13px] text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-3 file:px-3 file:py-1.5 file:text-[13px] file:text-ink"
                    />
                  </Field>
                </div>
              )}
            </div>
          </>
        )}

        {type !== "feedback" && (
          <div className="sm:col-span-2" data-invalid={invalid("url")}>
            <Field label="Evidence link" required error={err("url")} htmlFor="f-url" hint="Press release, filing, job posting or careers page.">
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" aria-hidden />
                <input id="f-url" type="url" className={cn(inputCls, "pl-9")} value={v.url} onChange={(e) => set("url", e.target.value)} placeholder="https://" aria-invalid={!!err("url")} />
              </div>
            </Field>
          </div>
        )}

        <div className="sm:col-span-2" data-invalid={invalid("email")}>
          <Field label="Contact email" hint="Optional. Only used if a reviewer needs to follow up." error={err("email")} htmlFor="f-email">
            <input id="f-email" type="email" className={inputCls} value={v.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" />
          </Field>
        </div>

        <div className="sm:col-span-2" data-invalid={invalid("consent")}>
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] text-muted">
            <input type="checkbox" checked={v.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand-strong)]" />
            I confirm this is accurate to the best of my knowledge and I'm permitted to share it. Atlas may publish it with a source and confidence tag.
          </label>
          {err("consent") && <p className="mt-1 text-[12px] text-bad" role="alert">{err("consent")}</p>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-[12px] text-faint">Pipeline: Ingest › Entity-resolve › Score › Human review › Publish</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? <><Loader2 className="size-3.5 animate-spin" /> Submitting</> : "Submit for review"}
          </Button>
        </div>
      </div>
    </form>
  );
}
