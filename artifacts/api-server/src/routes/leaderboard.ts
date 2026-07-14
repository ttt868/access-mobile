import { Router } from "express";
import { and, desc, eq, sum } from "drizzle-orm";
import { db, usersTable, transactionsTable } from "@workspace/db";

const router = Router();
const TOTAL_SUPPLY = 250000;

router.get("/", async (_req, res) => {
  const [users, totalResult] = await Promise.all([
    db.select({
      id: usersTable.id,
      username: usersTable.username,
      balance: usersTable.balance,
      avatarUrl: usersTable.avatarUrl,
    })
      .from(usersTable)
      .orderBy(desc(usersTable.balance))
      .limit(50),
    db.select({ total: sum(usersTable.balance) }).from(usersTable),
  ]);

  const totalMined = parseFloat(totalResult[0]?.total ?? "0") || 0;

  res.json({
    entries: users.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      balance: parseFloat(u.balance),
      avatarUrl: u.avatarUrl ?? null,
    })),
    totalMined: Math.round(totalMined * 1000000) / 1000000,
    totalSupply: TOTAL_SUPPLY,
  });
});

router.get("/referrers", async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      referralCount: usersTable.referralCount,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.referralCount))
    .limit(50);

  const withEarnings = await Promise.all(
    users.map(async (u) => {
      const [result] = await db
        .select({ total: sum(transactionsTable.amount) })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.userId, u.id), eq(transactionsTable.type, "referral_signup")));
      return {
        username: u.username,
        avatarUrl: u.avatarUrl ?? null,
        referralCount: u.referralCount,
        referralEarnings: Math.round((parseFloat(result?.total ?? "0") || 0) * 1000000) / 1000000,
      };
    })
  );

  const ranked = withEarnings
    .filter((u) => u.referralCount > 0)
    .sort((a, b) => b.referralCount - a.referralCount || b.referralEarnings - a.referralEarnings)
    .map((u, i) => ({ rank: i + 1, ...u }));

  res.json({ entries: ranked });
});

export default router;
