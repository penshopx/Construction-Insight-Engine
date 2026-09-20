import { createServer, type Server } from "node:http";
import express from "express";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/express", () => ({
  getAuth: vi.fn(() => ({ userId: null })),
}));

import referencesRouter from "./references";

type SearchHit = {
  id: string;
  documentId: string;
  title: string;
  category: string;
  fileType: string;
  sourceFilename: string;
  sourceChecksum: string;
  sectionNumber: number;
  heading: string;
  excerpt: string;
  topics: string[];
};

type SearchResponse = {
  query: string;
  total: number;
  results: SearchHit[];
  disclaimer: string;
};

describe("GET /references/search", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = express();
    app.use(referencesRouter);
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server failed to bind");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  async function search(params: Record<string, string | undefined>) {
    const entries = Object.entries(params).filter((entry): entry is [string, string] => entry[1] !== undefined);
    const response = await fetch(`${baseUrl}/references/search?${new URLSearchParams(entries)}`);
    expect(response.status).toBe(200);
    return response.json() as Promise<SearchResponse>;
  }

  function expectValidityDisclaimer(payload: SearchResponse) {
    expect(payload.disclaimer).toContain("Periksa kembali status keberlakuan peraturan");
    expect(payload.disclaimer).toContain("perubahan terbaru");
  }

  function expectCompleteHits(payload: SearchResponse) {
    expect(payload.total).toBe(payload.results.length);
    expect(payload.results.length).toBeGreaterThan(0);
    for (const hit of payload.results) {
      expect(hit.excerpt.trim()).not.toBe("");
      expect(hit.sectionNumber).toBeGreaterThan(0);
      expect(hit.heading.trim()).not.toBe("");
      expect(hit.title.trim()).not.toBe("");
      expect(hit.sourceFilename.trim()).not.toBe("");
      expect(hit.sourceChecksum).toMatch(/^[a-f0-9]{64}$/);
      expect(hit.topics).toEqual(expect.any(Array));
    }
  }

  it.each([
    { label: "istilah tunggal", q: "wanprestasi" },
    { label: "frasa", q: "force majeure" },
  ])("mengembalikan kutipan dan identitas sumber lengkap untuk $label", async ({ q }) => {
    const payload = await search({ q });

    expect(payload.query).toBe(q);
    expectCompleteHits(payload);
    expectValidityDisclaimer(payload);
  });

  it("membatasi hasil ke kategori yang diminta", async () => {
    const payload = await search({ q: "keterlambatan", category: "Klaim & Hukum" });

    expectCompleteHits(payload);
    expect(new Set(payload.results.map((hit) => hit.category))).toEqual(new Set(["Klaim & Hukum"]));
    expectValidityDisclaimer(payload);
  });

  it.each([
    { label: "kueri tanpa kecocokan", params: { q: "istilah-yang-tidak-ada-9f73c2" } },
    { label: "kategori tanpa kecocokan", params: { q: "wanprestasi", category: "Kategori Tidak Ada" } },
  ])("tetap menyertakan peringatan keberlakuan untuk $label", async ({ params }) => {
    const payload = await search(params);

    expect(payload.total).toBe(0);
    expect(payload.results).toEqual([]);
    expectValidityDisclaimer(payload);
  });
});