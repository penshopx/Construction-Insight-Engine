import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Filter,
  FolderKanban,
  Gauge,
  Grid2X2,
  LayoutDashboard,
  ListChecks,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type IconType = typeof LayoutDashboard;
type NavItem = { label: string; href: string; icon: IconType; note?: string };

const navItems: NavItem[] = [
  { label: 'Ringkasan', href: '/', icon: LayoutDashboard },
  { label: 'Referensi', href: '/referensi', icon: BookOpen, note: '16' },
  { label: 'Kompetensi', href: '/kompetensi', icon: ShieldCheck, note: 'SKKNI' },
  { label: 'Administrasi', href: '/administrasi', icon: FolderKanban, note: '4' },
];

const referenceItems = [
  { id: 'ref-01', title: 'Manajemen Kontrak', category: 'Dasar & prinsip', type: 'Modul', updated: 'Sumber utama', description: 'Landasan merencanakan, mengorganisasikan, menggerakkan, dan mengendalikan kontrak proyek.' },
  { id: 'ref-02', title: 'Bentuk Kontrak Konstruksi', category: 'Bentuk kontrak', type: 'Panduan', updated: 'Sumber utama', description: 'Membandingkan kontrak lump sum, harga satuan, design & build, EPC, dan turn-key.' },
  { id: 'ref-03', title: 'Syarat Umum Kontrak', category: 'Dokumen kontrak', type: 'Klausul', updated: 'Sumber utama', description: 'Struktur dokumen, urutan kekuatan hukum, hak-kewajiban, pembayaran, dan pemutusan.' },
  { id: 'ref-04', title: 'Aspek Hukum & Manajemen', category: 'Legal & manajemen', type: 'Bahan baca', updated: 'Sumber utama', description: 'Analisis hubungan hukum, kewenangan pihak, risiko, dan pengendalian kontrak industri.' },
  { id: 'ref-05', title: 'Klaim dan Penyelesaian Sengketa', category: 'Klaim & sengketa', type: 'Checklist', updated: 'Praktik kerja', description: 'Mencatat peristiwa, bukti, notifikasi, analisis entitlement, dan jalur penyelesaian.' },
  { id: 'ref-06', title: 'Kontrak EPC', category: 'Bentuk kontrak', type: 'Bahan baca', updated: 'Pengetahuan inti', description: 'Titik kendali engineering, procurement, construction, commissioning, dan risiko interface.' },
  { id: 'ref-07', title: 'Kontrak Kritis', category: 'Manajemen risiko', type: 'Framework', updated: 'Praktik kerja', description: 'Menandai klausul dan keputusan yang dapat mengubah biaya, waktu, mutu, atau hak pihak.' },
  { id: 'ref-08', title: 'Administrasi Kontrak Konstruksi', category: 'Administrasi', type: 'Modul', updated: 'Sumber utama', description: 'Ritme surat-menyurat, instruksi, pembayaran, perubahan, laporan, dan close-out.' },
];

const competencyGroups = [
  { id: 'A', title: 'Mengelola dokumen kontrak', subtitle: 'Menjaga satu sumber kebenaran untuk seluruh tim', progress: 78, color: 'cyan', items: ['Mengidentifikasi dokumen kontrak', 'Menetapkan hierarki dokumen', 'Memelihara register korespondensi'] },
  { id: 'B', title: 'Mengelola pelaksanaan kontrak', subtitle: 'Menghubungkan kewajiban kontraktual dengan pekerjaan lapangan', progress: 64, color: 'blue', items: ['Memantau pemenuhan kewajiban', 'Mengelola instruksi dan perubahan', 'Menyusun laporan kemajuan'] },
  { id: 'C', title: 'Mengelola klaim kontrak', subtitle: 'Membangun keputusan berbasis peristiwa dan bukti', progress: 46, color: 'amber', items: ['Mendeteksi peristiwa kompensabel', 'Menyiapkan notifikasi klaim', 'Menganalisis dampak waktu dan biaya'] },
  { id: 'D', title: 'Mengelola risiko kontrak', subtitle: 'Membuat risiko terlihat sebelum menjadi sengketa', progress: 58, color: 'violet', items: ['Mengidentifikasi risiko pihak', 'Merencanakan respons risiko', 'Mengawal mitigasi dan eskalasi'] },
];

type AdminItem = { id: string; title: string; project: string; owner: string; status: 'Perlu ditinjau' | 'Berjalan' | 'Selesai'; due: string; kind: string };
const initialAdmin: AdminItem[] = [
  { id: 'ADM-2408', title: 'Tanggapan terhadap Instruksi Perubahan #03', project: 'Jembatan Cisadane', owner: 'AR', status: 'Perlu ditinjau', due: 'Hari ini', kind: 'Perubahan' },
  { id: 'ADM-2406', title: 'Verifikasi kelengkapan klaim EOT', project: 'Gedung Arsip Nasional', owner: 'NS', status: 'Berjalan', due: '18 Jun 2024', kind: 'Klaim' },
  { id: 'ADM-2398', title: 'Berita acara pembayaran termin II', project: 'SPAM Regional Barat', owner: 'DP', status: 'Perlu ditinjau', due: '20 Jun 2024', kind: 'Pembayaran' },
  { id: 'ADM-2387', title: 'Penutupan daftar punch list', project: 'Jembatan Cisadane', owner: 'AR', status: 'Selesai', due: '14 Jun 2024', kind: 'Close-out' },
];

function cn(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 lg:translate-x-0', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-[84px] items-center justify-between border-b border-[hsl(var(--sidebar-border))] px-6">
          <Link href="/" className="flex items-center gap-3 no-underline" data-testid="link-brand">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]"><span className="font-display text-lg font-bold">K</span></span>
            <span><span className="block font-display text-[17px] font-bold tracking-[-.04em] text-white">Kontrak<span className="text-[hsl(var(--sidebar-primary))]">Konstruksi</span></span><span className="font-mono text-[9px] uppercase tracking-[.18em] text-slate-400">workbench v1.0</span></span>
          </Link>
          <button className="rounded-md p-1 text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="px-4 pt-7">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[.18em] text-slate-500">Workspace</p>
          <nav className="space-y-1" aria-label="Navigasi utama">
            {navItems.map((item) => {
              const active = location === item.href;
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn('group flex items-center justify-between rounded-lg px-3 py-3 text-[13px] font-semibold transition-colors', active ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white')} data-testid={`link-nav-${item.label.toLowerCase()}`}>
                <span className="flex items-center gap-3"><Icon size={17} strokeWidth={active ? 2.4 : 1.8} /><span>{item.label}</span></span>
                {item.note && <span className={cn('rounded px-1.5 py-0.5 font-mono text-[9px]', active ? 'bg-slate-900/15' : 'bg-slate-800 text-slate-400')}>{item.note}</span>}
              </Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto px-4 pb-5">
          <div className="rounded-xl border border-slate-700/80 bg-slate-800/50 p-4">
            <div className="mb-3 flex items-center gap-2 text-[hsl(var(--sidebar-primary))]"><Sparkles size={15} /><span className="font-mono text-[10px] uppercase tracking-[.14em]">Catatan kerja</span></div>
            <p className="text-[12px] leading-relaxed text-slate-300">Kontrak yang tertib membuat keputusan lapangan lebih dapat dipertanggungjawabkan.</p>
            <Link href="/referensi" className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[hsl(var(--sidebar-primary))]" data-testid="link-sidebar-reference">Buka referensi <ArrowRight size={13} /></Link>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-slate-700/70 pt-4">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-700 font-display text-xs font-bold text-white">RA</span>
            <span className="min-w-0"><span className="block truncate text-xs font-semibold text-white">Raka Adinata</span><span className="block font-mono text-[10px] text-slate-500">Contract manager</span></span>
            <button className="ml-auto text-slate-500 hover:text-white" data-testid="button-profile-menu"><MoreHorizontal size={16} /></button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button aria-label="Tutup navigasi" className="fixed inset-0 z-30 bg-slate-950/60 lg:hidden" onClick={() => setMobileOpen(false)} data-testid="button-overlay-menu" />}
      <main className="min-h-[100dvh] lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 px-5 backdrop-blur md:px-8">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-200 lg:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={20} /></button>
          <div className="hidden items-center gap-2 text-[11px] text-slate-500 sm:flex"><span className="font-mono uppercase tracking-[.13em]">Workspace</span><span>/</span><span className="font-semibold text-slate-700">{navItems.find((item) => item.href === location)?.label ?? 'Halaman'}</span></div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 font-mono text-[10px] text-slate-500 md:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Data lokal aktif</span>
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-[hsl(var(--border))] bg-white text-slate-600 transition-colors hover:border-cyan-400 hover:text-cyan-700" data-testid="button-help"><CircleHelp size={17} /></button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--primary))] font-display text-xs font-bold text-white" data-testid="button-user-avatar">RA</button>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-8 md:py-9">{children}</div>
      </main>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
    <div className="fade-up"><p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[.2em] text-cyan-700">{eyebrow}</p><h1 className="font-display text-3xl font-bold tracking-[-.045em] text-slate-950 md:text-[38px]">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>
    {action && <div className="fade-up delay-1">{action}</div>}
  </div>;
}

function MetricCard({ label, value, detail, icon: Icon, tone = 'default' }: { label: string; value: string; detail: string; icon: IconType; tone?: string }) {
  return <div className="fade-up rounded-xl border border-[hsl(var(--border))] bg-white p-5 shadow-[var(--shadow-card)]">
    <div className="flex items-start justify-between"><span className="font-mono text-[10px] uppercase tracking-[.12em] text-slate-500">{label}</span><span className={cn('grid h-8 w-8 place-items-center rounded-lg', tone === 'amber' ? 'bg-amber-100 text-amber-700' : tone === 'cyan' ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600')}><Icon size={16} /></span></div>
    <p className="mt-4 font-display text-3xl font-bold tracking-[-.05em] text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{detail}</p>
  </div>;
}

function StatusPill({ status }: { status: AdminItem['status'] }) {
  const style = status === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : status === 'Berjalan' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-amber-50 text-amber-700 border-amber-200';
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium', style)}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span>;
}

function Dashboard() {
  const [showBrief, setShowBrief] = useState(false);
  return <Shell><PageHeader eyebrow="Selasa, 18 Juni 2024" title="Selamat datang, Raka." description="Pusat kendali untuk membaca konteks, menilai risiko, dan menjaga administrasi kontrak tetap bergerak." action={<button onClick={() => setShowBrief(true)} className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-700/10 transition-transform hover:-translate-y-0.5" data-testid="button-new-brief"><Plus size={16} /> Catat keputusan</button>} />
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Agenda terbuka" value="04" detail="2 perlu ditinjau hari ini" icon={ListChecks} tone="amber" />
      <MetricCard label="Kontrak aktif" value="07" detail="Rp 86,4 M nilai terkelola" icon={FileCheck2} tone="cyan" />
      <MetricCard label="Kompetensi SKKNI" value="62%" detail="+8% sejak asesmen terakhir" icon={Gauge} />
      <MetricCard label="Risiko terpantau" value="03" detail="1 risiko dengan eskalasi tinggi" icon={AlertTriangle} tone="amber" />
    </section>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.9fr]">
      <section className="rounded-xl border border-[hsl(var(--border))] bg-white shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-5 py-4"><div><h2 className="font-display text-base font-bold text-slate-900">Agenda administrasi</h2><p className="mt-1 text-xs text-slate-500">Hal yang paling dekat dengan keputusan Anda</p></div><Link href="/administrasi" className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700" data-testid="link-view-administration">Lihat semua <ArrowRight size={14} /></Link></div>
        <div className="divide-y divide-slate-100">
          {initialAdmin.slice(0, 3).map((item, index) => <div key={item.id} className={cn('flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between', `delay-${index + 1}`)} data-testid={`row-agenda-${item.id}`}><div className="flex min-w-0 items-start gap-3"><span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-slate-100 font-mono text-[9px] text-slate-500">{item.kind.slice(0, 2).toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{item.title}</span><span className="mt-1 block text-xs text-slate-500">{item.project} <span className="mx-1 text-slate-300">•</span> {item.id}</span></span></div><div className="flex items-center gap-4 pl-10 sm:pl-0"><span className="font-mono text-[10px] text-slate-500">{item.due}</span><StatusPill status={item.status} /></div></div>)}
        </div>
      </section>
      <section className="relative overflow-hidden rounded-xl bg-[hsl(var(--sidebar))] p-6 text-white shadow-[var(--shadow-float)]"><div className="absolute -right-10 -top-16 h-48 w-48 rounded-full border-[22px] border-cyan-400/10" /><div className="absolute -bottom-20 -left-8 h-40 w-40 rounded-full border-[18px] border-cyan-400/10" /><div className="relative"><div className="mb-8 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.17em] text-cyan-300">Focus hari ini</span><span className="rounded bg-cyan-400/10 px-2 py-1 font-mono text-[9px] text-cyan-300">02 / 04</span></div><h2 className="max-w-[300px] font-display text-2xl font-semibold leading-tight tracking-[-.04em]">Bukti yang baik membuat posisi kontraktual Anda terbaca.</h2><p className="mt-4 max-w-[300px] text-xs leading-5 text-slate-300">Sebelum membalas instruksi perubahan, pastikan kejadian, dampak, dan dasar klausulnya tercatat.</p><button onClick={() => setShowBrief(true)} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 transition-colors hover:bg-cyan-50" data-testid="button-open-focus">Buka lembar kerja <ArrowRight size={14} /></button></div></section>
    </div>
    <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-5 shadow-[var(--shadow-card)]"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-base font-bold text-slate-900">Jejak keputusan</h2><p className="mt-1 text-xs text-slate-500">Aktivitas terbaru di workspace</p></div><Clock3 size={17} className="text-slate-400" /></div><div className="space-y-4">{[['08:42', 'Raka memperbarui catatan', 'Instruksi Perubahan #03'], ['Kemarin', 'Nadia menambahkan bukti', 'Klaim EOT Gedung Arsip'], ['17 Jun', 'Dokumen selesai ditinjau', 'Syarat Umum Kontrak']].map(([time, action, subject], i) => <div className="flex gap-3" key={subject} data-testid={`activity-${i}`}><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-500 ring-4 ring-cyan-50" /><div className="flex-1"><p className="text-xs text-slate-700"><span className="font-semibold">{action}</span> <span className="text-slate-500">— {subject}</span></p><p className="mt-1 font-mono text-[10px] text-slate-400">{time}</p></div></div>)}</div></div>
      <div className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-5"><div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-700 text-white"><ShieldCheck size={16} /></span><div><h2 className="font-display text-base font-bold text-slate-900">Rambu penggunaan</h2><p className="mt-2 text-xs leading-5 text-slate-600">KontrakKonstruksi adalah ruang bantu kerja berbasis referensi. Isinya bukan pendapat hukum, dan tidak menggantikan penelaahan dokumen oleh advokat atau ahli yang berwenang.</p><button className="mt-4 text-xs font-bold text-cyan-800 underline decoration-cyan-300 underline-offset-4" data-testid="button-read-disclaimer">Baca selengkapnya</button></div></div></div>
    </section>
    {showBrief && <DecisionModal onClose={() => setShowBrief(false)} />}
  </Shell>;
}

function DecisionModal({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-cyan-700">Lembar keputusan</p><h2 className="mt-2 font-display text-xl font-bold text-slate-950">Catat keputusan baru</h2></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" data-testid="button-close-decision"><X size={18} /></button></div><div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Judul keputusan</span><input defaultValue="Tanggapan Instruksi Perubahan #03" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-cyan-500 focus:ring-2" data-testid="input-decision-title" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Catatan singkat</span><textarea rows={4} placeholder="Apa yang diputuskan dan dasar pertimbangannya?" className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-cyan-500 focus:ring-2" data-testid="input-decision-note" /></label></div><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="rounded-lg px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100" data-testid="button-cancel-decision">Batal</button><button onClick={() => setSaved(true)} className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-xs font-bold text-white" data-testid="button-save-decision">{saved ? 'Tersimpan' : 'Simpan catatan'}</button></div>{saved && <p className="mt-3 text-right text-xs font-semibold text-emerald-600">Catatan tersimpan di data lokal.</p>}</div></div>;
}

function Referensi() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [selected, setSelected] = useState<string | null>(null);
  const categories = ['Semua', 'Dasar & prinsip', 'Dokumen kontrak', 'Bentuk kontrak', 'Klaim & sengketa', 'Administrasi'];
  const filtered = useMemo(() => referenceItems.filter((item) => (category === 'Semua' || item.category === category) && `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const active = referenceItems.find((item) => item.id === selected);
  return <Shell><PageHeader eyebrow="Perpustakaan kerja" title="Referensi kontrak" description="Bahan bacaan yang membantu Anda berpindah dari istilah ke tindakan. Pilih topik untuk melihat ringkasan dan konteks penggunaannya." action={<button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm hover:border-cyan-400 hover:text-cyan-700" data-testid="button-filter-reference"><Filter size={15} /> Filter tersimpan</button>} />
    <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[hsl(var(--border))] bg-white p-3 shadow-[var(--shadow-card)] md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari manajemen kontrak, klaim, EPC..." className="h-11 w-full rounded-lg bg-slate-50 pl-10 pr-4 text-sm outline-none ring-cyan-500 focus:ring-2" data-testid="input-reference-search" /></div><div className="flex gap-2 overflow-x-auto pb-0.5">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={cn('whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors', category === item ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100')} data-testid={`button-category-${item}`}>{item}</button>)}</div></div>
    <div className="mb-5 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[.16em] text-slate-500">{filtered.length} topik tersedia</p><button className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-cyan-700" data-testid="button-sort-reference"><SlidersHorizontal size={14} /> Terbaru</button></div>
    {filtered.length === 0 ? <EmptyState title="Tidak ada topik yang cocok" description="Coba gunakan kata kunci yang lebih umum atau ubah filter kategori." onReset={() => { setQuery(''); setCategory('Semua'); }} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{filtered.map((item, i) => <button key={item.id} onClick={() => setSelected(item.id)} className={cn('group flex min-h-[218px] flex-col rounded-xl border border-[hsl(var(--border))] bg-white p-5 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-1 hover:border-cyan-300 hover:shadow-[var(--shadow-float)]', `delay-${(i % 4) + 1}`)} data-testid={`card-reference-${item.id}`}><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-cyan-700 transition-colors group-hover:bg-cyan-100"><FileText size={17} /></span><span className="font-mono text-[9px] uppercase tracking-[.1em] text-slate-400">{item.type}</span></div><p className="mt-6 font-mono text-[9px] uppercase tracking-[.14em] text-cyan-700">{item.category}</p><h2 className="mt-2 font-display text-[17px] font-bold leading-tight tracking-[-.03em] text-slate-900">{item.title}</h2><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p><span className="mt-auto flex items-center gap-1 pt-4 text-[11px] font-bold text-slate-500 group-hover:text-cyan-700">Buka ringkasan <ArrowRight size={13} /></span></button>)}</div>}
    <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><ShieldCheck className="mt-0.5 shrink-0 text-slate-500" size={17} /><p className="text-xs leading-5 text-slate-500">Referensi dirangkum untuk membantu orientasi dan administrasi. Selalu cocokkan kembali dengan kontrak yang ditandatangani, peraturan terbaru, dan nasihat profesional yang relevan.</p></div>
    {active && <ReferenceModal item={active} onClose={() => setSelected(null)} />}
  </Shell>;
}

function ReferenceModal({ item, onClose }: { item: typeof referenceItems[number]; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><span className="font-mono text-[10px] uppercase tracking-[.18em] text-cyan-700">{item.category} / {item.type}</span><h2 className="mt-2 font-display text-2xl font-bold tracking-[-.04em] text-slate-950">{item.title}</h2></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" data-testid="button-close-reference"><X size={18} /></button></div><div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-sm leading-6 text-slate-700">{item.description}</p></div><h3 className="mt-6 font-display text-sm font-bold text-slate-900">Gunakan saat</h3><ul className="mt-3 space-y-3 text-sm leading-5 text-slate-600"><li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-cyan-600" size={16} />Menyamakan pemahaman tim sebelum mengambil posisi kontraktual.</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-cyan-600" size={16} />Menemukan dokumen, bukti, atau klausul yang perlu ditinjau.</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-cyan-600" size={16} />Menyiapkan pertanyaan yang lebih terarah untuk ahli atau penasihat hukum.</li></ul><div className="mt-7 flex justify-end"><button onClick={onClose} className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white" data-testid="button-done-reference">Selesai membaca</button></div></div></div>;
}

function Kompetensi() {
  const [active, setActive] = useState('A');
  const group = competencyGroups.find((item) => item.id === active) ?? competencyGroups[0];
  return <Shell><PageHeader eyebrow="Peta kompetensi" title="SKKNI 88–2015" description="Orientasi kompetensi Ahli Kontrak Kerja Konstruksi, disusun sebagai peta kerja untuk asesmen dan pengembangan tim." action={<button className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-700/10" data-testid="button-assessment"><ClipboardCheck size={16} /> Mulai asesmen</button>} />
    <div className="grid gap-6 xl:grid-cols-[.85fr_1.5fr]">
      <section className="rounded-xl border border-[hsl(var(--border))] bg-white p-5 shadow-[var(--shadow-card)]"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-slate-500">Kesiapan saat ini</p><p className="mt-3 font-display text-5xl font-bold tracking-[-.07em] text-slate-950">62<span className="text-2xl text-cyan-600">%</span></p></div><span className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-100 text-cyan-700"><TrendingUp size={19} /></span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[62%] rounded-full bg-cyan-500" /></div><p className="mt-3 text-xs leading-5 text-slate-500">12 dari 19 unit kompetensi telah memiliki catatan bukti kerja.</p><div className="mt-6 grid grid-cols-3 border-t border-slate-100 pt-5 text-center"><div><p className="font-display text-lg font-bold text-slate-900">08</p><p className="mt-1 font-mono text-[9px] uppercase text-slate-400">Kuat</p></div><div className="border-x border-slate-100"><p className="font-display text-lg font-bold text-slate-900">07</p><p className="mt-1 font-mono text-[9px] uppercase text-slate-400">Berproses</p></div><div><p className="font-display text-lg font-bold text-slate-900">04</p><p className="mt-1 font-mono text-[9px] uppercase text-slate-400">Perlu bukti</p></div></div></section>
      <section className="rounded-xl border border-[hsl(var(--border))] bg-white p-5 shadow-[var(--shadow-card)]"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-display text-base font-bold text-slate-900">Empat area kerja</h2><p className="mt-1 text-xs text-slate-500">Pilih area untuk melihat unit kompetensinya</p></div><span className="font-mono text-[10px] text-slate-400">SKKNI / 88 / 2015</span></div><div className="grid gap-2 sm:grid-cols-2">{competencyGroups.map((item) => <button key={item.id} onClick={() => setActive(item.id)} className={cn('flex items-center gap-3 rounded-lg border p-3 text-left transition-all', active === item.id ? 'border-cyan-400 bg-cyan-50' : 'border-slate-100 hover:border-cyan-200 hover:bg-slate-50')} data-testid={`button-competency-${item.id}`}><span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-bold', active === item.id ? 'bg-cyan-700 text-white' : 'bg-slate-100 text-slate-600')}>{item.id}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-slate-800">{item.title}</span><span className="mt-1 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200"><span className="block h-full rounded-full bg-cyan-500" style={{ width: `${item.progress}%` }} /></span><span className="font-mono text-[9px] text-slate-500">{item.progress}%</span></span></span></button>)}</div></section>
    </div>
    <section className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-white shadow-[var(--shadow-card)]"><div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.15em] text-cyan-700">Area {group.id}</p><h2 className="mt-1 font-display text-xl font-bold tracking-[-.035em] text-slate-950">{group.title}</h2><p className="mt-1 text-xs text-slate-500">{group.subtitle}</p></div><button className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700" data-testid="button-add-evidence"><Plus size={14} /> Tambah bukti kerja</button></div><div className="divide-y divide-slate-100">{group.items.map((item, i) => <div key={item} className="flex items-center gap-4 px-5 py-4"><span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 font-mono text-[10px] text-slate-500">{String(i + 1).padStart(2, '0')}</span><span className="flex-1 text-sm font-semibold text-slate-700">{item}</span><span className={cn('hidden rounded-full border px-2.5 py-1 font-mono text-[9px] sm:inline-flex', i === 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>{i === 0 ? 'Terverifikasi' : 'Butuh bukti'}</span><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-cyan-700" data-testid={`button-open-unit-${group.id}-${i}`}><ArrowRight size={16} /></button></div>)}</div></section>
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4"><AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={17} /><p className="text-xs leading-5 text-amber-900">Peta ini adalah alat orientasi berbasis SKKNI 88–2015, bukan sertifikasi. Penetapan kompetensi tetap mengikuti skema asesmen dan lembaga yang berwenang.</p></div>
  </Shell>;
}

function Administrasi() {
  const [items, setItems] = useState(initialAdmin);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Semua' | AdminItem['status']>('Semua');
  const [showAdd, setShowAdd] = useState(false);
  const filtered = items.filter((item) => (filter === 'Semua' || item.status === filter) && `${item.title} ${item.project} ${item.kind}`.toLowerCase().includes(query.toLowerCase()));
  const toggleDone = (id: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, status: item.status === 'Selesai' ? 'Berjalan' : 'Selesai' } : item));
  return <Shell><PageHeader eyebrow="Ruang kerja kontrak" title="Administrasi" description="Satu tempat untuk memprioritaskan korespondensi, klaim, pembayaran, perubahan, dan pekerjaan penutupan." action={<button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-700/10 transition-transform hover:-translate-y-0.5" data-testid="button-add-administration"><Plus size={16} /> Tambah item</button>} />
    <div className="mb-6 grid gap-4 md:grid-cols-3"><MetricCard label="Semua item" value={String(items.length).padStart(2, '0')} detail="dalam ruang kerja lokal" icon={Grid2X2} /><MetricCard label="Perlu ditinjau" value={String(items.filter((item) => item.status === 'Perlu ditinjau').length).padStart(2, '0')} detail="prioritas minggu ini" icon={AlertTriangle} tone="amber" /><MetricCard label="Selesai" value={String(items.filter((item) => item.status === 'Selesai').length).padStart(2, '0')} detail="ditutup oleh tim" icon={CheckCircle2} tone="cyan" /></div>
    <section className="rounded-xl border border-[hsl(var(--border))] bg-white shadow-[var(--shadow-card)]"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari item, proyek, atau tipe..." className="h-10 w-full rounded-lg bg-slate-50 pl-9 pr-3 text-xs outline-none ring-cyan-500 focus:ring-2" data-testid="input-administration-search" /></div><div className="flex gap-1 rounded-lg bg-slate-50 p-1">{(['Semua', 'Perlu ditinjau', 'Berjalan', 'Selesai'] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={cn('rounded-md px-3 py-2 text-[10px] font-bold', filter === item ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')} data-testid={`button-status-${item}`}>{item}</button>)}</div></div><div className="hidden grid-cols-[1.5fr_1fr_.75fr_.8fr_32px] gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3 font-mono text-[9px] uppercase tracking-[.13em] text-slate-400 md:grid"><span>Item kerja</span><span>Proyek</span><span>Status</span><span>Jatuh tempo</span><span /></div>{filtered.length === 0 ? <EmptyState title="Ruang kerja ini kosong" description="Tidak ada item yang sesuai dengan pencarian atau filter Anda." onReset={() => { setQuery(''); setFilter('Semua'); }} /> : <div className="divide-y divide-slate-100">{filtered.map((item) => <div key={item.id} className="grid gap-3 px-5 py-4 transition-colors hover:bg-slate-50 md:grid-cols-[1.5fr_1fr_.75fr_.8fr_32px] md:items-center md:gap-4" data-testid={`row-administration-${item.id}`}><div className="flex items-start gap-3"><button onClick={() => toggleDone(item.id)} className={cn('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border', item.status === 'Selesai' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 bg-white text-transparent hover:border-cyan-500')} data-testid={`button-complete-${item.id}`}><Check size={13} /></button><div><p className={cn('text-sm font-semibold', item.status === 'Selesai' ? 'text-slate-400 line-through' : 'text-slate-800')}>{item.title}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{item.id} <span className="mx-1">/</span> {item.kind}</p></div></div><span className="pl-8 text-xs text-slate-600 md:pl-0">{item.project}</span><span className="pl-8 md:pl-0"><StatusPill status={item.status} /></span><span className="pl-8 font-mono text-[10px] text-slate-500 md:pl-0">{item.due}</span><button className="absolute right-5 rounded-lg p-2 text-slate-400 hover:bg-slate-200 md:static" data-testid={`button-more-${item.id}`}><MoreHorizontal size={16} /></button></div>)}</div>}</section>
    <div className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-500"><FileText className="mt-0.5 shrink-0 text-slate-400" size={16} /><p>Data contoh tersimpan hanya di browser ini. Gunakan register dan dokumen resmi perusahaan untuk rekam hukum yang sebenarnya.</p></div>
    {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onAdd={(item) => { setItems((current) => [item, ...current]); setShowAdd(false); }} />}
  </Shell>;
}

function AddAdminModal({ onClose, onAdd }: { onClose: () => void; onAdd: (item: AdminItem) => void }) {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('Jembatan Cisadane');
  const submit = () => { if (!title.trim()) return; onAdd({ id: `ADM-${Math.floor(2400 + Math.random() * 99)}`, title, project, owner: 'RA', status: 'Perlu ditinjau', due: 'Belum ditentukan', kind: 'Catatan' }); };
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-cyan-700">Item administrasi</p><h2 className="mt-2 font-display text-xl font-bold text-slate-950">Tambah item kerja</h2></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" data-testid="button-close-add-item"><X size={18} /></button></div><div className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Apa yang perlu dikerjakan?</span><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Minta data pendukung perubahan" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none ring-cyan-500 focus:ring-2" data-testid="input-new-item-title" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-slate-700">Proyek</span><select value={project} onChange={(e) => setProject(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-cyan-500 focus:ring-2" data-testid="select-new-item-project"><option>Jembatan Cisadane</option><option>Gedung Arsip Nasional</option><option>SPAM Regional Barat</option></select></label></div><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="rounded-lg px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100" data-testid="button-cancel-add-item">Batal</button><button onClick={submit} disabled={!title.trim()} className="rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-save-add-item">Tambah item</button></div></div></div>;
}

function EmptyState({ title, description, onReset }: { title: string; description: string; onReset: () => void }) {
  return <div className="grid min-h-[240px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center"><div><span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-white text-slate-400 shadow-sm"><Search size={19} /></span><h2 className="mt-4 font-display text-base font-bold text-slate-800">{title}</h2><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-500">{description}</p><button onClick={onReset} className="mt-4 text-xs font-bold text-cyan-700 underline underline-offset-4" data-testid="button-reset-empty">Reset pencarian</button></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Dashboard} /><Route path="/referensi" component={Referensi} /><Route path="/kompetensi" component={Kompetensi} /><Route path="/administrasi" component={Administrasi} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><Router /><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;