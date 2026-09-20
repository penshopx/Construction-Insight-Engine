import { PageHeader, Shell } from '@/components/layout';
import { BarChart3, AlertCircle, Shield, FileText, CheckCircle, ChevronRight, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

const projects = [
  { 
    id: 'PRJ-01', 
    name: 'Tower A Jakarta', 
    owner: 'PT Mega Properti',
    contractValue: 'Rp 80.000.000.000', 
    progress: 42, 
    risk: 82, 
    topIssue: 'Sengketa Fasad & EOT',
    status: 'critical'
  },
  { 
    id: 'PRJ-02', 
    name: 'Bridge Kalimantan', 
    owner: 'Kementerian PUPR',
    contractValue: 'Rp 145.000.000.000', 
    progress: 68, 
    risk: 91, 
    topIssue: 'Somasi 3 (Keterlambatan)',
    status: 'critical'
  },
  { 
    id: 'PRJ-03', 
    name: 'Toll Road Semarang', 
    owner: 'PT Jasa Marga',
    contractValue: 'Rp 320.000.000.000', 
    progress: 15, 
    risk: 58, 
    topIssue: 'Pending EOT (Lahan)',
    status: 'warning'
  },
  { 
    id: 'PRJ-04', 
    name: 'Housing BSD', 
    owner: 'PT Sinarmas Land',
    contractValue: 'Rp 45.000.000.000', 
    progress: 88, 
    risk: 45, 
    topIssue: '3 Laporan Kegagalan',
    status: 'warning'
  },
  { 
    id: 'PRJ-05', 
    name: 'Mall Surabaya', 
    owner: 'PT Pakuwon',
    contractValue: 'Rp 210.000.000.000', 
    progress: 100, 
    risk: 23, 
    topIssue: 'Masa Pemeliharaan (DLP)',
    status: 'safe'
  }
];

export default function Proyek() {
  return (
    <Shell>
      <PageHeader 
        eyebrow="Pilar 1: Hukum & Kontrak" 
        title="Portfolio Proyek" 
        description="Pemantauan nilai kontrak, deviasi jadwal, dan paparan risiko sengketa komulatif di seluruh proyek."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { label: 'Total Value', value: 'Rp 800M+', icon: BarChart3, color: 'text-primary', border: 'border-primary/20' },
          { label: 'Total Exposure', value: 'Rp 127.4M', icon: AlertCircle, color: 'text-red-400', border: 'border-red-900/30' },
          { label: 'Proyek Berisiko', value: '2 Kritis', icon: Shield, color: 'text-amber-400', border: 'border-amber-900/30' },
          { label: 'Kontrak Aktif', value: '5', icon: FileText, color: 'text-slate-300', border: 'border-border' },
        ].map((stat, i) => (
          <div key={i} className={cn("fade-up rounded-lg border bg-card p-5 relative overflow-hidden", stat.border, `delay-${i+1}`)}>
            <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-bl-full"></div>
            <div className="flex justify-between items-start mb-3">
              <span className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider">{stat.label}</span>
              <stat.icon size={18} className={stat.color} />
            </div>
            <p className="font-mono text-2xl font-bold text-slate-200 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="fade-up delay-4 rounded-lg border border-border bg-card overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background/80 border-b border-border text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-4 font-bold">Identitas Proyek</th>
                <th className="px-5 py-4 font-bold">Nilai Kontrak</th>
                <th className="px-5 py-4 font-bold">Progres</th>
                <th className="px-5 py-4 font-bold">Risk Exposure</th>
                <th className="px-5 py-4 font-bold">Isu Utama</th>
                <th className="px-5 py-4 font-bold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-200 group-hover:text-white transition-colors">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] text-primary flex items-center gap-0.5"><Hash size={10} />{p.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-500">{p.owner}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-300 font-medium">{p.contractValue}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 bg-background border border-border rounded overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p.progress}%` }}></div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 w-8">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px] font-bold border",
                      p.status === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      p.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    )}>
                      {p.status === 'critical' ? <AlertCircle size={10} /> : p.status === 'warning' ? <Shield size={10} /> : <CheckCircle size={10} />}
                      Index {p.risk}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-slate-400 max-w-[200px] truncate">{p.topIssue}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-primary transition-colors inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
