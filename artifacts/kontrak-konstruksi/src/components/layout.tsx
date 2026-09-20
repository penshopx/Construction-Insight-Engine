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
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = { label: string; href: string; icon: React.ElementType; note?: string };

const navItems: NavItem[] = [
  { label: 'Command Center', href: '/', icon: LayoutDashboard },
  { label: 'Portfolio Proyek', href: '/proyek', icon: FolderKanban, note: '7' },
  { label: 'Tenggat Hukum', href: '/tenggat', icon: Clock, note: '3 Urgent' },
  { label: 'Evidence Vault', href: '/bukti', icon: Database },
  { label: 'Manajemen Kasus', href: '/kasus', icon: Scale, note: '12' },
  { label: 'Referensi Kontrak', href: '/referensi', icon: BookOpen },
  { label: 'Kompetensi', href: '/kompetensi', icon: GraduationCap },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  return (
    <div className="min-h-[100dvh] bg-background text-foreground cyber-grid">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-sidebar-border bg-sidebar/95 backdrop-blur transition-transform duration-300 lg:translate-x-0', 
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-[72px] items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" className="flex items-center gap-3 no-underline group" onClick={() => setMobileOpen(false)}>
            <span className="grid h-9 w-9 place-items-center rounded bg-primary/10 border border-primary/20 text-primary transition-colors group-hover:bg-primary/20">
              <ShieldAlert size={18} className="text-primary" />
            </span>
            <span>
              <span className="block font-display text-[16px] font-bold tracking-tight text-white group-hover:text-primary transition-colors">KontrakGuard</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary/70">Defense System</span>
            </span>
          </Link>
          <button className="rounded-md p-1 text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">Modul Pertahanan</p>
          <nav className="space-y-1" aria-label="Navigasi utama">
            {navItems.map((item) => {
              const active = location === item.href;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  onClick={() => setMobileOpen(false)} 
                  className={cn(
                    'group flex items-center justify-between rounded-md px-3 py-2.5 text-[13px] font-medium transition-all', 
                    active ? 'bg-primary/10 border border-primary/20 text-primary' : 'text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-200'
                  )}
                >
                  <span className="flex items-center gap-3"><Icon size={16} strokeWidth={active ? 2.5 : 2} className={active ? 'text-primary' : 'text-slate-500 group-hover:text-slate-300'} /><span>{item.label}</span></span>
                  {item.note && (
                    <span className={cn('rounded px-1.5 py-0.5 font-mono text-[9px] font-bold', active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-slate-500')}>{item.note}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="mt-auto px-4 pb-4">
          <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-3 mb-4">
            <div className="mb-2 flex items-center gap-2 text-red-400">
              <Zap size={14} className="animate-pulse" />
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] font-bold">Live Risk Exposure</span>
            </div>
            <p className="font-mono text-[18px] font-bold text-red-400">Rp 127.4M</p>
            <p className="text-[10px] text-red-400/60 mt-1">2 high-risk projects detected</p>
          </div>
          
          <div className="flex items-start gap-2 border-t border-sidebar-border pt-4">
            <Info size={14} className="shrink-0 text-slate-500 mt-0.5" />
            <p className="text-[9px] leading-relaxed text-slate-500">
              <span className="font-bold text-slate-400">DISCLAIMER:</span> KontrakGuard adalah sistem pendukung keputusan (decision-support). Data dan analisis dalam platform ini bukan nasihat hukum, sertifikasi, maupun jaminan alat bukti di pengadilan.
            </p>
          </div>
        </div>
      </aside>
      
      {mobileOpen && <button aria-label="Tutup navigasi" className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      
      <main className="min-h-[100dvh] lg:pl-[260px] flex flex-col">
        <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur-md md:px-8">
          <div className="flex items-center gap-4">
            <button className="rounded p-1 text-slate-400 hover:bg-white/5 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
            <div className="hidden items-center gap-2 text-[11px] text-slate-400 sm:flex">
              <ShieldCheck size={14} className="text-primary" />
              <span className="font-mono uppercase tracking-[0.1em]">KontrakGuard</span>
              <span>/</span>
              <span className="font-semibold text-slate-200">{navItems.find((item) => item.href === location)?.label ?? 'Sistem'}</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden items-center gap-1.5 font-mono text-[10px] text-slate-400 md:flex">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              System Active
            </span>
            <div className="h-4 w-px bg-border hidden md:block"></div>
            <button className="flex items-center gap-2 rounded-md bg-white/5 border border-border px-2 py-1 hover:bg-white/10 transition-colors">
              <span className="grid h-6 w-6 place-items-center rounded bg-slate-800 font-display text-[10px] font-bold text-slate-300">RA</span>
              <div className="text-left hidden sm:block">
                <p className="text-[11px] font-bold leading-none text-slate-200">Raka A.</p>
                <p className="text-[9px] font-mono text-slate-500">Contract Mgr</p>
              </div>
            </button>
          </div>
        </header>
        <div className="flex-1 p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end border-b border-border pb-6">
      <div className="fade-up">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-primary">{eyebrow}</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
      {action && <div className="fade-up delay-1 shrink-0">{action}</div>}
    </div>
  );
}
