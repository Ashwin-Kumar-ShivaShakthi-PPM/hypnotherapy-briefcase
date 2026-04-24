"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import Anthropic from "@anthropic-ai/sdk";
import { ASHWIN_VOICE_PRACTITIONER } from "../lib/voice";

const MODEL = "claude-opus-4-5";

export const submitIntake = action({
  args: {
    inviteCode: v.string(),
    episodeId: v.optional(v.id("episodes")),
    assistedBy: v.optional(v.string()),
    whatBringsYou: v.string(),
    successOutcome: v.string(),
    previousTherapy: v.boolean(),
    previousTherapyDescription: v.optional(v.string()),
    stressLevel: v.number(),
    additionalContext: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    const target = await ctx.runQuery(
      internal.intakeQueries.resolveIntakeTarget,
      { inviteCode: args.inviteCode, episodeId: args.episodeId }
    );
    if (!target || !target.client) {
      throw new Error(
        "We couldn't find that intake link. Please check with your practitioner."
      );
    }

    const client = target.client;
    const episode = target.episode;

    let aiSummary: string | undefined;
    let aiSummaryStatus: "generated" | "failed" | "pending" = "pending";
    let aiSummaryError: string | undefined;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      aiSummaryStatus = "failed";
      aiSummaryError = "Anthropic key is not configured.";
      console.error(
        "[submitIntake] ANTHROPIC_API_KEY missing — summary skipped."
      );
    }
    if (apiKey) {
      try {
        const anthropic = new Anthropic({ apiKey });
        const resp = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 400,
          system: ASHWIN_VOICE_PRACTITIONER,
          messages: [
            {
              role: "user",
              content: `Summarize this client intake into 2-3 sentences Ashwin can read at a glance before the first session.

Rules:
- Plain prose only. No markdown. No headings, no bold, no asterisks, no bullet lists.
- Direct and clinical. No preamble like "Here is a summary" or "Summary:".
- Maximum 3 sentences.

Client name: ${client.name}
Episode: ${episode?.episodeTitle ?? "(no episode on file)"}
Presenting issue on file: ${episode?.presentingIssue ?? client.presentingIssue}

What brings them: ${args.whatBringsYou}
Success outcome: ${args.successOutcome}
Previous therapy: ${
                args.previousTherapy
                  ? `yes — ${args.previousTherapyDescription ?? ""}`
                  : "no"
              }
Stress level: ${args.stressLevel}/10
Additional: ${args.additionalContext ?? "—"}`,
            },
          ],
        });
        aiSummary = resp.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join(" ")
          .trim();
        aiSummary = aiSummary
          .replace(/\*\*(.+?)\*\*/g, "$1")
          .replace(/^#+\s+/gm, "")
          .replace(/`([^`]+)`/g, "$1")
          .replace(/^\s*[-*•]\s+/gm, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
        aiSummaryStatus = aiSummary ? "generated" : "failed";
        if (!aiSummary) aiSummaryError = "Model returned an empty summary.";
      } catch (err) {
        aiSummaryStatus = "failed";
        aiSummaryError =
          err instanceof Error ? err.message : "Anthropic call failed.";
        console.error(
          `[submitIntake] Anthropic summary failed: ${aiSummaryError}`,
          err
        );
      }
    }

    await ctx.runMutation(internal.intakeQueries.insertIntake, {
      clientId: client._id,
      practitionerId: client.practitionerId,
      episodeId: episode?._id,
      whatBringsYou: args.whatBringsYou,
      successOutcome: args.successOutcome,
      previousTherapy: args.previousTherapy,
      previousTherapyDescription: args.previousTherapyDescription,
      stressLevel: args.stressLevel,
      additionalContext: args.additionalContext,
      aiSummary,
      aiSummaryStatus,
      aiSummaryError,
      assistedBy: args.assistedBy,
    });

    return { ok: true };
  },
});
