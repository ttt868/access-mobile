import { Router } from "express";
import { desc, sum } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

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

export default router;
