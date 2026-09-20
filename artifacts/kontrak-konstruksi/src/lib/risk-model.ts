export const riskModel = {
  version: 'KG-RISK-0.1-DRAFT',
  validationStatus: 'pending_expert_review' as const,
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

export function canDisplayOperationalScore() {
  return riskModel.validationStatus === ('approved' as string);
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