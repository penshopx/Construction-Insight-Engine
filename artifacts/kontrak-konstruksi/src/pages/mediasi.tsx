import { PageHeader, Shell } from '@/components/layout';
import { Users, Scale, FileText, CheckCircle2, ChevronRight, Download, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Mediasi() {
  return (
    <Shell>
      <PageHeader 
        eyebrow="Pilar 3: Ahli & Resolusi" 
        title="Ruang Mediasi Daring" 
        description="Workspace mediasi netral. Akses bukti yang disepakati, lacak pokok sengketa, dan kelola draf kesepakatan secara konstruktif bersama Penilai Ahli."
      />

      <div className="mb-6 flex items-start gap-3 rounded border border-primary/30 bg-primary/5 p-3">
        <Activity className="mt-0.5 shrink-0 text-primary" size={16} />
        <p className="text-xs leading-relaxed text-slate-300">
          <strong className="text-primary">MODE DEMONSTRASI:</strong> Tampilan ini mengilustrasikan ruang kerja mediasi. Data para pihak dan dokumen adalah sampel simulasi interaksi.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info & Status Column */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 shadow-card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-12 -mt-12"></div>
            <div className="flex items-center gap-2 mb-4">
              <Scale size={18} className="text-emerald-400" />
              <h3 className="font-display font-bold text-slate-200">Perkara #MED-2026-04</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="font-mono text-[9px] uppercase text-slate-500 tracking-wider mb-1">Status Saat Ini</p>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Sesi Aktif Berjalan
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                <div>
                  <p className="font-mono text-[9px] uppercase text-slate-500 tracking-wider mb-1">Pemohon</p>
                  <p className="text-sm font-bold text-slate-200">PT Kontraktor A</p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase text-slate-500 tracking-wider mb-1">Termohon</p>
                  <p className="text-sm font-bold text-slate-200">PT Pemilik XYZ</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="font-mono text-[9px] uppercase text-slate-500 tracking-wider mb-1">Mediator (Penilai Ahli)</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-200">Prof. Bambang Sutanto</p>
                  <span title="Pemeriksaan konflik kepentingan — data demonstrasi">
                    <ShieldCheck size={14} className="text-primary" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="font-display font-bold text-sm text-slate-200 mb-4">Agenda Sesi Mediasi</h3>
            <div className="space-y-3 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border"></div>
              
              <div className="relative flex gap-3 z-10">
                <div className="w-6 h-6 rounded-full bg-background border border-emerald-500 text-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={12} />
                </div>
                <div className="pt-0.5">
                  <p className="text-xs font-bold text-slate-300">Sesi 1: Paparan Awal</p>
                  <p className="font-mono text-[9px] text-slate-500">15 Sep 2026 • Selesai</p>
                </div>
              </div>
              
              <div className="relative flex gap-3 z-10">
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary text-primary flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,180,255,0.2)]">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                </div>
                <div className="pt-0.5">
                  <p className="text-xs font-bold text-primary">Sesi 2: Analisis Kuantum Klaim</p>
                  <p className="font-mono text-[9px] text-slate-500">Hari ini • Berlangsung</p>
                </div>
              </div>
              
              <div className="relative flex gap-3 z-10 opacity-50">
                <div className="w-6 h-6 rounded-full bg-background border border-border text-slate-500 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-mono">3</span>
                </div>
                <div className="pt-0.5">
                  <p className="text-xs font-bold text-slate-400">Sesi 3: Finalisasi Kesepakatan</p>
                  <p className="font-mono text-[9px] text-slate-500">22 Sep 2026 • Terjadwal</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agreed Issues Tracker */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="font-display font-bold text-lg text-white mb-1">Pokok Sengketa & Resolusi</h2>
            <p className="text-xs text-slate-400 mb-6">Tampilan demo status pembahasan; bukan persetujuan real-time atau penetapan hukum.</p>

            <div className="space-y-4">
              <div className="rounded border border-border bg-background p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">DISEPAKATI</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Isu #1</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">Tinjauan Awal Hak EOT (Belum Diverifikasi)</h4>
                <p className="text-xs text-slate-400 mb-4">Para pihak sepakat keterlambatan disebabkan oleh pembebasan lahan yang merupakan tanggung jawab Owner.</p>
                <div className="bg-emerald-950/20 rounded p-3 text-xs border border-emerald-900/30">
                  <span className="font-bold text-emerald-300">Resolusi: </span> 
                  <span className="text-emerald-200/80">EOT diberikan selama 45 hari kalender tanpa denda keterlambatan.</span>
                </div>
              </div>

              <div className="rounded border border-primary/30 bg-primary/5 p-4 shadow-[0_0_15px_rgba(0,180,255,0.03)]">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded border border-primary/30">DALAM NEGOSIASI</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">Isu #2</span>
                </div>
                <h4 className="text-sm font-bold text-slate-200 mb-1">Kompensasi Biaya Idle (Prolongation Cost)</h4>
                <p className="text-xs text-slate-400 mb-4">Kontraktor menuntut biaya sewa alat berat yang menganggur selama masa tunggu lahan. Owner menolak nilai kuantum.</p>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-background rounded p-2 border border-border">
                    <p className="font-mono text-[9px] text-slate-500 mb-1">Posisi Pemohon</p>
                    <p className="text-xs font-bold text-slate-300">Rp 850.000.000</p>
                  </div>
                  <div className="bg-background rounded p-2 border border-border">
                    <p className="font-mono text-[9px] text-slate-500 mb-1">Posisi Termohon</p>
                    <p className="text-xs font-bold text-slate-300">Rp 200.000.000</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-primary/20 pt-3">
                  <span className="text-xs text-slate-400 flex items-center gap-2">
                    <Users size={14} className="text-primary" /> Menunggu Opini Ahli mengenai nilai depresiasi wajar.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shared Evidence Access */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="font-display font-bold text-base text-slate-200 flex items-center gap-2">
                  <FileText size={16} className="text-primary" /> Daftar Dokumen Bersama (Demo)
                </h2>
                <p className="text-xs text-slate-500 mt-1">Dokumen yang disetujui untuk diakses mediator.</p>
              </div>
              <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Kelola Akses</button>
            </div>

            <div className="grid gap-2">
              {[
                { name: 'Kontrak Utama & Adendum 1', type: 'PDF', sender: 'Pemilik XYZ' },
                { name: 'Log Harian Cuaca (BMKG & Site)', type: 'XLSX', sender: 'Kontraktor A' },
                { name: 'Foto Drone Kondisi Lahan (Timestamped)', type: 'ZIP', sender: 'Kontraktor A' },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded border border-border bg-background hover:bg-white/5 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-800 rounded text-slate-400">
                      <FileText size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{doc.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">Oleh: {doc.sender} • Format {doc.type}</p>
                    </div>
                  </div>
                  <Download size={16} className="text-slate-600 group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
