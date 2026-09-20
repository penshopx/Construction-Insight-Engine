import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const exec = promisify(execFile);
const supported = new Set([".pdf", ".doc", ".docx"]);
const topicTerms: Record<string, string[]> = {
  "Force majeure": ["force majeure", "keadaan kahar", "keadaan memaksa"],
  Klaim: ["klaim", "claim"],
  Pembayaran: ["pembayaran", "payment", "termin"],
  Sengketa: ["sengketa", "arbitrase", "dispute"],
  Wanprestasi: ["wanprestasi", "cidera janji"],
  "Perubahan pekerjaan": ["variation order", "pekerjaan tambah", "perubahan pekerjaan"],
  Keterlambatan: ["keterlambatan", "delay", "perpanjangan waktu", "eot"],
  Pemutusan: ["pemutusan", "terminasi"],
};

export function metadataFor(filename: string, requestedTitle?: string, requestedCategory?: string) {
  const extension = extname(filename).toLowerCase();
  if (!supported.has(extension)) throw new Error("Format harus PDF, DOC, atau DOCX");
  const title = requestedTitle?.trim() || basename(filename, extension)
    .replace(/_\d+$/, "").replace(/^\d+-?/, "").replace(/-docx$/i, "")
    .replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const normalized = title.toLowerCase();
  const category = requestedCategory?.trim() || (
    /klaim|sengketa|hukum/.test(normalized) ? "Klaim & Hukum"
      : /administrasi|manajemen/.test(normalized) ? "Administrasi Kontrak"
        : /syarat|dokumen|rancangan/.test(normalized) ? "Dokumen Kontrak"
          : "Dasar & Prinsip"
  );
  return { extension, title, category, fileType: extension.slice(1).toUpperCase() };
}

function topicsFor(text: string) {
  const normalized = text.toLowerCase();
  return Object.entries(topicTerms).filter(([, terms]) => terms.some((term) => normalized.includes(term))).map(([topic]) => topic);
}

function chunks(text: string) {
  const paragraphs = text.replace(/\r/g, "").split(/\n{2,}/)
    .map((value) => value.replace(/\s+/g, " ").trim()).filter((value) => value.length > 80);
  const result: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current.length + paragraph.length > 1200 && current) {
      result.push(current);
      current = "";
    }
    current += `${current ? "\n" : ""}${paragraph}`;
  }
  if (current.length > 80) result.push(current);
  return result;
}

export async function extractReference(buffer: Buffer, filename: string) {
  const { extension } = metadataFor(filename);
  const dir = await mkdtemp(join(tmpdir(), "reference-"));
  const path = join(dir, `source${extension}`);
  try {
    await writeFile(path, buffer);
    let stdout: string;
    if (extension === ".pdf") ({ stdout } = await exec("pdftotext", ["-layout", path, "-"], { maxBuffer: 20_000_000 }));
    else if (extension === ".doc") ({ stdout } = await exec("antiword", [path], { maxBuffer: 20_000_000 }));
    else {
      ({ stdout } = await exec("unzip", ["-p", path, "word/document.xml"], { maxBuffer: 20_000_000 }));
      stdout = stdout.replace(/<w:tab[^>]*\/>/g, "\t").replace(/<\/w:p>/g, "\n").replace(/<[^>]+>/g, " ")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    }
    const sections = chunks(stdout).map((content, index) => ({
      sectionNumber: index + 1,
      heading: content.split("\n")[0].slice(0, 100) || `Bagian ${index + 1}`,
      content,
      topics: topicsFor(content),
    }));
    if (!sections.length) throw new Error("Tidak ada teks yang dapat diekstrak dari dokumen");
    return { checksum: createHash("sha256").update(buffer).digest("hex"), sections };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}