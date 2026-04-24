# weekender

live state for the sprint. update as facts land. claude reads this at the start of every coaching session.

## live state

- **track**: Revenue
- **idea**: the hypnotherapy briefcase — ai practice intelligence platform for solo hypnotherapists
- **live URL**: https://briefcase-waitlist.vercel.app
- **repo**: TODO — add the github URL
- **stage**: product live · Stripe pending · peer signups needed
- **first user**: ashwin.kumar@shivashakthippm.com (practitioner login on the live product)

## the pain

handbook rule, day 1: "must be tied to a pain you personally feel."

solo hypnotherapists spend 3-4 hours per week on post-session admin, pre-session prep, and client follow-up. clients go quiet between sessions because practitioners cannot keep up manually. i built this because i lived it.

## scope — what's shipping this week

see `./handbook/08-build-process.md` for the scope-doc pattern. keep it tight, name what's out.

- **one flow that must work end-to-end**: practitioner uploads transcript → agent generates session recap and follow-up email → practitioner approves and sends. everything else is bonus.
- **named out of scope (so you don't sneak it in)**: TODO
- **POC moment — the thing you showed yourself in claude to prove it's possible**: TODO

## metrics — revenue track

fill in live numbers. update as they move. rubric lives in `./handbook/09-scoring.md`.

- **waitlist signups**: 1 (ananda.advaith@gmail.com, via live URL) — pulled from convex `waitlist` table on 2026-04-24
- **practitioner signups on the product**: 1 (you)
- **paying customers (stripe)**: 0 — stripe not yet wired
- **mrr / revenue booked**: 0
- **peer signups from the sprint cohort**: TODO
- **qualitative (first-user quotes, testimonials)**: TODO

## daily log

one line per day on what actually moved. dates from handbook `02-how-the-week-runs.md`.

### wed 22 apr — lock idea, set up stack
- TODO

### thu 23 apr — waitlist live by 11am
- waitlist shipped at briefcase-waitlist.vercel.app
- linkedin / slack launch post: TODO — did this happen?
- TODO — anything else that moved

### fri 24 apr — push parameters to L3  *(today)*
- TODO — what moved so far
- TODO — what's still open at end of day

### sat 25 apr — submission day, 8pm cutoff
- submit: live URL, repo, track metrics
- TODO

### sun 26 apr — showcase
- TODO — feedback received / next build

## decisions log

one line per real decision. not activity — decisions. named so they stay named.

- chose convex + next.js + anthropic `claude-opus-4-5` for the full stack (day 1)
- resend domain not yet verified → welcome emails only deliver to the practitioner's own address until the domain is set up
- scoped for the week: waitlist + practitioner dashboard + post-session agent + prep brief + intake form + client portal. deferred: self-hypnosis audio, rag companion chatbot, multi-practitioner clinics
- TODO — add decisions as they happen

## open questions for claude

drop questions you want me to hold and re-surface next session.

- TODO
