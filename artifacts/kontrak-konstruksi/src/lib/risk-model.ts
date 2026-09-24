export type RiskMethodology = {
  factors: readonly { key: string; label: string; weight: number }[];
  thresholds: readonly { label: string; min: number; max: number }[];
};

// The full canonical payload is used as the fingerprint: unlike a shortened hash,
// different methodology payloads cannot accidentally share an identifier.
export function methodologyFingerprint(methodology: RiskMethodology): string {
  return JSON.stringify({
    factors: methodology.factors.map(({ key, label, weight }) => [key, label, weight]),
    thresholds: methodology.thresholds.map(({ label, min, max }) => [label, min, max]),
  });
}

type ReviewBase = {
  version: string;
  fingerprint: string;
  methodology: RiskMethodology;
  recordedAt: string;
  recordedBy: string;
  note: string;
};

export type RiskReview = ReviewBase & (
  | { decision: 'pending_expert_review' | 'rejected' }
  | {
    decision: 'approved';
    reviewer: string;
    verifiedCompetence: string;
    independence: string;
    scope: string;
    limitations: string;
  }
);

export const riskModel = {
  version: 'KG-RISK-0.1-DRAFT',
  calculatedAt: '2026-09-20T09:00:00+07:00',
  factors: [
    { key: 'contract', label: 'Administrasi kontrak', weight: 30 },
    { key: 'schedule', label: 'Jadwal & notice', weight: 25 },
    { key: 'quality', label: 'Mutu & NCR', weight: 25 },
    { key: 'dispute', label: 'Klaim & sengketa', weight: 20 },
  ],
  thresholds: [
    { label: 'Rendah', min: 0, max: 39 },
    { label: 'Perlu tinjauan', min: 40, max: 69 },
    { label: 'Prioritas tinggi', min: 70, max: 100 },
  ],
  limitations: [
    'Belum dikalibrasi terhadap hasil proyek nyata dan belum disetujui reviewer independen.',
    'Tidak memprediksi probabilitas sengketa, kegagalan konstruksi, atau nilai kerugian.',
    'Kelengkapan dan ketepatan input tetap harus diverifikasi terhadap dokumen sumber.',
  ],
} as const;

// Keep each reviewed methodology as a separate snapshot, not a reference to
// riskModel: editing the active model must never edit its review history.
const initialMethodology = {
  factors: [
    { key: 'contract', label: 'Administrasi kontrak', weight: 30 },
    { key: 'schedule', label: 'Jadwal & notice', weight: 25 },
    { key: 'quality', label: 'Mutu & NCR', weight: 25 },
    { key: 'dispute', label: 'Klaim & sengketa', weight: 20 },
  ],
  thresholds: [
    { label: 'Rendah', min: 0, max: 39 },
    { label: 'Perlu tinjauan', min: 40, max: 69 },
    { label: 'Prioritas tinggi', min: 70, max: 100 },
  ],
} as const;

export const riskReviewHistory: readonly RiskReview[] = [
  {
    version: 'KG-RISK-0.1-DRAFT',
    fingerprint: methodologyFingerprint(initialMethodology),
    methodology: initialMethodology,
    decision: 'pending_expert_review',
    recordedAt: '2026-09-20T09:00:00+07:00',
    recordedBy: 'Tim produk',
    note: 'Metodologi draft diajukan; belum ada uji kasus representatif atau persetujuan ahli.',
  },
];

function completeApproval(entry: RiskReview): boolean {
  return entry.decision === 'approved'
    && [entry.recordedAt, entry.recordedBy, entry.note, entry.reviewer,
      entry.verifiedCompetence, entry.independence, entry.scope, entry.limitations]
      .every((value) => value.trim().length > 0);
}

export function getRiskValidation(
  model: { version: string } & RiskMethodology = riskModel,
  history: readonly RiskReview[] = riskReviewHistory,
) {
  const fingerprint = methodologyFingerprint(model);
  const latest = history.at(-1);
  const latestApproved = [...history].reverse().find((entry) =>
    completeApproval(entry) && entry.fingerprint === methodologyFingerprint(entry.methodology)
  );
  // A methodology edit without a new review record is pending, even if an
  // older approval happens to match after the model is reverted.
  const currentDecision = latest?.version === model.version
    && latest.fingerprint === fingerprint
    && latest.fingerprint === methodologyFingerprint(latest.methodology)
    ? latest.decision === 'approved' && !completeApproval(latest) ? 'pending_expert_review' : latest.decision
    : 'pending_expert_review';
  return { fingerprint, currentDecision, latestApproved, methodologyChanged: !latest
    || latest.version !== model.version
    || latest.fingerprint !== fingerprint
    || latest.fingerprint !== methodologyFingerprint(latest.methodology) };
}

export type RiskFactorKey = (typeof riskModel.factors)[number]['key'];
export type RiskInput = Record<RiskFactorKey, number>;

export type ProjectRiskSnapshot = {
  inputs: RiskInput;
  sources: string[];
  calculatedAt: string;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function calculateIllustrativeScore(inputs: RiskInput) {
  return Math.round(riskModel.factors.reduce(
    (total, factor) => total + clamp(inputs[factor.key]) * factor.weight / 100,
    0,
  ));
}

export function canDisplayOperationalScore(
  model: { version: string } & RiskMethodology = riskModel,
  history: readonly RiskReview[] = riskReviewHistory,
) {
  return getRiskValidation(model, history).currentDecision === 'approved';
}

export const projectRiskSnapshots: Record<string, ProjectRiskSnapshot> = {
  'PRJ-01': {
    inputs: { contract: 85, schedule: 80, quality: 70, dispute: 95 },
    sources: ['Register VO VO-042 (demo)', 'Kronologi EOT EOT-003 (demo)'],
    calculatedAt: riskModel.calculatedAt,
  },
  'PRJ-02': {
    inputs: { contract: 90, schedule: 95, quality: 85, dispute: 95 },
    sources: ['Register korespondensi Somasi 1–3 (demo)', 'Laporan deviasi jadwal (demo)'],
    calculatedAt: riskModel.calculatedAt,
  },
  'PRJ-03': {
    inputs: { contract: 55, schedule: 75, quality: 35, dispute: 65 },
    sources: ['Permohonan EOT terkait lahan (demo)', 'Notulen mediasi awal (demo)'],
    calculatedAt: riskModel.calculatedAt,
  },
  'PRJ-04': {
    inputs: { contract: 35, schedule: 30, quality: 75, dispute: 40 },
    sources: ['Register NCR-006–008 (demo)', 'Laporan progres mingguan (demo)'],
    calculatedAt: riskModel.calculatedAt,
  },
  'PRJ-05': {
    inputs: { contract: 20, schedule: 15, quality: 30, dispute: 25 },
    sources: ['Daftar cacat masa pemeliharaan (demo)', 'Berita acara progres 100% (demo)'],
    calculatedAt: riskModel.calculatedAt,
  },
};