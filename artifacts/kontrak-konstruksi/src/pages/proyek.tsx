import { PageHeader, Shell } from '@/components/layout';
import { BarChart3, AlertCircle, Shield, FileText, ChevronRight, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskIndicator, RiskValidationNotice } from '@/components/risk-indicator';

const projects = [
  { 
    id: 'PRJ-01', 
    name: 'Tower A Jakarta', 
    owner: 'PT Mega Properti',
    contractValue: 'Rp 80.000.000.000', 
    progress: 42, 
    topIssue: 'Sengketa Fasad & EOT',
  },
  { 
    id: 'PRJ-02', 
    name: 'Bridge Kalimantan', 
    owner: 'Kementerian PUPR',
    contractValue: 'Rp 145.000.000.000', 
    progress: 68, 
    topIssue: 'Somasi 3 (Keterlambatan)',
  },
  { 
    id: 'PRJ-03', 
    name: 'Toll Road Semarang', 
    owner: 'PT Jasa Marga',
    contractValue: 'Rp 320.000.000.000', 
    progress: 15, 
    topIssue: 'Pending EOT (Lahan)',
  },
  { 
    id: 'PRJ-04', 
    name: 'Housing BSD', 
    owner: 'PT Sinarmas Land',
    contractValue: 'Rp 45.000.000.000', 
    progress: 88, 
    topIssue: '3 Laporan Kegagalan',
  },
  { 
    id: 'PRJ-05', 
    name: 'Mall Surabaya', 
    owner: 'PT Pakuwon',
    contractValue: 'Rp 210.000.000.000', 
    progress: 100, 
    topIssue: 'Masa Pemeliharaan (DLP)',
  }
];

export default function Proyek() {
  return (
    <Shell>
      <PageHeader 
        eyebrow="Pilar 1: Hukum & Kontrak" 
        title="Portfolio Proyek" 
        description="Contoh pemantauan nilai kontrak, progres, dan indikator prioritas internal. Seluruh angka di halaman ini adalah data ilustratif."
      />
      <div className="mb-6"><RiskValidationNotice /></div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { label: 'Total Nilai (Demo)', value: 'Rp 800 M+', icon: BarChart3, color: 'text-primary', border: 'border-primary/20' },
          { label: 'Indikator Eksposur (Demo)', value: 'Rp 127,4 M', icon: AlertCircle, color: 'text-red-400', border: 'border-red-900/30' },
          { label: 'Prioritas Tinjauan (Demo)', value: '2 Tinggi', icon: Shield, color: 'text-amber-400', border: 'border-amber-900/30' },
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
                <th className="px-5 py-4 font-bold">Indikator Demo</th>
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
                    <RiskIndicator projectId={p.id} />
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
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
        Model draft hanya mendukung pengujian internal. Nilai numerik tidak ditampilkan sebelum validasi ahli tersedia dan bukan probabilitas sengketa, estimasi kerugian, atau penilaian hukum.
      </p>
    </Shell>
  );
}
