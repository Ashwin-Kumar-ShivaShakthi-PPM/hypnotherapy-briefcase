import Link from "next/link";
import { TopNavBar } from "../ui/primitives";

type Feature = { title: string; narrative: string };

const LIVE_NOW: Feature[] = [
  {
    title: "Waitlist and practitioner signup",
    narrative:
      "The door is open — practitioners can create an account and start using their Briefcase today.",
  },
  {
    title: "Client dashboard with session intelligence signals",
    narrative:
      "Every client becomes a card with delta, focus, and engagement signal at a glance.",
  },
  {
    title: "Post-session agent: transcript to recap and email",
    narrative:
      "Paste the transcript. We generate the follow-up email, OKRs, and action plan in Ashwin's voice.",
  },
  {
    title: "Pre-session prep brief",
    narrative:
      "Schedule a session and receive a practitioner-only briefing that summarises the whole journey so far.",
  },
  {
    title: "Client intake form",
    narrative:
      "A quiet welcome — clients fill in their context before the first session, so you arrive prepared.",
  },
];

const BUILDING_NOW: Feature[] = [
  {
    title: "Client portal with personal journey view",
    narrative:
      "Clients will see their own journey, summaries, and action steps — nothing clinical, nothing overwhelming.",
  },
  {
    title: "RAG journey companion chatbot",
    narrative:
      "A gentle companion between sessions, grounded in the client's own journey — not generic AI.",
  },
  {
    title: "Personalised self-hypnosis between sessions",
    narrative:
      "Short, guided practice tailored to each client — because the work doesn't stop when the session ends.",
  },
  {
    title: "Stripe subscription for practitioners",
    narrative:
      "A simple way to support the tool long-term. Fair pricing for solo practice.",
  },
];

const PLANNED_V2: Feature[] = [
  {
    title: "Automatic Google Meet recording and transcription",
    narrative:
      "Connect once, never press record again. The hardest friction in the flow — removed.",
  },
  {
    title: "Predictive churn signals",
    narrative:
      "Flag at-risk clients before they go quiet. Because the signs are always there if we listen for them.",
  },
  {
    title: "Practice analytics",
    narrative:
      "Retention, session patterns, referral signals — a quiet dashboard for the business side of practice.",
  },
  {
    title: "AI content engine",
    narrative:
      "Your own practice insights, shaped into scholarly blog posts that sound like you, not a generic AI.",
  },
  {
    title: "Audio self-hypnosis",
    narrative:
      "Guidance spoken aloud, personalised to each client — the next natural step after written practice.",
  },
  {
    title: "Multi-practitioner clinic accounts",
    narrative:
      "Once solo practice feels right, we open it up to small clinics and teams.",
  },
];

export default function RoadmapPage() {
  return (
    <div className="paper-grain min-h-screen flex flex-col">
      <TopNavBar>
        <Link
          href="/login"
          className="text-[14px]"
          style={{ color: "var(--nav-fg-muted)" }}
        >
          Sign in
        </Link>
      </TopNavBar>
      <main className="flex-1">
        <div className="mx-auto max-w-[1100px] px-6 sm:px-10 pt-14 pb-20">
          <div
            className="h-[3px] w-24 mb-6"
            style={{ background: "var(--teal-dark)" }}
            aria-hidden
          />
          <p className="text-[12px] tracking-[0.2em] uppercase text-teal-dark">
            Roadmap
          </p>
          <h1 className="mt-3 font-display text-[44px] sm:text-[60px] leading-[1.04] text-ink tracking-[-0.015em]">
            Built transparently.
          </h1>
          <p className="mt-5 text-ink-muted max-w-[640px] text-[16px] leading-relaxed">
            Every feature is powered by the data we collect together. Last
            updated April 2026.
          </p>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Column
              eyebrow="Live now"
              eyebrowClass="text-teal-dark"
              items={LIVE_NOW}
              state="live"
            />
            <Column
              eyebrow="Building now"
              eyebrowClass="text-[#8a5a00]"
              items={BUILDING_NOW}
              state="building"
            />
            <Column
              eyebrow="Planned · V2"
              eyebrowClass="text-ink-faint"
              items={PLANNED_V2}
              state="planned"
            />
          </div>
        </div>
      </main>
      <footer className="border-t border-rule">
        <div className="mx-auto max-w-[1100px] px-6 sm:px-10 py-6 flex items-center justify-between text-[12px] text-ink-faint">
          <span>© 2026 The Hypnotherapy Briefcase</span>
          <span className="tracking-[0.18em] uppercase">Transparent build</span>
        </div>
      </footer>
    </div>
  );
}

function Column({
  eyebrow,
  eyebrowClass,
  items,
  state,
}: {
  eyebrow: string;
  eyebrowClass: string;
  items: Feature[];
  state: "live" | "building" | "planned";
}) {
  return (
    <section>
      <p
        className={`text-[11px] tracking-[0.2em] uppercase ${eyebrowClass} mb-4`}
      >
        {eyebrow}
      </p>
      <div className="space-y-4">
        {items.map((item) => (
          <article
            key={item.title}
            className={`border p-5 shadow-card ${
              state === "live"
                ? "border-teal-dark bg-teal-soft/50"
                : state === "building"
                  ? "border-rule bg-paper"
                  : "border-rule bg-paper-edge/40"
            }`}
          >
            <h3 className="font-display text-[20px] leading-tight text-ink">
              {item.title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
              {item.narrative}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
