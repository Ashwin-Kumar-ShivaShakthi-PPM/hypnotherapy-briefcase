"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; alreadyOnList: boolean }
  | { kind: "error"; message: string };

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const addEmail = useMutation(api.waitlist.addEmail);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status.kind === "submitting") return;
    setStatus({ kind: "submitting" });
    try {
      const result = await addEmail({ email });
      setStatus({ kind: "success", alreadyOnList: result.alreadyOnList });
      setEmail("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      // Convex wraps server errors; extract the inner message when present.
      const clean = message.replace(/^.*Error:\s*/, "").trim();
      setStatus({ kind: "error", message: clean || "Something went wrong." });
    }
  };

  if (status.kind === "success") {
    return (
      <div className="rise mt-10 max-w-lg">
        <div className="border-l-2 border-teal pl-5 py-1">
          <p className="font-display text-2xl md:text-3xl text-ink leading-snug">
            {status.alreadyOnList
              ? "You're already on the list."
              : "You're on the list."}
          </p>
          <p className="mt-2 text-ink-muted text-[15px] leading-relaxed">
            We&apos;ll be in touch the moment the Briefcase is ready for you.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 max-w-lg">
      <label
        htmlFor="email"
        className="block text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-3"
      >
        Join the waitlist
      </label>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@practice.com"
          className="flex-1 h-12 px-4 bg-transparent border border-rule rounded-none text-ink placeholder:text-ink-faint focus:outline-none focus:border-teal transition-colors"
          aria-invalid={status.kind === "error"}
          disabled={status.kind === "submitting"}
        />
        <button
          type="submit"
          disabled={status.kind === "submitting"}
          className="h-12 px-6 bg-teal text-paper rounded-none font-medium tracking-wide hover:bg-teal-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status.kind === "submitting" ? "Adding…" : "Join the waitlist"}
        </button>
      </div>
      {status.kind === "error" && (
        <p className="mt-3 text-sm text-[#a1392b]">{status.message}</p>
      )}
      <p className="mt-4 text-[13px] text-ink-faint leading-relaxed">
        No spam. One email when we launch. Unsubscribe in one click.
      </p>
    </form>
  );
}
