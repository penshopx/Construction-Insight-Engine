import { useState } from 'react';
import { PageHeader, Shell } from '@/components/layout';
import { GitPullRequest, ArrowRight, CheckCircle2, Search, Users, Scale, FileText, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

const cases = [
  { id: 'VO-042', type: 'Variation Order', project: 'Tower A', title: 'Perubahan Spesifikasi Fasad', value: 'Rp 4.200.000.000', stage: 3, status: 'Mediasi', assignedExpert: 'Prof. Bambang S.' },
  { id: 'EOT-003', type: 'Extension of Time', project: 'Toll Road', title: 'Delay Pembebasan Lahan', value: '+45 Hari', stage: 2, status: 'Review Konsultan MK', assignedExpert: null },
  { id: 'NCR-008', type: 'Kegagalan Konstruksi', project: 'Housing BSD', title: 'Retak Rambut Dinding Basement', value: 'TBD', stage: 1, status: 'Investigasi Bukti', assignedExpert: 'Ir. Siti Rahayu' },
  { id: 'CLM-012', type: 'Cost Claim', project: 'Bridge Kal', title: 'Klaim Idle Equipment', value: 'Rp 850.000.000', stage: 4, status: 'Negosiasi', assignedExpert: null },
];

export default function Kasus() {
  const [selected, setSelected] = useState(cases[0].id);
  const activeCase = cases.find(c => c.id === selected);

  return (
    <Shell>
      <PageHeader 
        eyebrow="Manajemen Kasus & Resolusi" 
        title="Joint Case Room" 
        description="Ruang kerja bersama untuk tim proyek dan penilai ahli independen. Susun argumen hukum, kumpulkan bukti forensik, dan tempuh jalur penyelesaian sengketa konstruktif."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              placeholder="Cari Kasus atau Proyek..." 
              className="w-full bg-background border border-border rounded-md py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[650px] scrollbar-thin pr-1">
            {cases.map((c, i) => (
              <button 
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all fade-up group",
                  `delay-${(i % 4) + 1}`,
                  selected === c.id 
                    ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(0,180,255,0.05)]' 
                    : 'border-border bg-card hover:border-slate-600 hover:bg-white/5'
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "font-mono text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded",
                    selected === c.id ? "bg-primary/20 text-primary" : "bg-white/5 text-slate-400 group-hover:text-slate-300"
                  )}>
                    {c.type}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{c.id}</span>
                </div>
                <h4 className={cn("text-sm font-bold mb-1 leading-tight", selected === c.id ? "text-white" : "text-slate-200")}>{c.title}</h4>
                <p className="text-xs text-slate-500 mb-3">{c.project}</p>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-mono font-bold text-slate-300">{c.value}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold",
                    c.status === 'Mediasi' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    c.status === 'Investigasi Bukti' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-white/5 text-slate-400 border border-border"
                  )}>{c.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeCase && (
          <div className="rounded-lg border border-border bg-card flex flex-col h-full fade-up overflow-hidden shadow-card">
            {/* Header Area */}
            <div className="border-b border-border p-6 bg-background/50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase font-bold text-primary tracking-wider">{activeCase.type}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{activeCase.project}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-[10px] text-slate-500">{activeCase.id}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white mb-2">{activeCase.title}</h2>
                  <p className="text-slate-300 font-mono text-lg">{activeCase.value}</p>
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2 rounded bg-background border border-border px-3 py-1.5">
                    <Scale size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-300 font-medium">Jalur: <span className="text-primary font-bold">Konstruktif</span></span>
                  </div>
                  {activeCase.assignedExpert && (
                    <div className="flex items-center gap-2 rounded bg-emerald-950/20 border border-emerald-900/30 px-3 py-1.5">
                      <Users size={14} className="text-emerald-500" />
                      <span className="text-xs text-slate-300">Ahli: <span className="text-emerald-400 font-bold">{activeCase.assignedExpert}</span></span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {/* Joint Workspace Action Bar */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <button className="flex items-center gap-2 bg-primary text-primary-foreground border border-primary px-3 py-2 rounded text-xs font-bold hover:bg-primary/90 transition-colors">
                  <FileText size={14} /> Sinkronisasi Bukti
                </button>
                <button className="flex items-center gap-2 bg-white/5 border border-border px-3 py-2 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                  <Users size={14} /> Undang Pihak Lawan
                </button>
                <button className="flex items-center gap-2 bg-white/5 border border-border px-3 py-2 rounded text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
                  <GitPullRequest size={14} /> Riwayat Dokumen
                </button>
              </div>

              {/* Collaborative Workflow Pipeline */}
              <div>
                <h3 className="font-display font-bold text-sm text-slate-200 mb-5 flex items-center gap-2">
                  <Scale size={16} className="text-primary" /> Alur Resolusi (Dispute Resolution Ladder)
                </h3>
                
                <div className="relative pl-6">
                  {/* Vertical Line */}
                  <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-border z-0"></div>
                  
                  <div className="space-y-6 relative z-10">
                    {[
                      { 
                        title: 'Notice & Dokumentasi Awal', 
                        desc: 'Pengajuan dokumen klaim dan pengumpulan bukti awal di Evidence Vault.', 
                        status: 'done',
                        date: '10 Sep 2026',
                        actor: 'Kontraktor'
                      },
                      { 
                        title: 'Analisis Teknis & Negosiasi Bipartit', 
                        desc: 'Pemeriksaan lapangan dan perundingan langsung antar pihak.', 
                        status: 'done',
                        date: '12-25 Sep 2026',
                        actor: 'Tim Proyek'
                      },
                      { 
                        title: 'Penunjukan Penilai Ahli (Mediasi)', 
                        desc: 'Eskalasi ke pihak independen untuk memberikan opini teknis objektif.', 
                        status: 'current',
                        date: 'Sedang berjalan',
                        actor: 'Prof. Bambang S.'
                      },
                      { 
                        title: 'Kesepakatan / Amandemen Kontrak', 
                        desc: 'Penyusunan draft persetujuan final berdasarkan hasil mediasi.', 
                        status: 'pending',
                        date: 'Menunggu',
                        actor: 'Semua Pihak'
                      }
                    ].map((stage, i) => (
                      <div key={i} className="flex gap-4">
                        <div className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 bg-card -ml-[11px] mt-0.5",
                          stage.status === 'done' ? "border-primary text-primary" : 
                          stage.status === 'current' ? "border-amber-400 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)] bg-amber-400/10" : 
                          "border-border text-slate-600"
                        )}>
                          {stage.status === 'done' ? <CheckCircle2 size={12} strokeWidth={3} /> : 
                           stage.status === 'current' ? <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div> : 
                           <span className="font-mono text-[9px]">{i+1}</span>}
                        </div>
                        
                        <div className={cn(
                          "flex-1 border rounded-lg p-4 transition-colors",
                          stage.status === 'current' ? "border-amber-900/50 bg-amber-950/10" :
                          stage.status === 'done' ? "border-border bg-background/50 opacity-80" :
                          "border-dashed border-border bg-transparent opacity-50"
                        )}>
                          <div className="flex justify-between items-start mb-1.5">
                            <h4 className={cn(
                              "text-sm font-bold",
                              stage.status === 'current' ? "text-amber-400" :
                              stage.status === 'done' ? "text-slate-200" :
                              "text-slate-500"
                            )}>{stage.title}</h4>
                            <span className="font-mono text-[9px] text-slate-500">{stage.date}</span>
                          </div>
                          <p className="text-xs text-slate-400 mb-3">{stage.desc}</p>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-mono text-slate-500 border border-border">PIC: {stage.actor}</span>
                          </div>

                          {/* Current Stage Action Context */}
                          {stage.status === 'current' && (
                            <div className="mt-4 pt-4 border-t border-amber-900/30">
                              <h5 className="text-xs font-bold text-slate-200 mb-2">Tindakan Diperlukan:</h5>
                              <div className="bg-background rounded border border-border p-3 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded"><Upload size={14} /></div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-300">Upload As-Built Drawing (Draft)</p>
                                    <p className="text-[10px] text-slate-500">Diminta oleh Mediator untuk analisis EOT.</p>
                                  </div>
                                </div>
                                <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 rounded border border-border transition-colors">
                                  Unggah
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
