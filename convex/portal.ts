import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const myJourney = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const client = await ctx.db
      .query("clients")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!client) return null;

    const recaps = await ctx.db
      .query("sessionRecaps")
      .withIndex("by_client", (q) => q.eq("clientId", client._id))
      .order("desc")
      .collect();

    const practitioner = await ctx.db.get(client.practitionerId);

    return {
      client: {
        _id: client._id,
        name: client.name,
        sessionCount: client.sessionCount,
      },
      practitionerName: practitioner?.name ?? "your practitioner",
      recaps: recaps.map((r) => ({
        _id: r._id,
        createdAt: r.createdAt,
        transformationDelta: r.transformationDelta,
        outcomesToExpect: r.outcomesToExpect,
        actionItems: r.actionItems,
        nextFocus: r.nextFocus,
      })),
    };
  },
});
