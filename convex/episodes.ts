import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listForClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!practitioner) return [];

    const client = await ctx.db.get(clientId);
    if (!client || client.practitionerId !== practitioner._id) return [];

    const episodes = await ctx.db
      .query("episodes")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();
    episodes.sort((a, b) => b.createdAt - a.createdAt);

    const withCounts = await Promise.all(
      episodes.map(async (ep) => {
        const sessions = await ctx.db
          .query("sessions")
          .withIndex("by_episode", (q) => q.eq("episodeId", ep._id))
          .collect();
        const intake = await ctx.db
          .query("intakeForms")
          .withIndex("by_episode", (q) => q.eq("episodeId", ep._id))
          .first();
        return {
          ...ep,
          sessionCount: sessions.length,
          hasIntake: !!intake,
        };
      })
    );

    return withCounts;
  },
});

export const createEpisode = mutation({
  args: {
    clientId: v.id("clients"),
    episodeTitle: v.string(),
    presentingIssue: v.string(),
  },
  handler: async (ctx, { clientId, episodeTitle, presentingIssue }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in.");
    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!practitioner) throw new Error("Only practitioners can create episodes.");

    const client = await ctx.db.get(clientId);
    if (!client || client.practitionerId !== practitioner._id) {
      throw new Error("Client not found.");
    }

    const episodeId = await ctx.db.insert("episodes", {
      clientId,
      practitionerId: practitioner._id,
      episodeTitle: episodeTitle.trim(),
      presentingIssue: presentingIssue.trim(),
      status: "active",
      createdAt: Date.now(),
    });
    return { episodeId };
  },
});

export const insertEpisodeInternal = internalMutation({
  args: {
    clientId: v.id("clients"),
    practitionerId: v.id("practitioners"),
    episodeTitle: v.string(),
    presentingIssue: v.string(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client || client.practitionerId !== args.practitionerId) {
      throw new Error("Client not found.");
    }
    const episodeId = await ctx.db.insert("episodes", {
      clientId: args.clientId,
      practitionerId: args.practitionerId,
      episodeTitle: args.episodeTitle.trim(),
      presentingIssue: args.presentingIssue.trim(),
      status: "active",
      createdAt: Date.now(),
    });
    return { episodeId };
  },
});

export const setStatus = mutation({
  args: {
    episodeId: v.id("episodes"),
    status: v.union(v.literal("active"), v.literal("closed")),
  },
  handler: async (ctx, { episodeId, status }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in.");
    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!practitioner) throw new Error("Not authorised.");

    const ep = await ctx.db.get(episodeId);
    if (!ep || ep.practitionerId !== practitioner._id) {
      throw new Error("Episode not found.");
    }
    await ctx.db.patch(episodeId, {
      status,
      closedAt: status === "closed" ? Date.now() : undefined,
    });
    return { ok: true };
  },
});
