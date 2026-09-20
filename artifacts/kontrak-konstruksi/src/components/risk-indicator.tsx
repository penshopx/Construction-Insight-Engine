import { Clock3, Database, LockKeyhole } from 'lucide-react';
import { canDisplayOperationalScore, calculateIllustrativeScore, projectRiskSnapshots, riskModel } from '@/lib/risk-model';

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
      {!compact && (
        <div className="mt-2 space-y-1 text-[10px] leading-relaxed text-slate-500">
          <p className="flex items-start gap-1.5"><Database size={11} className="mt-0.5 shrink-0" />{snapshot.sources.join(' · ')}</p>
          <p className="flex items-center gap-1.5"><Clock3 size={11} />Dihitung {formatTime(snapshot.calculatedAt)} · {riskModel.version}</p>
        </div>
      )}
    </div>
  );
}

export function RiskValidationNotice() {
  return (
    <section data-testid="status-risk-model-validation" className="rounded-lg border border-amber-500/25 bg-amber-950/20 p-4">
      <div className="flex items-start gap-3">
        <LockKeyhole className="mt-0.5 shrink-0 text-amber-400" size={18} />
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">Validasi model tertunda</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">Skor operasional tidak ditampilkan sampai kasus representatif selesai diuji dan reviewer kontrak serta risiko konstruksi yang kompeten mencatat persetujuan.</p>
          <p className="mt-2 text-[10px] text-slate-500">Metodologi draft: administrasi kontrak 30%, jadwal & notice 25%, mutu & NCR 25%, klaim & sengketa 20%. Batas kategori draft: 0–39 rendah, 40–69 perlu tinjauan, 70–100 prioritas tinggi.</p>
        </div>
      </div>
    </section>
  );
}