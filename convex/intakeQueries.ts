import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// Public query: resolves { name, alreadySubmitted, episode } for an intake
// link. Accepts either just an invite code (legacy — latest active episode)
// or an invite code + explicit episodeId.
export const getClientByInviteCode = query({
  args: {
    inviteCode: v.string(),
    episodeId: v.optional(v.id("episodes")),
  },
  handler: async (ctx, { inviteCode, episodeId }) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", inviteCode.trim())
      )
      .first();
    if (!client) return null;

    let episode: {
      _id: Id<"episodes">;
      episodeTitle: string;
      presentingIssue: string;
      status: "active" | "closed";
    } | null = null;

    if (episodeId) {
      const ep = await ctx.db.get(episodeId);
      if (!ep || ep.clientId !== client._id) return null;
      episode = {
        _id: ep._id,
        episodeTitle: ep.episodeTitle,
        presentingIssue: ep.presentingIssue,
        status: ep.status,
      };
    } else {
      const active = await ctx.db
        .query("episodes")
        .withIndex("by_client_status", (q) =>
          q.eq("clientId", client._id).eq("status", "active")
        )
        .order("desc")
        .first();
      if (active) {
        episode = {
          _id: active._id,
          episodeTitle: active.episodeTitle,
          presentingIssue: active.presentingIssue,
          status: active.status,
        };
      }
    }

    let alreadySubmitted = false;
    if (episode) {
      const existing = await ctx.db
        .query("intakeForms")
        .withIndex("by_episode", (q) => q.eq("episodeId", episode!._id))
        .first();
      alreadySubmitted = !!existing;
    } else {
      const existing = await ctx.db
        .query("intakeForms")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .first();
      alreadySubmitted = !!existing;
    }

    return {
      name: client.name,
      alreadySubmitted,
      episode,
    };
  },
});

export const getIntakeForEpisode = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!practitioner) return null;

    const ep = await ctx.db.get(episodeId);
    if (!ep || ep.practitionerId !== practitioner._id) return null;

    const intake = await ctx.db
      .query("intakeForms")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .first();
    return {
      episode: {
        _id: ep._id,
        episodeTitle: ep.episodeTitle,
        presentingIssue: ep.presentingIssue,
      },
      intake,
    };
  },
});

export const getClientForIntakeByCode = internalQuery({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", inviteCode.trim())
      )
      .first();
  },
});

export const resolveIntakeTarget = internalQuery({
  args: {
    inviteCode: v.string(),
    episodeId: v.optional(v.id("episodes")),
  },
  handler: async (ctx, { inviteCode, episodeId }) => {
    const client = await ctx.db
      .query("clients")
      .withIndex("by_inviteCode", (q) =>
        q.eq("inviteCode", inviteCode.trim())
      )
      .first();
    if (!client) return null;

    let episode = null;
    if (episodeId) {
      const ep = await ctx.db.get(episodeId);
      if (ep && ep.clientId === client._id) episode = ep;
    } else {
      episode = await ctx.db
        .query("episodes")
        .withIndex("by_client_status", (q) =>
          q.eq("clientId", client._id).eq("status", "active")
        )
        .order("desc")
        .first();
    }

    return { client, episode };
  },
});

export const insertIntake = internalMutation({
  args: {
    clientId: v.id("clients"),
    practitionerId: v.id("practitioners"),
    episodeId: v.optional(v.id("episodes")),
    whatBringsYou: v.string(),
    successOutcome: v.string(),
    previousTherapy: v.boolean(),
    previousTherapyDescription: v.optional(v.string()),
    stressLevel: v.number(),
    additionalContext: v.optional(v.string()),
    aiSummary: v.optional(v.string()),
    aiSummaryStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("generated"),
        v.literal("failed")
      )
    ),
    aiSummaryError: v.optional(v.string()),
    assistedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Dedup by episode when one is provided; otherwise dedup by client.
    let existing = null;
    if (args.episodeId) {
      existing = await ctx.db
        .query("intakeForms")
        .withIndex("by_episode", (q) => q.eq("episodeId", args.episodeId))
        .first();
    } else {
      existing = await ctx.db
        .query("intakeForms")
        .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
        .first();
    }
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        completedAt: Date.now(),
      });
      return existing._id;
    }
    return await ctx.db.insert("intakeForms", {
      ...args,
      completedAt: Date.now(),
    });
  },
});
