import { useState } from 'react';
import { PageHeader, Shell } from '@/components/layout';
import { Calendar, AlertTriangle, Clock, Info, Check, Filter } from 'lucide-react';

type Deadline = {
  id: string;
  project: string;
  type: string;
  title: string;
  dueDate: string;
  daysLeft: number;
  status: 'pending' | 'action_needed' | 'resolved';
  clause: string;
};

const initialDeadlines: Deadline[] = [
  { id: 'DL-01', project: 'Tower A Jakarta', type: 'Notice of Delay', title: 'Submit Notice untuk Hujan Ekstrem', dueDate: '15 Okt 2026', daysLeft: 2, status: 'action_needed', clause: 'Pasal 8.4' },
  { id: 'DL-02', project: 'Bridge Kalimantan', type: 'Response', title: 'Tanggapan Somasi Owner', dueDate: '16 Okt 2026', daysLeft: 3, status: 'action_needed', clause: 'Pasal 15.2' },
  { id: 'DL-03', project: 'Toll Road Semarang', type: 'EOT Claim', title: 'Pengajuan Proposal EOT Detail', dueDate: '20 Okt 2026', daysLeft: 7, status: 'pending', clause: 'Pasal 20.1' },
  { id: 'DL-04', project: 'Housing BSD', type: 'Retention', title: 'Pencairan Retensi Termin 2', dueDate: '30 Okt 2026', daysLeft: 17, status: 'pending', clause: 'Pasal 14.9' },
  { id: 'DL-05', project: 'Mall Surabaya', type: 'DLP Event', title: 'Akhir Masa Pemeliharaan (DLP)', dueDate: '15 Nov 2026', daysLeft: 33, status: 'pending', clause: 'Pasal 11.1' },
  { id: 'DL-06', project: 'Tower A Jakarta', type: 'Guarantee', title: 'Perpanjangan Jaminan Pelaksanaan', dueDate: '10 Okt 2026', daysLeft: -3, status: 'resolved', clause: 'Pasal 4.2' },
];

export default function Tenggat() {
  const [filter, setFilter] = useState<'all' | 'action_needed' | 'resolved'>('all');
  const [deadlines, setDeadlines] = useState(initialDeadlines);

  const filtered = deadlines.filter(d => filter === 'all' ? true : d.status === filter);

  const resolveDeadline = (id: string) => {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, status: 'resolved' } : d));
  };

  return (
    <Shell>
      <PageHeader 
        eyebrow="Early Warning System" 
        title="Tenggat Hukum" 
        description="Monitor deadline kontraktual kritis. Kegagalan memenuhi tenggat dapat menggugurkan hak klaim atau memicu denda keterlambatan."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex bg-card border border-border rounded-md p-1">
          <button 
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded ${filter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Semua
          </button>
          <button 
            onClick={() => setFilter('action_needed')}
            className={`px-3 py-1.5 text-xs font-bold rounded ${filter === 'action_needed' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Perlu Tindakan
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 text-xs font-bold rounded ${filter === 'resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Selesai
          </button>
        </div>
        <button className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-400 bg-card border border-border px-3 py-2 rounded-md hover:text-slate-200">
          <Filter size={14} /> Filter Project
        </button>
      </div>

      <div className="grid gap-4">
        {filtered.map((d, i) => (
          <div key={d.id} className={`fade-up delay-${i % 4 + 1} flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border ${
            d.status === 'action_needed' ? 'border-red-900/50 bg-red-950/10' : 
            d.status === 'resolved' ? 'border-emerald-900/30 bg-emerald-950/10 opacity-70' :
            'border-border bg-card'
          } p-4 md:p-5`}
          >
            <div className="flex gap-4">
              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${
                d.status === 'action_needed' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                d.status === 'resolved' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
                'border-border bg-background text-primary'
              }`}>
                {d.status === 'resolved' ? <Check size={18} /> : d.daysLeft <= 3 ? <AlertTriangle size={18} /> : <Calendar size={18} />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    d.type === 'Notice of Delay' ? 'bg-red-500/20 text-red-300' :
                    d.type === 'EOT Claim' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-white/10 text-slate-300'
                  }`}>
                    {d.type}
                  </span>
                  <span className="text-xs text-slate-500">{d.project}</span>
                </div>
                <h3 className={`text-sm font-bold ${d.status === 'resolved' ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {d.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                  <Info size={12} /> Referensi Klausul: {d.clause}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-6 md:min-w-[280px]">
              <div className="text-left md:text-right">
                <p className="font-mono text-[10px] text-slate-500 uppercase">Jatuh Tempo</p>
                <p className={`font-mono font-bold ${
                  d.status === 'resolved' ? 'text-slate-500' :
                  d.daysLeft <= 3 ? 'text-red-400' : 'text-slate-200'
                }`}>
                  {d.dueDate}
                </p>
                {d.status !== 'resolved' && (
                  <p className={`text-[10px] mt-0.5 ${d.daysLeft <= 3 ? 'text-red-500 font-bold animate-pulse' : 'text-slate-400'}`}>
                    <Clock size={10} className="inline mr-1" />
                    Tersisa {d.daysLeft} hari
                  </p>
                )}
              </div>
              
              {d.status !== 'resolved' && (
                <button 
                  onClick={() => resolveDeadline(d.id)}
                  className="shrink-0 rounded bg-primary/20 text-primary border border-primary/30 px-3 py-2 text-xs font-bold hover:bg-primary/30 transition-colors"
                >
                  Mark Done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}
