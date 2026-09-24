import { Clock3, Database, LockKeyhole } from 'lucide-react';
import { canDisplayOperationalScore, calculateIllustrativeScore, getRiskValidation, projectRiskSnapshots, riskModel, riskReviewHistory } from '@/lib/risk-model';

const formatTime = (value: string) => new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
}).format(new Date(value));

export function RiskIndicator({ projectId, compact = false }: { projectId: string; compact?: boolean }) {
  const snapshot = projectRiskSnapshots[projectId];
  const operational = canDisplayOperationalScore();
  const illustrativeScore = calculateIllustrativeScore(snapshot.inputs);

  return (
    <div data-testid={`risk-indicator-${projectId}`} className={compact ? '' : 'min-w-[270px]'}>
      <div className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-900/70 px-2 py-1 font-mono text-[10px] font-bold text-slate-300">
        <LockKeyhole size={11} />
        {operational ? `Skor ${illustrativeScore}` : 'Skor operasional dikunci'}
      </div>
      <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-slate-500">
        <p className="flex items-start gap-1.5"><Database size={11} className="mt-0.5 shrink-0" />{snapshot.sources.join(' · ')}</p>
        <p className="flex items-center gap-1.5"><Clock3 size={11} />Dihitung {formatTime(snapshot.calculatedAt)} · {riskModel.version}</p>
      </div>
    </div>
  );
}

export function RiskValidationNotice() {
  const validation = getRiskValidation();
  const operational = canDisplayOperationalScore();
  return (
    <section data-testid="status-risk-model-validation" className="rounded-lg border border-amber-500/25 bg-amber-950/20 p-4">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 shrink-0 text-amber-400" size={18} />
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">{operational ? 'Model risiko disetujui' : 'Validasi model tertunda'}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">{operational
            ? 'Versi aktif telah mendapat persetujuan reviewer untuk metodologi yang sama.'
            : 'Skor operasional tidak ditampilkan sampai kasus representatif selesai diuji dan reviewer kontrak serta risiko konstruksi yang kompeten mencatat persetujuan untuk metodologi aktif.'}</p>
          <p className="mt-2 text-[11px] text-slate-300">Versi dipakai: {riskModel.version} · {validation.methodologyChanged ? 'Metodologi berubah; review baru diperlukan' : validation.currentDecision === 'approved' ? 'Disetujui' : 'Menunggu review'}</p>
          <p className="text-[11px] text-slate-300">Versi terakhir disetujui: {validation.latestApproved?.version ?? 'Belum ada'}{validation.latestApproved ? ` (${formatTime(validation.latestApproved.recordedAt)})` : ''}</p>
          <p className="mt-2 text-[10px] text-slate-500">Metodologi aktif: {riskModel.factors.map((factor) => `${factor.label} ${factor.weight}%`).join(', ')}. Batas kategori: {riskModel.thresholds.map((threshold) => `${threshold.min}–${threshold.max} ${threshold.label.toLowerCase()}`).join(', ')}.</p>
          <details className="mt-2 text-[10px] text-slate-400">
            <summary className="cursor-pointer">Riwayat perubahan dan keputusan review</summary>
            <ol className="mt-2 space-y-1">
              {riskReviewHistory.map((entry, index) => (
                <li key={`${entry.version}-${index}`}>
                  {formatTime(entry.recordedAt)} · {entry.version} · {entry.decision === 'approved' ? 'Disetujui' : entry.decision === 'rejected' ? 'Ditolak' : 'Menunggu review'} · {entry.recordedBy}: {entry.note}
                  {entry.decision === 'approved' ? ` · Reviewer: ${entry.reviewer}; kompetensi: ${entry.verifiedCompetence}; independensi: ${entry.independence}; ruang lingkup: ${entry.scope}; batasan: ${entry.limitations}` : ''}
                </li>
              ))}
            </ol>
          </details>
        </div>
      </div>
    </section>
  );
}