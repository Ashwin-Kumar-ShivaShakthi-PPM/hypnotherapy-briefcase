"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { Spinner } from "../ui/primitives";

export function PractitionerOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = useQuery(api.users.me);
  const router = useRouter();

  useEffect(() => {
    if (me === undefined) return;
    if (me.role === "client") router.replace("/portal");
    else if (me.role === "none") router.replace("/login");
  }, [me, router]);

  if (me === undefined || me.role === "client" || me.role === "none") {
    return (
      <div className="min-h-screen flex items-center justify-center paper-grain">
        <Spinner label="Checking your access…" />
      </div>
    );
  }
  return <>{children}</>;
}

export function ClientOnly({ children }: { children: React.ReactNode }) {
  const me = useQuery(api.users.me);
  const router = useRouter();

  useEffect(() => {
    if (me === undefined) return;
    if (me.role === "practitioner") router.replace("/dashboard");
    else if (me.role === "none") router.replace("/login");
  }, [me, router]);

  if (me === undefined || me.role === "practitioner" || me.role === "none") {
    return (
      <div className="min-h-screen flex items-center justify-center paper-grain">
        <Spinner label="Checking your access…" />
      </div>
    );
  }
  return <>{children}</>;
}
