"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Spinner } from "../ui/primitives";
import type { Id } from "../../convex/_generated/dataModel";

type Tone = "teal" | "amber" | "red" | "ink";

function toneColor(tone: Tone) {
  return tone === "amber"
    ? "#8a5a00"
    : tone === "red"
      ? "#8a2a1c"
      : tone === "ink"
        ? "#1a1e1c"
        : "#0F6E56";
}

function MetricCard({
  value,
  label,
  tone = "teal",
  suffix = "",
}: {
  value: number | string;
  label: string;
  tone?: Tone;
  suffix?: string;
}) {
  return (
    <div
      className="bg-white px-5 py-5 shadow-card"
      style={{
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
      }}
    >
      <p
        className="leading-none"
        style={{
          fontSize: "32px",
          color: toneColor(tone),
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        {value}
        {suffix && (
          <span style={{ fontSize: "22px", marginLeft: "2px" }}>{suffix}</span>
        )}
      </p>
      <p
        className="mt-3"
        style={{ fontSize: "12px", color: "#3d4240", letterSpacing: "0.02em" }}
      >
        {label}
      </p>
    </div>
  );
}

function StatusColumn({
  title,
  titleTone,
  items,
}: {
  title: string;
  titleTone: Tone;
  items: { clientId: Id<"clients">; name: string }[];
}) {
  return (
    <div
      className="bg-white px-5 py-4 min-h-[130px] shadow-card"
      style={{
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
      }}
    >
      <p
        className="text-[11px] tracking-[0.12em] uppercase font-semibold mb-3"
        style={{ color: toneColor(titleTone) }}
      >
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-[14px] italic" style={{ color: "#0F6E56" }}>
          All clear
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.clientId}>
              <a
                href={`#client-${item.clientId}`}
                className="text-[15px] text-ink hover:text-teal transition-colors underline-offset-4 hover:underline"
              >
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AnalyticsSection() {
  const analytics = useQuery(api.analytics.getPracticeAnalytics);

  return (
    <section className="mb-10">
      <h2
        className="font-display text-teal mb-5"
        style={{ fontSize: "26px", lineHeight: 1.2 }}
      >
        Your practice at a glance
      </h2>

      {analytics === undefined && (
        <div className="py-10">
          <Spinner label="Loading your analytics…" />
        </div>
      )}

      {analytics !== undefined && analytics === null && (
        <p className="text-[15px] text-ink-muted">
          Practice data isn&apos;t ready yet.
        </p>
      )}

      {analytics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            <MetricCard
              value={analytics.activeClients}
              label="Active clients"
            />
            <MetricCard
              value={analytics.sessionsThisMonth}
              label="Sessions this month"
            />
            <MetricCard
              value={
                analytics.engagementHealth === null
                  ? "—"
                  : analytics.engagementHealth
              }
              suffix={analytics.engagementHealth === null ? "" : "%"}
              label="Engagement health"
              tone={
                analytics.engagementHealth === null
                  ? "ink"
                  : analytics.engagementHealth > 70
                    ? "teal"
                    : analytics.engagementHealth >= 50
                      ? "amber"
                      : "red"
              }
            />
            <MetricCard
              value={analytics.pendingIntakes}
              label="Pending intakes"
              tone={analytics.pendingIntakes > 0 ? "amber" : "teal"}
            />
            <MetricCard
              value={analytics.awaitingRecap}
              label="Awaiting recap"
              tone={analytics.awaitingRecap > 0 ? "amber" : "teal"}
            />
            <MetricCard
              value={analytics.totalEpisodes}
              label="Total episodes"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatusColumn
              title="Needs attention"
              titleTone="amber"
              items={analytics.statusLists.needsAttention}
            />
            <StatusColumn
              title="At risk"
              titleTone="red"
              items={analytics.statusLists.atRisk}
            />
            <StatusColumn
              title="Intake pending"
              titleTone="amber"
              items={analytics.statusLists.intakePending}
            />
          </div>
        </>
      )}
    </section>
  );
}
