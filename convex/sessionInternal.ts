import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getPractitionerForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const getClientForPractitioner = internalQuery({
  args: {
    clientId: v.id("clients"),
    practitionerId: v.id("practitioners"),
  },
  handler: async (ctx, { clientId, practitionerId }) => {
    const client = await ctx.db.get(clientId);
    if (!client || client.practitionerId !== practitionerId) return null;
    return client;
  },
});

export const listRecapsForClient = internalQuery({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    return await ctx.db
      .query("sessionRecaps")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("asc")
      .collect();
  },
});

export const resolveActiveEpisode = internalQuery({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    // Prefer the most recently created active episode. Falls back to the
    // most recent episode of any status so legacy data never blocks an action.
    const active = await ctx.db
      .query("episodes")
      .withIndex("by_client_status", (q) =>
        q.eq("clientId", clientId).eq("status", "active")
      )
      .order("desc")
      .first();
    if (active) return active;
    return await ctx.db
      .query("episodes")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("desc")
      .first();
  },
});

export const getEpisode = internalQuery({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    return await ctx.db.get(episodeId);
  },
});

export const createSessionAndRecap = internalMutation({
  args: {
    clientId: v.id("clients"),
    practitionerId: v.id("practitioners"),
    episodeId: v.optional(v.id("episodes")),
    sessionDate: v.number(),
    transcriptText: v.string(),
    recap: v.object({
      okrObjective: v.string(),
      okrKeyResults: v.array(v.string()),
      okrProgress: v.optional(v.string()),
      problemSolutionFit: v.array(
        v.object({ problem: v.string(), solution: v.string() })
      ),
      outcomesToExpect: v.array(v.string()),
      actionItems: v.array(
        v.object({
          step: v.number(),
          action: v.string(),
          when: v.string(),
          why: v.string(),
        })
      ),
      draftEmailSubject: v.string(),
      draftEmailBody: v.string(),
      transformationDelta: v.string(),
      nextFocus: v.string(),
      engagementSignal: v.union(
        v.literal("active"),
        v.literal("needs_attention"),
        v.literal("at_risk")
      ),
      engagementSignalEvidence: v.string(),
      practitionerNote: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client || client.practitionerId !== args.practitionerId) {
      throw new Error("Client not found.");
    }

    const sessionNumber = (client.sessionCount ?? 0) + 1;

    const sessionId = await ctx.db.insert("sessions", {
      clientId: args.clientId,
      practitionerId: args.practitionerId,
      episodeId: args.episodeId,
      sessionNumber,
      sessionDate: args.sessionDate,
      transcriptText: args.transcriptText,
      status: "processed",
    });

    const recapId = await ctx.db.insert("sessionRecaps", {
      sessionId,
      clientId: args.clientId,
      practitionerId: args.practitionerId,
      episodeId: args.episodeId,
      ...args.recap,
      emailSent: false,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.clientId, { sessionCount: sessionNumber });

    return { sessionId, recapId, sessionNumber };
  },
});

export const updateRecapEmail = internalMutation({
  args: {
    recapId: v.id("sessionRecaps"),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    emailSent: v.optional(v.boolean()),
  },
  handler: async (ctx, { recapId, subject, body, emailSent }) => {
    const patch: Record<string, unknown> = {};
    if (subject !== undefined) patch.draftEmailSubject = subject;
    if (body !== undefined) patch.draftEmailBody = body;
    if (emailSent !== undefined) patch.emailSent = emailSent;
    await ctx.db.patch(recapId, patch);
  },
});

export const getRecapWithContext = internalQuery({
  args: { recapId: v.id("sessionRecaps") },
  handler: async (ctx, { recapId }) => {
    const recap = await ctx.db.get(recapId);
    if (!recap) return null;
    const client = await ctx.db.get(recap.clientId);
    return { recap, client };
  },
});

export const insertPrepBrief = internalMutation({
  args: {
    clientId: v.id("clients"),
    practitionerId: v.id("practitioners"),
    episodeId: v.optional(v.id("episodes")),
    scheduledFor: v.number(),
    coreJtbd: v.string(),
    situationalStatus: v.string(),
    unfinishedBusiness: v.string(),
    actionStepIntelligence: v.string(),
    recommendedFocus: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client || client.practitionerId !== args.practitionerId) {
      throw new Error("Client not found.");
    }
    return await ctx.db.insert("prepBriefs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
