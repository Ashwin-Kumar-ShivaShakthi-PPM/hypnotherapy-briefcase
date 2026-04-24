import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Returns the current user's role and profile.
// Shape: { role: 'practitioner'|'client'|'none', practitioner?, client? }
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { role: "none" as const };

    const user = await ctx.db.get(userId);

    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (practitioner) {
      return {
        role: "practitioner" as const,
        user,
        practitioner,
      };
    }

    const client = await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (client) {
      return {
        role: "client" as const,
        user,
        client,
      };
    }

    return { role: "unclaimed" as const, user };
  },
});

export const createPractitionerProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { name, email }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in.");

    const existing = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existing) return existing._id;

    return await ctx.db.insert("practitioners", {
      userId,
      name,
      email: email.trim().toLowerCase(),
      createdAt: Date.now(),
    });
  },
});

export const claimClientProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    inviteCode: v.string(),
  },
  handler: async (ctx, { name, email, inviteCode }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not signed in.");

    const normalizedCode = inviteCode.trim();
    const client = await ctx.db
      .query("clients")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", normalizedCode))
      .first();

    if (!client) {
      throw new Error(
        "We couldn't find that invite code. Please double-check with your practitioner."
      );
    }

    if (client.userId && client.userId !== userId) {
      throw new Error("This invite code has already been used.");
    }

    await ctx.db.patch(client._id, {
      userId,
      name: name || client.name,
      email: (email || client.email).trim().toLowerCase(),
    });

    return client._id;
  },
});
