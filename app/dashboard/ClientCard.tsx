"use client";

import { useMemo, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignalPill } from "./RecapReviewModal";
import { SecondaryButton } from "../ui/primitives";
import type { Id } from "../../convex/_generated/dataModel";

export type EpisodeSummary = {
  _id: Id<"episodes">;
  episodeTitle: string;
  presentingIssue: string;
  status: "active" | "closed";
  sessionCount: number;
  hasIntake: boolean;
  createdAt: number;
};

type ClientCardProps = {
  client: {
    _id: Id<"clients">;
    name: string;
    email: string;
    sessionCount: number;
    presentingIssue: string;
    inviteCode: string;
    hasIntake: boolean;
    episodes: EpisodeSummary[];
    welcomeEmailStatus: "pending" | "sent" | "failed" | null;
    welcomeEmailError: string | null;
    latestRecap: {
      _id: Id<"sessionRecaps">;
      engagementSignal: "active" | "needs_attention" | "at_risk";
      transformationDelta: string;
      nextFocus: string;
      practitionerNote: string;
    } | null;
    upcomingPrep: {
      _id: Id<"prepBriefs">;
      scheduledFor: number;
    } | null;
  };
  onUpload: (episodeId: Id<"episodes">) => void;
  onViewIntake: (episodeId: Id<"episodes">) => void;
  onSchedule: (episodeId: Id<"episodes">) => void;
  onNewEpisode: () => void;
  onOpenRecap: () => void;
  onOpenPrep: () => void;
};

export function ClientCard({
  client,
  onUpload,
  onViewIntake,
  onSchedule,
  onNewEpisode,
  onOpenRecap,
  onOpenPrep,
}: ClientCardProps) {
  const activeEpisodes = useMemo(
    () => client.episodes.filter((e) => e.status === "active"),
    [client.episodes]
  );
  const defaultEpisodeId = activeEpisodes[0]?._id ?? client.episodes[0]?._id;
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<
    Id<"episodes"> | undefined
  >(defaultEpisodeId);
  const [episodesExpanded, setEpisodesExpanded] = useState(false);

  const recap = client.latestRecap;
  const prep = client.upcomingPrep;
  const prepReadySoon =
    prep && prep.scheduledFor - Date.now() < 1000 * 60 * 60 * 2;
  const hoursUntil = prep
    ? Math.max(0, Math.round((prep.scheduledFor - Date.now()) / 3600000))
    : null;

  const currentEpisode =
    client.episodes.find((e) => e._id === selectedEpisodeId) ??
    activeEpisodes[0];
  const hasActionableEpisode = !!currentEpisode;

  const resendWelcome = useAction(api.onboarding.resendClientWelcome);
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<null | {
    ok: boolean;
    message: string;
  }>(null);

  const onRetryWelcome = async () => {
    setRetrying(true);
    setRetryResult(null);
    try {
      const r = await resendWelcome({ clientId: client._id });
      setRetryResult({
        ok: r.emailSent,
        message: r.emailSent
          ? `Welcome email sent to ${client.email}.`
          : r.emailError ?? "Send failed.",
      });
    } catch (err) {
      setRetryResult({
        ok: false,
        message:
          err instanceof Error
            ? err.message.replace(/^.*Error:\s*/, "")
            : "We couldn't retry the send.",
      });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <article
      id={`client-${client._id}`}
      className="bg-paper p-6 sm:p-7 flex flex-col gap-5 scroll-mt-24 shadow-card"
      style={{
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
      }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-[26px] text-ink leading-tight">
            {client.name}
          </h3>
          <p className="text-[13px] text-ink-muted mt-1">
            {client.sessionCount}{" "}
            {client.sessionCount === 1 ? "session" : "sessions"}
            {client.hasIntake && (
              <span className="ml-3 inline-block px-2 py-[2px] border border-teal text-teal text-[11px] tracking-[0.12em] font-semibold uppercase">
                Intake received
              </span>
            )}
          </p>
        </div>
        {recap ? (
          <SignalPill signal={recap.engagementSignal} />
        ) : (
          <span className="inline-block px-3 py-1 text-[11px] tracking-[0.12em] font-semibold uppercase border border-rule text-ink-muted">
            New
          </span>
        )}
      </header>

      {recap ? (
        <div className="space-y-3 text-[15px] leading-relaxed text-ink-muted">
          {recap.transformationDelta && (
            <p>
              <span className="text-ink-muted uppercase text-[11px] tracking-[0.12em] font-semibold mr-2">
                Delta
              </span>
              {recap.transformationDelta}
            </p>
          )}
          {recap.nextFocus && (
            <p>
              <span className="text-ink-muted uppercase text-[11px] tracking-[0.12em] font-semibold mr-2">
                Next focus
              </span>
              {recap.nextFocus}
            </p>
          )}
          {recap.practitionerNote && (
            <p className="italic">
              <span className="text-ink-muted uppercase text-[11px] tracking-[0.12em] font-semibold mr-2 not-italic">
                Note
              </span>
              {recap.practitionerNote}
            </p>
          )}
        </div>
      ) : (
        <p className="text-[15px] text-ink-muted leading-relaxed italic">
          Upload your first session transcript to generate intelligence.
        </p>
      )}

      {client.welcomeEmailStatus === "failed" && (
        <div
          className="border px-4 py-3 flex flex-col gap-2"
          style={{
            borderColor: "#c9695a",
            background: "#fce8e3",
            borderRadius: 8,
          }}
        >
          <p className="text-[13px] font-semibold" style={{ color: "#8a2a1c" }}>
            Welcome email couldn&apos;t be delivered
          </p>
          {client.welcomeEmailError && (
            <p className="text-[13px] leading-relaxed" style={{ color: "#5c2a20" }}>
              {client.welcomeEmailError}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onRetryWelcome}
              disabled={retrying}
              className="text-[13px] text-teal hover:text-teal-deep underline underline-offset-4 disabled:opacity-60"
            >
              {retrying ? "Retrying…" : "Retry now"}
            </button>
            {retryResult && (
              <span
                className="text-[13px]"
                style={{ color: retryResult.ok ? "#0a4e3d" : "#8a2a1c" }}
              >
                {retryResult.message}
              </span>
            )}
          </div>
        </div>
      )}

      {prep && (
        <button
          onClick={onOpenPrep}
          className="flex items-center gap-2 text-left border border-teal-soft bg-teal-soft/60 px-4 py-3 hover:bg-teal-soft transition-colors"
        >
          <ClockIcon />
          <span className="text-[13px] text-teal-deep flex-1">
            {prepReadySoon ? (
              <>
                <span className="font-medium">Prep brief ready</span> — session
                starting soon
              </>
            ) : (
              <>
                Prep brief · Session in{" "}
                {hoursUntil === 0
                  ? "less than 1 hour"
                  : `${hoursUntil} hours`}
              </>
            )}
          </span>
        </button>
      )}

      {/* Episodes */}
      <div className="border-t border-rule pt-4">
        <button
          onClick={() => setEpisodesExpanded((v) => !v)}
          className="w-full flex items-center justify-between text-left group"
        >
          <span className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted">
            Episodes · {client.episodes.length}
          </span>
          <span className="text-[12px] text-ink-muted group-hover:text-teal transition-colors">
            {episodesExpanded ? "Hide" : "Show"}
          </span>
        </button>
        {episodesExpanded && (
          <ul className="mt-3 space-y-2">
            {client.episodes.map((ep) => (
              <li
                key={ep._id}
                className={`border px-4 py-3 flex flex-col gap-1 ${
                  ep._id === selectedEpisodeId
                    ? "border-teal bg-teal-soft/30"
                    : "border-rule"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] text-ink leading-snug">
                      {ep.episodeTitle}
                    </p>
                    <p className="text-[13px] text-ink-muted mt-1">
                      {ep.presentingIssue}
                    </p>
                  </div>
                  <EpisodeStatusPill status={ep.status} />
                </div>
                <div className="flex items-center justify-between gap-3 mt-1">
                  <span className="text-[12px] text-ink-muted">
                    {ep.sessionCount}{" "}
                    {ep.sessionCount === 1 ? "session" : "sessions"}
                    {ep.hasIntake ? " · intake on file" : " · intake pending"}
                  </span>
                  {ep.status === "active" && ep._id !== selectedEpisodeId && (
                    <button
                      onClick={() => setSelectedEpisodeId(ep._id)}
                      className="text-[12px] text-teal hover:text-teal-deep underline underline-offset-4"
                    >
                      Use for actions
                    </button>
                  )}
                </div>
              </li>
            ))}
            <li>
              <button
                onClick={onNewEpisode}
                className="w-full border border-dashed border-rule text-teal text-[14px] px-4 py-3 hover:border-teal transition-colors text-left"
              >
                + New episode
              </button>
            </li>
          </ul>
        )}
        {!episodesExpanded && (
          <div className="mt-2 text-[13px] text-ink-muted">
            Active:{" "}
            {activeEpisodes.length === 0
              ? "no active episodes"
              : activeEpisodes.map((e) => e.episodeTitle).join(" · ")}
          </div>
        )}
      </div>

      {/* Action bar — target episode picker when multiple active */}
      {activeEpisodes.length > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={`ep-${client._id}`}
            className="text-[12px] text-ink-muted uppercase tracking-[0.12em] font-semibold"
          >
            Acting on:
          </label>
          <select
            id={`ep-${client._id}`}
            value={selectedEpisodeId ?? ""}
            onChange={(e) =>
              setSelectedEpisodeId(e.target.value as Id<"episodes">)
            }
            className="border border-rule bg-paper px-3 h-9 text-[14px] text-ink focus:outline-none focus:border-teal"
          >
            {activeEpisodes.map((ep) => (
              <option key={ep._id} value={ep._id}>
                {ep.episodeTitle}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-1">
        <SecondaryButton
          onClick={() =>
            hasActionableEpisode && onUpload(currentEpisode!._id)
          }
          disabled={!hasActionableEpisode}
        >
          Upload session transcript
        </SecondaryButton>
        <SecondaryButton
          onClick={() =>
            hasActionableEpisode && onViewIntake(currentEpisode!._id)
          }
          disabled={!hasActionableEpisode}
        >
          View intake
        </SecondaryButton>
        <SecondaryButton
          onClick={() =>
            hasActionableEpisode && onSchedule(currentEpisode!._id)
          }
          disabled={!hasActionableEpisode}
        >
          Schedule session
        </SecondaryButton>
        {recap && (
          <button
            onClick={onOpenRecap}
            className="h-12 px-6 text-teal hover:text-teal-deep text-[15px] tracking-wide underline-offset-4 hover:underline"
          >
            Open latest intelligence
          </button>
        )}
      </div>

      <div className="text-[12px] text-ink-faint pt-2 border-t border-rule flex items-center justify-between">
        <span>Invite code · {client.inviteCode}</span>
        <span>{client.email}</span>
      </div>
    </article>
  );
}

function EpisodeStatusPill({
  status,
}: {
  status: "active" | "closed";
}) {
  return status === "active" ? (
    <span className="inline-block px-2 py-[2px] border border-teal bg-teal-soft/50 text-teal-deep text-[11px] tracking-[0.12em] font-semibold uppercase shrink-0">
      Active
    </span>
  ) : (
    <span className="inline-block px-2 py-[2px] border border-rule text-ink-muted text-[11px] tracking-[0.12em] font-semibold uppercase shrink-0">
      Closed
    </span>
  );
}

function ClockIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-teal-deep shrink-0"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
