import { afterEach, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { db, mediationEvidenceTable, mediationRoomsTable } from "@workspace/db";
import {
  canViewEvidence,
  listVisibleEvidence,
  validEvidenceAccess,
  type EvidenceVisibility,
} from "./collaboration";

const roomIds: number[] = [];

afterEach(async () => {
  if (roomIds.length) {
    await db.delete(mediationRoomsTable).where(inArray(mediationRoomsTable.id, roomIds.splice(0)));
  }
});

describe("collaboration evidence authorization", () => {
  const cases = [
    { confidentiality: "ORGANIZATION", allowedRoles: [] },
    { confidentiality: "RESTRICTED", allowedRoles: ["member"] },
    { confidentiality: "RESTRICTED", allowedRoles: ["manager"] },
    { confidentiality: "RESTRICTED", allowedRoles: ["manager", "member"] },
    { confidentiality: "MANAGERS", allowedRoles: [] },
    { confidentiality: "MANAGERS", allowedRoles: ["manager"] },
  ] satisfies readonly EvidenceVisibility[];

  it.each(cases)("uses confidentiality and allowed roles for manager visibility: %#", (item) => {
    expect(canViewEvidence(item, "manager")).toBe(
      item.confidentiality === "ORGANIZATION"
      || item.confidentiality === "MANAGERS"
      || item.allowedRoles.includes("manager"),
    );
  });

  it.each(cases)("uses confidentiality and allowed roles for member visibility: %#", (item) => {
    expect(canViewEvidence(item, "member")).toBe(
      item.confidentiality === "ORGANIZATION"
      || (item.confidentiality === "RESTRICTED" && item.allowedRoles.includes("member")),
    );
  });

  it("requires explicit roles for restricted evidence and rejects invalid combinations", () => {
    expect(validEvidenceAccess("RESTRICTED", [])).toBe(false);
    expect(validEvidenceAccess("RESTRICTED", ["member"])).toBe(true);
    expect(validEvidenceAccess("MANAGERS", [])).toBe(true);
    expect(validEvidenceAccess("MANAGERS", ["member"])).toBe(false);
    expect(validEvidenceAccess("ORGANIZATION", ["member"])).toBe(false);
    expect(validEvidenceAccess("RESTRICTED", ["member", "member"])).toBe(false);
    expect(validEvidenceAccess("RESTRICTED", ["guest"])).toBe(false);
    expect(validEvidenceAccess("UNKNOWN", [])).toBe(false);
  });
});

describe("collaboration organization isolation", () => {
  it("returns only evidence in the active organization and allowed workspace role", async () => {
    const rooms = await db.insert(mediationRoomsTable).values([
      { organizationId: 71001, reference: "TEST-EVIDENCE-A", title: "Ruang organisasi A" },
      { organizationId: 71002, reference: "TEST-EVIDENCE-B", title: "Ruang organisasi B" },
    ]).returning();
    roomIds.push(...rooms.map((item) => item.id));

    await db.insert(mediationEvidenceTable).values([
      { organizationId: 71001, roomId: rooms[0].id, name: "organization-a", confidentiality: "ORGANIZATION", allowedRoles: [] },
      { organizationId: 71001, roomId: rooms[0].id, name: "member-a", confidentiality: "RESTRICTED", allowedRoles: ["member"] },
      { organizationId: 71001, roomId: rooms[0].id, name: "manager-a", confidentiality: "RESTRICTED", allowedRoles: ["manager"] },
      { organizationId: 71001, roomId: rooms[0].id, name: "managers-a", confidentiality: "MANAGERS", allowedRoles: [] },
      { organizationId: 71002, roomId: rooms[0].id, name: "cross-organization", confidentiality: "ORGANIZATION", allowedRoles: [] },
    ]);

    const memberEvidence = await listVisibleEvidence(71001, rooms[0].id, "member");
    expect(memberEvidence.map((item) => item.name)).toEqual(["organization-a", "member-a"]);

    const managerEvidence = await listVisibleEvidence(71001, rooms[0].id, "manager");
    expect(managerEvidence.map((item) => item.name)).toEqual(["organization-a", "manager-a", "managers-a"]);
    expect([...memberEvidence, ...managerEvidence].some((item) => item.name === "cross-organization")).toBe(false);
  });
});