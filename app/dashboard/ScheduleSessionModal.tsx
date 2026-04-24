"use client";

import { FormEvent, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ErrorMessage,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  TextField,
} from "../ui/primitives";
import type { Id } from "../../convex/_generated/dataModel";

export function ScheduleSessionModal({
  open,
  onClose,
  clientId,
  episodeId,
  clientName,
}: {
  open: boolean;
  onClose: () => void;
  clientId: Id<"clients"> | null;
  episodeId: Id<"episodes"> | null;
  clientName: string;
}) {
  const schedule = useAction(api.prep.scheduleAndGenerate);
  const [date, setDate] = useState(() =>
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [time, setTime] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!open || !clientId) return null;

  const reset = () => {
    setSubmitting(false);
    setError(null);
    setDone(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const scheduledFor = new Date(`${date}T${time}:00`).getTime();
      await schedule({
        clientId,
        episodeId: episodeId ?? undefined,
        scheduledFor,
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Error:\s*/, "")
          : "We couldn't schedule that just now. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 sm:p-8 bg-[rgba(26,30,28,0.55)]">
      <div className="bg-paper border border-rule w-full max-w-[520px] shadow-xl">
        <div className="px-6 sm:px-8 py-5 border-b border-rule flex items-center justify-between">
          <div>
            <h2 className="font-display text-[24px] text-ink">
              {done ? "Prep brief ready" : "Schedule a session"}
            </h2>
            <p className="text-[13px] text-ink-muted mt-1">For {clientName}</p>
          </div>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-ink-muted hover:text-ink"
            aria-label="Close"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        {!done ? (
          <form onSubmit={onSubmit} className="px-6 sm:px-8 py-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                id="session-date"
                label="Date"
                type="date"
                required
                value={date}
                onChange={setDate}
                disabled={submitting}
              />
              <TextField
                id="session-time"
                label="Time"
                type="time"
                required
                value={time}
                onChange={setTime}
                disabled={submitting}
              />
            </div>
            {submitting && (
              <div className="border border-rule bg-teal-soft/40 px-5 py-4">
                <Spinner label="Generating your prep brief…" />
              </div>
            )}
            <ErrorMessage>{error}</ErrorMessage>
            <p className="text-[12px] text-ink-faint">
              Your data is private and encrypted.
            </p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
              <SecondaryButton
                onClick={() => {
                  reset();
                  onClose();
                }}
                disabled={submitting}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={submitting}>
                {submitting ? "Scheduling…" : "Schedule & prep"}
              </PrimaryButton>
            </div>
          </form>
        ) : (
          <div className="px-6 sm:px-8 py-6 space-y-4">
            <p className="text-[15px] text-ink-muted leading-relaxed">
              Your prep brief is ready on {clientName}&apos;s card. Open it any
              time before the session.
            </p>
            <div className="flex justify-end">
              <PrimaryButton
                onClick={() => {
                  reset();
                  onClose();
                }}
              >
                Done
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
