import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getRecap = query({
  args: { recapId: v.id("sessionRecaps") },
  handler: async (ctx, { recapId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const recap = await ctx.db.get(recapId);
    if (!recap) return null;

    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (practitioner && practitioner._id === recap.practitionerId) {
      return recap;
    }

    // Client can also view their own recaps via the portal.
    const client = await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (client && client._id === recap.clientId) {
      return recap;
    }

    return null;
  },
});
