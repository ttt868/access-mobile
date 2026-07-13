import crypto from "crypto";
import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, transactionsTable } from "@workspace/db";
import {
  createSalt,
  hashPassword,
  createToken,
  requireAuth,
  type AuthRequest,
} from "../lib/auth.js";

const router = Router();
const REFERRAL_SIGNUP_BONUS = 0.01;

function userResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    balance: parseFloat(user.balance),
    referralCode: user.referralCode,
    referralCount: user.referralCount,
    createdAt: user.createdAt.toISOString(),
  };
}

router.post("/register", async (req, res) => {
  const { username, password, referralCode } = req.body as {
    username?: string;
    password?: string;
    referralCode?: string;
  };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: "Username must be 3–20 characters" });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  if (existing.length > 0) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  // Find referrer if code provided
  let referrer: (typeof usersTable.$inferSelect) | null = null;
  if (referralCode) {
    const found = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.referralCode, referralCode.toUpperCase()))
      .limit(1);
    if (found.length > 0) referrer = found[0];
  }

  const salt = createSalt();
  const passwordHash = hashPassword(password, salt);
  const newReferralCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  const [user] = await db
    .insert(usersTable)
    .values({
      username,
      passwordHash,
      salt,
      referralCode: newReferralCode,
      referredById: referrer?.id ?? null,
    })
    .returning();

  // Give referrer signup bonus + increment their count
  if (referrer) {
    const newBal = parseFloat(referrer.balance) + REFERRAL_SIGNUP_BONUS;
    await db
      .update(usersTable)
      .set({
        balance: newBal.toString(),
        referralCount: sql`${usersTable.referralCount} + 1`,
      })
      .where(eq(usersTable.id, referrer.id));
    await db.insert(transactionsTable).values({
      userId: referrer.id,
      amount: REFERRAL_SIGNUP_BONUS.toString(),
      type: "referral_signup",
    });
  }

  const token = createToken(user.id);
  res.status(201).json({ token, user: userResponse(user) });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);
  if (!user || hashPassword(password, user.salt) !== user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  res.json({ token: createToken(user.id), user: userResponse(user) });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.userId!))
    .limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(userResponse(user));
});

export default router;
