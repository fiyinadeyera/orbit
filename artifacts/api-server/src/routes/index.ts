import { Router, type IRouter } from "express";
import healthRouter from "./health";
import orbitRouter from "./orbit";
import audioRouter from "./audio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(orbitRouter);
router.use(audioRouter);

export default router;
