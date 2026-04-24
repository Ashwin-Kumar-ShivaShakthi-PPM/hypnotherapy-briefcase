"use client";

import { FormEvent, useState } from "react";
import { TextareaField } from "../ui/primitives";

export type IntakeFormValues = {
  whatBringsYou: string;
  successOutcome: string;
  previousTherapy: boolean;
  previousTherapyDescription?: string;
  stressLevel: number;
  additionalContext?: string;
};

export function IntakeForm({
  onSubmit,
  submitting,
  disabled,
  submitLabel,
  showPrivacyLine = true,
  onCancel,
  cancelLabel = "Cancel",
}: {
  onSubmit: (values: IntakeFormValues) => void;
  submitting: boolean;
  disabled?: boolean;
  submitLabel: string;
  showPrivacyLine?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
}) {
  const [whatBringsYou, setWhatBringsYou] = useState("");
  const [successOutcome, setSuccessOutcome] = useState("");
  const [previousTherapy, setPreviousTherapy] = useState<null | boolean>(null);
  const [prevDesc, setPrevDesc] = useState("");
  const [stressLevel, setStressLevel] = useState(5);
  const [additionalContext, setAdditionalContext] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (previousTherapy === null) {
      setLocalError(
        "Please indicate whether they've experienced hypnotherapy before."
      );
      return;
    }
    setLocalError(null);
    onSubmit({
      whatBringsYou: whatBringsYou.trim(),
      successOutcome: successOutcome.trim(),
      previousTherapy,
      previousTherapyDescription: previousTherapy
        ? prevDesc.trim()
        : undefined,
      stressLevel,
      additionalContext: additionalContext.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <TextareaField
        id="whatBringsYou"
        label="What brings you to hypnotherapy today?"
        required
        value={whatBringsYou}
        onChange={setWhatBringsYou}
        rows={4}
        disabled={submitting || disabled}
      />
      <TextareaField
        id="successOutcome"
        label="What would a successful outcome look and feel like for you?"
        required
        value={successOutcome}
        onChange={setSuccessOutcome}
        rows={4}
        disabled={submitting || disabled}
      />
      <div>
        <p className="block text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-3">
          Have you experienced hypnotherapy before?
        </p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="prev-assisted"
              checked={previousTherapy === true}
              onChange={() => setPreviousTherapy(true)}
              className="accent-teal"
              disabled={submitting || disabled}
            />
            <span className="text-[15px]">Yes</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="prev-assisted"
              checked={previousTherapy === false}
              onChange={() => setPreviousTherapy(false)}
              className="accent-teal"
              disabled={submitting || disabled}
            />
            <span className="text-[15px]">No</span>
          </label>
        </div>
        {previousTherapy === true && (
          <div className="mt-4">
            <TextareaField
              id="prev-desc-assisted"
              label="Briefly, what was that like?"
              value={prevDesc}
              onChange={setPrevDesc}
              rows={3}
              disabled={submitting || disabled}
            />
          </div>
        )}
      </div>
      <div>
        <label
          htmlFor="stress-assisted"
          className="block text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-3"
        >
          Current stress or distress level
        </label>
        <input
          id="stress-assisted"
          type="range"
          min={1}
          max={10}
          value={stressLevel}
          onChange={(e) => setStressLevel(parseInt(e.target.value, 10))}
          className="w-full accent-teal"
          disabled={submitting || disabled}
        />
        <div className="flex justify-between text-[12px] text-ink-muted mt-2">
          <span>1 · Calm</span>
          <span className="text-teal font-medium">{stressLevel}</span>
          <span>10 · Overwhelmed</span>
        </div>
      </div>
      <TextareaField
        id="additional-assisted"
        label="Anything else to know before the first session?"
        value={additionalContext}
        onChange={setAdditionalContext}
        rows={3}
        disabled={submitting || disabled}
      />
      {localError && (
        <p className="text-sm text-[#a1392b]">{localError}</p>
      )}
      {showPrivacyLine && (
        <p className="text-[12px] text-ink-faint">
          Your data is private and encrypted.
        </p>
      )}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="h-12 px-6 border border-rule text-ink rounded-none font-medium tracking-wide hover:border-teal hover:text-teal transition-colors disabled:opacity-60"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || disabled}
          className="h-12 px-6 bg-teal text-paper rounded-none font-medium tracking-wide hover:bg-teal-deep transition-colors disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
