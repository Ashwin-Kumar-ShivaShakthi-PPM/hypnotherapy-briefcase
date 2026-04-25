"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Resend } from "resend";

type JoinResult = { ok: true; alreadyOnList: boolean };

export const joinWaitlist = action({
  args: { email: v.string() },
  handler: async (ctx, { email }): Promise<JoinResult> => {
    const result = await ctx.runMutation(api.waitlist.addEmail, { email });

    if (result.alreadyOnList) {
      return { ok: true, alreadyOnList: true };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;
    if (!apiKey || !fromEmail) {
      console.error(
        "[joinWaitlist] Email service not configured (missing RESEND_API_KEY or FROM_EMAIL). Signup saved, welcome email skipped."
      );
      return { ok: true, alreadyOnList: false };
    }

    const to = email.trim().toLowerCase();
    const subject = "Welcome to The Hypnotherapy Briefcase";
    const text =
      "You're on the waitlist for The Hypnotherapy Briefcase.\n\n" +
      "We'll email you the moment the Briefcase is ready for you. " +
      "No spam — one email when we launch.\n\n" +
      "— The Hypnotherapy Briefcase";
    const html =
      `<p>You're on the waitlist for <strong>The Hypnotherapy Briefcase</strong>.</p>` +
      `<p>We'll email you the moment the Briefcase is ready for you. No spam — one email when we launch.</p>` +
      `<p>— The Hypnotherapy Briefcase</p>`;

    const resend = new Resend(apiKey);

    try {
      const response = await resend.emails.send({
        from: fromEmail,
        to,
        subject,
        html,
        text,
      });

      if (response.error) {
        console.error(
          `[joinWaitlist] Resend rejected send to ${to}: ${response.error.name} (${response.error.statusCode ?? "n/a"}) — ${response.error.message}`
        );
      } else if (!response.data?.id) {
        console.error(`[joinWaitlist] Resend returned no message id for ${to}`, response);
      } else {
        console.log(`[joinWaitlist] Resend accepted — id=${response.data.id} to=${to}`);
      }
    } catch (err) {
      console.error(`[joinWaitlist] Resend threw for ${to}:`, err);
    }

    return { ok: true, alreadyOnList: false };
  },
});
