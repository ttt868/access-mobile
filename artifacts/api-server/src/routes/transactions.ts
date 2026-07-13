import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const txs = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(50);

  res.json({
    transactions: txs.map((t) => ({
      id: t.id,
      amount: parseFloat(t.amount),
      type: t.type,
      createdAt: t.createdAt.toISOString(),
    })),
  });
});

export default router;
