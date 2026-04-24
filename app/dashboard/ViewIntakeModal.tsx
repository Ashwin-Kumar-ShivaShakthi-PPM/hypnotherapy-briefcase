"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PrimaryButton, Spinner } from "../ui/primitives";
import type { Id } from "../../convex/_generated/dataModel";

export function ViewIntakeModal({
  open,
  onClose,
  episodeId,
  clientName,
  inviteCode,
}: {
  open: boolean;
  onClose: () => void;
  episodeId: Id<"episodes"> | null;
  clientName: string;
  inviteCode: string | null;
}) {
  const detail = useQuery(
    api.intakeQueries.getIntakeForEpisode,
    open && episodeId ? { episodeId } : "skip"
  );

  if (!open || !episodeId) return null;

  const intake = detail?.intake;
  const episodeTitle = detail?.episode.episodeTitle;
  const intakeLink =
    inviteCode && episodeId && typeof window !== "undefined"
      ? `${window.location.origin}/intake/${inviteCode}/${episodeId}`
      : null;

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 sm:p-8 bg-[rgba(26,30,28,0.55)]">
      <div className="bg-paper border border-rule w-full max-w-[640px] max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="px-6 sm:px-8 py-5 border-b border-rule flex items-center justify-between">
          <div>
            <h2 className="font-display text-[24px] text-ink">Intake</h2>
            <p className="text-[13px] text-ink-muted mt-1">
              {clientName}
              {episodeTitle && (
                <span className="mx-2 text-ink-faint">·</span>
              )}
              {episodeTitle}
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

        <div className="px-6 sm:px-8 py-6 space-y-5 bg-paper-card">
          {detail === undefined && <Spinner label="Loading intake…" />}
          {detail && !intake && (
            <div className="space-y-4">
              <p className="text-[15px] text-ink leading-relaxed">
                {clientName} hasn&apos;t completed the intake for this episode
                yet.
              </p>
              {intakeLink && (
                <div className="border border-rule bg-paper px-4 py-3">
                  <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-2">
                    Intake link to share
                  </p>
                  <p className="text-[13px] text-teal break-all">
                    {intakeLink}
                  </p>
                </div>
              )}
            </div>
          )}
          {intake && (
            <div className="space-y-5">
              {intake.assistedBy === "practitioner" && (
                <p className="text-[12px] text-teal-deep italic">
                  Completed by practitioner during call
                </p>
              )}
              {intake.aiSummary && (
                <div
                  className="pl-4 py-1"
                  style={{ borderLeft: "3px solid var(--intel-field-border)" }}
                >
                  <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-teal-deep mb-2">
                    Pre-session snapshot
                  </p>
                  <p className="text-[15px] leading-relaxed text-ink-muted">
                    {intake.aiSummary}
                  </p>
                </div>
              )}
              <Field label="What brings them">{intake.whatBringsYou}</Field>
              <Field label="Successful outcome">
                {intake.successOutcome}
              </Field>
              <Field label="Previous therapy">
                {intake.previousTherapy
                  ? `Yes — ${intake.previousTherapyDescription ?? ""}`
                  : "No"}
              </Field>
              <Field label="Current stress level">
                {intake.stressLevel} / 10
              </Field>
              {intake.additionalContext && (
                <Field label="Additional context">
                  {intake.additionalContext}
                </Field>
              )}
            </div>
          )}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-1">
        {label}
      </p>
      <p className="text-[15px] leading-relaxed text-ink whitespace-pre-line">
        {children}
      </p>
    </div>
  );
}
