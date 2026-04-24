"use client";

import { FormEvent, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ErrorMessage,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  TextField,
  TextareaField,
} from "../ui/primitives";
import type { Id } from "../../convex/_generated/dataModel";
import { IntakeForm, IntakeFormValues } from "./IntakeFields";

type Stage =
  | { kind: "form" }
  | { kind: "sending" }
  | { kind: "sent"; email: string; emailSent: boolean; emailError?: string }
  | { kind: "assisted"; episodeId: Id<"episodes">; inviteCode: string }
  | { kind: "assisted-done" };

export function NewEpisodeModal({
  open,
  onClose,
  clientId,
  clientName,
  clientEmail,
  inviteCode,
}: {
  open: boolean;
  onClose: () => void;
  clientId: Id<"clients"> | null;
  clientName: string;
  clientEmail: string;
  inviteCode: string;
}) {
  const createWithWelcome = useAction(api.onboarding.createEpisodeAndWelcome);
  const createLocal = useMutation(api.episodes.createEpisode);
  const submitIntake = useAction(api.intake.submitIntake);

  const [title, setTitle] = useState("");
  const [presentingIssue, setPresentingIssue] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "form" });
  const [error, setError] = useState<string | null>(null);

  if (!open || !clientId) return null;

  const reset = () => {
    setTitle("");
    setPresentingIssue("");
    setStage({ kind: "form" });
    setError(null);
  };

  const onSendToClient = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !presentingIssue.trim()) {
      setError("Please fill in both the episode title and the presenting issue.");
      return;
    }
    setStage({ kind: "sending" });
    setError(null);
    try {
      const result = await createWithWelcome({
        clientId,
        episodeTitle: title.trim(),
        presentingIssue: presentingIssue.trim(),
      });
      setStage({
        kind: "sent",
        email: clientEmail,
        emailSent: result.emailSent,
        emailError: result.emailError,
      });
    } catch (err) {
      setStage({ kind: "form" });
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Error:\s*/, "")
          : "We couldn't create that episode just now. Please try again."
      );
    }
  };

  const onStartAssisted = async () => {
    if (!title.trim() || !presentingIssue.trim()) {
      setError("Please fill in both the episode title and the presenting issue.");
      return;
    }
    setError(null);
    try {
      const { episodeId } = await createLocal({
        clientId,
        episodeTitle: title.trim(),
        presentingIssue: presentingIssue.trim(),
      });
      setStage({ kind: "assisted", episodeId, inviteCode });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Error:\s*/, "")
          : "We couldn't create that episode just now. Please try again."
      );
    }
  };

  const onAssistedSubmit = async (
    values: IntakeFormValues,
    episodeId: Id<"episodes">
  ) => {
    setStage((s) => (s.kind === "assisted" ? { ...s } : s));
    try {
      await submitIntake({
        inviteCode,
        episodeId,
        assistedBy: "practitioner",
        ...values,
      });
      setStage({ kind: "assisted-done" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Error:\s*/, "")
          : "We couldn't save that intake. Please try again."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 sm:p-8 bg-[rgba(26,30,28,0.55)]">
      <div className="bg-paper border border-rule w-full max-w-[640px] max-h-[94vh] overflow-y-auto shadow-xl">
        <div className="px-6 sm:px-8 py-5 border-b border-rule flex items-center justify-between">
          <div>
            <h2 className="font-display text-[24px] text-ink">
              {stage.kind === "assisted"
                ? "Assisted intake"
                : stage.kind === "assisted-done"
                  ? "Intake recorded"
                  : stage.kind === "sent"
                    ? "New episode created"
                    : "New episode"}
            </h2>
            <p className="text-[13px] text-ink-muted mt-1">
              For {clientName}
            </p>
          </div>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            className="text-ink-muted hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {stage.kind === "form" && (
          <form
            onSubmit={onSendToClient}
            className="px-6 sm:px-8 py-6 space-y-5 bg-paper-card"
          >
            <TextField
              id="episode-title"
              label="Episode title"
              required
              value={title}
              onChange={setTitle}
              placeholder="e.g. Managing fears — July 2026"
            />
            <TextareaField
              id="episode-issue"
              label="Presenting issue"
              required
              value={presentingIssue}
              onChange={setPresentingIssue}
              rows={3}
              placeholder="What are we focused on in this chapter?"
            />
            <ErrorMessage>{error}</ErrorMessage>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              Choose how to begin this chapter. Either email the client their
              intake link, or complete intake with them now on a call.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <PrimaryButton type="submit">
                Send intake to client
              </PrimaryButton>
              <SecondaryButton onClick={onStartAssisted}>
                Complete intake now with client
              </SecondaryButton>
            </div>
            <p className="text-[12px] text-ink-faint">
              Your data is private and encrypted.
            </p>
          </form>
        )}

        {stage.kind === "sending" && (
          <div className="px-6 sm:px-8 py-10">
            <Spinner label="Creating episode and sending welcome email…" />
          </div>
        )}

        {stage.kind === "sent" && (
          <div className="px-6 sm:px-8 py-6 space-y-4">
            {stage.emailSent ? (
              <p className="text-[15px] text-ink leading-relaxed">
                Episode created and a welcome email with the intake link has
                been sent to{" "}
                <span className="text-teal">{stage.email}</span>.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-[15px] text-ink leading-relaxed">
                  Episode created — but we couldn&apos;t send the welcome
                  email just now.
                </p>
                {stage.emailError && (
                  <p className="text-[13px] text-ink-muted">
                    {stage.emailError}
                  </p>
                )}
              </div>
            )}
            <p className="text-[12px] text-ink-faint">
              Your data is private and encrypted.
            </p>
            <div className="flex justify-end pt-2">
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

        {stage.kind === "assisted" && (
          <div className="px-6 sm:px-8 py-6 bg-paper-card">
            <p className="text-[13px] text-ink-muted mb-5 leading-relaxed">
              Completing intake on behalf of {clientName}. Fields mirror the
              client self-serve form.
            </p>
            <IntakeForm
              submitting={false}
              submitLabel="Save intake"
              onSubmit={(values) =>
                onAssistedSubmit(values, (stage as { episodeId: Id<"episodes"> }).episodeId)
              }
              onCancel={() => {
                reset();
                onClose();
              }}
              cancelLabel="Close without saving"
            />
            <ErrorMessage>{error}</ErrorMessage>
          </div>
        )}

        {stage.kind === "assisted-done" && (
          <div className="px-6 sm:px-8 py-6 space-y-4">
            <p className="text-[15px] text-ink leading-relaxed">
              Intake recorded for {clientName}. The AI summary is generating in
              the background and will appear on this client&apos;s card shortly.
            </p>
            <p className="text-[13px] text-ink-muted">
              This intake is marked as completed with you on a call.
            </p>
            <div className="flex justify-end pt-2">
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
