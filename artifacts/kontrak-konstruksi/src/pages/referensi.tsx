import { useState, useMemo } from 'react';
import { PageHeader, Shell } from '@/components/layout';
import { Search, Filter, FileText, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const referenceItems = [
  { id: 'ref-01', title: 'Manajemen Kontrak', category: 'Dasar & Prinsip', type: 'Modul', updated: 'Sumber Utama', description: 'Landasan merencanakan, mengorganisasikan, dan mengendalikan kontrak proyek agar tidak merugi.' },
  { id: 'ref-02', title: 'Bentuk Kontrak Konstruksi', category: 'Bentuk Kontrak', type: 'Panduan', updated: 'Sumber Utama', description: 'Perbandingan risiko kontrak lump sum, harga satuan, design & build, EPC.' },
  { id: 'ref-03', title: 'Syarat Umum Kontrak', category: 'Dokumen', type: 'Klausul', updated: 'Sumber Utama', description: 'Struktur dokumen, urutan kekuatan hukum, hak-kewajiban, pembayaran, dan pemutusan.' },
  { id: 'ref-04', title: 'Klaim dan Penyelesaian Sengketa', category: 'Sengketa', type: 'Checklist', updated: 'Praktik Kerja', description: 'Mencatat peristiwa, bukti forensik, notifikasi, analisis entitlement, dan jalur arbitrase BANI.' },
  { id: 'ref-05', title: 'Kegagalan Bangunan', category: 'Sengketa', type: 'Hukum', updated: 'UU 2/2017', description: 'Tanggung jawab pidana dan perdata atas kegagalan struktur dan arsitektur selama masa layanan (10 tahun).' },
  { id: 'ref-06', title: 'Administrasi Variation Order', category: 'Administrasi', type: 'SOP', updated: 'Praktik Kerja', description: 'SOP wajib sebelum melaksanakan instruksi lisan dari Owner atau MK di lapangan.' },
];

export default function Referensi() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [selected, setSelected] = useState<string | null>(null);
  
  const categories = ['Semua', 'Sengketa', 'Administrasi', 'Dokumen', 'Bentuk Kontrak', 'Dasar & Prinsip'];
  
  const filtered = useMemo(() => 
    referenceItems.filter((item) => 
      (category === 'Semua' || item.category === category) && 
      `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase())
    ), 
  [category, query]);

  const active = referenceItems.find((item) => item.id === selected);

  return (
    <Shell>
      <PageHeader 
        eyebrow="Perpustakaan Hukum" 
        title="Referensi Kontrak" 
        description="Cari klausul, prosedur administrasi, dan dasar hukum. Pahami posisi Anda sebelum mengambil keputusan di lapangan."
      />

      <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-card p-3 md:flex-row shadow-card">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Cari klaim, EOT, denda, arbitrase..." 
            className="h-10 w-full rounded bg-background border border-border pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-primary transition-colors" 
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
          {categories.map((item) => (
            <button 
              key={item} 
              onClick={() => setCategory(item)} 
              className={cn(
                'whitespace-nowrap rounded px-3 py-2 text-xs font-bold transition-colors border', 
                category === item ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-background border-border text-slate-400 hover:border-slate-600 hover:text-slate-200'
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((item, i) => (
          <button 
            key={item.id} 
            onClick={() => setSelected(item.id)} 
            className={cn(
              'group flex flex-col rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-primary/50 hover:bg-white/5', 
              `fade-up delay-${(i % 4) + 1}`
            )}
          >
            <div className="flex items-start justify-between w-full mb-4">
              <span className="grid h-8 w-8 place-items-center rounded bg-background border border-border text-primary transition-colors group-hover:bg-primary/10">
                <FileText size={16} />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-slate-500 bg-background px-2 py-1 rounded border border-border">
                {item.type}
              </span>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary mb-1">{item.category}</p>
            <h2 className="font-display text-[16px] font-bold leading-tight text-slate-200 mb-2 group-hover:text-primary transition-colors">{item.title}</h2>
            <p className="line-clamp-2 text-xs leading-relaxed text-slate-400 mt-auto">{item.description}</p>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center border border-border border-dashed rounded-lg mt-4">
          <p className="text-slate-500 text-sm">Tidak ada referensi yang cocok dengan pencarian.</p>
        </div>
      )}

      {active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-lg border border-border bg-card p-6 shadow-2xl fade-up">
            <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-primary">{active.category} / {active.type}</span>
                <h2 className="mt-1 font-display text-2xl font-bold text-slate-200">{active.title}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="rounded p-2 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="rounded bg-background border border-border p-4 mb-6">
              <p className="text-sm leading-relaxed text-slate-300">{active.description}</p>
            </div>
            
            <h3 className="font-display text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <ShieldAlert size={16} className="text-primary" /> Penggunaan Defensif
            </h3>
            
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex gap-3">
                <CheckCircle2 className="shrink-0 text-primary mt-0.5" size={16} />
                <span>Gunakan sebagai dasar argumentasi tertulis saat menolak instruksi lisan Owner/MK.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="shrink-0 text-primary mt-0.5" size={16} />
                <span>Sebagai lampiran (attachment) dalam pengajuan Notice of Delay atau klaim biaya.</span>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="shrink-0 text-primary mt-0.5" size={16} />
                <span>Rujukan untuk negosiasi klausul memberatkan sebelum penandatanganan kontrak baru.</span>
              </li>
            </ul>
            
            <div className="mt-8 flex justify-end">
              <button onClick={() => setSelected(null)} className="rounded bg-primary text-primary-foreground px-5 py-2.5 text-xs font-bold hover:bg-primary/90 transition-colors">
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
