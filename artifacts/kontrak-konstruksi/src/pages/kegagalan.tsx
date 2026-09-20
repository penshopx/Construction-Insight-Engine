import { useState } from 'react';
import { PageHeader, Shell } from '@/components/layout';
import { Building2, Search, AlertTriangle, Crosshair, Camera, FileText, UploadCloud, ChevronRight, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const failures = [
  { id: 'FLR-26-001', project: 'Housing BSD', type: 'Struktur Bawah', issue: 'Retak Geser Kolom Basement', severity: 'Tinggi', status: 'Investigasi Ahli', date: '12 Sep 2026', evidence: 14 },
  { id: 'FLR-26-002', project: 'Tower A Jakarta', type: 'Fasad', issue: 'Kebocoran Tirai Kaca (Curtain Wall)', severity: 'Sedang', status: 'Laporan Awal', date: '18 Sep 2026', evidence: 5 },
  { id: 'FLR-26-003', project: 'Mall Surabaya', type: 'Struktur Atas', issue: 'Lendutan Pelat Lantai > Toleransi', severity: 'Kritis', status: 'Analisis Lab', date: '05 Okt 2026', evidence: 22 },
];

export default function Kegagalan() {
  const [selected, setSelected] = useState(failures[0].id);
  const activeFailure = failures.find(f => f.id === selected);

  return (
    <Shell>
      <PageHeader 
        eyebrow="Pilar 2: Forensik Bangunan" 
        title="Kegagalan Bangunan & Konstruksi" 
        description="Ruang dokumentasi awal dan investigasi kegagalan konstruksi sesuai standar Permen PUPR No. 7/2019. Amankan bukti lapangan sebelum rusak."
        action={
          <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-900/50 rounded-lg p-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={24} />
            <div className="text-left">
              <p className="font-mono text-[9px] uppercase font-bold text-amber-500">Standar Keselamatan</p>
              <p className="text-xs text-amber-200/80">Utamakan K3. Evakuasi area sebelum forensik.</p>
            </div>
          </div>
        }
      />

      <div className="mb-6 flex items-start gap-3 rounded border border-primary/30 bg-primary/5 p-3">
        <Activity className="mt-0.5 shrink-0 text-primary" size={16} />
        <p className="text-xs leading-relaxed text-slate-300">
          <strong className="text-primary">MODE DEMONSTRASI:</strong> Data kegagalan bangunan ini adalah sampel untuk mengilustrasikan alur forensik digital. Pada produksi, data ini akan dikumpulkan langsung dari inspektur lapangan via mobile app.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              placeholder="Cari Laporan Insiden..." 
              className="w-full bg-background border border-border rounded-md py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[600px] scrollbar-thin pr-1">
            {failures.map((f, i) => (
              <button 
                key={f.id}
                onClick={() => setSelected(f.id)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all fade-up group",
                  `delay-${(i % 4) + 1}`,
                  selected === f.id 
                    ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                    : 'border-border bg-card hover:border-slate-600 hover:bg-white/5'
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "font-mono text-[9px] uppercase font-bold tracking-wider",
                    f.severity === 'Kritis' ? 'text-red-400' :
                    f.severity === 'Tinggi' ? 'text-amber-400' : 'text-primary'
                  )}>
                    {f.severity} Priority
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{f.id}</span>
                </div>
                <h4 className={cn("text-sm font-bold mb-1 leading-tight", selected === f.id ? "text-white" : "text-slate-200")}>{f.issue}</h4>
                <p className="text-xs text-slate-500 mb-3">{f.project} • {f.type}</p>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-mono text-slate-400">{f.date}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-border text-slate-300">
                    {f.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
          
          <button className="mt-2 w-full rounded border border-dashed border-border bg-transparent py-3 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors flex items-center justify-center gap-2">
            <Building2 size={16} /> Buat Laporan Insiden Baru
          </button>
        </div>

        {activeFailure && (
          <div className="rounded-lg border border-border bg-card flex flex-col h-full fade-up shadow-card">
            {/* Header */}
            <div className="border-b border-border p-6 bg-background/50">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white mb-2">{activeFailure.issue}</h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-slate-300 font-medium">{activeFailure.project}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{activeFailure.type}</span>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded border font-mono text-[10px] uppercase font-bold tracking-widest",
                  activeFailure.severity === 'Kritis' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  activeFailure.severity === 'Tinggi' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-primary/10 text-primary border-primary/20'
                )}>
                  Exposure: {activeFailure.severity}
                </span>
              </div>
              
              {/* Tab Navigation (Visual only for demo) */}
              <div className="flex gap-6 border-b border-border/50">
                <button className="pb-3 text-sm font-bold text-primary border-b-2 border-primary">Dokumentasi Awal</button>
                <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-300">Analisis Akar Masalah</button>
                <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-300">Dampak & Liabilitas</button>
                <button className="pb-3 text-sm font-bold text-slate-500 hover:text-slate-300">Opini Ahli</button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid gap-6 md:grid-cols-2 mb-8">
                {/* Visual Evidence Summary */}
                <div className="border border-border rounded-lg p-4 bg-background">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                      <Camera size={16} className="text-primary" /> Visual Lapangan
                    </h3>
                    <span className="text-xs text-slate-500 font-mono">{activeFailure.evidence} Foto/Video</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-video bg-white/5 rounded border border-border/50 flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <span className="text-xs font-bold">Lihat Metadata</span>
                      </div>
                      <Crosshair size={24} className="text-slate-600" />
                    </div>
                    <div className="aspect-video bg-white/5 rounded border border-border/50 flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <span className="text-xs font-bold">Lihat Metadata</span>
                      </div>
                      <Crosshair size={24} className="text-slate-600" />
                    </div>
                  </div>
                  <button className="w-full mt-3 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-border py-2 rounded text-xs font-bold text-slate-300 transition-colors">
                    <UploadCloud size={14} /> Tambah Bukti Visual
                  </button>
                </div>

                {/* IDR Form Fields (Readonly Demo) */}
                <div className="border border-border rounded-lg p-4 bg-background">
                  <h3 className="font-bold text-sm text-slate-200 mb-4 flex items-center gap-2">
                    <FileText size={16} className="text-primary" /> Initial Damage Report
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Gejala (Symptoms)</p>
                      <p className="text-sm text-slate-300">Retak diagonal pada kolom struktur K-14 (Grid C-4) dengan lebar rata-rata 2.4mm. Ditemukan spalling pada area joint kolom-balok.</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Dugaan Awal</p>
                      <p className="text-sm text-slate-300">Kegagalan geser akibat mutu beton tidak mencapai rencana (fc' terindikasi rendah) atau defisiensi penulangan geser.</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Tindakan Sementara</p>
                      <p className="text-sm text-slate-300">Pemasangan shoring/perancah baja sementara pada grid C-4, C-5. Area ditutup dari pekerja.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="border border-border rounded-lg p-5 bg-card shadow-inner">
                <h3 className="font-bold text-sm text-slate-200 mb-4">Langkah Investigasi Lanjutan (Rekomendasi)</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded border border-border bg-background hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-primary/20 text-primary flex items-center justify-center font-mono text-xs font-bold">1</div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">Non-Destructive Testing (NDT)</p>
                        <p className="text-xs text-slate-500">Uji UPV (Ultrasonic Pulse Velocity) & Hammer Test</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-primary" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded border border-border bg-background hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-white/5 text-slate-400 flex items-center justify-center font-mono text-xs font-bold">2</div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors">Penunjukan Penilai Ahli Forensik</p>
                        <p className="text-xs text-slate-500">Eskalasi untuk analisis liabilitas dan perbaikan</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-primary" />
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
