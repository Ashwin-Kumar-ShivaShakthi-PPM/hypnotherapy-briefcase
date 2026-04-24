"use client";

import { PrimaryButton } from "../ui/primitives";

type PrepBrief = {
  _id: string;
  scheduledFor: number;
  coreJtbd: string;
  situationalStatus: string;
  unfinishedBusiness: string;
  actionStepIntelligence: string;
  recommendedFocus: string;
};

export function PrepBriefModal({
  open,
  onClose,
  clientName,
  brief,
}: {
  open: boolean;
  onClose: () => void;
  clientName: string;
  brief: PrepBrief | null;
}) {
  if (!open || !brief) return null;

  const scheduledAt = new Date(brief.scheduledFor);
  const now = Date.now();
  const hoursUntil = (brief.scheduledFor - now) / (1000 * 60 * 60);
  const label =
    hoursUntil < 0
      ? "Session already passed"
      : hoursUntil < 2
        ? "Session starting soon"
        : `Session in ${Math.round(hoursUntil)} hours`;

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 sm:p-8 bg-[rgba(26,30,28,0.55)]">
      <div className="bg-paper border border-rule w-full max-w-[640px] max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="px-6 sm:px-8 py-5 border-b border-rule flex items-center justify-between">
          <div>
            <h2 className="font-display text-[24px] text-ink">Prep brief</h2>
            <p className="text-[13px] text-ink-muted mt-1">
              {clientName} · {scheduledAt.toLocaleString(undefined, {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              · {label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="px-6 sm:px-8 py-6 space-y-5">
          <Section label="Core JTBD">{brief.coreJtbd}</Section>
          <Section label="Situational status">
            {brief.situationalStatus}
          </Section>
          <Section label="Unfinished business">
            {brief.unfinishedBusiness}
          </Section>
          <Section label="Action-step intelligence">
            {brief.actionStepIntelligence}
          </Section>
          <Section label="Recommended focus">{brief.recommendedFocus}</Section>
          <p className="text-[12px] text-ink-faint">
            Your data is private and encrypted.
          </p>
          <div className="flex justify-end">
            <PrimaryButton onClick={onClose}>Close</PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="pl-4 py-1"
      style={{ borderLeft: "3px solid var(--intel-field-border)" }}
    >
      <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-1">
        {label}
      </p>
      <p className="text-[15px] leading-relaxed text-ink">{children || "—"}</p>
    </div>
  );
}
