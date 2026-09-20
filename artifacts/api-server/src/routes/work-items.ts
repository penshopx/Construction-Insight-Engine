import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, workItemsTable } from "@workspace/db";
import {
  CreateWorkItemBody,
  CreateWorkItemResponse,
  ListWorkItemsQueryParams,
  ListWorkItemsResponse,
  UpdateWorkItemBody,
  UpdateWorkItemParams,
  UpdateWorkItemResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/work-items", async (req, res): Promise<void> => {
  const query = ListWorkItemsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const items = query.data.category
    ? await db.select().from(workItemsTable).where(eq(workItemsTable.category, query.data.category)).orderBy(desc(workItemsTable.createdAt))
    : await db.select().from(workItemsTable).orderBy(desc(workItemsTable.createdAt));

  res.json(ListWorkItemsResponse.parse(items));
});

router.post("/work-items", async (req, res): Promise<void> => {
  const body = CreateWorkItemBody.safeParse(req.body);
  if (!body.success) {
    req.log.warn({ errors: body.error.message }, "Invalid work item");
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [item] = await db.insert(workItemsTable).values(body.data).returning();
  res.status(201).json(CreateWorkItemResponse.parse(item));
});

router.patch("/work-items/:id", async (req, res): Promise<void> => {
  const params = UpdateWorkItemParams.safeParse(req.params);
  const body = UpdateWorkItemBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [item] = await db
    .update(workItemsTable)
    .set(body.data)
    .where(eq(workItemsTable.id, params.data.id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Item kerja tidak ditemukan" });
    return;
  }

  res.json(UpdateWorkItemResponse.parse(item));
});

export default router;