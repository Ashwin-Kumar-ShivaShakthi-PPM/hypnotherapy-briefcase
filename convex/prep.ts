"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import Anthropic from "@anthropic-ai/sdk";
import { ASHWIN_VOICE_PRACTITIONER } from "../lib/voice";
import type { Id } from "./_generated/dataModel";

const MODEL = "claude-opus-4-5";

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

function coerce(x: unknown, fallback = ""): string {
  return typeof x === "string" ? x : fallback;
}

export const scheduleAndGenerate = action({
  args: {
    clientId: v.id("clients"),
    episodeId: v.optional(v.id("episodes")),
    scheduledFor: v.number(),
  },
  handler: async (
    ctx,
    { clientId, episodeId: argEpisodeId, scheduledFor }
  ): Promise<{ briefId: Id<"prepBriefs">; episodeId: Id<"episodes"> | undefined }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in.");

    const practitioner = await ctx.runQuery(
      internal.sessionInternal.getPractitionerForUser,
      { userId }
    );
    if (!practitioner) throw new Error("Only practitioners can schedule.");

    const client = await ctx.runQuery(
      internal.sessionInternal.getClientForPractitioner,
      { clientId, practitionerId: practitioner._id }
    );
    if (!client) throw new Error("Client not found.");

    let episodeId: Id<"episodes"> | undefined;
    if (argEpisodeId) {
      const ep = await ctx.runQuery(internal.sessionInternal.getEpisode, {
        episodeId: argEpisodeId,
      });
      if (!ep || ep.practitionerId !== practitioner._id) {
        throw new Error("Episode not found.");
      }
      episodeId = ep._id;
    } else {
      const active = await ctx.runQuery(
        internal.sessionInternal.resolveActiveEpisode,
        { clientId }
      );
      episodeId = active?._id;
    }

    const recaps = await ctx.runQuery(
      internal.sessionInternal.listRecapsForClient,
      {
        clientId,
      }
    );

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Something went wrong generating your session intelligence — please try again"
      );
    }
    const anthropic = new Anthropic({ apiKey });

    const recapBlock =
      recaps.length === 0
        ? "No previous sessions — this is the first session with this client."
        : recaps
            .map(
              (r, i) =>
                `Session ${i + 1}:\n` +
                `Objective: ${r.okrObjective}\n` +
                `Key results: ${r.okrKeyResults.join("; ")}\n` +
                `Transformation delta: ${r.transformationDelta}\n` +
                `Next focus: ${r.nextFocus}\n` +
                `Action items: ${r.actionItems.map((a) => a.action).join("; ")}\n` +
                `Practitioner note: ${r.practitionerNote}`
            )
            .join("\n\n");

    const prompt = `Generate a practitioner prep brief as valid JSON only:
{
  "core_jtbd": string,
  "situational_status": string,
  "unfinished_business": string,
  "action_step_intelligence": string,
  "recommended_focus": string
}
Maximum 250 words total. Every word must earn its place.
CLIENT: ${client.name} — presenting issue: ${client.presentingIssue}
PREVIOUS SESSION RECAPS:
${recapBlock}`;

    let raw: string;
    try {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1500,
        system: ASHWIN_VOICE_PRACTITIONER,
        messages: [{ role: "user", content: prompt }],
      });
      raw = resp.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    } catch (err) {
      console.error("Anthropic error (prep brief):", err);
      throw new Error(
        "Something went wrong generating your session intelligence — please try again"
      );
    }

    const parsed = extractJson(raw) as Record<string, unknown>;

    const briefId = await ctx.runMutation(
      internal.sessionInternal.insertPrepBrief,
      {
        clientId,
        practitionerId: practitioner._id,
        episodeId,
        scheduledFor,
        coreJtbd: coerce(parsed.core_jtbd),
        situationalStatus: coerce(parsed.situational_status),
        unfinishedBusiness: coerce(parsed.unfinished_business),
        actionStepIntelligence: coerce(parsed.action_step_intelligence),
        recommendedFocus: coerce(parsed.recommended_focus),
      }
    );

    return { briefId, episodeId };
  },
});
