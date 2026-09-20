import { afterEach, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import {
  contractCaseActivitiesTable,
  contractCasesTable,
  db,
  workItemsTable,
} from "@workspace/db";
import {
  processNoticeReminders,
  retainedReminderSentDays,
} from "./notice-reminders";

const caseIds: number[] = [];
const workItemIds: number[] = [];

afterEach(async () => {
  if (caseIds.length) {
    await db.delete(contractCaseActivitiesTable).where(inArray(contractCaseActivitiesTable.caseId, caseIds));
  }
  if (workItemIds.length) {
    await db.delete(workItemsTable).where(inArray(workItemsTable.id, workItemIds.splice(0)));
  }
  if (caseIds.length) {
    await db.delete(contractCasesTable).where(inArray(contractCasesTable.id, caseIds.splice(0)));
  }
});

function caseValues(organizationId: number, suffix: string, status = "Active") {
  return {
    organizationId,
    reference: `TEST-${suffix}`,
    type: "CLAIM",
    title: `Kasus ${suffix}`,
    project: "Proyek tes",
    eventDate: "2026-09-01",
    noticeDueDate: "2026-09-27",
    clauseBasis: "Klausul tes",
    description: "Kasus pengujian pengingat notice.",
    status,
  };
}

describe("notice reminder state transitions", () => {
  it("resets sent thresholds for a revised deadline and retains only unchanged thresholds otherwise", () => {
    expect(retainedReminderSentDays([14, 7, 3], [14, 7, 1], false)).toEqual([14, 7]);
    expect(retainedReminderSentDays([14, 7, 3], [14, 7, 3], true)).toEqual([]);
  });

  it("delivers each threshold once and records activities in the owning organization", async () => {
    const organizationA = 910_001;
    const organizationB = 910_002;
    const cases = await db.insert(contractCasesTable).values([
      caseValues(organizationA, "A"),
      caseValues(organizationB, "B"),
    ]).returning();
    caseIds.push(...cases.map((item) => item.id));
    const items = await db.insert(workItemsTable).values(cases.map((item) => ({
      organizationId: item.organizationId,
      category: "administration",
      title: `Notice ${item.reference}`,
      status: "Terjadwal",
      due: "2026-09-27",
      kind: "Notice",
      caseId: item.id,
      reminderDays: [7, 3],
    }))).returning();
    workItemIds.push(...items.map((item) => item.id));

    await Promise.all([
      processNoticeReminders(new Date("2026-09-20T10:00:00Z")),
      processNoticeReminders(new Date("2026-09-20T10:00:00Z")),
    ]);

    for (const item of cases) {
      const activities = await db.select().from(contractCaseActivitiesTable)
        .where(eq(contractCaseActivitiesTable.caseId, item.id));
      expect(activities).toHaveLength(1);
      expect(activities[0].organizationId).toBe(item.organizationId);
      expect(activities[0].action).toBe("Pengingat notice dikirim");
    }
  });

  it("suppresses reminders for completed deadlines, closed cases, and mismatched organizations", async () => {
    const organizationA = 920_001;
    const organizationB = 920_002;
    const cases = await db.insert(contractCasesTable).values([
      caseValues(organizationA, "completed"),
      caseValues(organizationA, "closed", "Closed"),
      caseValues(organizationB, "mismatch"),
    ]).returning();
    caseIds.push(...cases.map((item) => item.id));
    const items = await db.insert(workItemsTable).values([
      {
        organizationId: organizationA,
        category: "administration",
        title: "Completed notice",
        due: "2026-09-27",
        kind: "Notice",
        caseId: cases[0].id,
        completed: true,
        reminderDays: [7],
      },
      {
        organizationId: organizationA,
        category: "administration",
        title: "Closed notice",
        due: "2026-09-27",
        kind: "Notice",
        caseId: cases[1].id,
        reminderDays: [7],
      },
      {
        organizationId: organizationA,
        category: "administration",
        title: "Cross-organization notice",
        due: "2026-09-27",
        kind: "Notice",
        caseId: cases[2].id,
        reminderDays: [7],
      },
    ]).returning();
    workItemIds.push(...items.map((item) => item.id));

    await processNoticeReminders(new Date("2026-09-20T10:00:00Z"));

    for (const item of cases) {
      const activities = await db.select().from(contractCaseActivitiesTable)
        .where(eq(contractCaseActivitiesTable.caseId, item.id));
      expect(activities).toHaveLength(0);
    }
  });
});