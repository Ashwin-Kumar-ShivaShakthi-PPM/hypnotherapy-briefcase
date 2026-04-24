import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const markClientWelcomeAttempt = internalMutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    await ctx.db.patch(clientId, {
      welcomeEmailStatus: "pending",
      welcomeEmailAttemptedAt: Date.now(),
    });
  },
});

export const recordClientWelcome = internalMutation({
  args: {
    clientId: v.id("clients"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { clientId, status, error }) => {
    const patch: Record<string, unknown> = {
      welcomeEmailStatus: status,
      welcomeEmailError: status === "failed" ? error ?? null : undefined,
    };
    if (status === "sent") patch.welcomeEmailSentAt = Date.now();
    await ctx.db.patch(clientId, patch);
  },
});

export const markEpisodeWelcomeAttempt = internalMutation({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    await ctx.db.patch(episodeId, {
      welcomeEmailStatus: "pending",
      welcomeEmailAttemptedAt: Date.now(),
    });
  },
});

export const recordEpisodeWelcome = internalMutation({
  args: {
    episodeId: v.id("episodes"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { episodeId, status, error }) => {
    const patch: Record<string, unknown> = {
      welcomeEmailStatus: status,
      welcomeEmailError: status === "failed" ? error ?? null : undefined,
    };
    if (status === "sent") patch.welcomeEmailSentAt = Date.now();
    await ctx.db.patch(episodeId, patch);
  },
});

export const markRecapEmailAttempt = internalMutation({
  args: { recapId: v.id("sessionRecaps") },
  handler: async (ctx, { recapId }) => {
    await ctx.db.patch(recapId, {
      emailStatus: "pending",
      emailAttemptedAt: Date.now(),
    });
  },
});

export const recordRecapEmail = internalMutation({
  args: {
    recapId: v.id("sessionRecaps"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { recapId, status, error }) => {
    const patch: Record<string, unknown> = {
      emailStatus: status,
      emailError: status === "failed" ? error ?? null : undefined,
      emailSent: status === "sent",
    };
    if (status === "sent") patch.emailSentAt = Date.now();
    await ctx.db.patch(recapId, patch);
  },
});

// Ownership-guarded public lookups for the UI to show email status + retry.

export const firstEpisodeForClient = internalQuery({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const episodes = await ctx.db
      .query("episodes")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .collect();
    episodes.sort((a, b) => a.createdAt - b.createdAt);
    return episodes[0] ?? null;
  },
});

// Verified ownership lookup used by the dashboard to confirm status
// without exposing internal mutations.
import { query } from "./_generated/server";

export const getEmailStatusForClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, { clientId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!practitioner) return null;
    const client = await ctx.db.get(clientId);
    if (!client || client.practitionerId !== practitioner._id) return null;
    return {
      welcomeEmailStatus: client.welcomeEmailStatus ?? null,
      welcomeEmailError: client.welcomeEmailError ?? null,
      welcomeEmailSentAt: client.welcomeEmailSentAt ?? null,
      welcomeEmailAttemptedAt: client.welcomeEmailAttemptedAt ?? null,
    };
  },
});
