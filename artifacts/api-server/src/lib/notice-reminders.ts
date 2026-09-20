import { and, eq, isNotNull, ne, sql } from "drizzle-orm";
import {
  contractCaseActivitiesTable,
  contractCasesTable,
  db,
  workItemsTable,
} from "@workspace/db";
import { logger } from "./logger";

const ONE_DAY_MS = 86_400_000;

export function retainedReminderSentDays(
  currentSentDays: number[],
  nextReminderDays: number[],
  dueChanged: boolean,
): number[] {
  if (dueChanged) return [];
  return currentSentDays.filter((day) => nextReminderDays.includes(day));
}

export function calendarDayDifference(due: string, now: Date): number | null {
  const dueTime = Date.parse(`${due}T00:00:00Z`);
  if (Number.isNaN(dueTime)) return null;
  const todayTime = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.ceil((dueTime - todayTime) / ONE_DAY_MS);
}

export async function processNoticeReminders(now = new Date()): Promise<void> {
  const candidates = await db.select({
    workItem: workItemsTable,
    caseStatus: contractCasesTable.status,
    caseOrganizationId: contractCasesTable.organizationId,
    caseReference: contractCasesTable.reference,
  }).from(workItemsTable).innerJoin(
    contractCasesTable,
    and(
      eq(contractCasesTable.id, workItemsTable.caseId),
      eq(contractCasesTable.organizationId, workItemsTable.organizationId),
    ),
  ).where(and(
    eq(workItemsTable.category, "administration"),
    eq(workItemsTable.completed, false),
    isNotNull(workItemsTable.caseId),
    ne(contractCasesTable.status, "Closed"),
  ));

  for (const candidate of candidates) {
    const { workItem } = candidate;
    if (!workItem.due || candidate.caseStatus === "Closed") continue;
    const daysRemaining = calendarDayDifference(workItem.due, now);
    if (daysRemaining == null) continue;
    const dueOffsets = workItem.reminderDays
      .filter((offset) => offset >= daysRemaining && !workItem.reminderSentDays.includes(offset))
      .sort((a, b) => b - a);

    for (const offset of dueOffsets) {
      try {
        await db.transaction(async (tx) => {
          const [claimed] = await tx.update(workItemsTable).set({
            reminderSentDays: sql`array_append(${workItemsTable.reminderSentDays}, ${offset})`,
            status: "Perlu ditinjau",
          }).where(and(
            eq(workItemsTable.id, workItem.id),
            eq(workItemsTable.organizationId, candidate.caseOrganizationId),
            eq(workItemsTable.completed, false),
            sql`NOT (${offset} = ANY(${workItemsTable.reminderSentDays}))`,
          )).returning({ id: workItemsTable.id });
          if (!claimed) return;
          await tx.insert(contractCaseActivitiesTable).values({
            caseId: workItem.caseId!,
            organizationId: candidate.caseOrganizationId,
            action: "Pengingat notice dikirim",
            detail: daysRemaining < 0
              ? `Tenggat notice ${candidate.caseReference} telah lewat ${Math.abs(daysRemaining)} hari. Segera tinjau potensi time bar.`
              : `Tenggat notice ${candidate.caseReference} tersisa ${daysRemaining} hari (ambang ${offset} hari).`,
            actor: "Sistem pengingat",
          });
        });
      } catch (error) {
        logger.error({ err: error, workItemId: workItem.id, offset }, "Failed to deliver notice reminder");
        try {
          await db.insert(contractCaseActivitiesTable).values({
            caseId: workItem.caseId!,
            organizationId: candidate.caseOrganizationId,
            action: "Pengingat notice gagal",
            detail: `Pengingat ambang ${offset} hari gagal dikirim dan akan dicoba kembali.`,
            actor: "Sistem pengingat",
          });
        } catch (historyError) {
          logger.error({ err: historyError, workItemId: workItem.id }, "Failed to record notice reminder failure");
        }
      }
    }
  }
}

export function startNoticeReminderScheduler(): NodeJS.Timeout {
  void processNoticeReminders().catch((error) => logger.error({ err: error }, "Notice reminder scan failed"));
  const timer = setInterval(() => {
    void processNoticeReminders().catch((error) => logger.error({ err: error }, "Notice reminder scan failed"));
  }, 60_000);
  timer.unref();
  return timer;
}