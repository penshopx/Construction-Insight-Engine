import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(projectRoot, 'src');
const appSource = readFileSync(join(sourceRoot, 'App.tsx'), 'utf8');
const layoutSource = readFileSync(join(sourceRoot, 'components/layout.tsx'), 'utf8');
const riskModelSource = readFileSync(join(sourceRoot, 'lib/risk-model.ts'), 'utf8');
const riskIndicatorSource = readFileSync(join(sourceRoot, 'components/risk-indicator.tsx'), 'utf8');

const pageImports = new Map(
  [...appSource.matchAll(/import\s+(\w+)\s+from\s+['"]@\/pages\/([^'"]+)['"]/g)]
    .map(([, component, file]) => [component, file]),
);

const operationalRoutes = [...appSource.matchAll(
  /<Route\s+path="([^"]+)"[^>]*>\{\(\)\s*=>\s*<ProtectedRoute>\s*<(\w+)\s*\/>\s*<\/ProtectedRoute>\}<\/Route>/g,
)].map(([, path, component]) => ({ path, component }));

assert.ok(operationalRoutes.length > 0, 'Tidak ada route operasional yang terdeteksi di App.tsx');

for (const { path, component } of operationalRoutes) {
  const pageFile = pageImports.get(component);
  assert.ok(pageFile, `Route operasional ${path} harus memakai komponen halaman yang diimpor dari src/pages`);

  const pageSource = readFileSync(join(sourceRoot, 'pages', `${pageFile}.tsx`), 'utf8');
  assert.match(
    pageSource,
    /import\s*\{[^}]*\bShell\b[^}]*\}\s*from\s*['"]@\/components\/layout['"]/s,
    `Halaman ${path} harus mengimpor Shell standar`,
  );
  assert.match(pageSource, /<Shell(?:\s|>)/, `Halaman ${path} harus dirender di dalam Shell standar`);
}

assert.match(layoutSource, />DISCLAIMER:</, 'Shell standar harus tetap menampilkan label disclaimer');
for (const requiredCopy of ['bukan nasihat hukum', 'tidak menjamin keutuhan', 'diterimanya data sebagai alat bukti']) {
  assert.ok(
    layoutSource.toLocaleLowerCase('id').includes(requiredCopy),
    `Disclaimer Shell harus tetap memuat peringatan: "${requiredCopy}"`,
  );
}
for (const requiredLandingCopy of ['bukan nasihat hukum', 'jaminan diterimanya data sebagai alat bukti']) {
  assert.ok(
    appSource.toLocaleLowerCase('id').includes(requiredLandingCopy),
    `Landing page harus tetap memuat peringatan: "${requiredLandingCopy}"`,
  );
}

const riskyClaims = [
  { name: 'klaim kekekalan/immutability', pattern: /\b(?:immutable|immutability|kekal|kekekalan|tidak dapat diubah|anti[- ]?ubah)\b/gi },
  { name: 'klaim chain of custody', pattern: /\bchain of custody\b/gi },
  { name: 'klaim penerimaan hukum/pengadilan', pattern: /\b(?:court[- ]?admissible|diterima(?:nya)? sebagai alat bukti|penerimaan hukum|diterima (?:oleh )?pengadilan)\b/gi },
  { name: 'klaim skor tervalidasi', pattern: /\b(?:skor|model|penilaian|score|risk)\b.{0,35}\b(?:tervalidasi|validated)\b/gi },
];
const qualification = /\b(?:bukan|tidak|belum|tanpa|jangan|tak|non|harus diverifikasi|perlu diverifikasi)\b/i;

function findUnqualifiedClaims(source, file) {
  const findings = [];
  for (const claim of riskyClaims) {
    for (const match of source.matchAll(claim.pattern)) {
      const start = Math.max(0, match.index - 180);
      const end = Math.min(source.length, match.index + match[0].length + 180);
      const context = source.slice(start, end).replace(/\s+/g, ' ');
      if (!qualification.test(context)) {
        const line = source.slice(0, match.index).split('\n').length;
        findings.push(`${file}:${line} ${claim.name}: "${match[0]}"`);
      }
    }
  }
  return findings;
}

assert.ok(
  findUnqualifiedClaims('Bukti ini immutable dan court-admissible dengan skor risiko tervalidasi.', 'fixture.tsx').length >= 3,
  'Pendeteksi klaim berisiko harus menolak copy afirmatif',
);
assert.deepEqual(
  findUnqualifiedClaims('Catatan ini bukan chain of custody dan tidak menjamin diterimanya sebagai alat bukti. Skor belum tervalidasi.', 'fixture.tsx'),
  [],
  'Pendeteksi klaim berisiko harus mengizinkan disclaimer yang jelas',
);

assert.match(riskModelSource, /validationStatus:\s*'pending_expert_review'/, 'Model tanpa persetujuan ahli harus berstatus tertunda');
assert.match(riskModelSource, /calculatedAt:/, 'Snapshot risiko harus mencatat waktu perhitungan');
assert.match(riskModelSource, /sources:/, 'Snapshot risiko harus mencatat sumber input');
assert.match(riskIndicatorSource, /canDisplayOperationalScore\(\)/, 'UI harus mengunci skor berdasarkan status validasi');
assert.match(riskIndicatorSource, /Skor operasional dikunci/, 'UI harus menjelaskan bahwa skor operasional dikunci');

const calculateDraftScore = ({ contract, schedule, quality, dispute }) =>
  Math.round(contract * 0.30 + schedule * 0.25 + quality * 0.25 + dispute * 0.20);
const representativeCases = [
  { name: 'proyek stabil', input: { contract: 10, schedule: 10, quality: 10, dispute: 10 }, expected: 10 },
  { name: 'keterlambatan dominan', input: { contract: 20, schedule: 100, quality: 20, dispute: 20 }, expected: 40 },
  { name: 'NCR dominan', input: { contract: 20, schedule: 20, quality: 100, dispute: 20 }, expected: 40 },
  { name: 'sengketa dan administrasi kritis', input: { contract: 100, schedule: 60, quality: 40, dispute: 100 }, expected: 75 },
];
for (const testCase of representativeCases) {
  assert.equal(calculateDraftScore(testCase.input), testCase.expected, `Perhitungan draft harus konsisten untuk kasus ${testCase.name}`);
}

const sourceFiles = [
  join(sourceRoot, 'App.tsx'),
  join(sourceRoot, 'components/layout.tsx'),
  ...readdirSync(join(sourceRoot, 'pages'))
    .filter((file) => file.endsWith('.tsx'))
    .map((file) => join(sourceRoot, 'pages', file)),
];
const riskyFindings = sourceFiles.flatMap((file) =>
  findUnqualifiedClaims(readFileSync(file, 'utf8'), file.slice(projectRoot.length + 1)),
);

assert.deepEqual(
  riskyFindings,
  [],
  `Copy berisiko harus diberi kualifikasi/disclaimer sebelum rilis:\n${riskyFindings.join('\n')}`,
);

console.log(`Legal guardrails passed for ${operationalRoutes.length} operational routes.`);