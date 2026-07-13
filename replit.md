# NEXORA — Mining Network

A gamified crypto-mining-style mobile app: users run server-timed 12-hour "mining" sessions to earn a virtual ZRN token, track balance and transaction history, refer friends for bonuses (with a referrals screen showing who they invited), upload a profile photo, and compete on a leaderboard. The app directory/slug is still `access-mobile` for technical continuity, but all user-facing branding is "NEXORA".

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/access-mobile run dev` — run the Expo app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string; `SESSION_SECRET` — HMAC signing key for auth tokens

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Mobile: Expo Router, React Query via `@workspace/api-client-react`

## Where things live

- `lib/db/src/schema/index.ts` — `usersTable` (balance, referralCode, referralCount, `avatarUrl`), `miningSessionsTable`, `transactionsTable`
- `lib/api-spec/openapi.yaml` — source of truth for the API contract (auth incl. avatar upload, mining, leaderboard, transactions, referrals)
- `artifacts/api-server/src/routes/` — `auth.ts`, `mining.ts`, `leaderboard.ts`, `transactions.ts`, `referrals.ts`
- `artifacts/api-server/src/lib/auth.ts` — custom auth: scrypt password hashing + HMAC-signed bearer tokens (no external auth provider)
- `artifacts/access-mobile/` — Expo app; `context/AuthContext.tsx` holds token/user state (persisted via AsyncStorage), `app/(tabs)/` has Mine/Wallet/Referrals/Ranks(leaderboard)/Account(profile) screens

## Architecture decisions

- Auth is custom-built (not Clerk/Replit Auth): username+password with scrypt hashing and HMAC-signed bearer tokens using `SESSION_SECRET`. This mirrors the original app being ported in and keeps the mining/referral domain model self-contained.
- Referrals: signing up with a referral code grants the referrer a signup bonus; each referral that mines a session adds a small bonus to the referrer's session earnings. `/referrals` returns the full list of referred users (username, avatar, join date, active-mining status) for the Referrals screen.
- Mining is server-authoritative: `mining.ts` enforces a 12-hour `SESSION_DURATION_MS` — `/mining/claim` rejects with 400 until the session's `startedAt` (server-side timestamp) is 12h in the past, regardless of what the client sends. There is no manual "stop" — the client can only start or claim. The client displays a countdown corrected against `serverNow` from each `/mining/status` poll so the on-screen timer isn't affected by the device's local clock, but the real gate is always server-side.
- Avatar photos are stored directly in Postgres as base64 data-URI strings in `usersTable.avatarUrl` (not object storage) — this was an explicit user request ("save them in the database"). Upload is capped at ~400KB decoded (`MAX_AVATAR_BYTES` in `auth.ts`) and images are picked at low quality/resized client-side via `expo-image-picker` before upload to keep rows small.

## Product

- Sign up / sign in (optionally with a referral code)
- Start a 12-hour server-timed mining session, then claim it once it's finished to add ZRN to your balance
- View wallet balance and transaction history (mining rewards + referral bonuses)
- Referrals screen: total referral count, list of referred usernames with avatars and mining-active status, referral code + share action
- Leaderboard ("Ranks" tab) ranked by balance, with a top-3 podium and avatars
- Account screen (profile): avatar upload, referral code, earnings breakdown, sign out

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Orval-generated mutation hooks (e.g. `useStartMining`, `useClaimMining`) require calling `.mutate()` with no argument when the OpenAPI operation has no request body — passing `{}` fails typecheck.
- `Alert.alert(...)` from `react-native` is a silent no-op on web (react-native-web has no native dialog host) — any confirmation flow (e.g. sign-out) must branch on `Platform.OS === 'web'` and use `window.confirm` there instead, or its buttons never fire in the web preview.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
