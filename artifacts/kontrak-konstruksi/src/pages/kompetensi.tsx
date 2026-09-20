import { useState } from 'react';
import { PageHeader, Shell } from '@/components/layout';
import { CheckSquare, ShieldCheck, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const competencyGroups = [
  { id: 'A', title: 'Dokumen Kontrak', progress: 78 },
  { id: 'B', title: 'Pelaksanaan', progress: 64 },
  { id: 'C', title: 'Klaim', progress: 46 },
  { id: 'D', title: 'Risiko', progress: 58 },
];

export default function Kompetensi() {
  const [active, setActive] = useState('A');
  
  return (
    <Shell>
      <PageHeader 
        eyebrow="Standar Kualifikasi" 
        title="SKKNI 88-2015" 
        description="Orientasi Ahli Kontrak Kerja Konstruksi. Modul pendukung untuk standardisasi kompetensi tim manajemen kontrak Anda."
      />

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="fade-up flex flex-col gap-3">
          <div className="rounded-lg border border-border bg-card p-5 mb-2 shadow-card text-center">
            <GraduationCap size={32} className="text-primary mx-auto mb-3 opacity-50" />
            <p className="font-mono text-[10px] uppercase text-slate-500 mb-1">Rata-rata Tim</p>
            <p className="font-display text-4xl font-bold text-slate-200">62<span className="text-primary text-xl">%</span></p>
          </div>
          
          <div className="space-y-2">
            {competencyGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setActive(group.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                  active === group.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-slate-600"
                )}
              >
                <span className="font-bold text-sm text-slate-200">{group.title}</span>
                <span className="font-mono text-[10px] text-slate-500">{group.progress}%</span>
              </button>
            ))}
          </div>
        </div>

        <div className="fade-up delay-1 rounded-lg border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
            <span className="grid h-10 w-10 place-items-center rounded bg-primary/20 border border-primary/30 text-primary font-display font-bold text-lg">
              {active}
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-slate-200">
                {competencyGroups.find(g => g.id === active)?.title}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-1">Unit Kompetensi Inti</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              'Mengidentifikasi dokumen kontrak dan hierarki hukum',
              'Memelihara register korespondensi yang dapat diterima di pengadilan',
              'Menganalisis dampak klausul ambigu terhadap risiko biaya',
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded border border-border bg-background">
                <CheckSquare size={16} className="text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-slate-300">{item}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded p-4 flex gap-3 items-start">
            <ShieldCheck size={16} className="text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              SKKNI (Standar Kompetensi Kerja Nasional Indonesia) digunakan sebagai dasar pengembangan SDM. KontrakGuard membantu memenuhi kompetensi ini dengan menyediakan tool yang memandu pengguna menerapkan praktik administrasi kontrak yang standar.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}
