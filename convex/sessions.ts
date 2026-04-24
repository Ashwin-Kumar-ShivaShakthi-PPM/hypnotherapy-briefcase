"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { ASHWIN_VOICE } from "../lib/voice";
import {
  buildEmailShell,
  htmlToPlainText,
  normalizeBodyHtml,
} from "../lib/emailHtml";
import type { Id } from "./_generated/dataModel";

const MODEL = "claude-opus-4-5";

function coerceString(x: unknown): string {
  if (typeof x !== "string") return "";
  return x;
}

function coerceStringArray(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return x.filter((v): v is string => typeof v === "string");
}

function coerceSignal(
  x: unknown
): "active" | "needs_attention" | "at_risk" {
  if (x === "active" || x === "needs_attention" || x === "at_risk") return x;
  return "active";
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  const candidate =
    first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error("Agent returned an unreadable response.");
    }
  }
}

export const processTranscript = action({
  args: {
    clientId: v.id("clients"),
    episodeId: v.optional(v.id("episodes")),
    transcriptText: v.string(),
    sessionDate: v.number(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    recapId: Id<"sessionRecaps">;
    sessionId: Id<"sessions">;
    sessionNumber: number;
    episodeId: Id<"episodes"> | undefined;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in.");

    const practitioner = await ctx.runQuery(
      internal.sessionInternal.getPractitionerForUser,
      { userId }
    );
    if (!practitioner)
      throw new Error("Only practitioners can upload transcripts.");

    const client = await ctx.runQuery(
      internal.sessionInternal.getClientForPractitioner,
      {
        clientId: args.clientId,
        practitionerId: practitioner._id,
      }
    );
    if (!client) throw new Error("Client not found.");

    // Resolve episode: if explicit episodeId provided, verify ownership.
    // Otherwise default to the client's most recent active episode.
    let episodeId: Id<"episodes"> | undefined;
    if (args.episodeId) {
      const ep = await ctx.runQuery(internal.sessionInternal.getEpisode, {
        episodeId: args.episodeId,
      });
      if (!ep || ep.practitionerId !== practitioner._id) {
        throw new Error("Episode not found.");
      }
      episodeId = ep._id;
    } else {
      const active = await ctx.runQuery(
        internal.sessionInternal.resolveActiveEpisode,
        { clientId: args.clientId }
      );
      episodeId = active?._id;
    }

    const previousRecaps = await ctx.runQuery(
      internal.sessionInternal.listRecapsForClient,
      { clientId: args.clientId }
    );

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Something went wrong generating your session intelligence — please try again"
      );
    }
    const anthropic = new Anthropic({ apiKey });

    const recapSummaries =
      previousRecaps.length === 0
        ? "No previous sessions"
        : previousRecaps
            .map(
              (r, i) =>
                `Session ${i + 1} (${new Date(r.createdAt).toISOString()}):\n` +
                `Objective: ${r.okrObjective}\n` +
                `Transformation: ${r.transformationDelta}\n` +
                `Next focus: ${r.nextFocus}\n` +
                `Action items: ${r.actionItems.map((a) => `${a.step}. ${a.action}`).join("; ")}`
            )
            .join("\n\n");

    const userPrompt = `You are the post-session agent for the Hypnotherapy Briefcase.

Generate a complete post-session intelligence package as valid JSON with exactly these keys — no other text, no markdown, no explanation:

{
  "okr_objective": string,
  "okr_key_results": string[],
  "okr_progress": string,
  "problem_solution_fit": Array<{problem: string, solution: string}>,
  "outcomes_to_expect": string[],
  "action_items": Array<{step: number, action: string, when: string, why: string}>,
  "draft_email_subject": string,
  "draft_email_body": string,
  "transformation_delta": string,
  "next_focus": string,
  "engagement_signal": "active" | "needs_attention" | "at_risk",
  "engagement_signal_evidence": string,
  "practitioner_note": string
}

RULES FOR draft_email_body:
- The value of draft_email_body MUST be a valid HTML fragment (no <html>, <head>, or <body> wrappers — only inner markup).
- NO markdown, NO asterisks for emphasis, NO backticks, NO #-style headings. Only HTML tags.
- Use "we" language throughout. Warm, professional, never clinical.
- Maximum 400 words total in the body.

STRUCTURE the draft_email_body as five clearly ordered sections, in this exact order:

1. Opening paragraph — a single warm <p> that acknowledges what we worked on together today. No heading above this paragraph.

2. The affirmation or anchor from this session, ONLY if one was created:
   - Introduce with a short <h2> heading in the practitioner's voice (e.g. <h2>What you carry with you</h2> or <h2>Our anchor</h2>).
   - Present the affirmation itself in a <blockquote> tag.
   - Skip this section entirely if no anchor or affirmation was created — do not invent one.

3. <h2>What you may notice</h2> followed immediately by a <ul> of 2–4 <li> items describing what the client may experience in the coming days.

4. <h2>Before our next session</h2> followed immediately by a <ul> of <li> items — one <li> per action from the action_items. Inside each <li>, open with the action in <strong>, then a short natural sentence about when and why.

5. Closing — a short warm <p> that ends the email. Mention naturally that curated resources will be shared separately.

Allowed tags: <p>, <strong>, <em>, <h2>, <blockquote>, <ul>, <li>. Nothing else. No attributes on tags. No inline CSS.

End the draft_email_body with the closing <p> and nothing after it.

PREVIOUS SESSION RECAPS: ${recapSummaries}

CLIENT CONTEXT: ${client.name} — presenting issue: ${client.presentingIssue}

TRANSCRIPT:
${args.transcriptText}`;

    let rawJson: string;
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 6000,
        system: ASHWIN_VOICE,
        messages: [{ role: "user", content: userPrompt }],
      });
      rawJson = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    } catch (err) {
      console.error("Anthropic error (processTranscript main):", err);
      throw new Error(
        "Something went wrong generating your session intelligence — please try again"
      );
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = extractJson(rawJson) as Record<string, unknown>;
    } catch (err) {
      console.error("JSON extraction failed (processTranscript):", err);
      throw new Error(
        "Something went wrong generating your session intelligence — please try again"
      );
    }

    let draftEmailBody = coerceString(parsed.draft_email_body);
    let qualityGateRan = false;
    let qualityGateReplaced = false;

    try {
      const reviewResp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 3000,
        system: ASHWIN_VOICE,
        messages: [
          {
            role: "user",
            content: `Review this HTML email body against these criteria and return ONLY the improved HTML. No prose commentary, no markdown, no explanation — just the HTML fragment, starting with a tag.

1. Does it overwhelm? If yes, cut until it does not.
2. Does it use "we" language throughout? If no, rewrite.
3. Does it sound like a warm professional who knows this client personally? If no, rewrite.
4. Are all five elements present: a reference to the session's objective, the problem-solution connection, what the client may notice, the action roadmap, and a note that curated resources will be shared separately? If any are missing, add them naturally.
5. Is it clean HTML using only <p>, <strong>, <em>, <h2>, <blockquote>, <ul>, <li> — with no markdown asterisks, no backticks, no attributes? If not, clean it up.

Structure must stay: opening <p>, optional <h2> + <blockquote> anchor, <h2>What you may notice</h2> + <ul>, <h2>Before our next session</h2> + <ul>, closing <p>.

HTML TO REVIEW:
${draftEmailBody}`,
          },
        ],
      });
      qualityGateRan = true;
      const reviewed = reviewResp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      // Only accept the revision if it looks like real HTML content (starts
      // near a tag after any leading whitespace) and is substantial enough.
      const firstTag = reviewed.indexOf("<");
      const looksHtml = firstTag >= 0 && firstTag < 40;
      if (looksHtml && reviewed.length > 80) {
        draftEmailBody = reviewed.slice(firstTag);
        qualityGateReplaced = true;
      }
    } catch (err) {
      console.error("Anthropic error (processTranscript review):", err);
    }
    console.log(
      `[processTranscript] quality gate ran=${qualityGateRan} replaced=${qualityGateReplaced}`
    );

    const problemSolutionFit = Array.isArray(parsed.problem_solution_fit)
      ? parsed.problem_solution_fit
          .map((p: unknown) => {
            const obj = p as { problem?: unknown; solution?: unknown };
            return {
              problem: coerceString(obj.problem),
              solution: coerceString(obj.solution),
            };
          })
          .filter((p) => p.problem && p.solution)
      : [];

    const actionItems = Array.isArray(parsed.action_items)
      ? parsed.action_items
          .map((a: unknown, idx: number) => {
            const obj = a as {
              step?: unknown;
              action?: unknown;
              when?: unknown;
              why?: unknown;
            };
            return {
              step: typeof obj.step === "number" ? obj.step : idx + 1,
              action: coerceString(obj.action),
              when: coerceString(obj.when),
              why: coerceString(obj.why),
            };
          })
          .filter((a) => a.action)
      : [];

    const result = await ctx.runMutation(
      internal.sessionInternal.createSessionAndRecap,
      {
        clientId: args.clientId,
        practitionerId: practitioner._id,
        episodeId,
        sessionDate: args.sessionDate,
        transcriptText: args.transcriptText,
        recap: {
          okrObjective: coerceString(parsed.okr_objective),
          okrKeyResults: coerceStringArray(parsed.okr_key_results),
          okrProgress: coerceString(parsed.okr_progress) || undefined,
          problemSolutionFit,
          outcomesToExpect: coerceStringArray(parsed.outcomes_to_expect),
          actionItems,
          draftEmailSubject:
            coerceString(parsed.draft_email_subject) ||
            `Notes from our session, ${client.name.split(" ")[0]}`,
          draftEmailBody,
          transformationDelta: coerceString(parsed.transformation_delta),
          nextFocus: coerceString(parsed.next_focus),
          engagementSignal: coerceSignal(parsed.engagement_signal),
          engagementSignalEvidence: coerceString(
            parsed.engagement_signal_evidence
          ),
          practitionerNote: coerceString(parsed.practitioner_note),
        },
      }
    );

    return {
      recapId: result.recapId,
      sessionId: result.sessionId,
      sessionNumber: result.sessionNumber,
      episodeId,
    };
  },
});

export const sendRecapEmail = action({
  args: {
    recapId: v.id("sessionRecaps"),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (
    ctx,
    { recapId, subject, body }
  ): Promise<{ ok: boolean; to: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in.");

    const practitioner = await ctx.runQuery(
      internal.sessionInternal.getPractitionerForUser,
      { userId }
    );
    if (!practitioner) throw new Error("Only practitioners can send emails.");

    const ctxData = await ctx.runQuery(
      internal.sessionInternal.getRecapWithContext,
      {
        recapId,
      }
    );
    if (!ctxData || !ctxData.recap || !ctxData.client) {
      throw new Error("We couldn't find that session recap.");
    }
    if (ctxData.recap.practitionerId !== practitioner._id) {
      throw new Error("Not authorised for that recap.");
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;
    if (!apiKey || !fromEmail) {
      throw new Error(
        "Email service isn't ready yet — your session has been saved."
      );
    }

    const resend = new Resend(apiKey);

    const bodyHtml = normalizeBodyHtml(body);
    const html = buildEmailShell({
      subject,
      bodyHtml,
      practitionerName: practitioner.name || "Ashwin Kumar",
    });
    const text = htmlToPlainText(bodyHtml);

    // Persist the edited subject/body first, then mark an attempt.
    await ctx.runMutation(internal.sessionInternal.updateRecapEmail, {
      recapId,
      subject,
      body,
    });
    await ctx.runMutation(internal.emailStatus.markRecapEmailAttempt, {
      recapId,
    });

    let rejectionMessage: string | null = null;
    try {
      const response = await resend.emails.send({
        from: fromEmail,
        to: ctxData.client.email,
        subject,
        html,
        text,
      });
      if (response.error) {
        rejectionMessage =
          response.error.message ||
          `Resend ${response.error.name ?? "validation_error"}.`;
        console.error(
          `[sendRecapEmail] Resend API rejected send to ${ctxData.client.email}: ${response.error.name} (${response.error.statusCode ?? "n/a"}) — ${response.error.message}`
        );
      } else if (!response.data?.id) {
        rejectionMessage = "Resend returned no message id.";
        console.error(
          `[sendRecapEmail] Unexpected Resend response (no id):`,
          response
        );
      } else {
        console.log(
          `[sendRecapEmail] Resend accepted — id=${response.data.id} to=${ctxData.client.email}`
        );
      }
    } catch (err) {
      rejectionMessage =
        err instanceof Error
          ? err.message
          : "We couldn't reach the email service.";
      console.error(`[sendRecapEmail] Resend threw:`, err);
    }

    if (rejectionMessage) {
      await ctx.runMutation(internal.emailStatus.recordRecapEmail, {
        recapId,
        status: "failed",
        error: rejectionMessage,
      });
      throw new Error(
        `We couldn't send the email — ${rejectionMessage}. Your session is saved; please try again.`
      );
    }

    await ctx.runMutation(internal.emailStatus.recordRecapEmail, {
      recapId,
      status: "sent",
    });

    return { ok: true, to: ctxData.client.email };
  },
});

export const saveRecapEdits = action({
  args: {
    recapId: v.id("sessionRecaps"),
    subject: v.string(),
    body: v.string(),
  },
  handler: async (
    ctx,
    { recapId, subject, body }
  ): Promise<{ ok: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in.");
    const practitioner = await ctx.runQuery(
      internal.sessionInternal.getPractitionerForUser,
      { userId }
    );
    if (!practitioner) throw new Error("Not authorised.");
    const ctxData = await ctx.runQuery(
      internal.sessionInternal.getRecapWithContext,
      {
        recapId,
      }
    );
    if (!ctxData || ctxData.recap?.practitionerId !== practitioner._id) {
      throw new Error("Not authorised.");
    }
    await ctx.runMutation(internal.sessionInternal.updateRecapEmail, {
      recapId,
      subject,
      body,
    });
    return { ok: true };
  },
});
