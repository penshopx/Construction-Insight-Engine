import { useState } from 'react';
import { PageHeader, Shell } from '@/components/layout';
import { CheckSquare, ShieldCheck, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const competencyGroups = [
  { id: 'KON.K01', title: 'Administrasi Kontrak', progress: 78, desc: 'Pemahaman UU, PP, standar kontrak, dan manajemen klaim.' },
  { id: 'KON.K02', title: 'Investigasi Kegagalan', progress: 34, desc: 'Metode NDT, asesmen struktur, dan prosedur pelaporan.' },
  { id: 'KON.K03', title: 'Resolusi Sengketa', progress: 46, desc: 'Teknik mediasi, peran saksi ahli, dan arbitrase.' },
];

export default function Kompetensi() {
  const [active, setActive] = useState('KON.K01');
  const activeGroup = competencyGroups.find(g => g.id === active);
  
  return (
    <Shell>
      <PageHeader 
        eyebrow="Penunjang Keputusan" 
        title="Standar Kompetensi (SKKNI)" 
        description="Profil kompetensi tim berbasis SKKNI Bidang Konstruksi. Sistem akan menyesuaikan level rekomendasi keputusan berdasarkan kualifikasi pengguna."
      />

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-card p-6 shadow-card text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full pointer-events-none"></div>
            <GraduationCap size={28} className="text-primary mx-auto mb-3" />
            <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-1">Rata-rata Kualifikasi Tim</p>
            <p className="font-display text-4xl font-bold text-slate-200">52<span className="text-primary text-xl">%</span></p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider px-1">Unit Kompetensi Inti</h3>
            {competencyGroups.map((group, i) => (
              <button
                key={group.id}
                onClick={() => setActive(group.id)}
                className={cn(
                  "fade-up w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all group",
                  `delay-${(i % 3) + 1}`,
                  active === group.id 
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,180,255,0.05)]" 
                    : "border-border bg-card hover:border-slate-600"
                )}
              >
                <div>
                  <span className="font-mono text-[9px] text-slate-500 block mb-1 group-hover:text-slate-400">{group.id}</span>
                  <span className={cn("font-bold text-sm block", active === group.id ? "text-white" : "text-slate-300")}>{group.title}</span>
                </div>
                <span className={cn(
                  "font-mono text-[11px] font-bold px-2 py-1 rounded",
                  active === group.id ? "bg-primary/20 text-primary" : "bg-white/5 text-slate-400"
                )}>{group.progress}%</span>
              </button>
            ))}
          </div>
        </div>

        {activeGroup && (
          <div className="fade-up delay-2 rounded-lg border border-border bg-card p-6 shadow-card h-fit">
            <div className="flex items-center gap-4 border-b border-border pb-5 mb-6">
              <span className="grid h-12 w-12 place-items-center rounded bg-background border border-border text-primary font-mono text-sm font-bold shadow-inner">
                {activeGroup.id.split('.')[1]}
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-slate-200 mb-1">
                  {activeGroup.title}
                </h2>
                <p className="text-xs text-slate-400">{activeGroup.desc}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider">Elemen Kompetensi (Sampel)</h3>
              {[
                'Mengidentifikasi klausul ambigu dan risiko pada dokumen kontrak',
                'Menyusun kronologi fakta dan bukti forensik pendukung klaim',
                'Melakukan perhitungan kompensasi biaya dan waktu (Delay Analysis)',
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start p-4 rounded border border-border bg-background hover:bg-white/5 transition-colors">
                  <CheckSquare size={16} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-300">{item}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-8 bg-amber-950/20 border border-amber-900/30 rounded p-4 flex gap-3 items-start">
              <ShieldCheck size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="font-bold text-amber-400">Implementasi Aplikasi:</span> Modul KontrakGuard dirancang selaras dengan unit kompetensi ini. Fitur seperti Evidence Vault dan Joint Case Room adalah instrumen praktis untuk memenuhi standar kerja penanganan sengketa dan asesmen ahli.
              </p>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
