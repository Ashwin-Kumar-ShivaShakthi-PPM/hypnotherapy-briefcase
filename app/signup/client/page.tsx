"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import {
  AuthShell,
  ErrorMessage,
  PrimaryButton,
  TextField,
} from "../../ui/primitives";

export default function ClientSignupPage() {
  const { signIn } = useAuthActions();
  const claimClient = useMutation(api.users.claimClientProfile);
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      await signIn("password", {
        email: cleanEmail,
        password,
        flow: "signUp",
      });
      await claimClient({
        name: name.trim(),
        email: cleanEmail,
        inviteCode: inviteCode.trim(),
      });
      router.replace("/portal");
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "We couldn't create your account. Please try again.";
      const clean = msg.replace(/^.*Error:\s*/, "").trim();
      setError(clean || "We couldn't create your account. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Your client portal"
      headline={
        <>
          Step into your <span className="italic">journey.</span>
        </>
      }
      footer={
        <p className="text-[14px] text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-teal underline">
            Sign in
          </Link>
          .
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <TextField
          id="name"
          label="Your name"
          required
          value={name}
          onChange={setName}
          autoComplete="name"
          disabled={submitting}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          required
          value={email}
          onChange={setEmail}
          autoComplete="email"
          disabled={submitting}
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          required
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={submitting}
          hint="At least 8 characters."
        />
        <TextField
          id="inviteCode"
          label="Invite code"
          required
          value={inviteCode}
          onChange={setInviteCode}
          disabled={submitting}
          placeholder="6-digit code"
          hint="Your practitioner shared this with you."
        />
        <div className="pt-2">
          <PrimaryButton type="submit" disabled={submitting} full>
            {submitting ? "Setting up your portal…" : "Enter my portal"}
          </PrimaryButton>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
      </form>
    </AuthShell>
  );
}
