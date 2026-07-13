# Access Mobile — Virtual Mining

A gamified crypto-mining-style mobile app: users start/claim timed "mining" sessions to earn a virtual ZRN token, track balance and transaction history, refer friends for bonuses, and compete on a leaderboard.

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

- `lib/db/src/schema/index.ts` — `usersTable` (balance, referralCode, referralCount), `miningSessionsTable`, `transactionsTable`
- `lib/api-spec/openapi.yaml` — source of truth for the API contract (auth, mining, leaderboard, transactions)
- `artifacts/api-server/src/routes/` — `auth.ts`, `mining.ts`, `leaderboard.ts`, `transactions.ts`
- `artifacts/api-server/src/lib/auth.ts` — custom auth: scrypt password hashing + HMAC-signed bearer tokens (no external auth provider)
- `artifacts/access-mobile/` — Expo app; `context/AuthContext.tsx` holds token/user state (persisted via AsyncStorage), `app/(tabs)/` has Mine/Wallet/Ranks/Profile screens

## Architecture decisions

- Auth is custom-built (not Clerk/Replit Auth): username+password with scrypt hashing and HMAC-signed bearer tokens using `SESSION_SECRET`. This mirrors the original app being ported in and keeps the mining/referral domain model self-contained.
- Referrals: signing up with a referral code grants the referrer a signup bonus; each referral that mines a session adds a small bonus to the referrer's session earnings.

## Product

- Sign up / sign in (optionally with a referral code)
- Start a mining session, then claim it to add ZRN to your balance
- View wallet balance and transaction history (mining rewards + referral bonuses)
- Leaderboard ranked by balance, with a top-3 podium
- Profile screen showing referral code, referral count, and earnings breakdown

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Orval-generated mutation hooks (e.g. `useStartMining`, `useClaimMining`) require calling `.mutate()` with no argument when the OpenAPI operation has no request body — passing `{}` fails typecheck.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
