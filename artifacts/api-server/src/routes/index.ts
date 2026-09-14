import { Router, type IRouter } from "express";
import healthRouter from "./health";
import orbitRouter from "./orbit";
import introsRouter from "./intros";
import askRouter from "./ask";
import analyticsRouter from "./analytics";
import pushRouter from "./push";
import cronRouter from "./cron";
import importRouter from "./import";
import audioRouter from "./audio";
import authRouter from "./auth";
import authGoogleRouter from "./auth-google";
import { requireCsrf, requireUser } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(authGoogleRouter);
router.use(cronRouter);
router.use(requireUser);
router.use(requireCsrf);
router.use(orbitRouter);
router.use(introsRouter);
router.use(askRouter);
router.use(analyticsRouter);
router.use(pushRouter);
router.use(importRouter);
router.use(audioRouter);

export default router;
