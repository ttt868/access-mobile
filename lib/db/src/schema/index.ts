import { pgTable, serial, text, timestamp, integer, numeric } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  balance: numeric("balance", { precision: 18, scale: 6 }).notNull().default("0"),
  referralCode: text("referral_code").notNull().unique(),
  referralCount: integer("referral_count").notNull().default(0),
  referredById: integer("referred_by_id").references((): any => usersTable.id),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const miningSessionsTable = pgTable("mining_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  earnedAmount: numeric("earned_amount", { precision: 18, scale: 6 }),
});

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  amount: numeric("amount", { precision: 18, scale: 6 }).notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type MiningSession = typeof miningSessionsTable.$inferSelect;
export type Transaction = typeof transactionsTable.$inferSelect;
