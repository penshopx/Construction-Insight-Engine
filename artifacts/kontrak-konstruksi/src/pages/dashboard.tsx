import { PageHeader, Shell } from '@/components/layout';
import { 
  ShieldAlert, 
  TriangleAlert, 
  Activity, 
  FileWarning, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  Building2,
  Users,
  Scale,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

export default function Dashboard() {
  return (
    <Shell>
      <PageHeader 
        eyebrow="Command Center" 
        title="Ruang Kolaborasi Terintegrasi" 
        description="Pantau paparan finansial, sinyal awal kegagalan konstruksi, dan proses resolusi sengketa bersama tim teknis dan penilai ahli."
        action={
          <div className="text-right">
            <p className="font-mono text-[10px] text-slate-500 mb-1">Total Exposure (Estimasi)</p>
            <p className="font-mono text-2xl font-bold text-red-400 tracking-tight">Rp 127.400.000.000</p>
          </div>
        }
      />

      {/* 3 Pillars Overview */}
      <section className="mb-8 grid gap-4 lg:grid-cols-3">
        {/* Pillar 1: Hukum */}
        <div className="fade-up delay-1 flex flex-col rounded-lg border border-border bg-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded bg-primary/10 border border-primary/20 p-2 text-primary shadow-[0_0_10px_rgba(0,180,255,0.1)]">
              <Scale size={20} />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Pilar 1</p>
              <h2 className="font-bold text-slate-200">Hukum & Kontrak</h2>
            </div>
          </div>
          <div className="space-y-3 mb-6 flex-1">
            <div className="flex justify-between items-center bg-background rounded border border-border p-2">
              <span className="text-xs text-slate-400">Tenggat Kritis</span>
              <span className="font-mono text-xs font-bold text-red-400">3 Urgent</span>
            </div>
            <div className="flex justify-between items-center bg-background rounded border border-border p-2">
              <span className="text-xs text-slate-400">Total VO Tertahan</span>
              <span className="font-mono text-xs font-bold text-amber-400">Rp 4.2M</span>
            </div>
          </div>
          <Link href="/kasus" className="inline-flex items-center justify-between w-full rounded border border-border bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
            Buka Manajemen Kasus <ArrowRight size={14} />
          </Link>
        </div>

        {/* Pillar 2: Kegagalan */}
        <div className="fade-up delay-2 flex flex-col rounded-lg border border-amber-900/30 bg-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded bg-amber-500/10 border border-amber-500/20 p-2 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
              <Building2 size={20} />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Pilar 2</p>
              <h2 className="font-bold text-slate-200">Kegagalan Konstruksi</h2>
            </div>
          </div>
          <div className="space-y-3 mb-6 flex-1">
            <div className="flex justify-between items-center bg-background rounded border border-border p-2">
              <span className="text-xs text-slate-400">Investigasi Aktif</span>
              <span className="font-mono text-xs font-bold text-amber-400">2 Kasus</span>
            </div>
            <div className="flex justify-between items-center bg-background rounded border border-border p-2">
              <span className="text-xs text-slate-400">NCR Struktur (Open)</span>
              <span className="font-mono text-xs font-bold text-amber-400">3 Laporan</span>
            </div>
          </div>
          <Link href="/kegagalan" className="inline-flex items-center justify-between w-full rounded border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-xs font-bold text-amber-400 hover:bg-amber-900/40 hover:text-amber-300 transition-colors">
            Masuk Ruang Forensik <ArrowRight size={14} />
          </Link>
        </div>

        {/* Pillar 3: Ahli & Resolusi */}
        <div className="fade-up delay-3 flex flex-col rounded-lg border border-emerald-900/30 bg-card p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded bg-emerald-500/10 border border-emerald-500/20 p-2 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
              <Users size={20} />
            </div>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Pilar 3</p>
              <h2 className="font-bold text-slate-200">Ahli & Mediasi</h2>
            </div>
          </div>
          <div className="space-y-3 mb-6 flex-1">
            <div className="flex justify-between items-center bg-background rounded border border-border p-2">
              <span className="text-xs text-slate-400">Sesi Mediasi Aktif</span>
              <span className="font-mono text-xs font-bold text-emerald-400">1 Agenda</span>
            </div>
            <div className="flex justify-between items-center bg-background rounded border border-border p-2">
              <span className="text-xs text-slate-400">Penilai Ahli Terhubung</span>
              <span className="font-mono text-xs font-bold text-emerald-400">2 Ahli</span>
            </div>
          </div>
          <Link href="/mediasi" className="inline-flex items-center justify-between w-full rounded border border-emerald-900/50 bg-emerald-950/20 px-3 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-900/40 hover:text-emerald-300 transition-colors">
            Buka Ruang Mediasi <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Action Surface */}
      <section className="mb-8 space-y-4">
        <h3 className="font-mono text-[10px] uppercase font-bold text-slate-500 tracking-wider">Aksi Mendesak</h3>
        
        <div className="fade-up delay-4 relative overflow-hidden rounded-lg border border-red-900/50 bg-red-950/10 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          <div className="rounded bg-red-500/20 p-2 text-red-400 shrink-0"><TriangleAlert size={18} /></div>
          <div className="flex-1">
            <p className="font-mono text-[10px] uppercase font-bold text-red-400 mb-1">Klaim EOT Terancam Hangus</p>
            <h4 className="text-sm font-bold text-slate-200">Notice of Delay - Tower A</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">Tenggat pengajuan Notice of Delay tersisa 2 hari (Pasal 8.4). Tanpa notifikasi formal, hak perpanjangan waktu dapat digugurkan secara kontraktual.</p>
          </div>
          <Link href="/tenggat" className="shrink-0 inline-flex items-center justify-center gap-2 rounded bg-red-500/20 border border-red-500/30 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-colors">
            Draft Notice Sekarang
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Joint Collaboration Log */}
        <section className="fade-up delay-4 rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-200">Aktivitas Kolaborasi</h2>
              <p className="mt-1 text-xs text-slate-500">Log ruang kerja bersama (Tim Proyek & Ahli)</p>
            </div>
            <Activity size={18} className="text-slate-500" />
          </div>
          
          <div className="space-y-5 pt-1">
            {[
              { time: '10:42', user: 'Prof. Bambang S.', role: 'Mediator', action: 'Mengunggah Opini Ahli Pendahuluan', target: 'Kasus VO-042', icon: ShieldAlert, color: 'text-primary' },
              { time: 'Kemarin', user: 'System', role: 'Automated', action: 'Memverifikasi bukti foto dengan metadata GPS', target: 'NCR-008 BSD', icon: CheckCircle2, color: 'text-emerald-400' },
              { time: '17 Jun', user: 'Tim Teknis', role: 'Internal', action: 'Menyelesaikan input kronologi penundaan', target: 'EOT-003', icon: Clock, color: 'text-amber-400' },
              { time: '15 Jun', user: 'Raka A.', role: 'Contract Mgr', action: 'Meminta persetujuan Penilai Ahli independen', target: 'Sengketa Fasad', icon: Users, color: 'text-primary' },
            ].map((log, i) => (
              <div key={i} className="flex gap-4">
                <div className="mt-0.5 shrink-0">
                  <log.icon size={16} className={log.color} />
                </div>
                <div>
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-slate-200">{log.user}</span> <span className="text-slate-400">{log.action}</span> <span className="font-medium text-slate-300">{log.target}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-500">
                    <span>{log.time}</span>
                    <span>•</span>
                    <span className="rounded border border-border bg-background px-1.5 py-0.5">{log.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Link href="/kasus" className="mt-6 block w-full rounded border border-border bg-background py-2.5 text-center text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors">
            Lihat Semua Aktivitas
          </Link>
        </section>

        {/* High-Risk Projects Dashboard */}
        <section className="fade-up delay-4 rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-200">Portfolio Risk Exposure</h2>
              <p className="mt-1 text-xs text-slate-500">Pemantauan risiko proyek berbasis anomali</p>
            </div>
            <FileWarning size={18} className="text-slate-500" />
          </div>
          
          <div className="space-y-2">
            {[
              { name: 'Tower A Jakarta', risk: 82, issue: 'Sengketa spesifikasi fasad (VO ditolak)', status: 'critical', trend: '+15%' },
              { name: 'Bridge Kalimantan', risk: 91, issue: 'Somasi ke-3 dari Owner terkait deviasi', status: 'critical', trend: '+8%' },
              { name: 'Toll Road Semarang', risk: 58, issue: 'Klaim EOT menunggu mediasi awal', status: 'warning', trend: '-2%' },
              { name: 'Housing BSD', risk: 45, issue: '3 NCR terindikasi kegagalan konstruksi', status: 'warning', trend: '+5%' },
            ].map((p, i) => (
              <Link href="/proyek" key={i} className="flex items-center justify-between rounded-lg p-3 hover:bg-white/5 border border-transparent hover:border-border transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "grid h-9 w-9 place-items-center rounded bg-background border",
                    p.status === 'critical' ? 'border-red-900/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-amber-900/50 text-amber-400'
                  )}>
                    <span className="font-mono text-[11px] font-bold">{p.risk}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200 group-hover:text-primary transition-colors flex items-center gap-2">
                      {p.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-xs">{p.issue}</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className={cn("font-mono text-[10px]", p.status === 'critical' ? 'text-red-400' : 'text-amber-400')}>{p.trend}</span>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-primary mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
