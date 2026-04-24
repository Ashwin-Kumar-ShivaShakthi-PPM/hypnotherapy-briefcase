"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../convex/_generated/api";
import { Spinner } from "../ui/primitives";

export default function HandoffPage() {
  const me = useQuery(api.users.me);
  const router = useRouter();

  useEffect(() => {
    if (me === undefined) return;
    if (me.role === "practitioner") router.replace("/dashboard");
    else if (me.role === "client") router.replace("/portal");
    else if (me.role === "unclaimed") router.replace("/signup/client");
    else router.replace("/login");
  }, [me, router]);

  return (
    <div className="min-h-screen flex items-center justify-center paper-grain">
      <Spinner label="Finding your Briefcase…" />
    </div>
  );
}
