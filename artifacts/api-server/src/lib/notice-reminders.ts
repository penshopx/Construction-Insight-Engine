import { and, eq, inArray, isNotNull, lte, ne, or, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  contractCaseActivitiesTable,
  contractCasesTable,
  db,
  noticeReminderDeliveriesTable,
  organizationReminderSettingsTable,
  workItemsTable,
} from "@workspace/db";
import { logger } from "./logger";
import { decryptCredential } from "./credential-crypto";

const ONE_DAY_MS = 86_400_000;

type ReminderMessage = {
  subject: string;
  text: string;
};

async function sendEmail(token: string, from: string, recipient: string, message: ReminderMessage, idempotencyKey: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ from, to: [recipient], subject: message.subject, text: message.text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}`);
}

async function sendWhatsapp(
  token: string,
  phoneNumberId: string,
  templateName: string,
  templateLanguage: string,
  recipient: string,
  message: ReminderMessage,
): Promise<void> {
  const response = await fetch(
    `https://graph.facebook.com/v22.0/${encodeURIComponent(phoneNumberId)}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient.replace(/^\+/, ""),
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components: [{
            type: "body",
            parameters: [
              { type: "text", text: message.subject },
              { type: "text", text: message.text },
            ],
          }],
        },
      }),
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) throw new Error(`WhatsApp returned HTTP ${response.status}`);
}

function deliveryValues(
  settings: typeof organizationReminderSettingsTable.$inferSelect | undefined,
  base: {
    organizationId: number;
    workItemId: number;
    caseId: number;
    reminderDay: number;
    subject: string;
    message: string;
    nextAttemptAt: Date;
  },
) {
  if (!settings) return [];
  return [
    ...(settings.emailEnabled ? settings.emailRecipients.map((recipient) => ({ ...base, channel: "email", recipient })) : []),
    ...(settings.whatsappEnabled ? settings.whatsappRecipients.map((recipient) => ({ ...base, channel: "whatsapp", recipient })) : []),
  ];
}

async function deliverQueuedReminders(now: Date): Promise<void> {
  const staleLease = new Date(now.getTime() - 5 * 60_000);
  const deliveries = await db.select().from(noticeReminderDeliveriesTable).where(or(
    and(
      inArray(noticeReminderDeliveriesTable.status, ["pending", "failed"]),
      lte(noticeReminderDeliveriesTable.nextAttemptAt, now),
    ),
    and(
      eq(noticeReminderDeliveriesTable.status, "sending"),
      lte(noticeReminderDeliveriesTable.updatedAt, staleLease),
    ),
  ));

  for (const delivery of deliveries) {
    const leaseToken = randomUUID();
    const [claimed] = await db.update(noticeReminderDeliveriesTable).set({
      status: "sending",
      leaseToken,
      attempts: delivery.attempts + 1,
      updatedAt: now,
    }).where(and(
      eq(noticeReminderDeliveriesTable.id, delivery.id),
      eq(noticeReminderDeliveriesTable.status, delivery.status),
      ...(delivery.status === "sending" && delivery.leaseToken
        ? [eq(noticeReminderDeliveriesTable.leaseToken, delivery.leaseToken)]
        : []),
    )).returning();
    if (!claimed) continue;

    try {
      const [settings] = await db.select().from(organizationReminderSettingsTable)
        .where(eq(organizationReminderSettingsTable.organizationId, claimed.organizationId)).limit(1);
      if (!settings) throw new Error("Organization reminder settings are missing");
      const message = { subject: claimed.subject, text: claimed.message };
      if (claimed.channel === "email") {
        if (!settings.emailEnabled || !settings.emailTokenEncrypted || !settings.emailFrom) {
          throw new Error("Email reminder configuration is incomplete");
        }
        await sendEmail(
          decryptCredential(settings.emailTokenEncrypted),
          settings.emailFrom,
          claimed.recipient,
          message,
          `notice-reminder-${claimed.id}`,
        );
      } else if (claimed.channel === "whatsapp") {
        if (!settings.whatsappEnabled || !settings.whatsappTokenEncrypted || !settings.whatsappPhoneNumberId || !settings.whatsappTemplateName) {
          throw new Error("WhatsApp reminder configuration is incomplete");
        }
        await sendWhatsapp(
          decryptCredential(settings.whatsappTokenEncrypted),
          settings.whatsappPhoneNumberId,
          settings.whatsappTemplateName,
          settings.whatsappTemplateLanguage,
          claimed.recipient,
          message,
        );
      } else {
        throw new Error(`Unsupported reminder channel: ${claimed.channel}`);
      }
      await db.transaction(async (tx) => {
        await tx.update(noticeReminderDeliveriesTable).set({
          status: "sent",
          leaseToken: null,
          lastError: null,
          updatedAt: new Date(),
        }).where(eq(noticeReminderDeliveriesTable.id, claimed.id));
        await tx.insert(contractCaseActivitiesTable).values({
          caseId: claimed.caseId,
          organizationId: claimed.organizationId,
          action: "Pengingat notice dikirim",
          detail: `Berhasil dikirim melalui ${claimed.channel} ke ${claimed.recipient}.`,
          actor: "Sistem pengingat",
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown delivery error";
      const retryDelaySeconds = Math.min(60 * (2 ** Math.min(claimed.attempts, 6)), 3_600);
      logger.error({ err: error, deliveryId: claimed.id, channel: claimed.channel }, "Failed to deliver queued notice reminder");
      await db.transaction(async (tx) => {
        await tx.update(noticeReminderDeliveriesTable).set({
          status: "failed",
          leaseToken: null,
          lastError: message.slice(0, 500),
          nextAttemptAt: new Date(now.getTime() + retryDelaySeconds * 1_000),
          updatedAt: new Date(),
        }).where(eq(noticeReminderDeliveriesTable.id, claimed.id));
        await tx.insert(contractCaseActivitiesTable).values({
          caseId: claimed.caseId,
          organizationId: claimed.organizationId,
          action: "Pengingat notice gagal",
          detail: `Pengiriman ${claimed.channel} ke ${claimed.recipient} gagal dan akan dicoba kembali.`,
          actor: "Sistem pengingat",
        });
      });
    }
  }
}

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
        const detail = daysRemaining < 0
          ? `Tenggat notice ${candidate.caseReference} telah lewat ${Math.abs(daysRemaining)} hari. Segera tinjau potensi time bar.`
          : `Tenggat notice ${candidate.caseReference} tersisa ${daysRemaining} hari (ambang ${offset} hari).`;
        const [settings] = await db.select().from(organizationReminderSettingsTable)
          .where(eq(organizationReminderSettingsTable.organizationId, candidate.caseOrganizationId)).limit(1);
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
          const deliveries = deliveryValues(settings, {
            organizationId: candidate.caseOrganizationId,
            workItemId: workItem.id,
            caseId: workItem.caseId!,
            reminderDay: offset,
            subject: `Pengingat notice ${candidate.caseReference}`,
            message: `${workItem.title}\n${detail}`,
            nextAttemptAt: now,
          });
          if (deliveries.length) {
            await tx.insert(noticeReminderDeliveriesTable).values(deliveries).onConflictDoNothing();
          }
          await tx.insert(contractCaseActivitiesTable).values({
            caseId: workItem.caseId!,
            organizationId: candidate.caseOrganizationId,
            action: deliveries.length ? "Pengingat notice dijadwalkan" : "Pengingat notice dikirim",
            detail: `${detail}${deliveries.length ? ` Menunggu ${deliveries.length} pengiriman eksternal.` : " Dicatat di aplikasi; kanal eksternal tidak aktif."}`,
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
  await deliverQueuedReminders(now);
}

export function startNoticeReminderScheduler(): NodeJS.Timeout {
  void processNoticeReminders().catch((error) => logger.error({ err: error }, "Notice reminder scan failed"));
  const timer = setInterval(() => {
    void processNoticeReminders().catch((error) => logger.error({ err: error }, "Notice reminder scan failed"));
  }, 60_000);
  timer.unref();
  return timer;
}