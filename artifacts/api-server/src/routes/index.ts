import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workItemsRouter from "./work-items";
import referencesRouter from "./references";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workItemsRouter);
router.use(referencesRouter);

export default router;
