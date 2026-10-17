"use client";

import { Building2, CheckCircle2, MessageSquarePlus, Rocket, Sparkles } from "lucide-react";
import { useAtlas } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { SubmissionStatus, SubmissionType } from "@/lib/types";
import { Button, Drawer, EmptyState, Pill } from "./ui";

const ICON: Record<SubmissionType, typeof Building2> = { gcc: Building2, expansion: Rocket, feedback: MessageSquarePlus };
const TONE: Record<SubmissionStatus, "neutral" | "info" | "warn" | "ok"> = {
  Ingested: "neutral",
  "Entity-resolved": "info",
  Scored: "info",
  "In human review": "warn",
  Published: "ok",
};

export default function QueueDrawer() {
  const { queueOpen, setQueueOpen, submissions, approveSubmission, openSubmit, resetDemo } = useAtlas();
  const credits = submissions.reduce((s, x) => s + x.credits, 0);
  const published = submissions.filter((s) => s.status === "Published").length;

  return (
    <Drawer
      open={queueOpen}
      onClose={() => setQueueOpen(false)}
      title="Your contributions"
      subtitle="The data flywheel in miniature: submissions become verified records."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="primary"
            onClick={() => {
              setQueueOpen(false);
              openSubmit();
            }}
          >
            Submit intelligence
          </Button>
          {submissions.length > 0 && (
            <Button variant="ghost" onClick={resetDemo}>
              Reset prototype data
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Submitted" value={submissions.length} />
        <Stat label="Published" value={published} />
        <Stat label="Credits" value={credits} icon={<Sparkles className="size-3.5 text-warn" aria-hidden />} />
      </div>

      {submissions.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nothing submitted yet" body="Add a new GCC, an expansion or provider feedback and watch it move through review." />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {submissions.map((s) => {
            const Icon = ICON[s.type];
            return (
              <li key={s.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{s.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Pill tone={TONE[s.status]}>
                        {s.status === "Published" && <CheckCircle2 className="size-3" aria-hidden />}
                        {s.status}
                      </Pill>
                      <span className="tnum text-[12px] text-faint">+{s.credits} credits</span>
                    </div>
                  </div>
                </div>
                {s.status !== "Published" && (
                  <div className={cn("mt-3 flex items-center justify-between gap-3 border-t border-line pt-3")}>
                    <p className="text-[12px] text-faint">Prototype control</p>
                    <Button size="sm" onClick={() => approveSubmission(s.id)}>
                      Simulate reviewer approval
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Drawer>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] text-faint">{icon}{label}</p>
      <p className="tnum mt-1 text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}
