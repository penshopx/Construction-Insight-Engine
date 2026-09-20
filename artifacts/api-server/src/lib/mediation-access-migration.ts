import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  appUsersTable,
  collaborationActivitiesTable,
  db,
  mediationEvidenceTable,
  mediationParticipantsTable,
  mediationRoomsTable,
  organizationMembershipsTable,
} from "@workspace/db";
type MediationRole = "CLAIMANT" | "RESPONDENT" | "MEDIATOR" | "OBSERVER";

const normalizeRole = (role: string): MediationRole => {
  switch (role.toUpperCase()) {
    case "CLAIMANT":
    case "PEMOHON":
      return "CLAIMANT";
    case "RESPONDENT":
    case "TERMOHON":
      return "RESPONDENT";
    case "MEDIATOR":
      return "MEDIATOR";
    case "OBSERVER":
    case "PENGAMAT":
      return "OBSERVER";
    default:
      return "CLAIMANT";
  }
};

const normalizeEvidenceRoles = (roles: readonly string[]) => {
  const normalized = new Set<MediationRole>();
  for (const role of roles) {
    if (role === "manager" || role === "MEDIATOR") normalized.add("MEDIATOR");
    if (role === "member") {
      normalized.add("CLAIMANT");
      normalized.add("RESPONDENT");
      normalized.add("OBSERVER");
    }
    if (["CLAIMANT", "RESPONDENT", "MEDIATOR", "OBSERVER"].includes(role)) {
      normalized.add(role as MediationRole);
    }
  }
  return [...normalized];
};

export async function migrateLegacyMediationAccess(): Promise<void> {
  await db.transaction(async (tx) => {
    const legacyParticipants = await tx.select({
      id: mediationParticipantsTable.id,
      role: mediationParticipantsTable.role,
    }).from(mediationParticipantsTable).where(isNull(mediationParticipantsTable.userId));

    for (const participant of legacyParticipants) {
      await tx.update(mediationParticipantsTable)
        .set({ role: normalizeRole(participant.role) })
        .where(eq(mediationParticipantsTable.id, participant.id));
    }

    const legacyEvidence = await tx.select().from(mediationEvidenceTable).where(
      inArray(mediationEvidenceTable.confidentiality, ["ORGANIZATION", "MANAGERS", "RESTRICTED"]),
    );
    for (const evidence of legacyEvidence) {
      const legacyRoles = evidence.allowedParticipantRoles;
      const confidentiality = evidence.confidentiality === "ORGANIZATION" ? "ROOM" : "RESTRICTED";
      const allowedParticipantRoles = evidence.confidentiality === "ORGANIZATION"
        ? []
        : evidence.confidentiality === "MANAGERS"
          ? ["MEDIATOR" as const]
          : normalizeEvidenceRoles(legacyRoles);
      await tx.update(mediationEvidenceTable).set({
        confidentiality,
        allowedParticipantRoles,
        allowedParticipantIds: [],
      }).where(eq(mediationEvidenceTable.id, evidence.id));
    }

    const legacyRooms = await tx.select({
      id: mediationRoomsTable.id,
      organizationId: mediationRoomsTable.organizationId,
    }).from(mediationRoomsTable).where(sql`not exists (
      select 1 from ${mediationParticipantsTable}
      where ${mediationParticipantsTable.roomId} = ${mediationRoomsTable.id}
        and ${mediationParticipantsTable.userId} is not null
    )`);

    for (const legacyRoom of legacyRooms) {
      const managers = await tx.select({
        userId: organizationMembershipsTable.userId,
        displayName: appUsersTable.displayName,
      }).from(organizationMembershipsTable)
        .innerJoin(appUsersTable, eq(organizationMembershipsTable.userId, appUsersTable.id))
        .where(and(
          eq(organizationMembershipsTable.organizationId, legacyRoom.organizationId),
          eq(organizationMembershipsTable.role, "manager"),
        ));

      if (!managers.length) continue;
      await tx.insert(mediationParticipantsTable).values(managers.map((manager) => ({
        organizationId: legacyRoom.organizationId,
        roomId: legacyRoom.id,
        userId: manager.userId,
        displayName: manager.displayName || `Pengelola ${manager.userId}`,
        role: "MEDIATOR",
      }))).onConflictDoNothing();
      await tx.insert(collaborationActivitiesTable).values({
        organizationId: legacyRoom.organizationId,
        roomId: legacyRoom.id,
        action: "Akses peserta lama dimigrasikan",
        detail: "Pengelola organisasi yang sebelumnya memiliki akses ditautkan sebagai mediator; peserta lama tetap tertutup sampai ditautkan ke akun.",
        actor: null,
      });
    }
  });
}