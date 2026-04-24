"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import {
  AuthShell,
  ErrorMessage,
  PrimaryButton,
  TextField,
} from "../ui/primitives";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn("password", {
        email: email.trim().toLowerCase(),
        password,
        flow: "signIn",
      });
      router.replace("/handoff");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "We couldn't sign you in. Please try again.";
      const clean = msg.replace(/^.*Error:\s*/, "").trim();
      setError(
        /invalid|credentials|account/i.test(clean)
          ? "The email or password didn't match. Please try again."
          : clean || "We couldn't sign you in. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      headline={
        <>
          Sign in to your <span className="italic">Briefcase.</span>
        </>
      }
      footer={
        <div className="space-y-3 text-[14px] text-ink-muted">
          <p>
            New practitioner?{" "}
            <Link href="/signup/practitioner" className="text-teal underline">
              Create your practitioner account
            </Link>
            .
          </p>
          <p>
            Invited by a practitioner?{" "}
            <Link href="/signup/client" className="text-teal underline">
              Set up your client account
            </Link>
            .
          </p>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <TextField
          id="email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={setEmail}
          autoComplete="email"
          disabled={submitting}
          placeholder="you@practice.com"
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          required
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={submitting}
        />
        <div className="pt-2">
          <PrimaryButton type="submit" disabled={submitting} full>
            {submitting ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
      </form>
    </AuthShell>
  );
}
