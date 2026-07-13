import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import miningRouter from "./mining.js";
import leaderboardRouter from "./leaderboard.js";
import transactionsRouter from "./transactions.js";
import referralsRouter from "./referrals.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/mining", miningRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/transactions", transactionsRouter);
router.use("/referrals", referralsRouter);

export default router;
