---
name: Server-authoritative countdown/timer features
description: Pattern for timed sessions (mining, cooldowns, etc.) that must not be cheatable via the device clock.
---

For any "wait N hours then claim/unlock" feature, never trust the client's elapsed-time math for the
actual gate — only the server decides whether the action is allowed, by comparing `now` on the server
to a stored server-side `startedAt` timestamp at the moment of the request.

The client may still show a live countdown for UX, but it should:
1. Fetch `serverNow` + `remainingMs` from the API on each poll.
2. Compute `offset = serverNow - Date.now()` and use `Date.now() + offset` for its local ticking,
   so a changed device clock doesn't visibly desync the countdown between polls.
3. Never expose a "stop" affordance — only start/claim — and disable claim client-side until
   `isClaimable` is true, but treat that purely as UX; the server independently re-validates on claim.

**Why:** a user explicitly asked that a 12-hour mining timer be uncheatable by changing the phone's
date/time, and unstoppable once started — the fix is entirely in what the server enforces, not in
how the client displays time.

**How to apply:** any "timed unlock" feature (mining, energy regen, cooldowns, daily rewards) should
follow this split: server enforces via stored timestamp comparison; client is cosmetic only.
