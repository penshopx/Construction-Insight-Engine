import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workItemsRouter from "./work-items";
import referencesRouter from "./references";
import workspaceRouter from "./workspace";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workItemsRouter);
router.use(referencesRouter);
router.use(workspaceRouter);

export default router;
