import Link from "next/link";
import { WaitlistForm } from "./WaitlistForm";
import { TopNavBar } from "./ui/primitives";

export default function Home() {
  return (
    <div className="paper-grain relative flex-1 flex flex-col">
      <TopNavBar>
        <Link
          href="/login"
          className="hidden sm:inline"
          style={{ color: "var(--nav-fg-muted)" }}
        >
          Sign in
        </Link>
        <Link
          href="/roadmap"
          style={{ color: "#ffffff" }}
          className="tracking-wide"
        >
          Roadmap
        </Link>
      </TopNavBar>

      <main className="flex-1 flex flex-col">
        <div className="mx-auto w-full max-w-[820px] px-6 sm:px-10 pt-14 sm:pt-20 pb-24">
          {/* 3px horizontal rule above the eyebrow — grounds the hero */}
          <div
            className="h-[3px] w-24"
            style={{ background: "var(--teal-dark)" }}
            aria-hidden
          />

          {/* Eyebrow */}
          <p
            className="rise mt-6 text-[12px] tracking-[0.2em] uppercase"
            style={{ color: "var(--teal-dark)", animationDelay: "0.05s" }}
          >
            Private beta · Waitlist open
          </p>

          {/* Headline — 72px desktop */}
          <h1
            className="rise mt-5 font-display text-ink text-[44px] leading-[1.04] sm:text-[60px] sm:leading-[1.02] md:text-[72px] md:leading-[1.01] tracking-[-0.015em]"
            style={{ animationDelay: "0.15s" }}
          >
            You became a hypnotherapist to{" "}
            <span className="italic">change lives</span> — not to chase clients
            and drown in admin.
            <span className="block mt-4 text-teal-dark">
              The Briefcase does that part.
            </span>
          </h1>

          {/* Bullets */}
          <ul
            className="rise mt-12 space-y-5 max-w-[620px]"
            style={{ animationDelay: "0.3s" }}
          >
            <Bullet>
              <strong className="font-medium text-ink">
                AI collects new client intake automatically
              </strong>{" "}
              — no chasing forms.
            </Bullet>
            <Bullet>
              <strong className="font-medium text-ink">
                Personalised session prep brief
              </strong>{" "}
              generated before every appointment.
            </Bullet>
            <Bullet>
              <strong className="font-medium text-ink">
                Warm follow-up sent after every session
              </strong>{" "}
              so clients never go quiet.
            </Bullet>
          </ul>

          {/* Form */}
          <div className="rise" style={{ animationDelay: "0.45s" }}>
            <WaitlistForm />
          </div>

          {/* Separator */}
          <div className="mt-24 sm:mt-32 h-px bg-rule" />

          {/* Small closing note */}
          <p className="mt-8 font-display italic text-ink-muted text-lg leading-relaxed max-w-[520px]">
            Built for the solo practitioner who would rather be in the room
            with a client than in a spreadsheet.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-rule">
        <div className="mx-auto w-full max-w-[820px] px-6 sm:px-10 py-6 flex items-center justify-between text-[12px] text-ink-faint">
          <span>© 2026 The Hypnotherapy Briefcase</span>
          <span className="tracking-[0.18em] uppercase">Coming soon</span>
        </div>
      </footer>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-4 text-ink-muted text-[17px] sm:text-[18px] leading-relaxed">
      <span
        className="mt-[0.65em] h-[7px] w-[7px] shrink-0"
        style={{ background: "var(--teal-dark)" }}
        aria-hidden
      />
      <span>{children}</span>
    </li>
  );
}
