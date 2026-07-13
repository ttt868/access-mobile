import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db, usersTable, miningSessionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;

  const [me, referred] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1),
    db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        balance: usersTable.balance,
        avatarUrl: usersTable.avatarUrl,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.referredById, userId)),
  ]);

  const referrals = await Promise.all(
    referred.map(async (r) => {
      const active = await db
        .select()
        .from(miningSessionsTable)
        .where(and(eq(miningSessionsTable.userId, r.id), isNull(miningSessionsTable.endedAt)))
        .limit(1);
      return {
        id: r.id,
        username: r.username,
        avatarUrl: r.avatarUrl ?? null,
        balance: parseFloat(r.balance),
        isActive: active.length > 0,
        joinedAt: r.createdAt.toISOString(),
      };
    }),
  );

  res.json({
    referrals,
    totalCount: referrals.length,
    referralCode: me[0]?.referralCode ?? "",
  });
});

export default router;
