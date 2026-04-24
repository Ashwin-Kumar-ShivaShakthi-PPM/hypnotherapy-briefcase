import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

export const listForPractitioner = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!practitioner) return [];

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_practitioner", (q) =>
        q.eq("practitionerId", practitioner._id)
      )
      .collect();

    const enriched = await Promise.all(
      clients.map(async (client) => {
        const latestRecap = await ctx.db
          .query("sessionRecaps")
          .withIndex("by_client", (q) => q.eq("clientId", client._id))
          .order("desc")
          .first();

        const intake = await ctx.db
          .query("intakeForms")
          .withIndex("by_client", (q) => q.eq("clientId", client._id))
          .first();

        const upcomingPrep = await ctx.db
          .query("prepBriefs")
          .withIndex("by_client", (q) => q.eq("clientId", client._id))
          .order("desc")
          .first();

        const episodes = await ctx.db
          .query("episodes")
          .withIndex("by_client", (q) => q.eq("clientId", client._id))
          .collect();
        episodes.sort((a, b) => b.createdAt - a.createdAt);

        const episodesEnriched = await Promise.all(
          episodes.map(async (ep) => {
            const epSessions = await ctx.db
              .query("sessions")
              .withIndex("by_episode", (q) => q.eq("episodeId", ep._id))
              .collect();
            const epIntake = await ctx.db
              .query("intakeForms")
              .withIndex("by_episode", (q) => q.eq("episodeId", ep._id))
              .first();
            return {
              ...ep,
              sessionCount: epSessions.length,
              hasIntake: !!epIntake,
            };
          })
        );

        return {
          ...client,
          latestRecap,
          hasIntake: !!intake,
          upcomingPrep,
          episodes: episodesEnriched,
          welcomeEmailStatus: client.welcomeEmailStatus ?? null,
          welcomeEmailError: client.welcomeEmailError ?? null,
        };
      })
    );

    return enriched;
  },
});

export const getClientForPractitioner = query({
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

    const intake = await ctx.db
      .query("intakeForms")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .first();

    const recaps = await ctx.db
      .query("sessionRecaps")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("desc")
      .collect();

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("desc")
      .collect();

    const upcomingPrep = await ctx.db
      .query("prepBriefs")
      .withIndex("by_client", (q) => q.eq("clientId", clientId))
      .order("desc")
      .first();

    return { client, intake, recaps, sessions, upcomingPrep };
  },
});

function generateInviteCode() {
  // 6-digit numeric
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const createClient = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    episodeTitle: v.string(),
    presentingIssue: v.string(),
  },
  handler: async (
    ctx,
    { name, email, episodeTitle, presentingIssue }
  ): Promise<{
    clientId: Id<"clients">;
    episodeId: Id<"episodes">;
    inviteCode: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in.");
    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!practitioner)
      throw new Error("Only practitioners can create client records.");

    let inviteCode = generateInviteCode();
    for (let i = 0; i < 6; i++) {
      const existing = await ctx.db
        .query("clients")
        .withIndex("by_inviteCode", (q) => q.eq("inviteCode", inviteCode))
        .first();
      if (!existing) break;
      inviteCode = generateInviteCode();
    }

    const now = Date.now();
    const cleanEpisodeTitle = episodeTitle.trim() || "Initial engagement";
    const cleanPresentingIssue = presentingIssue.trim();

    const clientId: Id<"clients"> = await ctx.db.insert("clients", {
      practitionerId: practitioner._id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      presentingIssue: cleanPresentingIssue,
      sessionCount: 0,
      inviteCode,
      createdAt: now,
    });

    const episodeId: Id<"episodes"> = await ctx.db.insert("episodes", {
      clientId,
      practitionerId: practitioner._id,
      episodeTitle: cleanEpisodeTitle,
      presentingIssue: cleanPresentingIssue,
      status: "active",
      createdAt: now,
    });

    return { clientId, episodeId, inviteCode };
  },
});

// Read-side helper used by email actions — resolves the active episode of a
// client. Separate because actions need to pass IDs around, not auth.
export const getEpisodeForEmail = query({
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
    const client = await ctx.db.get(ep.clientId);
    if (!client) return null;
    return {
      clientName: client.name,
      clientEmail: client.email,
      inviteCode: client.inviteCode,
      episodeTitle: ep.episodeTitle,
      presentingIssue: ep.presentingIssue,
      practitionerName: practitioner.name,
    };
  },
});
