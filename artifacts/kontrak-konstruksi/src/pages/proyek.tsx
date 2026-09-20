import { PageHeader, Shell } from '@/components/layout';
import { BarChart3, AlertCircle, Shield, FileText, CheckCircle } from 'lucide-react';

const projects = [
  { 
    id: 'PRJ-01', 
    name: 'Tower A Jakarta', 
    owner: 'PT Mega Properti',
    contractValue: 'Rp 80.000.000.000', 
    progress: 42, 
    risk: 82, 
    topIssue: 'VO Rp4.2M belum disetujui selama >45 hari',
    status: 'critical'
  },
  { 
    id: 'PRJ-02', 
    name: 'Bridge Kalimantan', 
    owner: 'Kementerian PUPR',
    contractValue: 'Rp 145.000.000.000', 
    progress: 68, 
    risk: 91, 
    topIssue: 'Somasi 3 dari Owner, termin 4 unpaid 60hr',
    status: 'critical'
  },
  { 
    id: 'PRJ-03', 
    name: 'Toll Road Semarang', 
    owner: 'PT Jasa Marga',
    contractValue: 'Rp 320.000.000.000', 
    progress: 15, 
    risk: 58, 
    topIssue: 'Delay 12% karena hujan, EOT pending',
    status: 'warning'
  },
  { 
    id: 'PRJ-04', 
    name: 'Housing BSD', 
    owner: 'PT Sinarmas Land',
    contractValue: 'Rp 45.000.000.000', 
    progress: 88, 
    risk: 45, 
    topIssue: '3 NCR struktur open, menahan BAST',
    status: 'warning'
  },
  { 
    id: 'PRJ-05', 
    name: 'Mall Surabaya', 
    owner: 'PT Pakuwon',
    contractValue: 'Rp 210.000.000.000', 
    progress: 100, 
    risk: 23, 
    topIssue: 'Masa DLP tersisa 4 bulan, pencairan retensi aman',
    status: 'safe'
  }
];

export default function Proyek() {
  return (
    <Shell>
      <PageHeader 
        eyebrow="Portfolio Proyek" 
        title="Contract & Risk Portfolio" 
        description="Monitor status kontrak, deviasi progres, dan kalkulasi risiko kegagalan/sengketa di seluruh proyek."
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          { label: 'Total Exposure', value: 'Rp 127.4M', icon: AlertCircle, color: 'text-red-400' },
          { label: 'High Risk Projects', value: '2', icon: Shield, color: 'text-amber-400' },
          { label: 'Total Value', value: 'Rp 800M+', icon: BarChart3, color: 'text-primary' },
          { label: 'Active Contracts', value: '5', icon: FileText, color: 'text-slate-300' },
        ].map((stat, i) => (
          <div key={i} className="fade-up rounded-lg border border-border bg-card p-4">
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-[10px] uppercase text-slate-500">{stat.label}</span>
              <stat.icon size={16} className={stat.color} />
            </div>
            <p className="font-mono text-xl font-bold text-slate-200">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="fade-up delay-2 rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background/50 text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="px-5 py-4">Proyek & Owner</th>
                <th className="px-5 py-4">Nilai Kontrak</th>
                <th className="px-5 py-4">Progres</th>
                <th className="px-5 py-4">Risk Score</th>
                <th className="px-5 py-4">Top Issue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors group cursor-pointer">
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-200 group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.id} • {p.owner}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-300">{p.contractValue}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-24 bg-background rounded overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${p.progress}%` }}></div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[10px] font-bold ${
                      p.status === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                      p.status === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {p.status === 'critical' ? <AlertCircle size={10} /> : p.status === 'warning' ? <Shield size={10} /> : <CheckCircle size={10} />}
                      {p.risk}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-slate-400 max-w-[250px] truncate">{p.topIssue}</p>
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
