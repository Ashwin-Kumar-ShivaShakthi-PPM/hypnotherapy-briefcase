"use client";

import { useEffect, useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  ErrorMessage,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  TextField,
} from "../ui/primitives";
import type { Id } from "../../convex/_generated/dataModel";
import { normalizeBodyHtml } from "../../lib/emailHtml";

export function RecapReviewModal({
  recapId,
  onClose,
}: {
  recapId: Id<"sessionRecaps"> | null;
  onClose: () => void;
}) {
  const recap = useQuery(
    api.recaps.getRecap,
    recapId ? { recapId } : "skip"
  );
  const sendEmail = useAction(api.sessions.sendRecapEmail);
  const saveEdits = useAction(api.sessions.saveRecapEdits);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bodyMode, setBodyMode] = useState<"edit" | "preview">("preview");
  const [busy, setBusy] = useState<false | "save" | "send">(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (recap?.draftEmailSubject) setSubject(recap.draftEmailSubject);
    if (recap?.draftEmailBody) setBody(recap.draftEmailBody);
    setBodyMode("preview");
  }, [recap?._id]);

  const previewHtml = useMemo(() => normalizeBodyHtml(body), [body]);

  if (!recapId) return null;

  const onSend = async () => {
    if (!recapId) return;
    setBusy("send");
    setError(null);
    try {
      const r = await sendEmail({ recapId, subject, body });
      setSuccess(`Email sent to ${r.to}. Session saved.`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Error:\s*/, "")
          : "We couldn't send that email. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    if (!recapId) return;
    setBusy("save");
    setError(null);
    try {
      await saveEdits({ recapId, subject, body });
      setSuccess("Session saved.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^.*Error:\s*/, "")
          : "We couldn't save your changes. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-center bg-[rgba(26,30,28,0.55)] p-2 sm:p-6">
      <div className="bg-paper border border-rule w-full max-w-[1100px] max-h-[96vh] overflow-hidden flex flex-col shadow-xl">
        <div className="px-6 sm:px-8 py-5 border-b border-rule flex items-center justify-between">
          <div>
            <h2 className="font-display text-[24px] text-ink">
              Session intelligence
            </h2>
            <p className="text-[13px] text-ink-muted mt-1">
              Review, refine, then send to your client.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-xl"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!recap ? (
          <div className="flex-1 flex items-center justify-center p-10">
            <Spinner label="Loading your session…" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-rule">
            {/* Left: editable email */}
            <div className="p-6 sm:p-8 space-y-5 bg-paper-card">
              <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted">
                Draft follow-up email
              </p>
              <TextField
                id="email-subject"
                label="Subject"
                value={subject}
                onChange={setSubject}
                disabled={busy !== false}
              />
              <div>
                <div className="flex items-end justify-between mb-2">
                  <label
                    htmlFor="email-body"
                    className="block text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted"
                  >
                    Body · HTML
                  </label>
                  <div
                    role="tablist"
                    className="flex border border-rule"
                    aria-label="Body view"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={bodyMode === "preview"}
                      onClick={() => setBodyMode("preview")}
                      className={`px-3 py-1 text-[12px] tracking-wide ${
                        bodyMode === "preview"
                          ? "bg-teal text-paper"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={bodyMode === "edit"}
                      onClick={() => setBodyMode("edit")}
                      className={`px-3 py-1 text-[12px] tracking-wide border-l border-rule ${
                        bodyMode === "edit"
                          ? "bg-teal text-paper"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      Edit HTML
                    </button>
                  </div>
                </div>
                {bodyMode === "edit" ? (
                  <textarea
                    id="email-body"
                    rows={22}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-4 py-3 bg-paper border border-rule rounded-none text-[13px] text-ink focus:outline-none focus:border-teal leading-relaxed font-mono"
                    disabled={busy !== false}
                    spellCheck={false}
                  />
                ) : (
                  <div
                    id="email-body"
                    className="border border-rule bg-[#fbfaf7] px-6 py-5 min-h-[480px] font-serif text-[16px] leading-[1.8] text-ink recap-preview"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                )}
                <p className="mt-2 text-[12px] text-ink-muted">
                  {bodyMode === "preview"
                    ? "This is how the email will render for your client."
                    : "Edit the HTML directly — switch to Preview to see it rendered."}
                </p>
              </div>
              <ErrorMessage>{error}</ErrorMessage>
              {success && (
                <p className="text-sm text-teal-deep">{success}</p>
              )}
              <p className="text-[13px] text-ink-muted">
                Your data is private and encrypted.
              </p>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <SecondaryButton onClick={onSave} disabled={busy !== false}>
                  {busy === "save" ? "Saving…" : "Save without sending"}
                </SecondaryButton>
                <PrimaryButton onClick={onSend} disabled={busy !== false}>
                  {busy === "send" ? "Sending…" : "Send to client"}
                </PrimaryButton>
              </div>
            </div>

            {/* Right: intelligence card */}
            <div className="p-6 sm:p-8 space-y-6 bg-paper-intel">
              <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted">
                Intelligence card
              </p>

              <IntelSection label="Objective">
                <p className="text-[15px] leading-relaxed">
                  {recap.okrObjective || "—"}
                </p>
                {recap.okrKeyResults.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {recap.okrKeyResults.map((kr: string, i: number) => (
                      <li
                        key={i}
                        className="flex gap-3 text-[15px] leading-relaxed text-ink-muted"
                      >
                        <span
                          className="mt-[0.6em] h-[5px] w-[5px] bg-teal shrink-0"
                          aria-hidden
                        />
                        {kr}
                      </li>
                    ))}
                  </ul>
                )}
                {recap.okrProgress && (
                  <p className="mt-3 text-[15px] text-ink-muted italic">
                    {recap.okrProgress}
                  </p>
                )}
              </IntelSection>

              <IntelSection label="Problem → Solution">
                {recap.problemSolutionFit.length === 0 ? (
                  <p className="text-ink-muted text-[15px]">—</p>
                ) : (
                  <div className="space-y-4">
                    {recap.problemSolutionFit.map(
                      (
                        p: { problem: string; solution: string },
                        i: number
                      ) => (
                        <div key={i} className="border-l-2 border-teal pl-4">
                          <p className="text-[13px] text-ink-muted leading-relaxed">
                            <span className="text-ink">Problem: </span>
                            {p.problem}
                          </p>
                          <p className="mt-1 text-[13px] text-ink-muted leading-relaxed">
                            <span className="text-ink">Solution: </span>
                            {p.solution}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </IntelSection>

              <IntelSection label="What the client may notice">
                {recap.outcomesToExpect.length === 0 ? (
                  <p className="text-ink-muted text-[15px]">—</p>
                ) : (
                  <ul className="space-y-2">
                    {recap.outcomesToExpect.map((o: string, i: number) => (
                      <li
                        key={i}
                        className="flex gap-3 text-[15px] leading-relaxed text-ink-muted"
                      >
                        <span
                          className="mt-[0.6em] h-[5px] w-[5px] bg-teal shrink-0"
                          aria-hidden
                        />
                        {o}
                      </li>
                    ))}
                  </ul>
                )}
              </IntelSection>

              <IntelSection label="Action roadmap">
                {recap.actionItems.length === 0 ? (
                  <p className="text-ink-muted text-[15px]">—</p>
                ) : (
                  <ol className="space-y-3">
                    {recap.actionItems.map(
                      (
                        a: {
                          step: number;
                          action: string;
                          when: string;
                          why: string;
                        },
                        i: number
                      ) => (
                        <li key={i} className="text-[15px] leading-relaxed">
                          <p className="text-ink">
                            <span className="text-teal mr-2">{a.step}.</span>
                            {a.action}
                          </p>
                          <p className="text-ink-muted mt-1">
                            <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-ink-muted mr-2">
                              When:
                            </span>
                            {a.when}
                          </p>
                          <p className="text-ink-muted italic mt-1">{a.why}</p>
                        </li>
                      )
                    )}
                  </ol>
                )}
              </IntelSection>

              <IntelSection label="Transformation delta">
                <p className="text-[15px] leading-relaxed">
                  {recap.transformationDelta || "—"}
                </p>
              </IntelSection>

              <IntelSection label="Next focus">
                <p className="text-[15px] leading-relaxed">
                  {recap.nextFocus || "—"}
                </p>
              </IntelSection>

              <IntelSection label="Engagement signal">
                <SignalPill signal={recap.engagementSignal} />
                <p className="mt-2 text-[13px] text-ink-muted italic leading-relaxed">
                  {recap.engagementSignalEvidence}
                </p>
              </IntelSection>

              <IntelSection label="Practitioner note">
                <p className="text-[15px] leading-relaxed text-ink-muted">
                  {recap.practitionerNote || "—"}
                </p>
              </IntelSection>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IntelSection({
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
      <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

export function SignalPill({
  signal,
}: {
  signal: "active" | "needs_attention" | "at_risk";
}) {
  const styles = {
    active: {
      label: "Active",
      className: "bg-teal-soft text-teal-deep border-teal",
    },
    needs_attention: {
      label: "Needs attention",
      className: "bg-[#fff3dc] text-[#8a5a00] border-[#d4a85a]",
    },
    at_risk: {
      label: "At risk",
      className: "bg-[#fce8e3] text-[#8a2a1c] border-[#c9695a]",
    },
  }[signal];
  return (
    <span
      className={`inline-block px-3 py-1 text-[11px] tracking-[0.18em] uppercase border ${styles.className}`}
    >
      {styles.label}
    </span>
  );
}
