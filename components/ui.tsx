"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import {
  BadgeCheck,
  CircleDashed,
  ExternalLink,
  FileText,
  Landmark,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { src } from "@/lib/data/sources";
import type { BadgeLevel, Confidence, SourceKind } from "@/lib/types";

/* ───────── Tags ───────── */

const CONF_STYLE: Record<Confidence, string> = {
  High: "text-ok bg-ok-soft",
  Medium: "text-warn bg-warn-soft",
  Low: "text-bad bg-bad-soft",
};

export function ConfidenceTag({ level, className }: { level: Confidence; className?: string }) {
  const bars = level === "High" ? 3 : level === "Medium" ? 2 : 1;
  return (
    <span
      title={`${level} confidence`}
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", CONF_STYLE[level], className)}
    >
      <span className="flex items-end gap-px" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={cn("w-[3px] rounded-[1px] bg-current", i <= bars ? "opacity-100" : "opacity-25")} style={{ height: 3 + i * 2 }} />
        ))}
      </span>
      {level}
    </span>
  );
}

const KIND_ICON: Record<SourceKind, typeof FileText> = {
  Filing: Landmark,
  Report: FileText,
  Press: Newspaper,
  Policy: ShieldCheck,
  Community: Users,
  Derived: Sparkles,
};

export function SourceTag({ id, className }: { id: string; className?: string }) {
  const s = src(id);
  const Icon = KIND_ICON[s.kind];
  const body = (
    <>
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{s.label}</span>
      {s.url && <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />}
    </>
  );
  const cls = cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted",
    s.url && "hover:border-line-strong hover:text-ink",
    className,
  );
  return s.url ? (
    <a href={s.url} target="_blank" rel="noreferrer noopener" className={cls} title={`${s.kind}: ${s.label}`}>
      {body}
    </a>
  ) : (
    <span className={cls} title={`${s.kind}: ${s.label}`}>
      {body}
    </span>
  );
}

type Tone = "neutral" | "brand" | "ok" | "warn" | "bad" | "info";
const TONES: Record<Tone, string> = {
  neutral: "bg-surface-3 text-muted",
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  bad: "bg-bad-soft text-bad",
  info: "bg-info-soft text-info",
};

export function Pill({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", TONES[tone], className)}>
      {children}
    </span>
  );
}

const BADGE_META: Record<BadgeLevel, { tone: Tone; icon: typeof BadgeCheck; hint: string }> = {
  Claimed: { tone: "neutral", icon: CircleDashed, hint: "Self-reported by the provider. No documents reviewed." },
  Evidenced: { tone: "info", icon: FileText, hint: "Documents reviewed by Atlas (contracts, filings, invoices)." },
  "Client-verified": { tone: "ok", icon: BadgeCheck, hint: "Clients independently confirmed delivery to Atlas." },
};

export function DeliveryBadge({ level, className }: { level: BadgeLevel; className?: string }) {
  const m = BADGE_META[level];
  const Icon = m.icon;
  return (
    <Pill tone={m.tone} className={cn("py-1", className)}>
      <Icon className="size-3.5" aria-hidden />
      <span title={m.hint}>{level}</span>
    </Pill>
  );
}
export const BADGE_HINTS = BADGE_META;

/* ───────── Layout primitives ───────── */

export function Card({ children, className, ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, hint, right }: { title: string; hint?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] text-muted">{hint}</p>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-muted">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-lg border border-line bg-surface-2 p-0.5", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
            value === o.value ? "bg-surface-3 text-ink shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-[13px] text-muted">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 rounded-full transition-colors", checked ? "bg-brand-strong" : "bg-surface-3 border border-line-strong")}
      >
        <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", checked ? "left-[18px]" : "left-0.5")} />
      </button>
      <span>{label}</span>
    </label>
  );
}

export function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role={onChange ? "radiogroup" : "img"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = <Star width={size} height={size} className={cn(filled ? "fill-warn text-warn" : "text-line-strong")} aria-hidden />;
        return onChange ? (
          <button key={i} type="button" role="radio" aria-checked={i === value} aria-label={`${i} star${i > 1 ? "s" : ""}`} onClick={() => onChange(i)} className="rounded p-0.5 hover:scale-110">
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        );
      })}
    </span>
  );
}

export function ScoreRing({ value, size = 44, label }: { value: number; size?: number; label?: string }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const tone = value >= 75 ? "var(--ok)" : value >= 50 ? "var(--warn)" : "var(--faint)";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label ?? "Score"} ${value} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          style={{ transition: "stroke-dashoffset .5s ease" }}
        />
      </svg>
      <span className="tnum absolute inset-0 grid place-items-center text-[13px] font-semibold text-ink">{value}</span>
    </div>
  );
}

/* ───────── Overlays ───────── */

function useOverlay(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    prev.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    const node = ref.current;
    node?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
      if (e.key === "Tab" && node) {
        const f = node.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      (prev.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  return ref;
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const ref = useOverlay(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="anim-fade absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("anim-slide-in relative flex h-full w-full flex-col border-l border-line bg-surface outline-none", width)}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-base font-semibold text-ink">{title}</h2>
            {subtitle && <div className="mt-1 text-[13px] text-muted">{subtitle}</div>}
          </div>
          <button onClick={onClose} aria-label="Close panel" className="rounded-lg p-1.5 text-muted hover:bg-surface-3 hover:text-ink">
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="border-t border-line px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  width = "max-w-2xl",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  width?: string;
}) {
  const ref = useOverlay(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="anim-fade absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn("anim-pop relative flex max-h-[94dvh] w-full flex-col rounded-t-2xl border border-line bg-surface shadow-2xl outline-none sm:max-h-[90dvh] sm:rounded-2xl", width)}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-lg p-1.5 text-muted hover:bg-surface-3 hover:text-ink">
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ───────── Form bits ───────── */

export const inputCls =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px] text-ink placeholder:text-faint outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-2 focus:ring-brand-soft";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12px] font-medium text-muted">
        {label} {required && <span className="text-bad" aria-hidden>*</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-[12px] text-bad" role="alert">{error}</p> : hint ? <p className="mt-1 text-[12px] text-faint">{hint}</p> : null}
    </div>
  );
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" }) {
  const v = {
    primary: "bg-brand-strong text-white hover:brightness-110 shadow-[0_6px_18px_-8px_var(--brand-strong)]",
    secondary: "border border-line-strong bg-surface-2 text-ink hover:bg-surface-3",
    ghost: "text-muted hover:bg-surface-3 hover:text-ink",
    danger: "bg-bad-soft text-bad hover:brightness-110",
  }[variant];
  const s = size === "sm" ? "px-2.5 py-1.5 text-[12px]" : "px-3.5 py-2 text-[13px]";
  return (
    <button
      className={cn("inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50", v, s, className)}
      {...rest}
    />
  );
}
