import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      throw new Error("Please enter a valid email address.");
    }

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .first();

    if (existing) {
      return { ok: true, alreadyOnList: true };
    }

    await ctx.db.insert("waitlist", {
      email: normalized,
      createdAt: Date.now(),
    });

    return { ok: true, alreadyOnList: false };
  },
});
