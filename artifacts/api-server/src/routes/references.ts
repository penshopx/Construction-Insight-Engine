import { Router, type IRouter } from "express";
import { ListReferencesResponse, SearchReferencesQueryParams, SearchReferencesResponse } from "@workspace/api-zod";
import referenceIndex from "../lib/reference-index.json" with { type: "json" };

type IndexedSection = {
  id: string;
  sectionNumber: number;
  heading: string;
  content: string;
  topics: string[];
};

type IndexedDocument = {
  id: string;
  title: string;
  category: string;
  fileType: string;
  sourceFilename: string;
  sourceChecksum: string;
  topics: string[];
  sections: IndexedSection[];
};

const documents = referenceIndex as IndexedDocument[];
const router: IRouter = Router();
const disclaimer = "Periksa kembali status keberlakuan peraturan, perubahan terbaru, dan kesesuaiannya dengan kontrak Anda sebelum menggunakan kutipan ini.";

function excerptFor(content: string, terms: string[]) {
  const normalized = content.toLowerCase();
  const positions = terms.map((term) => normalized.indexOf(term)).filter((position) => position >= 0);
  const position = positions.length ? Math.min(...positions) : 0;
  const start = Math.max(0, position - 180);
  const end = Math.min(content.length, position + 420);
  return `${start > 0 ? "… " : ""}${content.slice(start, end).trim()}${end < content.length ? " …" : ""}`;
}

router.get("/references", (_req, res): void => {
  const payload = documents.map(({ sections, ...document }) => ({
    ...document,
    sectionCount: sections.length,
  }));
  res.json(ListReferencesResponse.parse(payload));
});

router.get("/references/search", (req, res): void => {
  const query = SearchReferencesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const terms = query.data.q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = documents
    .filter((document) => !query.data.category || document.category === query.data.category)
    .flatMap((document) =>
      document.sections
        .filter((section) => {
          const haystack = `${document.title} ${section.heading} ${section.topics.join(" ")} ${section.content}`.toLowerCase();
          return terms.every((term) => haystack.includes(term));
        })
        .map((section) => ({
          id: section.id,
          documentId: document.id,
          title: document.title,
          category: document.category,
          fileType: document.fileType,
          sourceFilename: document.sourceFilename,
          sourceChecksum: document.sourceChecksum,
          sectionNumber: section.sectionNumber,
          heading: section.heading,
          excerpt: excerptFor(section.content, terms),
          topics: section.topics,
        })),
    )
    .slice(0, 50);

  res.json(SearchReferencesResponse.parse({ query: query.data.q, total: results.length, results, disclaimer }));
});

export default router;