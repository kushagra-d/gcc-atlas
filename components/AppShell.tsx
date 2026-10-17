"use client";

import { useCallback, useEffect, useState } from "react";
import { Database, Inbox, Landmark, Moon, Plus, Radar as RadarIcon, ShieldCheck, Sun } from "lucide-react";
import { AtlasProvider, useAtlas } from "@/lib/store";
import { ENTRANTS } from "@/lib/data/radar";
import { cn } from "@/lib/utils";
import type { Navigate, NavOptions, View } from "@/lib/nav";
import Registry from "./Registry";
import Radar from "./Radar";
import IncentiveMatrix from "./IncentiveMatrix";
import ProviderScorecard from "./ProviderScorecard";
import SubmitModal from "./SubmitModal";
import QueueDrawer from "./QueueDrawer";
import { Button } from "./ui";

const NAV: { view: View; label: string; short: string; icon: typeof Database; title: string; blurb: string }[] = [
  {
    view: "registry",
    label: "Registry & Radar",
    short: "Registry",
    icon: Database,
    title: "GCC Registry & Inbound Radar",
    blurb: "Who is here, and who is arriving next. Every field shows its source, date and confidence.",
  },
  {
    view: "incentives",
    label: "State Incentives",
    short: "Incentives",
    icon: Landmark,
    title: "State Incentive Benchmark",
    blurb: "Policies side by side, with a seat-count calculator and last-verified stamps.",
  },
  {
    view: "providers",
    label: "Provider Scorecard",
    short: "Providers",
    icon: ShieldCheck,
    title: "Verified Provider Scorecard",
    blurb: "Legal, EOR/payroll, real estate and recruitment partners ranked on delivery evidence, not marketing.",
  },
];

const VIEWS = NAV.map((n) => n.view as string).concat("radar");

export default function AppShell() {
  return (
    <AtlasProvider>
      <Shell />
    </AtlasProvider>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--brand)" opacity="0.18" />
        <circle cx="16" cy="16" r="8.5" fill="none" stroke="var(--brand)" strokeWidth="1.6" />
        <ellipse cx="16" cy="16" rx="3.6" ry="8.5" fill="none" stroke="var(--brand)" strokeWidth="1.2" />
        <path d="M7.5 16h17" stroke="var(--brand)" strokeWidth="1.2" />
        <circle cx="22.5" cy="9.5" r="2.2" fill="var(--ok)" />
      </svg>
      <div className="leading-tight">
        <p className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-ink">GCC Atlas</p>
        <p className="hidden whitespace-nowrap text-[11px] text-faint min-[420px]:block">GCC-Pulse · prototype</p>
      </div>
    </div>
  );
}

function Shell() {
  const { submissions, setQueueOpen, openSubmit, toasts, resetDemo } = useAtlas();
  const [view, setView] = useState<View>("registry");
  const [regTab, setRegTab] = useState<"registry" | "radar">("registry");
  const [focusState, setFocusState] = useState<NavOptions["state"]>();
  const [provCity, setProvCity] = useState<string>();
  const [provCat, setProvCat] = useState<NavOptions["category"]>();
  const [nonce, setNonce] = useState({ incentives: 0, providers: 0 });
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("light") ? "light" : "dark");
    const h = window.location.hash.replace("#", "");
    if (VIEWS.includes(h)) {
      if (h === "radar") {
        setView("registry");
        setRegTab("radar");
      } else setView(h as View);
    }
  }, []);

  const navigate: Navigate = useCallback((v, opts) => {
    setView(v);
    if (v === "registry") setRegTab(opts?.registryTab ?? "registry");
    if (v === "incentives" && opts?.state) {
      setFocusState(opts.state);
      setNonce((n) => ({ ...n, incentives: n.incentives + 1 }));
    }
    if (v === "providers" && (opts?.city || opts?.category)) {
      setProvCity(opts.city);
      setProvCat(opts.category);
      setNonce((n) => ({ ...n, providers: n.providers + 1 }));
    }
    try {
      window.history.replaceState(null, "", `#${v === "registry" && opts?.registryTab === "radar" ? "radar" : v}`);
    } catch {
      /* non-critical */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
    try {
      window.localStorage.setItem("gcc-atlas-theme", next);
    } catch {
      /* ignore */
    }
  }

  const current = NAV.find((n) => n.view === view)!;
  const pending = submissions.filter((s) => s.status !== "Published").length;

  return (
    <div className="ambient min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface/80 px-4 py-5 backdrop-blur lg:flex">
        <Logo />
        <nav className="mt-8 space-y-1" aria-label="Modules">
          {NAV.map((n) => {
            const Icon = n.icon;
            const on = view === n.view;
            return (
              <button
                key={n.view}
                onClick={() => navigate(n.view)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors",
                  on ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-3 hover:text-ink",
                )}
              >
                <Icon className="size-4" aria-hidden /> {n.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-xl border border-line bg-surface-2 p-3.5">
            <p className="flex items-center gap-2 text-[12px] font-semibold text-ink">
              <RadarIcon className="size-3.5 text-brand" aria-hidden /> Data flywheel
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-muted">Public data feeds the Registry. Entrants bring demand. Providers verify delivery. Verification sharpens the data.</p>
            <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => openSubmit()}>
              <Plus className="size-3.5" /> Contribute
            </Button>
          </div>
          <p className="px-1 text-[11px] leading-relaxed text-faint">
            Prototype. Registry and provider data are illustrative; incentive data is summarised from public sources and must be verified. Radar entrants are fictional.
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="lg:hidden">
              <Logo />
            </div>
            <div className="hidden min-w-0 lg:block">
              <h1 className="truncate text-lg font-semibold tracking-tight text-ink">{current.title}</h1>
              <p className="truncate text-[13px] text-muted">{current.blurb}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setQueueOpen(true)} aria-label={`Your contributions, ${submissions.length} submitted`} className="relative">
                <Inbox className="size-3.5" />
                <span className="hidden sm:inline">Contributions</span>
                {submissions.length > 0 && (
                  <span className={cn("tnum grid min-w-5 place-items-center rounded-full px-1.5 text-[11px]", pending ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok")}>{submissions.length}</span>
                )}
              </Button>
              <Button variant="secondary" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} className="!px-2.5">
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Button variant="primary" onClick={() => openSubmit()}>
                <Plus className="size-4" />
                <span className="hidden sm:inline">Submit intelligence</span>
                <span className="sm:hidden">Submit</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-4 pb-28 pt-5 sm:px-6 lg:pb-12">
          <div className="mb-5 lg:hidden">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{current.title}</h1>
            <p className="mt-1 text-[13px] text-muted">{current.blurb}</p>
          </div>

          <div hidden={view !== "registry"}>
            <div role="tablist" aria-label="Registry sections" className="mb-5 inline-flex rounded-xl border border-line bg-surface p-1">
              {(
                [
                  ["registry", "GCC Registry"],
                  ["radar", "Inbound Radar"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={regTab === id}
                  onClick={() => setRegTab(id)}
                  className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-colors", regTab === id ? "bg-brand-soft text-brand" : "text-muted hover:text-ink")}
                >
                  {label}
                  {id === "radar" && <span className="tnum rounded-full bg-surface-3 px-1.5 text-[11px] text-muted">{ENTRANTS.length}</span>}
                </button>
              ))}
            </div>
            <div hidden={regTab !== "registry"}>
              <Registry onNavigate={navigate} />
            </div>
            <div hidden={regTab !== "radar"}>
              <Radar onNavigate={navigate} />
            </div>
          </div>

          <div hidden={view !== "incentives"}>
            <IncentiveMatrix key={`inc-${nonce.incentives}`} focusState={focusState} />
          </div>
          <div hidden={view !== "providers"}>
            <ProviderScorecard key={`prov-${nonce.providers}`} initialCity={provCity} initialCategory={provCat} />
          </div>

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[12px] text-faint">
            <p>Market totals: Nasscom-Zinnov FY26. Neutral, source-cited, updated continuously (prototype).</p>
            <button onClick={resetDemo} className="hover:text-ink hover:underline">Reset prototype data</button>
          </footer>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Modules">
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {NAV.map((n) => {
            const Icon = n.icon;
            const on = view === n.view;
            return (
              <li key={n.view}>
                <button
                  onClick={() => navigate(n.view)}
                  aria-current={on ? "page" : undefined}
                  className={cn("flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium", on ? "text-brand" : "text-muted")}
                >
                  <Icon className="size-5" aria-hidden /> {n.short}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <SubmitModal onNavigate={navigate} />
      <QueueDrawer />

      <div className="pointer-events-none fixed inset-x-0 top-[72px] z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="anim-fade-up pointer-events-auto max-w-md rounded-xl border border-line-strong bg-surface-3 px-4 py-2.5 text-[13px] text-ink shadow-2xl">
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
