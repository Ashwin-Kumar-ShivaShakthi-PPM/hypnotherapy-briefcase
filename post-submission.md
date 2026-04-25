# post-submission

features and cleanups to build AFTER the sprint submission (sat 25 apr 8pm). parked here so they don't sneak into scope.

---

## delete client + all associated data (practitioner dashboard)

**why parked:** doesn't move any revenue-rubric parameter. core flow (transcript → recap → follow-up) and signups are the priority. revisit monday 2026-04-27.

**goal:** complete, safe, atomic client-deletion from the practitioner dashboard. no orphaned data anywhere.

### part 1 — delete trigger in UI

- inside the expanded episode list on each client card
- small, subtle, destructive-red text link at the very bottom of the expanded episode list
- label: "Delete client permanently"
- not a prominent button — requires intent to find
- only visible when the episode list is expanded

### part 2 — confirmation modal

clicking the delete link opens a modal with:
- title: "Delete [client name]?" (client name in bold so the practitioner is certain)
- body: "This will permanently remove all their sessions, recaps, intake forms, episodes, companion messages, prep briefs, and all agent-generated intelligence. This cannot be undone."
- buttons: "Cancel" (secondary) and "Delete permanently" (solid red background, white text)

### part 3 — deletion sequence (single atomic convex mutation)

delete in this exact order to respect data relationships and prevent orphans:

1. `clientCompanionMessages` where `clientId` matches
2. `sessionRecaps` where `clientId` matches
3. `prepBriefs` where `clientId` matches
4. `intakeForms` where `clientId` matches
5. `sessions` where `clientId` matches
6. `episodes` where `clientId` matches
7. auth records — if the client has a linked auth user (`userId` on the client record), delete their `authAccounts`, `authSessions`, `authRefreshTokens`, and `authVerificationCodes` so they cannot log in after deletion
8. the client record itself

all eight must succeed or none. if any step fails, roll back everything and show: "We couldn't delete this client right now. Their data is safe — please try again."

### part 4 — agent handoff safety

in-flight agent jobs must handle the deletion gracefully:

- post-session agent (`processTranscript`), pre-session prep agent, and intake summary agent must each check if the client still exists in convex before saving any results
- if the client has been deleted during processing, the agent exits silently without saving and without throwing an error to the UI
- add this existence check at the start of the save step in each agent — if client no longer exists, return early

### part 5 — analytics update

all six metrics must update immediately and accurately after deletion:

- **Active clients** — decrements if this client had active episodes
- **Sessions this month** — decrements by the count of this client's sessions in the current month
- **Engagement health** — recalculates percentage across remaining clients only
- **Pending intakes** — decrements if this client had pending intakes
- **Awaiting recap** — decrements if this client had sessions awaiting recap
- **Total episodes** — decrements by this client's episode count

since metrics are driven by reactive convex queries, they should update automatically. verify this — if any metric requires a manual refresh, fix the query to be fully reactive.

the client status panel (Needs attention, At risk, Intake pending) must also update immediately — the deleted client's name must disappear from any column it appeared in.

### part 6 — security

before executing any deletion:

- verify authenticated user is a practitioner
- verify the client's `practitionerId` matches this practitioner's id
- if either fails, return: "You don't have permission to delete this client" — and do not delete anything

### part 7 — success feedback

after successful deletion:

- client card disappears from dashboard immediately
- brief success toast: "[Client name] has been removed from your practice."
- toast auto-dismisses after 3 seconds

### part 8 — quality check

after building:

- delete a test client and confirm all 8 data types are removed from convex
- confirm analytics update correctly after deletion
- confirm a deleted client cannot log into the portal
- confirm no orphaned records remain in any table

then redeploy with `vercel --prod --yes` and confirm what was built and tested.
