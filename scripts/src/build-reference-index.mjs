import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const assetsDir = resolve(root, "attached_assets");
const output = resolve(root, "artifacts/api-server/src/lib/reference-index.json");
const supported = new Set([".pdf", ".doc", ".docx"]);
const topicTerms = {
  "Force majeure": ["force majeure", "keadaan kahar", "keadaan memaksa"],
  Klaim: ["klaim", "claim"],
  Pembayaran: ["pembayaran", "payment", "termin"],
  Sengketa: ["sengketa", "arbitrase", "dispute"],
  Wanprestasi: ["wanprestasi", "cidera janji"],
  "Perubahan pekerjaan": ["variation order", "pekerjaan tambah", "perubahan pekerjaan"],
  Keterlambatan: ["keterlambatan", "delay", "perpanjangan waktu", "eot"],
  Pemutusan: ["pemutusan", "terminasi"],
};

function cleanXml(xml) {
  return xml
    .replace(/<w:tab[^>]*\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function extract(path, extension) {
  if (extension === ".pdf") return execFileSync("pdftotext", ["-layout", path, "-"], { encoding: "utf8", maxBuffer: 20_000_000 });
  if (extension === ".doc") return execFileSync("antiword", [path], { encoding: "utf8", maxBuffer: 20_000_000 });
  return cleanXml(execFileSync("unzip", ["-p", path, "word/document.xml"], { encoding: "utf8", maxBuffer: 20_000_000 }));
}

function humanTitle(filename) {
  return basename(filename, extname(filename))
    .replace(/_\d+$/, "").replace(/^\d+-?/, "").replace(/-docx$/i, "")
    .replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function categoryFor(title) {
  const value = title.toLowerCase();
  if (/klaim|sengketa|hukum/.test(value)) return "Klaim & Hukum";
  if (/administrasi|manajemen/.test(value)) return "Administrasi Kontrak";
  if (/syarat|dokumen|rancangan/.test(value)) return "Dokumen Kontrak";
  return "Dasar & Prinsip";
}

function topicsFor(text) {
  const normalized = text.toLowerCase();
  return Object.entries(topicTerms)
    .filter(([, terms]) => terms.some((term) => normalized.includes(term)))
    .map(([topic]) => topic);
}

function chunks(text) {
  const paragraphs = text.replace(/\r/g, "").split(/\n{2,}/).map((value) => value.replace(/\s+/g, " ").trim()).filter((value) => value.length > 80);
  const result = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length > 1200 && current.length > 0) {
      result.push(current);
      current = "";
    }
    current += `${current ? "\n" : ""}${paragraph}`;
  }
  if (current.length > 80) result.push(current);
  return result;
}

const documents = [];
for (const filename of readdirSync(assetsDir).sort()) {
  const extension = extname(filename).toLowerCase();
  if (!supported.has(extension)) continue;
  const path = resolve(assetsDir, filename);
  try {
    const content = extract(path, extension);
    const title = humanTitle(filename);
    const sections = chunks(content).map((section, index) => {
      const firstLine = section.split("\n")[0];
      return {
        id: `${createHash("sha1").update(filename).digest("hex").slice(0, 10)}-${index + 1}`,
        sectionNumber: index + 1,
        heading: firstLine.length <= 100 ? firstLine : `Bagian ${index + 1}`,
        content: section,
        topics: topicsFor(section),
      };
    });
    if (!sections.length) continue;
    const checksum = createHash("sha256").update(readFileSync(path)).digest("hex");
    const allTopics = [...new Set(sections.flatMap((section) => section.topics))];
    documents.push({
      id: createHash("sha1").update(filename).digest("hex").slice(0, 10),
      title,
      category: categoryFor(title),
      fileType: extension.slice(1).toUpperCase(),
      sourceFilename: filename,
      sourceChecksum: checksum,
      topics: allTopics,
      sections,
    });
  } catch (error) {
    process.stderr.write(`Gagal mengekstrak ${filename}: ${error.message}\n`);
  }
}

writeFileSync(output, `${JSON.stringify(documents)}\n`);
process.stdout.write(`Mengindeks ${documents.length} dokumen ke ${output}\n`);