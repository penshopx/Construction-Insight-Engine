import { useState } from 'react';
import { PageHeader, Shell } from '@/components/layout';
import { Briefcase, Search, Star, ShieldCheck, MapPin, Languages, ChevronDown, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const experts = [
  { 
    id: 'EXP-001', 
    name: 'Prof. Ir. Bambang Sutanto, M.Sc., Ph.D.', 
    disciplines: ['Struktur', 'Kegagalan Bangunan'], 
    roles: ['Mediator', 'Konsultan', 'Pendampingan/Advokasi'], 
    region: 'DKI Jakarta', 
    rating: 4.9, 
    cases: 127,
    level: 'Ahli Utama (SKKNI Level 9)',
    languages: ['Indonesia', 'English'],
    availability: 'Minggu ini',
    verified: false
  },
  { 
    id: 'EXP-002', 
    name: 'Ir. Siti Rahayu, M.T., ACIArb', 
    disciplines: ['Manajemen Konstruksi', 'MEP'], 
    roles: ['Mediator', 'Konsultan'], 
    region: 'Jawa Timur', 
    rating: 4.8, 
    cases: 89,
    level: 'Ahli Utama (SKKNI Level 9)',
    languages: ['Indonesia'],
    availability: 'Tersedia',
    verified: false
  },
  { 
    id: 'EXP-003', 
    name: 'Dr. Hendra Gunawan, S.H., M.H.', 
    disciplines: ['Hukum Konstruksi', 'Klaim'], 
    roles: ['Pendampingan/Advokasi', 'Konsultan'], 
    region: 'DKI Jakarta', 
    rating: 4.7, 
    cases: 156,
    level: 'Advokat Konstruksi',
    languages: ['Indonesia', 'English'],
    availability: 'Bulan Depan',
    verified: false
  },
];

export default function PenilaiAhli() {
  const [filterRole, setFilterRole] = useState('Semua Peran');
  const [selectedExpert, setSelectedExpert] = useState<string | null>(experts[0].id);

  const filtered = experts.filter(e => filterRole === 'Semua Peran' || e.roles.includes(filterRole));
  const activeExpert = experts.find(e => e.id === selectedExpert);

  return (
    <Shell>
      <PageHeader 
        eyebrow="Pilar 3: Ahli & Resolusi" 
        title="Direktori Penilai Ahli" 
        description="Temukan ahli independen untuk mediasi, konsultasi forensik, atau pendampingan sengketa. Keputusan penunjukan dilakukan di luar sistem."
        action={
          <div className="flex gap-2">
            {['Semua Peran', 'Mediator', 'Konsultan', 'Pendampingan/Advokasi'].map(role => (
              <button 
                key={role}
                onClick={() => setFilterRole(role)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-bold transition-colors border",
                  filterRole === role 
                    ? "bg-primary/20 border-primary/50 text-primary" 
                    : "bg-background border-border text-slate-400 hover:text-slate-200"
                )}
              >
                {role}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 flex items-start gap-3 rounded border border-primary/30 bg-primary/5 p-3">
        <Info className="mt-0.5 shrink-0 text-primary" size={16} />
        <p className="text-xs leading-relaxed text-slate-300">
          <strong className="text-primary">DISCLAIMER PROTOTYPE:</strong> Profil penilai ahli, rating, status sertifikasi, dan ketersediaan di halaman ini adalah data sampel fiktif semata. Sistem ini tidak (belum) terhubung dengan database sertifikasi pemerintah (SIKa/LPJK) secara riil.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Expert List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-card border border-border rounded-lg p-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                placeholder="Cari berdasarkan keahlian atau nama..." 
                className="w-full bg-background border border-border rounded py-2 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-primary"
              />
            </div>
            <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 px-3 py-2 border border-border rounded bg-background">
              Filter Tambahan <ChevronDown size={14} />
            </button>
          </div>

          <div className="grid gap-4">
            {filtered.map((expert, i) => (
              <div 
                key={expert.id} 
                onClick={() => setSelectedExpert(expert.id)}
                className={cn(
                  "fade-up cursor-pointer rounded-lg border p-5 transition-all",
                  `delay-${(i % 4) + 1}`,
                  selectedExpert === expert.id 
                    ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(0,180,255,0.05)]" 
                    : "border-border bg-card hover:border-slate-600"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <Briefcase className="text-slate-400" size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                        {expert.name}
                        {expert.verified && (
                          <span title="Status verifikasi demonstrasi">
                            <ShieldCheck size={14} className="text-emerald-500" />
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{expert.level}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        {expert.disciplines.map(d => (
                          <span key={d} className="px-2 py-0.5 bg-white/5 border border-border rounded text-[10px] font-mono text-slate-300">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={14} className="fill-amber-400" />
                      <span className="text-sm font-bold">{expert.rating}</span>
                      <span className="text-[10px] text-slate-500 ml-1">({expert.cases} kasus)</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {expert.roles.map(r => (
                        <span key={r} className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                          r === 'Mediator' ? 'bg-emerald-500/20 text-emerald-400' :
                          r === 'Konsultan' ? 'bg-primary/20 text-primary' :
                           'bg-amber-500/20 text-amber-400'
                        )}>{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filtered.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border rounded-lg bg-card">
                <p className="text-slate-500">Tidak ada ahli yang cocok dengan filter ini.</p>
              </div>
            )}
          </div>
        </div>

        {/* Expert Detail Panel */}
        {activeExpert ? (
          <div className="rounded-lg border border-border bg-card p-6 h-fit sticky top-24 fade-up shadow-card">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-primary/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,180,255,0.1)]">
                <Briefcase className="text-primary" size={24} />
              </div>
              <div>
                <h2 className="font-display font-bold text-lg text-white leading-tight mb-1">{activeExpert.name}</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1.5"><MapPin size={12} /> {activeExpert.region}</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <h4 className="text-[10px] font-mono uppercase text-slate-500 mb-2">Status Ketersediaan</h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm font-bold text-slate-200">{activeExpert.availability}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono uppercase text-slate-500 mb-2">Bahasa Hukum & Teknis</h4>
                <div className="flex items-center gap-2">
                  <Languages size={14} className="text-slate-400" />
                  <span className="text-sm text-slate-300">{activeExpert.languages.join(', ')}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono uppercase text-slate-500 mb-2">Verifikasi Standar (Mock)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Sertifikat Kompetensi</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1"><ShieldCheck size={12}/> Valid</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Conflict of Interest</span>
                    <span className="text-slate-300">Belum Dicek</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border space-y-3">
                <button className="w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded hover:bg-primary/90 transition-colors">
                  Ajukan Penunjukan (Draft)
                </button>
                <button className="w-full py-2.5 bg-transparent border border-border text-slate-300 font-bold text-xs rounded hover:bg-white/5 transition-colors">
                  Cek Konflik Kepentingan
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-6 flex flex-col items-center justify-center text-center text-slate-500">
            <Briefcase size={32} className="mb-3 opacity-20" />
            <p className="text-sm">Pilih penilai ahli untuk melihat detail</p>
          </div>
        )}
      </div>
    </Shell>
  );
}
