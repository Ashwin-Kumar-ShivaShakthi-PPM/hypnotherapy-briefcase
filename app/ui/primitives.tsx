"use client";

import { ReactNode } from "react";
import Link from "next/link";

export const LABEL_CLASS =
  "block text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted mb-2";

export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] tracking-[0.12em] uppercase font-semibold text-ink-muted ${className}`}
    >
      {children}
    </p>
  );
}

export function TextField({
  id,
  label,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
  disabled,
  autoComplete,
  hint,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={LABEL_CLASS}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="w-full h-12 px-4 bg-paper-card border border-rule rounded-none text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-teal transition-colors disabled:opacity-60"
      />
      {hint && (
        <p className="mt-2 text-[13px] text-ink-muted leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextareaField({
  id,
  label,
  required,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className={LABEL_CLASS}
      >
        {label}
      </label>
      <textarea
        id={id}
        required={required}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-3 bg-paper-card border border-rule rounded-none text-[15px] text-ink placeholder:text-ink-faint focus:outline-none focus:border-teal transition-colors disabled:opacity-60 leading-relaxed"
      />
    </div>
  );
}

export function PrimaryButton({
  children,
  type = "button",
  disabled,
  onClick,
  full,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  full?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${full ? "w-full" : ""} inline-flex items-center justify-center px-7 py-[14px] text-paper rounded-none font-medium tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
      style={{ background: "var(--button-primary-bg)" }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background =
          "var(--button-primary-bg-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = "var(--button-primary-bg)")
      }
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  type = "button",
  disabled,
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center px-7 py-[14px] border border-rule text-ink rounded-none font-medium tracking-wide hover:border-teal-dark hover:text-teal-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-paper"
    >
      {children}
    </button>
  );
}

export function ErrorMessage({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="mt-3 text-sm text-[#a1392b]">{children}</p>;
}

export function PrivacyLine() {
  return (
    <p className="text-[13px] text-ink-muted tracking-wide">
      Your data is private and encrypted.
    </p>
  );
}

export function BriefcaseMark({
  variant = "teal",
  href = "/",
}: {
  variant?: "teal" | "light";
  href?: string;
}) {
  const iconColor = variant === "light" ? "#ffffff" : "var(--teal)";
  const labelColor =
    variant === "light" ? "rgba(255,255,255,0.92)" : "var(--ink-muted)";
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3"
      style={{ color: iconColor }}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="7" width="18" height="13" rx="1.5" />
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
        <path d="M3 12h18" />
      </svg>
      <span
        className="text-[11px] tracking-[0.22em] uppercase"
        style={{ color: labelColor }}
      >
        The Hypnotherapy Briefcase
      </span>
    </Link>
  );
}

export function TopNavBar({
  children,
  maxWidth = "max-w-[1100px]",
}: {
  children?: ReactNode;
  maxWidth?: string;
}) {
  return (
    <header
      style={{ background: "var(--nav-bg)", color: "var(--nav-fg)" }}
      className="w-full"
    >
      <div
        className={`mx-auto ${maxWidth} px-6 sm:px-10 h-16 flex items-center justify-between gap-6`}
      >
        <BriefcaseMark variant="light" />
        {children && (
          <div className="flex items-center gap-6 text-[14px]">{children}</div>
        )}
      </div>
    </header>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-teal">
      <span
        aria-hidden
        className="inline-block h-4 w-4 border-2 border-teal border-t-transparent rounded-full animate-spin"
      />
      {label && <span className="text-[14px] text-ink-muted">{label}</span>}
    </div>
  );
}

export function AuthShell({
  eyebrow,
  headline,
  children,
  footer,
}: {
  eyebrow: string;
  headline: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="paper-grain min-h-screen flex flex-col">
      <TopNavBar />
      <main className="flex-1 flex flex-col">
        <div className="mx-auto w-full max-w-[520px] px-6 sm:px-10 pt-14 sm:pt-20 pb-16">
          <div
            className="h-[3px] w-16 mb-6"
            style={{ background: "var(--teal-dark)" }}
            aria-hidden
          />
          <p className="text-[12px] tracking-[0.2em] uppercase text-teal-dark">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-ink text-[42px] leading-[1.05] sm:text-[56px] tracking-[-0.015em]">
            {headline}
          </h1>
          <div className="mt-10">{children}</div>
          {footer && (
            <div className="mt-10 pt-6 border-t border-rule">{footer}</div>
          )}
          <div className="mt-10">
            <PrivacyLine />
          </div>
        </div>
      </main>
    </div>
  );
}
