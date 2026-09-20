import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ShieldAlert, 
  Menu, 
  X, 
  LayoutDashboard, 
  FolderKanban, 
  Clock, 
  Database, 
  Scale, 
  BookOpen, 
  GraduationCap,
  ShieldCheck,
  Zap,
  Info,
  Building2,
  Users,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = { label: string; href: string; icon: React.ElementType; note?: string };
type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: 'Command Center',
    items: [
      { label: 'Dashboard Terintegrasi', href: '/', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Pilar 1: Hukum & Kontrak',
    items: [
      { label: 'Portfolio Proyek', href: '/proyek', icon: FolderKanban, note: '7' },
      { label: 'Tenggat Hukum', href: '/tenggat', icon: Clock, note: '3 Urgent' },
      { label: 'Evidence Vault', href: '/bukti', icon: Database },
      { label: 'Manajemen Kasus', href: '/kasus', icon: Scale, note: '12' },
    ]
  },
  {
    title: 'Pilar 2: Kegagalan Konstruksi',
    items: [
      { label: 'Forensik Kegagalan', href: '/kegagalan', icon: Building2, note: '2 Investigasi' },
    ]
  },
  {
    title: 'Pilar 3: Penilai Ahli & Resolusi',
    items: [
      { label: 'Direktori Ahli', href: '/penilai-ahli', icon: Briefcase },
      { label: 'Ruang Mediasi', href: '/mediasi', icon: Users, note: '1 Aktif' },
    ]
  },
  {
    title: 'Penunjang Kompetensi',
    items: [
      { label: 'Referensi Hukum', href: '/referensi', icon: BookOpen },
      { label: 'Kompetensi SKKNI', href: '/kompetensi', icon: GraduationCap },
    ]
  }
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  return (
    <div className="min-h-[100dvh] bg-background text-foreground cyber-grid flex">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur-md transition-transform duration-300 lg:translate-x-0 lg:static', 
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" className="flex items-center gap-3 no-underline group" onClick={() => setMobileOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20 shadow-[0_0_15px_rgba(0,180,255,0.15)]">
              <ShieldAlert size={18} className="text-primary" />
            </span>
            <span>
              <span className="block font-display text-[16px] font-bold tracking-tight text-white group-hover:text-primary transition-colors">KontrakGuard</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/70">Defense System v3</span>
            </span>
          </Link>
          <button className="rounded-md p-1 text-slate-400 hover:text-white lg:hidden" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
          <div className="space-y-6">
            {navGroups.map((group, i) => (
              <div key={i}>
                <h3 className="mb-2 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">{group.title}</h3>
                <nav className="space-y-0.5" aria-label={group.title}>
                  {group.items.map((item) => {
                    const active = location === item.href;
                    const Icon = item.icon;
                    return (
                      <Link 
                        key={item.href} 
                        href={item.href} 
                        onClick={() => setMobileOpen(false)} 
                        className={cn(
                          'group flex items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium transition-all', 
                          active 
                            ? 'bg-primary/10 border-l-2 border-primary text-primary shadow-[inset_0_0_20px_rgba(0,180,255,0.05)]' 
                            : 'text-slate-400 border-l-2 border-transparent hover:bg-white/5 hover:text-slate-200'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Icon size={16} strokeWidth={active ? 2.5 : 2} className={active ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
                          <span>{item.label}</span>
                        </span>
                        {item.note && (
                          <span className={cn('rounded px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider', active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-500')}>{item.note}</span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </div>
        
        <div className="shrink-0 border-t border-sidebar-border p-4 bg-sidebar/50">
          <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-3 mb-4">
            <div className="mb-2 flex items-center gap-2 text-red-400">
              <Zap size={14} className="animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] font-bold">Live Risk Exposure</span>
            </div>
            <p className="font-mono text-[18px] font-bold text-red-400 tracking-tight">Rp 127.4M</p>
            <p className="text-[10px] text-red-400/60 mt-1">2 high-risk projects detected</p>
          </div>
          
          <div className="flex items-start gap-2 pt-2">
            <Info size={14} className="shrink-0 text-slate-500 mt-0.5" />
            <p className="text-[9px] leading-relaxed text-slate-500">
              <span className="font-bold text-slate-400">DISCLAIMER:</span> Sistem decision-support. Data dan opini dalam aplikasi bukan jaminan putusan pengadilan atau alat bukti sah tanpa pengujian forensik resmi.
            </p>
          </div>
        </div>
      </aside>
      
      {mobileOpen && <button aria-label="Tutup navigasi" className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="sticky top-0 z-20 flex h-[72px] shrink-0 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-4">
            <button className="rounded p-1 text-slate-400 hover:bg-white/5 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <div className="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex">
              <ShieldCheck size={14} className="text-primary" />
              <span className="font-mono uppercase tracking-[0.1em]">KontrakGuard</span>
              <span className="text-slate-600">/</span>
              <span className="font-semibold text-slate-200">
                {navGroups.flatMap(g => g.items).find((item) => item.href === location)?.label ?? 'Sistem'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden items-center gap-1.5 font-mono text-[10px] text-slate-400 md:flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              System Active
            </span>
            <div className="h-4 w-px bg-border hidden md:block"></div>
            <button className="flex items-center gap-2 rounded-md bg-white/5 border border-border px-2 py-1.5 hover:bg-white/10 hover:border-slate-700 transition-colors">
              <span className="grid h-6 w-6 place-items-center rounded bg-slate-800 font-display text-[10px] font-bold text-slate-300">RA</span>
              <div className="text-left hidden sm:block">
                <p className="text-[11px] font-bold leading-none text-slate-200">Raka A.</p>
                <p className="text-[9px] font-mono text-slate-500 mt-0.5">Contract Mgr</p>
              </div>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="p-5 md:p-8 max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end border-b border-border pb-6">
      <div className="fade-up max-w-3xl">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block"></span>
          {eyebrow}
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl mb-3">{title}</h1>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      {action && <div className="fade-up delay-1 shrink-0">{action}</div>}
    </div>
  );
}
