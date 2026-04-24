"use client";

import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { Spinner, TopNavBar } from "../ui/primitives";

type PortalRecap = {
  _id: string;
  createdAt: number;
  transformationDelta: string;
  outcomesToExpect: string[];
  actionItems: Array<{
    step: number;
    action: string;
    when: string;
    why: string;
  }>;
  nextFocus: string;
};

export default function PortalPage() {
  const journey = useQuery(api.portal.myJourney);
  const { signOut } = useAuthActions();
  const router = useRouter();

  const onSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="paper-grain min-h-screen flex flex-col">
      <TopNavBar maxWidth="max-w-[820px]">
        <button
          onClick={onSignOut}
          className="text-[13px]"
          style={{ color: "#ffffff" }}
        >
          Sign out
        </button>
      </TopNavBar>

      <main className="flex-1">
        <div className="mx-auto max-w-[820px] px-6 sm:px-10 py-12">
          {journey === undefined && (
            <div className="py-16 flex justify-center">
              <Spinner label="Opening your journey…" />
            </div>
          )}

          {journey === null && (
            <div className="py-16 text-center">
              <p className="font-display text-[28px] text-ink">
                Your portal is almost ready.
              </p>
              <p className="mt-3 text-ink-muted max-w-[440px] mx-auto leading-relaxed">
                It looks like your account isn&apos;t linked to a practitioner
                yet. If you were given an invite code, please use it on the
                sign-up page.
              </p>
            </div>
          )}

          {journey && (
            <>
              <p className="text-[12px] tracking-[0.2em] uppercase text-teal">
                Your journey
              </p>
              <h1 className="mt-3 font-display text-[40px] sm:text-[52px] leading-[1.05] text-ink">
                Hello, {journey.client.name.split(" ")[0]}.
              </h1>
              <p className="mt-3 text-ink-muted text-[15px] leading-relaxed max-w-[560px]">
                This is the quiet space where your work with {journey.practitionerName} lives.
                Your data is private and encrypted.
              </p>

              {journey.recaps.length === 0 ? (
                <div className="mt-12 border border-rule p-8">
                  <p className="font-display text-[22px] text-ink">
                    Your first session is still ahead.
                  </p>
                  <p className="mt-2 text-ink-muted leading-relaxed">
                    After your first session, this space will fill with the
                    transformation we&apos;ve noticed together, and the steps
                    we&apos;ve agreed for the days ahead.
                  </p>
                </div>
              ) : (
                <div className="mt-12 space-y-8">
                  {journey.recaps.map((r: PortalRecap, idx: number) => (
                    <article key={r._id} className="border border-rule p-6 sm:p-8">
                      <p className="text-[11px] tracking-[0.18em] uppercase text-teal-deep">
                        Session {journey.recaps.length - idx} ·{" "}
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {r.transformationDelta && (
                        <p className="mt-4 font-display text-[22px] leading-snug text-ink">
                          {r.transformationDelta}
                        </p>
                      )}
                      {r.outcomesToExpect.length > 0 && (
                        <div className="mt-5">
                          <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-2">
                            In the days ahead
                          </p>
                          <ul className="space-y-2">
                            {r.outcomesToExpect.map((o: string, i: number) => (
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
                        </div>
                      )}
                      {r.actionItems.length > 0 && (
                        <div className="mt-5">
                          <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-2">
                            Where we go from here
                          </p>
                          <ol className="space-y-3">
                            {r.actionItems.map(
                              (
                                a: {
                                  step: number;
                                  action: string;
                                  when: string;
                                  why: string;
                                },
                                i: number
                              ) => (
                                <li
                                  key={i}
                                  className="text-[15px] leading-relaxed"
                                >
                                  <p className="text-ink">
                                    <span className="text-teal mr-2">
                                      {a.step}.
                                    </span>
                                    {a.action}
                                  </p>
                                  <p className="text-ink-muted italic mt-1">
                                    {a.why}
                                  </p>
                                </li>
                              )
                            )}
                          </ol>
                        </div>
                      )}
                      {r.nextFocus && idx === 0 && (
                        <p className="mt-5 text-[15px] text-ink-muted italic border-l-2 border-teal pl-4">
                          {r.nextFocus}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
