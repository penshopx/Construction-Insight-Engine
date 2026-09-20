import { useState } from 'react';
import { PageHeader, Shell } from '@/components/layout';
import { ShieldAlert, TriangleAlert, Activity, FileWarning, ArrowRight, CheckCircle2, ChevronRight, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

export default function Dashboard() {
  return (
    <Shell>
      <PageHeader 
        eyebrow="Executive Command Center" 
        title="Ringkasan Paparan Risiko" 
        description="Pantau paparan finansial, sinyal peringatan dini (early warning), dan tenggat hukum yang membutuhkan tindakan segera."
        action={
          <div className="text-right">
            <p className="font-mono text-[10px] text-slate-500 mb-1">Total Exposure (Estimasi)</p>
            <p className="font-mono text-2xl font-bold text-red-400">Rp 127.400.000.000</p>
          </div>
        }
      />

      {/* Action Surface */}
      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="fade-up delay-1 relative overflow-hidden rounded-lg border border-red-900/50 bg-red-950/20 p-5">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded bg-red-500/20 p-2 text-red-400"><TriangleAlert size={18} /></div>
            <div>
              <p className="font-mono text-[10px] uppercase font-bold text-red-400 mb-1">URGENT ACTION REQUIRED</p>
              <h3 className="text-sm font-bold text-slate-200 mb-1">Notice of Delay - Tower A</h3>
              <p className="text-xs text-slate-400 mb-3">Tenggat pengajuan Notice of Delay tersisa 2 hari. Klaim EOT terancam hangus.</p>
              <Link href="/tenggat" className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300">
                Draft Notice <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        <div className="fade-up delay-2 relative overflow-hidden rounded-lg border border-amber-900/50 bg-amber-950/20 p-5">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded bg-amber-500/20 p-2 text-amber-400"><FileWarning size={18} /></div>
            <div>
              <p className="font-mono text-[10px] uppercase font-bold text-amber-400 mb-1">PENDING APPROVAL</p>
              <h3 className="text-sm font-bold text-slate-200 mb-1">7 Variation Orders Tertahan</h3>
              <p className="text-xs text-slate-400 mb-3">VO senilai Rp 4,2 miliar di Tower A belum disetujui Owner selama lebih dari 45 hari.</p>
              <Link href="/kasus" className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300">
                Eskalasi Somasi <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        <div className="fade-up delay-3 relative overflow-hidden rounded-lg border border-primary/30 bg-primary/5 p-5">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded bg-primary/20 p-2 text-primary"><ShieldAlert size={18} /></div>
            <div>
              <p className="font-mono text-[10px] uppercase font-bold text-primary mb-1">DEFENSE PREPARATION</p>
              <h3 className="text-sm font-bold text-slate-200 mb-1">Konsolidasi Bukti NCR</h3>
              <p className="text-xs text-slate-400 mb-3">3 Non-Conformance Report struktur di Housing BSD berpotensi sengketa.</p>
              <Link href="/bukti" className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80">
                Buka Vault <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {/* High-Risk Projects */}
        <section className="fade-up delay-4 rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-200">Portfolio Risk Tracker</h2>
              <p className="mt-1 text-xs text-slate-500">Prediksi sengketa berbasis AI & deviasi jadwal</p>
            </div>
            <Activity size={18} className="text-slate-500" />
          </div>
          
          <div className="space-y-1">
            {[
              { name: 'Tower A Jakarta', risk: 82, trend: 'naik', issue: 'VO Rp4.2M belum disetujui', status: 'critical' },
              { name: 'Bridge Kalimantan', risk: 91, trend: 'naik', issue: 'Somasi 3 dari Owner', status: 'critical' },
              { name: 'Toll Road Semarang', risk: 58, trend: 'stabil', issue: 'Delay 12%, EOT pending', status: 'warning' },
              { name: 'Housing BSD', risk: 45, trend: 'naik', issue: '3 NCR struktur open', status: 'warning' },
            ].map((p, i) => (
              <Link href="/proyek" key={i} className="flex items-center justify-between rounded p-3 hover:bg-white/5 border border-transparent hover:border-border transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "grid h-8 w-8 place-items-center rounded bg-background border",
                    p.status === 'critical' ? 'border-red-900 text-red-500' : 'border-amber-900 text-amber-500'
                  )}>
                    <span className="font-mono text-[10px] font-bold">{p.risk}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300 group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.issue}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600" />
              </Link>
            ))}
          </div>
        </section>

        {/* Audit Trail & Evidence Log */}
        <section className="fade-up delay-4 rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-200">Chain of Custody</h2>
              <p className="mt-1 text-xs text-slate-500">Log aktivitas & pengamanan bukti terakhir</p>
            </div>
            <CheckCircle2 size={18} className="text-slate-500" />
          </div>
          
          <div className="space-y-4 pt-1">
            {[
              { time: '10:42', user: 'Raka A.', action: 'Anchored 12 items to Vault', target: 'EOT-002 Claim', id: '0x7f3a...b9' },
              { time: 'Kemarin', user: 'System', action: 'Auto-generated Warning', target: 'Retention DLP - Mall SBY', id: 'SYS-882' },
              { time: '17 Jun', user: 'Nadia S.', action: 'Uploaded Lab Results', target: 'NCR-04 BSD', id: 'SHA-256 Verified' },
              { time: '15 Jun', user: 'Raka A.', action: 'Sent Notice of Delay', target: 'Tower A - Psl 8.4', id: 'Ack: Owner' },
            ].map((log, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-4 ring-primary/20 shrink-0" />
                <div>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">{log.user}</span> <span className="text-slate-400">{log.action}</span> <span className="text-primary">{log.target}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-500">
                    <span>{log.time}</span>
                    <span>•</span>
                    <span className="rounded bg-white/5 px-1">{log.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/bukti" className="mt-6 block w-full rounded border border-border bg-background py-2 text-center text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors">
            Lihat Semua Log
          </Link>
        </section>
      </div>
    </Shell>
  );
}
