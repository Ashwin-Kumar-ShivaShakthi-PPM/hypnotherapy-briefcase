import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  waitlist: defineTable({
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  practitioners: defineTable({
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  clients: defineTable({
    userId: v.optional(v.id("users")),
    practitionerId: v.id("practitioners"),
    name: v.string(),
    email: v.string(),
    presentingIssue: v.string(),
    sessionCount: v.number(),
    inviteCode: v.string(),
    createdAt: v.number(),
    welcomeEmailStatus: v.optional(
      v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"))
    ),
    welcomeEmailError: v.optional(v.string()),
    welcomeEmailSentAt: v.optional(v.number()),
    welcomeEmailAttemptedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_practitioner", ["practitionerId"])
    .index("by_inviteCode", ["inviteCode"])
    .index("by_email", ["email"]),

  episodes: defineTable({
    clientId: v.id("clients"),
    practitionerId: v.id("practitioners"),
    episodeTitle: v.string(),
    presentingIssue: v.string(),
    status: v.union(v.literal("active"), v.literal("closed")),
    createdAt: v.number(),
    closedAt: v.optional(v.number()),
    welcomeEmailStatus: v.optional(
      v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"))
    ),
    welcomeEmailError: v.optional(v.string()),
    welcomeEmailSentAt: v.optional(v.number()),
    welcomeEmailAttemptedAt: v.optional(v.number()),
  })
    .index("by_client", ["clientId"])
    .index("by_practitioner", ["practitionerId"])
    .index("by_client_status", ["clientId", "status"]),

  sessions: defineTable({
    clientId: v.id("clients"),
    practitionerId: v.id("practitioners"),
    episodeId: v.optional(v.id("episodes")),
    sessionNumber: v.number(),
    sessionDate: v.number(),
    transcriptText: v.string(),
    status: v.union(v.literal("pending"), v.literal("processed")),
  })
    .index("by_client", ["clientId"])
    .index("by_practitioner", ["practitionerId"])
    .index("by_episode", ["episodeId"]),

  sessionRecaps: defineTable({
    sessionId: v.id("sessions"),
    clientId: v.id("clients"),
    practitionerId: v.id("practitioners"),
    episodeId: v.optional(v.id("episodes")),
    okrObjective: v.string(),
    okrKeyResults: v.array(v.string()),
    okrProgress: v.optional(v.string()),
    problemSolutionFit: v.array(
      v.object({ problem: v.string(), solution: v.string() })
    ),
    outcomesToExpect: v.array(v.string()),
    actionItems: v.array(
      v.object({
        step: v.number(),
        action: v.string(),
        when: v.string(),
        why: v.string(),
      })
    ),
    draftEmailSubject: v.string(),
    draftEmailBody: v.string(),
    transformationDelta: v.string(),
    nextFocus: v.string(),
    engagementSignal: v.union(
      v.literal("active"),
      v.literal("needs_attention"),
      v.literal("at_risk")
    ),
    engagementSignalEvidence: v.string(),
    practitionerNote: v.string(),
    emailSent: v.optional(v.boolean()),
    emailStatus: v.optional(
      v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"))
    ),
    emailError: v.optional(v.string()),
    emailSentAt: v.optional(v.number()),
    emailAttemptedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_client", ["clientId"])
    .index("by_practitioner", ["practitionerId"])
    .index("by_episode", ["episodeId"]),

  prepBriefs: defineTable({
    clientId: v.id("clients"),
    practitionerId: v.id("practitioners"),
    episodeId: v.optional(v.id("episodes")),
    scheduledFor: v.number(),
    coreJtbd: v.string(),
    situationalStatus: v.string(),
    unfinishedBusiness: v.string(),
    actionStepIntelligence: v.string(),
    recommendedFocus: v.string(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_practitioner", ["practitionerId"])
    .index("by_episode", ["episodeId"]),

  intakeForms: defineTable({
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
    completedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_practitioner", ["practitionerId"])
    .index("by_episode", ["episodeId"]),

  clientCompanionMessages: defineTable({
    clientId: v.id("clients"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_client", ["clientId"]),
});
