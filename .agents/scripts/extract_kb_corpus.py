#!/usr/bin/env python3
import hashlib
import json
import re
import subprocess
import zipfile
from pathlib import Path
from xml.etree import ElementTree

SOURCE_DIR = Path("attached_assets")
OUTPUT_DIR = Path("knowledge/kontrakguard")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def clean_text(value: str) -> str:
    value = value.replace("\x00", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def normalized(value: str) -> str:
    return re.sub(r"\W+", "", value.lower(), flags=re.UNICODE)


def extract_docx(path: Path) -> tuple[str, int]:
    with zipfile.ZipFile(path) as archive:
        xml = archive.read("word/document.xml")
    root = ElementTree.fromstring(xml)
    namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    paragraphs = []
    for paragraph in root.iter(namespace + "p"):
        text = "".join(node.text or "" for node in paragraph.iter(namespace + "t"))
        if text.strip():
            paragraphs.append(text)
    return clean_text("\n".join(paragraphs)), 0


def extract_pdf(path: Path) -> tuple[str, int]:
    result = subprocess.run(
        ["pdftotext", "-layout", str(path), "-"],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    info = subprocess.run(
        ["pdfinfo", str(path)],
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    ).stdout
    pages_match = re.search(r"^Pages:\s+(\d+)", info, flags=re.MULTILINE)
    return clean_text(result.stdout.decode("utf-8", errors="replace")), int(pages_match.group(1)) if pages_match else 0


def infer_title(path: Path, text: str) -> str:
    candidates = [line.strip() for line in text.splitlines()[:80] if 8 <= len(line.strip()) <= 180]
    for candidate in candidates:
        if not re.fullmatch(r"[\d\W_]+", candidate):
            return candidate
    stem = re.sub(r"_\d{13}$", "", path.stem)
    return stem.replace("-", " ").replace("_", " ")


records = []
failures = []
for path in sorted(SOURCE_DIR.iterdir()):
    if path.suffix.lower() not in {".pdf", ".docx"}:
        continue
    try:
        text, pages = extract_pdf(path) if path.suffix.lower() == ".pdf" else extract_docx(path)
        norm = normalized(text)
        records.append(
            {
                "id": hashlib.sha256(path.name.encode()).hexdigest()[:12],
                "file": str(path),
                "filename": path.name,
                "format": path.suffix.lower().lstrip("."),
                "bytes": path.stat().st_size,
                "pages": pages,
                "title_detected": infer_title(path, text),
                "characters": len(text),
                "words": len(re.findall(r"\b\w+\b", text, flags=re.UNICODE)),
                "text_sha256": hashlib.sha256(norm.encode()).hexdigest(),
                "text": text,
            }
        )
    except Exception as exc:
        failures.append({"file": str(path), "error": str(exc)})

by_text_hash = {}
for record in records:
    by_text_hash.setdefault(record["text_sha256"], []).append(record["filename"])
text_duplicates = [group for group in by_text_hash.values() if len(group) > 1]

with (OUTPUT_DIR / "corpus.jsonl").open("w", encoding="utf-8") as handle:
    for record in records:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")

manifest = {
    "documents_extracted": len(records),
    "failed_extractions": failures,
    "normalized_text_duplicate_groups": text_duplicates,
    "total_characters": sum(record["characters"] for record in records),
    "total_words": sum(record["words"] for record in records),
}
(OUTPUT_DIR / "extraction-report.json").write_text(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)
print(json.dumps(manifest, ensure_ascii=False, indent=2))