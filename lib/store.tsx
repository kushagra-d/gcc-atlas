"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Gcc, Provider, Review, Submission, SubmissionStatus } from "./types";
import { GCCS } from "./data/gccs";
import { PROVIDERS } from "./data/providers";

export type LeadStatus = "New" | "Claimed" | "Won" | "Lost";

interface Persisted {
  submissions: Submission[];
  shortlist: string[];
  leads: Record<string, LeadStatus>;
  alerts: string[];
  helpful: string[];
  intros: string[];
}

const EMPTY: Persisted = { submissions: [], shortlist: [], leads: {}, alerts: [], helpful: [], intros: [] };
const KEY = "gcc-atlas-prototype-v1";

const PIPELINE: SubmissionStatus[] = ["Ingested", "Entity-resolved", "Scored", "In human review", "Published"];

interface Toast {
  id: number;
  message: string;
}

interface Ctx extends Persisted {
  gccs: Gcc[];
  providers: Provider[];
  toasts: Toast[];
  toast: (message: string) => void;
  submitModalOpen: boolean;
  submitPreset: { type?: Submission["type"]; providerId?: string; gccId?: string } | null;
  openSubmit: (preset?: Ctx["submitPreset"]) => void;
  closeSubmit: () => void;
  queueOpen: boolean;
  setQueueOpen: (v: boolean) => void;
  addSubmission: (s: Submission) => void;
  approveSubmission: (id: string) => void;
  toggleShortlist: (id: string) => void;
  setLead: (id: string, status: LeadStatus) => void;
  toggleAlert: (id: string) => void;
  voteHelpful: (id: string) => void;
  requestIntro: (id: string, label: string) => void;
  resetDemo: () => void;
}

const AtlasContext = createContext<Ctx | null>(null);

export function useAtlas(): Ctx {
  const ctx = useContext(AtlasContext);
  if (!ctx) throw new Error("useAtlas must be used inside <AtlasProvider>");
  return ctx;
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitPreset, setSubmitPreset] = useState<Ctx["submitPreset"]>(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const timers = useRef<number[]>([]);
  const toastId = useRef(0);

  // Load persisted prototype state once on the client.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as Partial<Persisted>) });
    } catch {
      /* storage unavailable: run in-memory */
    }
    setHydrated(true);
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [state, hydrated]);

  const toast = useCallback((message: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, message }]);
    const h = window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
    timers.current.push(h);
  }, []);

  const setStatus = useCallback((id: string, status: SubmissionStatus) => {
    setState((s) => ({
      ...s,
      submissions: s.submissions.map((x) =>
        x.id === id
          ? {
              ...x,
              status,
              gcc: x.gcc ? { ...x.gcc, reviewStatus: status } : x.gcc,
              feedback: x.feedback
                ? { ...x.feedback, review: { ...x.feedback.review, pending: status !== "Published" } }
                : x.feedback,
            }
          : x,
      ),
    }));
  }, []);

  const addSubmission = useCallback(
    (sub: Submission) => {
      setState((s) => ({ ...s, submissions: [sub, ...s.submissions] }));
      // Simulate the ingest → entity-resolve → score → human-review pipeline.
      PIPELINE.slice(1, 4).forEach((status, i) => {
        const h = window.setTimeout(() => setStatus(sub.id, status), 1100 * (i + 1));
        timers.current.push(h);
      });
    },
    [setStatus],
  );

  const approveSubmission = useCallback(
    (id: string) => {
      setStatus(id, "Published");
      toast("Reviewer approved. The record is now published with Medium confidence.");
    },
    [setStatus, toast],
  );

  const flip = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const value = useMemo<Ctx>(() => {
    const communityGccs = state.submissions.filter((s) => s.type === "gcc" && s.gcc).map((s) => s.gcc as Gcc);

    const expansionsByGcc = new Map<string, number>();
    state.submissions.forEach((s) => {
      if (s.type === "expansion" && s.expansion) {
        expansionsByGcc.set(s.expansion.gccId, (expansionsByGcc.get(s.expansion.gccId) ?? 0) + 1);
      }
    });
    const gccs = [...communityGccs, ...GCCS].map((g) =>
      expansionsByGcc.has(g.id) && !g.tag ? { ...g, tag: "Expansion reported" } : g,
    );

    const feedback = new Map<string, Review[]>();
    state.submissions.forEach((s) => {
      if (s.type === "feedback" && s.feedback) {
        feedback.set(s.feedback.providerId, [...(feedback.get(s.feedback.providerId) ?? []), s.feedback.review]);
      }
    });
    const providers = PROVIDERS.map((p) =>
      feedback.has(p.id) ? { ...p, reviews: [...(feedback.get(p.id) as Review[]), ...p.reviews] } : p,
    );

    return {
      ...state,
      gccs,
      providers,
      toasts,
      toast,
      submitModalOpen,
      submitPreset,
      openSubmit: (preset) => {
        setSubmitPreset(preset ?? null);
        setSubmitModalOpen(true);
      },
      closeSubmit: () => setSubmitModalOpen(false),
      queueOpen,
      setQueueOpen,
      addSubmission,
      approveSubmission,
      toggleShortlist: (id) => setState((s) => ({ ...s, shortlist: flip(s.shortlist, id) })),
      setLead: (id, status) => setState((s) => ({ ...s, leads: { ...s.leads, [id]: status } })),
      toggleAlert: (id) => setState((s) => ({ ...s, alerts: flip(s.alerts, id) })),
      voteHelpful: (id) => setState((s) => ({ ...s, helpful: flip(s.helpful, id) })),
      requestIntro: (id, label) => {
        setState((s) => (s.intros.includes(id) ? s : { ...s, intros: [...s.intros, id] }));
        toast(`Intro requested with ${label}. They will see your shortlist context.`);
      },
      resetDemo: () => {
        setState(EMPTY);
        toast("Prototype data reset.");
      },
    };
  }, [state, toasts, toast, submitModalOpen, submitPreset, queueOpen, addSubmission, approveSubmission]);

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}
