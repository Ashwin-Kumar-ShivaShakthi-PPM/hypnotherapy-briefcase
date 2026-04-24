"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Spinner } from "../../ui/primitives";

export default function SettingsPage() {
  const me = useQuery(api.users.me);

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 sm:px-10 py-10 sm:py-14">
      <p className="text-[12px] tracking-[0.2em] uppercase text-teal">
        Account
      </p>
      <h1 className="mt-3 font-display text-[40px] sm:text-[52px] leading-[1.05] text-ink">
        Settings
      </h1>

      <div className="mt-10 space-y-8">
        {me === undefined && <Spinner label="Loading your details…" />}
        {me?.role === "practitioner" && (
          <>
            <Row label="Name">{me.practitioner.name}</Row>
            <Row label="Email">{me.practitioner.email}</Row>
            <Row label="Role">Practitioner</Row>
            <p className="text-[13px] text-ink-muted leading-relaxed pt-4 border-t border-rule">
              Billing, integrations, and team settings are on our near-term
              roadmap. For now, your Briefcase is ready to use.
            </p>
          </>
        )}
        <p className="text-[12px] text-ink-faint pt-6">
          Your data is private and encrypted.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6">
      <p className="text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted sm:w-40">
        {label}
      </p>
      <p className="text-[16px] text-ink">{children}</p>
    </div>
  );
}
