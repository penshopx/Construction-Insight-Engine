import { afterEach, describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import {
  contractCaseActivitiesTable,
  contractCasesTable,
  db,
  noticeReminderDeliveriesTable,
  organizationReminderSettingsTable,
  organizationsTable,
  workItemsTable,
} from "@workspace/db";
import { encryptCredential } from "./credential-crypto";
import {
  processNoticeReminders,
  retainedReminderSentDays,
} from "./notice-reminders";

const caseIds: number[] = [];
const workItemIds: number[] = [];
const organizationIds: number[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  if (workItemIds.length) {
    await db.delete(noticeReminderDeliveriesTable).where(inArray(noticeReminderDeliveriesTable.workItemId, workItemIds));
  }
  if (caseIds.length) {
    await db.delete(contractCaseActivitiesTable).where(inArray(contractCaseActivitiesTable.caseId, caseIds));
  }
  if (workItemIds.length) {
    await db.delete(workItemsTable).where(inArray(workItemsTable.id, workItemIds.splice(0)));
  }
  if (caseIds.length) {
    await db.delete(contractCasesTable).where(inArray(contractCasesTable.id, caseIds.splice(0)));
  }
  if (organizationIds.length) {
    await db.delete(organizationReminderSettingsTable).where(inArray(organizationReminderSettingsTable.organizationId, organizationIds));
    await db.delete(organizationsTable).where(inArray(organizationsTable.id, organizationIds.splice(0)));
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

  it("uses approved WhatsApp templates and retries only failed recipients", async () => {
    process.env.SESSION_SECRET ??= "notice-reminder-test-secret";
    const [organization] = await db.insert(organizationsTable).values({ name: "Provider test" }).returning();
    const [otherOrganization] = await db.insert(organizationsTable).values({ name: "Other provider test" }).returning();
    organizationIds.push(organization.id, otherOrganization.id);
    await db.insert(organizationReminderSettingsTable).values({
      organizationId: organization.id,
      emailEnabled: true,
      emailRecipients: ["site@example.com"],
      emailFrom: "Notice <notice@example.com>",
      emailTokenEncrypted: encryptCredential("resend-token"),
      whatsappEnabled: true,
      whatsappRecipients: ["+628111111111", "+628222222222"],
      whatsappPhoneNumberId: "123456",
      whatsappTemplateName: "notice_reminder",
      whatsappTemplateLanguage: "id",
      whatsappTokenEncrypted: encryptCredential("meta-token"),
    });
    await db.insert(organizationReminderSettingsTable).values({
      organizationId: otherOrganization.id,
      emailEnabled: true,
      emailRecipients: ["other@example.com"],
      emailFrom: "Other <other@example.com>",
      emailTokenEncrypted: encryptCredential("wrong-resend-token"),
      whatsappEnabled: true,
      whatsappRecipients: ["+628999999999"],
      whatsappPhoneNumberId: "999999",
      whatsappTemplateName: "other_template",
      whatsappTemplateLanguage: "en_US",
      whatsappTokenEncrypted: encryptCredential("wrong-meta-token"),
    });
    const [contractCase] = await db.insert(contractCasesTable).values(
      caseValues(organization.id, "provider"),
    ).returning();
    caseIds.push(contractCase.id);
    const [workItem] = await db.insert(workItemsTable).values({
      organizationId: organization.id,
      category: "administration",
      title: "Provider notice",
      due: "2026-09-27",
      kind: "Notice",
      caseId: contractCase.id,
      reminderDays: [7],
    }).returning();
    workItemIds.push(workItem.id);

    let failSecondWhatsapp = true;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("graph.facebook.com") && failSecondWhatsapp) {
        const whatsappCalls = fetchMock.mock.calls.filter(([calledUrl]) => String(calledUrl).includes("graph.facebook.com"));
        if (whatsappCalls.length === 2) return new Response("", { status: 500 });
      }
      return new Response("{}", { status: 200 });
    });

    await Promise.all([
      processNoticeReminders(new Date("2026-09-20T10:00:00Z")),
      processNoticeReminders(new Date("2026-09-20T10:00:00Z")),
    ]);
    const firstDeliveries = await db.select().from(noticeReminderDeliveriesTable)
      .where(eq(noticeReminderDeliveriesTable.workItemId, workItem.id));
    expect(firstDeliveries.filter((item) => item.status === "sent")).toHaveLength(2);
    expect(firstDeliveries.filter((item) => item.status === "failed")).toHaveLength(1);

    const emailCall = fetchMock.mock.calls.find(([url]) => String(url).includes("api.resend.com"));
    expect(new Headers(emailCall?.[1]?.headers).get("Idempotency-Key")).toMatch(/^notice-reminder-/);
    expect(new Headers(emailCall?.[1]?.headers).get("Authorization")).toBe("Bearer resend-token");
    const whatsappCall = fetchMock.mock.calls.find(([url]) => String(url).includes("graph.facebook.com"));
    expect(new Headers(whatsappCall?.[1]?.headers).get("Authorization")).toBe("Bearer meta-token");
    const whatsappBody = JSON.parse(String(whatsappCall?.[1]?.body));
    expect(whatsappBody.type).toBe("template");
    expect(whatsappBody.template.name).toBe("notice_reminder");
    expect(whatsappBody.template.components[0].parameters).toHaveLength(2);

    fetchMock.mockClear();
    failSecondWhatsapp = false;
    await processNoticeReminders(new Date("2026-09-20T10:03:00Z"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("graph.facebook.com");
    const finalDeliveries = await db.select().from(noticeReminderDeliveriesTable)
      .where(eq(noticeReminderDeliveriesTable.workItemId, workItem.id));
    expect(finalDeliveries.every((item) => item.status === "sent")).toBe(true);
  });
});