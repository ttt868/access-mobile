import { Router } from "express";
import { and, eq, isNull, sum } from "drizzle-orm";
import { db, usersTable, miningSessionsTable, transactionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router = Router();

const MINING_BASE = 0.01;              // base reward for a completed session
const ACTIVE_REFERRAL_BONUS = 0.001;   // per active referral, added to a completed session
const TOTAL_SUPPLY = 250000;
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours — enforced server-side only

async function getTotalMined(): Promise<number> {
  const result = await db.select({ total: sum(usersTable.balance) }).from(usersTable);
  return parseFloat(result[0]?.total ?? "0") || 0;
}

async function getActiveReferralCount(userId: number): Promise<number> {
  const referrals = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.referredById, userId));

  if (referrals.length === 0) return 0;

  const referralIds = referrals.map((r) => r.id);
  let count = 0;
  for (const rid of referralIds) {
    const active = await db
      .select()
      .from(miningSessionsTable)
      .where(and(eq(miningSessionsTable.userId, rid), isNull(miningSessionsTable.endedAt)))
      .limit(1);
    if (active.length > 0) count++;
  }
  return count;
}

function sessionProgress(startedAt: Date, now: Date) {
  const elapsedMs = Math.max(0, now.getTime() - startedAt.getTime());
  const remainingMs = Math.max(0, SESSION_DURATION_MS - elapsedMs);
  const isClaimable = remainingMs <= 0;
  const progress = Math.min(1, elapsedMs / SESSION_DURATION_MS);
  return { remainingMs, isClaimable, progress };
}

router.get("/status", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(401).json({ error: "User not found" }); return; }

  const [session] = await db
    .select()
    .from(miningSessionsTable)
    .where(and(eq(miningSessionsTable.userId, userId), isNull(miningSessionsTable.endedAt)))
    .limit(1);

  const [activeReferralCount, totalMined] = await Promise.all([
    getActiveReferralCount(userId),
    getTotalMined(),
  ]);

  const bonusPerSession = activeReferralCount * ACTIVE_REFERRAL_BONUS;
  const ratePerSession = MINING_BASE + bonusPerSession;
  const now = new Date();

  const { remainingMs, isClaimable, progress } = session
    ? sessionProgress(session.startedAt, now)
    : { remainingMs: 0, isClaimable: false, progress: 0 };

  res.json({
    isActive: !!session,
    startedAt: session?.startedAt.toISOString() ?? null,
    serverNow: now.toISOString(),
    sessionDurationMs: SESSION_DURATION_MS,
    remainingMs,
    isClaimable,
    earnedSoFar: session ? Math.round(ratePerSession * progress * 1000000) / 1000000 : 0,
    ratePerSession,
    balance: parseFloat(user.balance),
    activeReferralCount,
    bonusPerSession,
    totalMined: Math.round(totalMined * 1000000) / 1000000,
    totalSupply: TOTAL_SUPPLY,
  });
});

router.post("/start", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const existing = await db
    .select()
    .from(miningSessionsTable)
    .where(and(eq(miningSessionsTable.userId, userId), isNull(miningSessionsTable.endedAt)))
    .limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "Mining session already active" });
    return;
  }

  const [session] = await db.insert(miningSessionsTable).values({ userId }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const [activeReferralCount, totalMined] = await Promise.all([
    getActiveReferralCount(userId),
    getTotalMined(),
  ]);

  const bonusPerSession = activeReferralCount * ACTIVE_REFERRAL_BONUS;
  const now = new Date();
  res.json({
    isActive: true,
    startedAt: session.startedAt.toISOString(),
    serverNow: now.toISOString(),
    sessionDurationMs: SESSION_DURATION_MS,
    remainingMs: SESSION_DURATION_MS,
    isClaimable: false,
    earnedSoFar: 0,
    ratePerSession: MINING_BASE + bonusPerSession,
    balance: parseFloat(user.balance),
    activeReferralCount,
    bonusPerSession,
    totalMined: Math.round(totalMined * 1000000) / 1000000,
    totalSupply: TOTAL_SUPPLY,
  });
});

router.post("/claim", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const [session] = await db
    .select()
    .from(miningSessionsTable)
    .where(and(eq(miningSessionsTable.userId, userId), isNull(miningSessionsTable.endedAt)))
    .limit(1);

  if (!session) {
    res.status(400).json({ error: "No active mining session" });
    return;
  }

  const { isClaimable } = sessionProgress(session.startedAt, new Date());
  if (!isClaimable) {
    res.status(400).json({ error: "Mining session is not finished yet" });
    return;
  }

  const activeReferralCount = await getActiveReferralCount(userId);
  const earned = Math.round((MINING_BASE + activeReferralCount * ACTIVE_REFERRAL_BONUS) * 1000000) / 1000000;

  const now = new Date();
  await db.update(miningSessionsTable)
    .set({ endedAt: now, earnedAmount: earned.toString() })
    .where(eq(miningSessionsTable.id, session.id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  const newBalance = Math.round((parseFloat(user.balance) + earned) * 1000000) / 1000000;

  await db.update(usersTable).set({ balance: newBalance.toString() }).where(eq(usersTable.id, userId));
  await db.insert(transactionsTable).values({ userId, amount: earned.toString(), type: "mine" });

  res.json({ earned, newBalance, activeReferralCount });
});

export default router;
