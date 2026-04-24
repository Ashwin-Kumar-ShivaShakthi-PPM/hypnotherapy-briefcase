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
  TextareaField,
} from "../ui/primitives";

export function AddClientModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const createClientAndWelcome = useAction(
    api.onboarding.createClientAndWelcome
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("Initial engagement");
  const [presentingIssue, setPresentingIssue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    inviteCode: string;
    name: string;
    email: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const reset = () => {
    setName("");
    setEmail("");
    setEpisodeTitle("Initial engagement");
    setPresentingIssue("");
    setSubmitting(false);
    setError(null);
    setResult(null);
    setCopied(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const r = await createClientAndWelcome({
        name: name.trim(),
        email: email.trim(),
        episodeTitle: episodeTitle.trim() || "Initial engagement",
        presentingIssue: presentingIssue.trim(),
      });
      setResult({
        inviteCode: r.inviteCode,
        name: name.trim(),
        email: email.trim(),
        emailSent: r.emailSent,
        emailError: r.emailError,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Error:\s*/, "")
          : "We couldn't save that client. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 sm:p-8 bg-[rgba(26,30,28,0.55)]">
      <div className="bg-paper border border-rule w-full max-w-[560px] max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="px-6 sm:px-8 py-5 border-b border-rule flex items-center justify-between">
          <h2 className="font-display text-[24px] text-ink">
            {result ? "Client added" : "Add a new client"}
          </h2>
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

        {!result ? (
          <form
            onSubmit={onSubmit}
            className="px-6 sm:px-8 py-6 space-y-5 bg-paper-card"
          >
            <TextField
              id="client-name"
              label="Client name"
              required
              value={name}
              onChange={setName}
              disabled={submitting}
            />
            <TextField
              id="client-email"
              label="Client email"
              type="email"
              required
              value={email}
              onChange={setEmail}
              disabled={submitting}
              hint="We'll email them their intake link immediately."
            />
            <TextField
              id="episode-title"
              label="Episode title"
              required
              value={episodeTitle}
              onChange={setEpisodeTitle}
              disabled={submitting}
              hint="e.g. Initial engagement, Managing fears — July 2026"
            />
            <TextareaField
              id="presenting-issue"
              label="Presenting issue"
              required
              value={presentingIssue}
              onChange={setPresentingIssue}
              disabled={submitting}
              placeholder="What brings them to your practice?"
              rows={3}
            />
            <ErrorMessage>{error}</ErrorMessage>
            {submitting && (
              <div className="border border-rule bg-teal-soft/50 px-5 py-3">
                <Spinner label="Saving client and sending welcome email…" />
              </div>
            )}
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
                {submitting ? "Saving…" : "Add client"}
              </PrimaryButton>
            </div>
          </form>
        ) : (
          <div className="px-6 sm:px-8 py-6 space-y-5">
            {result.emailSent ? (
              <p className="text-[15px] text-ink leading-relaxed">
                Client added and welcome email sent to{" "}
                <span className="text-teal">{result.email}</span>.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[15px] text-ink leading-relaxed">
                  {result.name} is saved — but we couldn&apos;t send the
                  welcome email just now.
                </p>
                {result.emailError && (
                  <p className="text-[13px] text-ink-muted">
                    {result.emailError}
                  </p>
                )}
              </div>
            )}
            <div className="border border-rule bg-teal-soft/50 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-teal-deep">
                  Invite code
                </p>
                <p className="font-display text-[36px] leading-none mt-2 text-teal-deep tracking-[0.15em]">
                  {result.inviteCode}
                </p>
              </div>
              <button
                onClick={copy}
                className="h-10 px-4 border border-teal text-teal hover:bg-teal hover:text-paper transition-colors text-[13px]"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-[13px] text-ink-muted leading-relaxed">
              They can also sign into their portal at{" "}
              <span className="text-teal">/signup/client</span> using this
              code.
            </p>
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
      </div>
    </div>
  );
}
