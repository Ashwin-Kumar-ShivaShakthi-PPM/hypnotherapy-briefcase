import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id, Doc } from "./_generated/dataModel";

export type PracticeAnalytics = {
  activeClients: number;
  sessionsThisMonth: number;
  engagementHealth: number | null; // percentage, null when no recaps yet
  pendingIntakes: number;
  awaitingRecap: number;
  totalEpisodes: number;
  statusLists: {
    needsAttention: { clientId: Id<"clients">; name: string }[];
    atRisk: { clientId: Id<"clients">; name: string }[];
    intakePending: { clientId: Id<"clients">; name: string }[];
  };
};

export const getPracticeAnalytics = query({
  args: {},
  handler: async (ctx): Promise<PracticeAnalytics | null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const practitioner = await ctx.db
      .query("practitioners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!practitioner) return null;

    const practitionerId = practitioner._id;

    const clients = await ctx.db
      .query("clients")
      .withIndex("by_practitioner", (q) =>
        q.eq("practitionerId", practitionerId)
      )
      .collect();

    const episodes = await ctx.db
      .query("episodes")
      .withIndex("by_practitioner", (q) =>
        q.eq("practitionerId", practitionerId)
      )
      .collect();

    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_practitioner", (q) =>
        q.eq("practitionerId", practitionerId)
      )
      .collect();

    const recaps = await ctx.db
      .query("sessionRecaps")
      .withIndex("by_practitioner", (q) =>
        q.eq("practitionerId", practitionerId)
      )
      .collect();

    const intakes = await ctx.db
      .query("intakeForms")
      .withIndex("by_practitioner", (q) =>
        q.eq("practitionerId", practitionerId)
      )
      .collect();

    // Metric 1: active clients (have ≥1 active episode)
    const activeClientIds = new Set<Id<"clients">>();
    for (const ep of episodes) {
      if (ep.status === "active") activeClientIds.add(ep.clientId);
    }
    const activeClients = activeClientIds.size;

    // Metric 2: sessions this calendar month
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime();
    const startOfNext = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    ).getTime();
    const sessionsThisMonth = sessions.filter(
      (s) => s.sessionDate >= startOfMonth && s.sessionDate < startOfNext
    ).length;

    // Metric 3: engagement health — % of clients whose latest recap is active
    const latestRecapByClient = new Map<Id<"clients">, Doc<"sessionRecaps">>();
    for (const r of recaps) {
      const current = latestRecapByClient.get(r.clientId);
      if (!current || r.createdAt > current.createdAt) {
        latestRecapByClient.set(r.clientId, r);
      }
    }
    const clientsWithRecap = Array.from(latestRecapByClient.values());
    const activeCount = clientsWithRecap.filter(
      (r) => r.engagementSignal === "active"
    ).length;
    const engagementHealth =
      clientsWithRecap.length === 0
        ? null
        : Math.round((activeCount / clientsWithRecap.length) * 100);

    // Metric 4: pending intakes — active episodes with no intakeForm
    const intakeEpisodeIds = new Set<Id<"episodes">>();
    for (const i of intakes) {
      if (i.episodeId) intakeEpisodeIds.add(i.episodeId);
    }
    const pendingIntakeEpisodes = episodes.filter(
      (e) => e.status === "active" && !intakeEpisodeIds.has(e._id)
    );
    const pendingIntakes = pendingIntakeEpisodes.length;

    // Metric 5: sessions awaiting recap (pending status)
    const awaitingRecap = sessions.filter((s) => s.status === "pending").length;

    // Metric 6: total episodes
    const totalEpisodes = episodes.length;

    // Status lists
    const clientById = new Map(clients.map((c) => [c._id, c]));

    const needsAttention: { clientId: Id<"clients">; name: string }[] = [];
    const atRisk: { clientId: Id<"clients">; name: string }[] = [];

    for (const [clientId, r] of latestRecapByClient) {
      const client = clientById.get(clientId);
      if (!client) continue;
      if (r.engagementSignal === "needs_attention") {
        needsAttention.push({ clientId, name: client.name });
      } else if (r.engagementSignal === "at_risk") {
        atRisk.push({ clientId, name: client.name });
      }
    }

    const intakePendingClientIds = new Set<Id<"clients">>();
    for (const ep of pendingIntakeEpisodes) {
      intakePendingClientIds.add(ep.clientId);
    }
    const intakePending: { clientId: Id<"clients">; name: string }[] = [];
    for (const id of intakePendingClientIds) {
      const c = clientById.get(id);
      if (c) intakePending.push({ clientId: id, name: c.name });
    }

    needsAttention.sort((a, b) => a.name.localeCompare(b.name));
    atRisk.sort((a, b) => a.name.localeCompare(b.name));
    intakePending.sort((a, b) => a.name.localeCompare(b.name));

    return {
      activeClients,
      sessionsThisMonth,
      engagementHealth,
      pendingIntakes,
      awaitingRecap,
      totalEpisodes,
      statusLists: { needsAttention, atRisk, intakePending },
    };
  },
});
