"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { AddClientModal } from "./AddClientModal";
import { UploadTranscriptModal } from "./UploadTranscriptModal";
import { ScheduleSessionModal } from "./ScheduleSessionModal";
import { ViewIntakeModal } from "./ViewIntakeModal";
import { RecapReviewModal } from "./RecapReviewModal";
import { PrepBriefModal } from "./PrepBriefModal";
import { NewEpisodeModal } from "./NewEpisodeModal";
import { AnalyticsSection } from "./AnalyticsSection";
import { ClientCard, EpisodeSummary } from "./ClientCard";
import { PrimaryButton, Spinner } from "../ui/primitives";
import type { Id } from "../../convex/_generated/dataModel";

type EnrichedClient = NonNullable<
  FunctionReturnType<typeof api.clients.listForPractitioner>
>[number];

export default function DashboardPage() {
  const me = useQuery(api.users.me);
  const clients = useQuery(api.clients.listForPractitioner);

  const [addOpen, setAddOpen] = useState(false);
  const [newEpisodeFor, setNewEpisodeFor] = useState<{
    id: Id<"clients">;
    name: string;
    email: string;
    inviteCode: string;
  } | null>(null);
  const [uploadFor, setUploadFor] = useState<{
    clientId: Id<"clients">;
    episodeId: Id<"episodes">;
    name: string;
  } | null>(null);
  const [scheduleFor, setScheduleFor] = useState<{
    clientId: Id<"clients">;
    episodeId: Id<"episodes">;
    name: string;
  } | null>(null);
  const [intakeFor, setIntakeFor] = useState<{
    episodeId: Id<"episodes">;
    name: string;
    inviteCode: string;
  } | null>(null);
  const [openRecap, setOpenRecap] = useState<Id<"sessionRecaps"> | null>(null);
  const [openPrep, setOpenPrep] = useState<{
    clientName: string;
    brief: {
      _id: string;
      scheduledFor: number;
      coreJtbd: string;
      situationalStatus: string;
      unfinishedBusiness: string;
      actionStepIntelligence: string;
      recommendedFocus: string;
    };
  } | null>(null);

  const practitionerName =
    me?.role === "practitioner" ? me.practitioner.name.split(" ")[0] : null;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 sm:px-10 py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-5 mb-10">
        <div>
          <p className="text-[12px] tracking-[0.2em] uppercase text-teal">
            Your practice
          </p>
          <h1 className="mt-3 font-display text-[40px] sm:text-[52px] leading-[1.05] text-ink">
            {practitionerName
              ? `Welcome back, ${practitionerName}.`
              : "Welcome back."}
          </h1>
          <p className="mt-3 text-ink-muted text-[15px] max-w-[560px] leading-relaxed">
            Every client, every session, held in one quiet place. Your data is
            private and encrypted.
          </p>
        </div>
        <PrimaryButton onClick={() => setAddOpen(true)}>
          + Add a client
        </PrimaryButton>
      </header>

      <AnalyticsSection />

      {clients === undefined && (
        <div className="py-16 flex justify-center">
          <Spinner label="Loading your clients…" />
        </div>
      )}

      {clients && clients.length === 0 && (
        <div className="border border-rule p-10 text-center">
          <p className="font-display text-[28px] text-ink">
            Your Briefcase is ready.
          </p>
          <p className="mt-3 text-ink-muted max-w-[440px] mx-auto leading-relaxed">
            Add your first client to begin. We&apos;ll generate a unique invite
            code and email them their intake link.
          </p>
          <div className="mt-6 inline-block">
            <PrimaryButton onClick={() => setAddOpen(true)}>
              Add your first client
            </PrimaryButton>
          </div>
        </div>
      )}

      {clients && clients.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {clients.map((c: EnrichedClient) => (
            <ClientCard
              key={c._id}
              client={{
                _id: c._id,
                name: c.name,
                email: c.email,
                sessionCount: c.sessionCount,
                presentingIssue: c.presentingIssue,
                inviteCode: c.inviteCode,
                hasIntake: c.hasIntake,
                episodes: c.episodes as EpisodeSummary[],
                welcomeEmailStatus:
                  (c.welcomeEmailStatus as
                    | "pending"
                    | "sent"
                    | "failed"
                    | null) ?? null,
                welcomeEmailError: c.welcomeEmailError ?? null,
                latestRecap: c.latestRecap
                  ? {
                      _id: c.latestRecap._id,
                      engagementSignal: c.latestRecap.engagementSignal,
                      transformationDelta: c.latestRecap.transformationDelta,
                      nextFocus: c.latestRecap.nextFocus,
                      practitionerNote: c.latestRecap.practitionerNote,
                    }
                  : null,
                upcomingPrep: c.upcomingPrep
                  ? {
                      _id: c.upcomingPrep._id,
                      scheduledFor: c.upcomingPrep.scheduledFor,
                    }
                  : null,
              }}
              onUpload={(episodeId) =>
                setUploadFor({ clientId: c._id, episodeId, name: c.name })
              }
              onViewIntake={(episodeId) =>
                setIntakeFor({
                  episodeId,
                  name: c.name,
                  inviteCode: c.inviteCode,
                })
              }
              onSchedule={(episodeId) =>
                setScheduleFor({
                  clientId: c._id,
                  episodeId,
                  name: c.name,
                })
              }
              onNewEpisode={() =>
                setNewEpisodeFor({
                  id: c._id,
                  name: c.name,
                  email: c.email,
                  inviteCode: c.inviteCode,
                })
              }
              onOpenRecap={() =>
                c.latestRecap && setOpenRecap(c.latestRecap._id)
              }
              onOpenPrep={() =>
                c.upcomingPrep &&
                setOpenPrep({
                  clientName: c.name,
                  brief: {
                    _id: c.upcomingPrep._id,
                    scheduledFor: c.upcomingPrep.scheduledFor,
                    coreJtbd: c.upcomingPrep.coreJtbd,
                    situationalStatus: c.upcomingPrep.situationalStatus,
                    unfinishedBusiness: c.upcomingPrep.unfinishedBusiness,
                    actionStepIntelligence:
                      c.upcomingPrep.actionStepIntelligence,
                    recommendedFocus: c.upcomingPrep.recommendedFocus,
                  },
                })
              }
            />
          ))}
        </div>
      )}

      <AddClientModal open={addOpen} onClose={() => setAddOpen(false)} />

      <NewEpisodeModal
        open={newEpisodeFor !== null}
        clientId={newEpisodeFor?.id ?? null}
        clientName={newEpisodeFor?.name ?? ""}
        clientEmail={newEpisodeFor?.email ?? ""}
        inviteCode={newEpisodeFor?.inviteCode ?? ""}
        onClose={() => setNewEpisodeFor(null)}
      />

      <UploadTranscriptModal
        open={uploadFor !== null}
        clientId={uploadFor?.clientId ?? null}
        episodeId={uploadFor?.episodeId ?? null}
        clientName={uploadFor?.name ?? ""}
        onClose={() => setUploadFor(null)}
        onProcessed={(recapId) => {
          setUploadFor(null);
          setOpenRecap(recapId);
        }}
      />

      <ScheduleSessionModal
        open={scheduleFor !== null}
        clientId={scheduleFor?.clientId ?? null}
        episodeId={scheduleFor?.episodeId ?? null}
        clientName={scheduleFor?.name ?? ""}
        onClose={() => setScheduleFor(null)}
      />

      <ViewIntakeModal
        open={intakeFor !== null}
        episodeId={intakeFor?.episodeId ?? null}
        clientName={intakeFor?.name ?? ""}
        inviteCode={intakeFor?.inviteCode ?? null}
        onClose={() => setIntakeFor(null)}
      />

      <RecapReviewModal
        recapId={openRecap}
        onClose={() => setOpenRecap(null)}
      />

      <PrepBriefModal
        open={openPrep !== null}
        brief={openPrep?.brief ?? null}
        clientName={openPrep?.clientName ?? ""}
        onClose={() => setOpenPrep(null)}
      />
    </div>
  );
}
