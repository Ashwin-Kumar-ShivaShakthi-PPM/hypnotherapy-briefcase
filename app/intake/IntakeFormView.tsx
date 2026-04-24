"use client";

import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  AuthShell,
  ErrorMessage,
  PrimaryButton,
  Spinner,
  TextareaField,
} from "../ui/primitives";
import type { Id } from "../../convex/_generated/dataModel";

export function IntakeFormView({
  inviteCode,
  episodeId,
}: {
  inviteCode: string;
  episodeId?: Id<"episodes">;
}) {
  const client = useQuery(api.intakeQueries.getClientByInviteCode, {
    inviteCode,
    episodeId,
  });
  const submit = useAction(api.intake.submitIntake);

  const [whatBringsYou, setWhatBringsYou] = useState("");
  const [successOutcome, setSuccessOutcome] = useState("");
  const [previousTherapy, setPreviousTherapy] = useState<null | boolean>(null);
  const [previousTherapyDescription, setPreviousTherapyDescription] =
    useState("");
  const [stressLevel, setStressLevel] = useState(5);
  const [additionalContext, setAdditionalContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previousTherapy === null) {
      setError("Please let us know if you've experienced hypnotherapy before.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submit({
        inviteCode,
        episodeId,
        whatBringsYou: whatBringsYou.trim(),
        successOutcome: successOutcome.trim(),
        previousTherapy,
        previousTherapyDescription: previousTherapy
          ? previousTherapyDescription.trim()
          : undefined,
        stressLevel,
        additionalContext: additionalContext.trim() || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Error:\s*/, "")
          : "We couldn't save your intake just now. Please try again."
      );
      setSubmitting(false);
    }
  };

  if (client === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center paper-grain">
        <Spinner label="Loading your intake…" />
      </div>
    );
  }

  if (client === null) {
    return (
      <AuthShell
        eyebrow="Intake"
        headline={<>We couldn&apos;t find that link.</>}
      >
        <p className="text-ink-muted text-[15px] leading-relaxed">
          The intake link may have expired or been mistyped. Please check with
          your practitioner.
        </p>
      </AuthShell>
    );
  }

  const episodeTitle = client.episode?.episodeTitle;

  if (done || client.alreadySubmitted) {
    return (
      <AuthShell
        eyebrow="Thank you"
        headline={
          <>
            You&apos;re all set,{" "}
            <span className="italic">{client.name.split(" ")[0]}.</span>
          </>
        }
      >
        <p className="text-ink-muted text-[16px] leading-relaxed">
          Your intake is with Ashwin. He&apos;ll read it carefully before your
          first session together
          {episodeTitle ? ` on ${episodeTitle}` : ""}.
        </p>
        <p className="text-ink-muted text-[16px] leading-relaxed mt-4">
          See you soon.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={
        episodeTitle
          ? `${episodeTitle} · Intake`
          : `Welcome, ${client.name.split(" ")[0]}`
      }
      headline={
        <>
          Before we begin, a few <span className="italic">gentle</span>{" "}
          questions.
        </>
      }
    >
      <p className="text-ink-muted text-[15px] leading-relaxed mb-6">
        There are no right answers. Take your time. What you share helps Ashwin
        arrive prepared for our first session.
      </p>
      <form onSubmit={onSubmit} className="space-y-6">
        <TextareaField
          id="whatBringsYou"
          label="What brings you to hypnotherapy today?"
          required
          value={whatBringsYou}
          onChange={setWhatBringsYou}
          rows={4}
          disabled={submitting}
        />
        <TextareaField
          id="successOutcome"
          label="What would a successful outcome look and feel like for you?"
          required
          value={successOutcome}
          onChange={setSuccessOutcome}
          rows={4}
          disabled={submitting}
        />
        <div>
          <p className="block text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-3">
            Have you experienced hypnotherapy before?
          </p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="prev"
                checked={previousTherapy === true}
                onChange={() => setPreviousTherapy(true)}
                className="accent-teal"
                disabled={submitting}
              />
              <span className="text-[15px]">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="prev"
                checked={previousTherapy === false}
                onChange={() => setPreviousTherapy(false)}
                className="accent-teal"
                disabled={submitting}
              />
              <span className="text-[15px]">No</span>
            </label>
          </div>
          {previousTherapy === true && (
            <div className="mt-4">
              <TextareaField
                id="prev-desc"
                label="Briefly, what was that like?"
                value={previousTherapyDescription}
                onChange={setPreviousTherapyDescription}
                rows={3}
                disabled={submitting}
              />
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="stress"
            className="block text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-3"
          >
            Current stress or distress level
          </label>
          <input
            id="stress"
            type="range"
            min={1}
            max={10}
            value={stressLevel}
            onChange={(e) => setStressLevel(parseInt(e.target.value, 10))}
            className="w-full accent-teal"
            disabled={submitting}
          />
          <div className="flex justify-between text-[12px] text-ink-muted mt-2">
            <span>1 · Calm</span>
            <span className="text-teal font-medium">{stressLevel}</span>
            <span>10 · Overwhelmed</span>
          </div>
        </div>

        <TextareaField
          id="additional"
          label="Anything you would like Ashwin to know before our first session?"
          value={additionalContext}
          onChange={setAdditionalContext}
          rows={4}
          disabled={submitting}
        />

        <ErrorMessage>{error}</ErrorMessage>
        <p className="text-[12px] text-ink-faint">
          Your data is private and encrypted.
        </p>
        <PrimaryButton type="submit" disabled={submitting} full>
          {submitting ? "Sending to Ashwin…" : "Send my intake"}
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
