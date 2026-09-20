import { useState } from 'react';
import { PageHeader, Shell } from '@/components/layout';
import { GitPullRequest, ArrowRight, CheckCircle2, ChevronDown, Clock, Search } from 'lucide-react';

const cases = [
  { id: 'VO-042', type: 'Variation Order', project: 'Tower A', title: 'Perubahan Spesifikasi Fasad', value: 'Rp 4.200.000.000', stage: 2, status: 'Tertahan di Owner' },
  { id: 'EOT-003', type: 'Extension of Time', project: 'Toll Road', title: 'Delay Pembebasan Lahan', value: '+45 Hari', stage: 3, status: 'Review Konsultan MK' },
  { id: 'NCR-008', type: 'Defect / NCR', project: 'Housing BSD', title: 'Retak Rambut Dinding Basement', value: 'N/A', stage: 1, status: 'Investigasi Bukti' },
  { id: 'CLM-012', type: 'Cost Claim', project: 'Bridge Kal', title: 'Klaim Idle Equipment', value: 'Rp 850.000.000', stage: 4, status: 'Negosiasi' },
];

export default function Kasus() {
  const [selected, setSelected] = useState(cases[0].id);
  const activeCase = cases.find(c => c.id === selected);

  return (
    <Shell>
      <PageHeader 
        eyebrow="Workflow Kasus" 
        title="Manajemen VO, EOT & Klaim" 
        description="Kawal proses persetujuan dan pertahankan hak kontraktual Anda. Jangan kerjakan instruksi lapangan tanpa persetujuan VO tertulis."
      />

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              placeholder="Cari Kasus..." 
              className="w-full bg-card border border-border rounded-md py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[600px] scrollbar-thin pr-2">
            {cases.map((c, i) => (
              <button 
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all fade-up delay-${i+1} ${
                  selected === c.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-slate-600'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-[9px] uppercase text-primary">{c.type}</span>
                  <span className="font-mono text-[9px] text-slate-500">{c.id}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-1 leading-tight">{c.title}</h4>
                <p className="text-xs text-slate-500 mb-3">{c.project}</p>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="font-bold text-slate-300">{c.value}</span>
                  <span className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">{c.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {activeCase && (
          <div className="rounded-lg border border-border bg-card p-6 flex flex-col h-full fade-up">
            <div className="mb-6 border-b border-border pb-6 flex justify-between items-start">
              <div>
                <span className="font-mono text-[10px] uppercase text-slate-500 mb-2 block">{activeCase.type} • {activeCase.project} • {activeCase.id}</span>
                <h2 className="font-display text-2xl font-bold text-white mb-2">{activeCase.title}</h2>
                <p className="text-primary font-mono text-lg font-bold">{activeCase.value}</p>
              </div>
              <button className="flex items-center gap-2 bg-white/5 border border-border px-3 py-2 rounded text-xs font-bold text-slate-300 hover:text-white transition-colors">
                <GitPullRequest size={14} /> Lihat Berkas
              </button>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-sm text-slate-300 mb-4">Stage Persetujuan (Workflow)</h3>
              <div className="relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-border z-0"></div>
                <div className="space-y-6 relative z-10">
                  {[
                    { title: 'Notice of Variation', desc: 'Diajukan 10 Sep 2026', done: true },
                    { title: 'Verifikasi Lapangan & Foto Bukti', desc: 'Disetujui MK 12 Sep 2026', done: true },
                    { title: 'Submit Proposal Harga & Waktu', desc: 'Sedang direview Owner (Tertahan 45 hari)', done: false, current: true },
                    { title: 'Negosiasi Final', desc: 'Menunggu', done: false },
                    { title: 'Approval & Amendemen', desc: 'Menunggu', done: false }
                  ].map((stage, i) => (
                    <div key={i} className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-card shrink-0 ${
                        stage.done ? 'border-emerald-500 text-emerald-500' : 
                        stage.current ? 'border-primary text-primary shadow-[0_0_10px_rgba(0,180,255,0.3)]' : 'border-border text-slate-600'
                      }`}>
                        {stage.done ? <CheckCircle2 size={16} /> : <span className="font-mono text-[10px]">{i+1}</span>}
                      </div>
                      <div className="pt-1.5">
                        <h4 className={`text-sm font-bold ${stage.current ? 'text-primary' : stage.done ? 'text-slate-300' : 'text-slate-500'}`}>{stage.title}</h4>
                        <p className={`text-xs mt-1 ${stage.current ? 'text-slate-400' : 'text-slate-600'}`}>{stage.desc}</p>
                        
                        {stage.current && (
                          <div className="mt-4 bg-primary/5 border border-primary/20 rounded p-4">
                            <h5 className="text-xs font-bold text-slate-200 mb-2">Rekomendasi Tindakan (AI):</h5>
                            <p className="text-xs text-slate-400 leading-relaxed mb-4">Waktu review Owner telah melebihi batas 14 hari sesuai Pasal 8.4. Hak Anda untuk menunda pekerjaan terkait fasad telah aktif. Segera terbitkan Surat Peringatan.</p>
                            <button className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-primary/90">
                              Generate Draft Somasi <ArrowRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
