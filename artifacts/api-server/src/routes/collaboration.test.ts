import { afterEach, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import {
  appUsersTable,
  collaborationActivitiesTable,
  db,
  mediationEvidenceTable,
  mediationParticipantsTable,
  mediationRoomsTable,
  organizationMembershipsTable,
  organizationsTable,
} from "@workspace/db";
import {
  canChangeMediationRoom,
  canContributeToMediation,
  canViewEvidence,
  listVisibleEvidence,
  validEvidenceAccess,
  type EvidenceVisibility,
} from "./collaboration";
import { migrateLegacyMediationAccess } from "../lib/mediation-access-migration";

const roomIds: number[] = [];
const organizationIds: number[] = [];
const userIds: number[] = [];

afterEach(async () => {
  if (roomIds.length) {
    const ids = roomIds.splice(0);
    await db.delete(collaborationActivitiesTable).where(inArray(collaborationActivitiesTable.roomId, ids));
    await db.delete(mediationRoomsTable).where(inArray(mediationRoomsTable.id, ids));
  }
  if (organizationIds.length) {
    await db.delete(organizationsTable).where(inArray(organizationsTable.id, organizationIds.splice(0)));
  }
  if (userIds.length) {
    await db.delete(appUsersTable).where(inArray(appUsersTable.id, userIds.splice(0)));
  }
});

describe("collaboration evidence authorization", () => {
  const cases: readonly EvidenceVisibility[] = [
    { confidentiality: "ROOM", allowedParticipantRoles: [], allowedParticipantIds: [] },
    { confidentiality: "RESTRICTED", allowedParticipantRoles: ["CLAIMANT"], allowedParticipantIds: [] },
    { confidentiality: "RESTRICTED", allowedParticipantRoles: ["MEDIATOR"], allowedParticipantIds: [] },
    { confidentiality: "RESTRICTED", allowedParticipantRoles: [], allowedParticipantIds: [12] },
  ];

  it.each(cases)("uses mediation role and participant identity for claimant visibility: %#", (item) => {
    expect(canViewEvidence(item, { id: 11, role: "CLAIMANT" })).toBe(
      item.confidentiality === "ROOM"
      || item.allowedParticipantRoles.includes("CLAIMANT")
      || item.allowedParticipantIds.includes(11),
    );
  });

  it.each(cases)("uses mediation role and participant identity for selected participant visibility: %#", (item) => {
    expect(canViewEvidence(item, { id: 12, role: "RESPONDENT" })).toBe(
      item.confidentiality === "ROOM"
      || item.allowedParticipantRoles.includes("RESPONDENT")
      || item.allowedParticipantIds.includes(12),
    );
  });

  it("requires an explicit participant scope for restricted evidence", () => {
    expect(validEvidenceAccess("RESTRICTED", [], [])).toBe(false);
    expect(validEvidenceAccess("RESTRICTED", ["CLAIMANT"], [])).toBe(true);
    expect(validEvidenceAccess("RESTRICTED", [], [11])).toBe(true);
    expect(validEvidenceAccess("ROOM", [], [])).toBe(true);
    expect(validEvidenceAccess("ROOM", ["MEDIATOR"], [])).toBe(false);
    expect(validEvidenceAccess("RESTRICTED", ["CLAIMANT", "CLAIMANT"], [])).toBe(false);
    expect(validEvidenceAccess("RESTRICTED", ["GUEST"], [])).toBe(false);
    expect(validEvidenceAccess("RESTRICTED", [], [11, 11])).toBe(false);
    expect(validEvidenceAccess("UNKNOWN", [], [])).toBe(false);
  });

  it("applies mediation role capabilities", () => {
    expect(canChangeMediationRoom("MEDIATOR")).toBe(true);
    expect(canChangeMediationRoom("CLAIMANT")).toBe(false);
    expect(canContributeToMediation("CLAIMANT")).toBe(true);
    expect(canContributeToMediation("RESPONDENT")).toBe(true);
    expect(canContributeToMediation("MEDIATOR")).toBe(true);
    expect(canContributeToMediation("OBSERVER")).toBe(false);
  });
});

describe("collaboration organization isolation", () => {
  it("returns only evidence in the active organization and allowed participant scope", async () => {
    const rooms = await db.insert(mediationRoomsTable).values([
      { organizationId: 71001, reference: "TEST-EVIDENCE-A", title: "Ruang organisasi A" },
      { organizationId: 71002, reference: "TEST-EVIDENCE-B", title: "Ruang organisasi B" },
    ]).returning();
    roomIds.push(...rooms.map((item) => item.id));

    await db.insert(mediationEvidenceTable).values([
      { organizationId: 71001, roomId: rooms[0].id, name: "room-a", confidentiality: "ROOM", allowedParticipantRoles: [], allowedParticipantIds: [] },
      { organizationId: 71001, roomId: rooms[0].id, name: "claimant-a", confidentiality: "RESTRICTED", allowedParticipantRoles: ["CLAIMANT"], allowedParticipantIds: [] },
      { organizationId: 71001, roomId: rooms[0].id, name: "selected-a", confidentiality: "RESTRICTED", allowedParticipantRoles: [], allowedParticipantIds: [12] },
      { organizationId: 71002, roomId: rooms[0].id, name: "cross-organization", confidentiality: "ROOM", allowedParticipantRoles: [], allowedParticipantIds: [] },
    ]);

    const claimantEvidence = await listVisibleEvidence(71001, rooms[0].id, { id: 11, role: "CLAIMANT" });
    expect(claimantEvidence.map((item) => item.name)).toEqual(["room-a", "claimant-a"]);

    const selectedEvidence = await listVisibleEvidence(71001, rooms[0].id, { id: 12, role: "OBSERVER" });
    expect(selectedEvidence.map((item) => item.name)).toEqual(["room-a", "selected-a"]);
    expect([...claimantEvidence, ...selectedEvidence].some((item) => item.name === "cross-organization")).toBe(false);
  });

  it("migrates legacy rooms to existing managers without exposing them to other members", async () => {
    const [organization] = await db.insert(organizationsTable).values({ name: "Organisasi migrasi mediasi" }).returning();
    organizationIds.push(organization.id);
    const users = await db.insert(appUsersTable).values([
      { clerkUserId: `legacy-manager-${Date.now()}`, displayName: "Pengelola Lama", activeOrganizationId: organization.id },
      { clerkUserId: `legacy-member-${Date.now()}`, displayName: "Anggota Lama", activeOrganizationId: organization.id },
    ]).returning();
    userIds.push(...users.map(({ id: userId }) => userId));
    await db.insert(organizationMembershipsTable).values([
      { organizationId: organization.id, userId: users[0].id, role: "manager" },
      { organizationId: organization.id, userId: users[1].id, role: "member" },
    ]);
    const [legacyRoom] = await db.insert(mediationRoomsTable).values({
      organizationId: organization.id,
      reference: `LEGACY-${Date.now()}`,
      title: "Ruang mediasi lama",
    }).returning();
    roomIds.push(legacyRoom.id);
    await db.insert(mediationParticipantsTable).values({
      organizationId: organization.id,
      roomId: legacyRoom.id,
      userId: null,
      displayName: "Pihak lama",
      role: "PARTY",
    });
    await db.insert(mediationEvidenceTable).values([
      { organizationId: organization.id, roomId: legacyRoom.id, name: "Bukti organisasi lama", confidentiality: "ORGANIZATION", allowedParticipantRoles: [], allowedParticipantIds: [] },
      { organizationId: organization.id, roomId: legacyRoom.id, name: "Bukti pengelola lama", confidentiality: "MANAGERS", allowedParticipantRoles: [], allowedParticipantIds: [] },
    ]);

    await migrateLegacyMediationAccess();

    const participants = await db.select().from(mediationParticipantsTable).where(eq(mediationParticipantsTable.roomId, legacyRoom.id));
    expect(participants).toEqual(expect.arrayContaining([
      expect.objectContaining({ userId: null, role: "CLAIMANT" }),
      expect.objectContaining({ userId: users[0].id, role: "MEDIATOR" }),
    ]));
    expect(participants.some(({ userId }) => userId === users[1].id)).toBe(false);

    const evidence = await db.select().from(mediationEvidenceTable).where(eq(mediationEvidenceTable.roomId, legacyRoom.id));
    expect(evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "Bukti organisasi lama", confidentiality: "ROOM", allowedParticipantRoles: [] }),
      expect.objectContaining({ name: "Bukti pengelola lama", confidentiality: "RESTRICTED", allowedParticipantRoles: ["MEDIATOR"] }),
    ]));
  });
});