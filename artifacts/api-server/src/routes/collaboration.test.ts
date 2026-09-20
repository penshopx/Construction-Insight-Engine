import { describe, expect, it } from "vitest";
import {
  canViewEvidence,
  referencesBelongToWorkspace,
  validEvidenceAccess,
  type EvidenceVisibility,
} from "./collaboration";

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
    expect(validEvidenceAccess("UNKNOWN", [])).toBe(false);
  });
});

describe("collaboration organization isolation", () => {
  it("rejects missing and cross-organization references", () => {
    expect(referencesBelongToWorkspace([{ organizationId: 7 }, { organizationId: 7 }], 7)).toBe(true);
    expect(referencesBelongToWorkspace([{ organizationId: 7 }, { organizationId: 8 }], 7)).toBe(false);
    expect(referencesBelongToWorkspace([{ organizationId: 7 }, null], 7)).toBe(false);
    expect(referencesBelongToWorkspace([], 7)).toBe(true);
  });
});