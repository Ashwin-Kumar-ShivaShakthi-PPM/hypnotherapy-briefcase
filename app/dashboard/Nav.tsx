"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";
import { BriefcaseMark } from "../ui/primitives";

export function DashboardNav() {
  const me = useQuery(api.users.me);
  const pathname = usePathname();
  const { signOut } = useAuthActions();
  const router = useRouter();

  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/roadmap", label: "Roadmap" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(href + "/");

  const onSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const practitionerName =
    me?.role === "practitioner" ? me.practitioner.name : null;

  return (
    <header
      style={{ background: "var(--nav-bg)", color: "var(--nav-fg)" }}
      className="w-full"
    >
      <div className="mx-auto max-w-[1100px] px-6 sm:px-10 h-16 flex items-center justify-between gap-6">
        <BriefcaseMark variant="light" />
        <nav className="hidden sm:flex items-center gap-7 text-[14px]">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors"
              style={{
                color: isActive(item.href)
                  ? "#ffffff"
                  : "var(--nav-fg-muted)",
                borderBottom: isActive(item.href)
                  ? "1px solid #ffffff"
                  : "1px solid transparent",
                paddingBottom: 2,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-[13px]">
          {practitionerName && (
            <span
              className="hidden sm:inline"
              style={{ color: "var(--nav-fg-muted)" }}
            >
              {practitionerName}
            </span>
          )}
          <button
            onClick={onSignOut}
            className="transition-colors"
            style={{ color: "#ffffff" }}
          >
            Log out
          </button>
        </div>
      </div>
      <nav
        className="sm:hidden border-t"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        <div className="mx-auto max-w-[1100px] px-6 flex gap-5 h-11 items-center text-[13px] overflow-x-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap transition-colors"
              style={{
                color: isActive(item.href)
                  ? "#ffffff"
                  : "var(--nav-fg-muted)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
