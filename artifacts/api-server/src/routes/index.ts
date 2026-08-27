import { Router, type IRouter } from "express";
import healthRouter from "./health";
import orbitRouter from "./orbit";
import introsRouter from "./intros";
import audioRouter from "./audio";

const router: IRouter = Router();

router.use(healthRouter);
router.use(orbitRouter);
router.use(introsRouter);
router.use(audioRouter);

export default router;
