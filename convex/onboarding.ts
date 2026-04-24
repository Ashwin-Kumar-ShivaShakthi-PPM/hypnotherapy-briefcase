"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { Resend } from "resend";
import {
  renderEpisodeWelcome,
  renderNewClientWelcome,
} from "../lib/welcomeEmail";
import type { Id } from "./_generated/dataModel";

function publicAppUrl(): string {
  return (
    process.env.PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.SITE_URL?.replace(/\/$/, "") ||
    "https://briefcase-waitlist.vercel.app"
  );
}

function intakeUrlFor(inviteCode: string, episodeId: string): string {
  return `${publicAppUrl()}/intake/${encodeURIComponent(
    inviteCode
  )}/${encodeURIComponent(episodeId)}`;
}

type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string; errorName?: string; statusCode?: number };

async function sendViaResend({
  to,
  subject,
  html,
  text,
  context,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  context: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    const error = "Email service is not configured (missing RESEND_API_KEY or FROM_EMAIL).";
    console.error(`[${context}] ${error}`);
    return { ok: false, error };
  }

  const resend = new Resend(apiKey);

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
      text,
    });

    // Resend returns { data: null, error: {...} } on API-level failures.
    // An exception is thrown only on network failures. We must check both.
    if (response.error) {
      console.error(
        `[${context}] Resend API rejected send to ${to}: ${response.error.name} (${response.error.statusCode ?? "n/a"}) — ${response.error.message}`
      );
      return {
        ok: false,
        error: response.error.message || "Resend rejected the email.",
        errorName: response.error.name,
        statusCode: response.error.statusCode ?? undefined,
      };
    }

    if (!response.data?.id) {
      const error = "Resend returned no message id.";
      console.error(`[${context}] ${error}`, response);
      return { ok: false, error };
    }

    console.log(`[${context}] Resend accepted — id=${response.data.id} to=${to}`);
    return { ok: true, id: response.data.id };
  } catch (err) {
    const error =
      err instanceof Error
        ? err.message
        : "We couldn't reach the email service.";
    console.error(`[${context}] Resend threw: ${error}`, err);
    return { ok: false, error };
  }
}

export const createClientAndWelcome = action({
  args: {
    name: v.string(),
    email: v.string(),
    episodeTitle: v.string(),
    presentingIssue: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    clientId: Id<"clients">;
    episodeId: Id<"episodes">;
    inviteCode: string;
    emailSent: boolean;
    emailError?: string;
  }> => {
    const { clientId, episodeId, inviteCode } = await ctx.runMutation(
      api.clients.createClient,
      {
        name: args.name,
        email: args.email,
        episodeTitle: args.episodeTitle,
        presentingIssue: args.presentingIssue,
      }
    );

    await ctx.runMutation(internal.emailStatus.markClientWelcomeAttempt, {
      clientId,
    });

    const ctxData = await ctx.runQuery(api.clients.getEpisodeForEmail, {
      episodeId,
    });
    if (!ctxData) {
      const error = "Could not load client context for email.";
      await ctx.runMutation(internal.emailStatus.recordClientWelcome, {
        clientId,
        status: "failed",
        error,
      });
      return { clientId, episodeId, inviteCode, emailSent: false, emailError: error };
    }

    const email = renderNewClientWelcome({
      clientName: ctxData.clientName,
      episodeTitle: ctxData.episodeTitle,
      presentingIssue: ctxData.presentingIssue,
      inviteCode: ctxData.inviteCode,
      intakeUrl: intakeUrlFor(ctxData.inviteCode, episodeId),
      practitionerName: ctxData.practitionerName,
    });

    const sent = await sendViaResend({
      to: ctxData.clientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      context: "createClientAndWelcome",
    });

    await ctx.runMutation(internal.emailStatus.recordClientWelcome, {
      clientId,
      status: sent.ok ? "sent" : "failed",
      error: sent.ok ? undefined : sent.error,
    });

    return {
      clientId,
      episodeId,
      inviteCode,
      emailSent: sent.ok,
      emailError: sent.ok ? undefined : sent.error,
    };
  },
});

export const createEpisodeAndWelcome = action({
  args: {
    clientId: v.id("clients"),
    episodeTitle: v.string(),
    presentingIssue: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    episodeId: Id<"episodes">;
    emailSent: boolean;
    emailError?: string;
  }> => {
    const { episodeId } = await ctx.runMutation(
      api.episodes.createEpisode,
      {
        clientId: args.clientId,
        episodeTitle: args.episodeTitle,
        presentingIssue: args.presentingIssue,
      }
    );

    await ctx.runMutation(internal.emailStatus.markEpisodeWelcomeAttempt, {
      episodeId,
    });

    const ctxData = await ctx.runQuery(api.clients.getEpisodeForEmail, {
      episodeId,
    });
    if (!ctxData) {
      const error = "Could not load episode context for email.";
      await ctx.runMutation(internal.emailStatus.recordEpisodeWelcome, {
        episodeId,
        status: "failed",
        error,
      });
      return { episodeId, emailSent: false, emailError: error };
    }

    const email = renderEpisodeWelcome({
      clientName: ctxData.clientName,
      episodeTitle: ctxData.episodeTitle,
      presentingIssue: ctxData.presentingIssue,
      inviteCode: ctxData.inviteCode,
      intakeUrl: intakeUrlFor(ctxData.inviteCode, episodeId),
      practitionerName: ctxData.practitionerName,
    });

    const sent = await sendViaResend({
      to: ctxData.clientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      context: "createEpisodeAndWelcome",
    });

    await ctx.runMutation(internal.emailStatus.recordEpisodeWelcome, {
      episodeId,
      status: sent.ok ? "sent" : "failed",
      error: sent.ok ? undefined : sent.error,
    });

    return {
      episodeId,
      emailSent: sent.ok,
      emailError: sent.ok ? undefined : sent.error,
    };
  },
});

export const resendClientWelcome = action({
  args: { clientId: v.id("clients") },
  handler: async (
    ctx,
    { clientId }
  ): Promise<{ emailSent: boolean; emailError?: string }> => {
    const ep = await ctx.runQuery(internal.emailStatus.firstEpisodeForClient, {
      clientId,
    });
    if (!ep) {
      return { emailSent: false, emailError: "No episode on this client." };
    }

    await ctx.runMutation(internal.emailStatus.markClientWelcomeAttempt, {
      clientId,
    });

    const ctxData = await ctx.runQuery(api.clients.getEpisodeForEmail, {
      episodeId: ep._id,
    });
    if (!ctxData) {
      const error = "Could not load client context for email.";
      await ctx.runMutation(internal.emailStatus.recordClientWelcome, {
        clientId,
        status: "failed",
        error,
      });
      return { emailSent: false, emailError: error };
    }

    const email = renderNewClientWelcome({
      clientName: ctxData.clientName,
      episodeTitle: ctxData.episodeTitle,
      presentingIssue: ctxData.presentingIssue,
      inviteCode: ctxData.inviteCode,
      intakeUrl: intakeUrlFor(ctxData.inviteCode, ep._id),
      practitionerName: ctxData.practitionerName,
    });

    const sent = await sendViaResend({
      to: ctxData.clientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      context: "resendClientWelcome",
    });

    await ctx.runMutation(internal.emailStatus.recordClientWelcome, {
      clientId,
      status: sent.ok ? "sent" : "failed",
      error: sent.ok ? undefined : sent.error,
    });

    return {
      emailSent: sent.ok,
      emailError: sent.ok ? undefined : sent.error,
    };
  },
});

export const resendEpisodeWelcome = action({
  args: { episodeId: v.id("episodes") },
  handler: async (
    ctx,
    { episodeId }
  ): Promise<{ emailSent: boolean; emailError?: string }> => {
    await ctx.runMutation(internal.emailStatus.markEpisodeWelcomeAttempt, {
      episodeId,
    });

    const ctxData = await ctx.runQuery(api.clients.getEpisodeForEmail, {
      episodeId,
    });
    if (!ctxData) {
      const error = "Could not load episode context for email.";
      await ctx.runMutation(internal.emailStatus.recordEpisodeWelcome, {
        episodeId,
        status: "failed",
        error,
      });
      return { emailSent: false, emailError: error };
    }

    const email = renderEpisodeWelcome({
      clientName: ctxData.clientName,
      episodeTitle: ctxData.episodeTitle,
      presentingIssue: ctxData.presentingIssue,
      inviteCode: ctxData.inviteCode,
      intakeUrl: intakeUrlFor(ctxData.inviteCode, episodeId),
      practitionerName: ctxData.practitionerName,
    });

    const sent = await sendViaResend({
      to: ctxData.clientEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      context: "resendEpisodeWelcome",
    });

    await ctx.runMutation(internal.emailStatus.recordEpisodeWelcome, {
      episodeId,
      status: sent.ok ? "sent" : "failed",
      error: sent.ok ? undefined : sent.error,
    });

    return {
      emailSent: sent.ok,
      emailError: sent.ok ? undefined : sent.error,
    };
  },
});
