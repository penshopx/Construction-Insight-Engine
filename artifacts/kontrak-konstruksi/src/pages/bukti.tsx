import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getListWorkItemsQueryKey, useCreateWorkItem, useListWorkItems } from '@workspace/api-client-react';
import { PageHeader, Shell } from '@/components/layout';
import { Database, FileCheck2, Fingerprint, Hash, Lock, Plus, ShieldCheck, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Bukti() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: evidence = [], isLoading, isError } = useListWorkItems({ category: 'evidence' });

  return (
    <Shell>
      <PageHeader
        eyebrow="Pilar 1: Hukum & Kontrak"
        title="Evidence Vault"
        description="Amankan dokumen kontraktual, foto lapangan, dan notifikasi dalam satu register permanen. Persiapan krusial untuk mediasi atau forensik."
        action={<button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(0,180,255,0.2)]" data-testid="button-add-evidence"><Plus size={14} /> Tambah Bukti</button>}
      />
      
      <div className="mb-6 flex items-start gap-3 rounded border border-primary/30 bg-primary/10 p-4 shadow-[0_0_10px_rgba(0,180,255,0.05)]">
        <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={18} />
        <p className="text-xs leading-relaxed text-slate-300">
          <strong className="text-primary tracking-wider font-mono">CHAIN OF CUSTODY:</strong> Metadata bukti dicatat secara berurut di database server dan tetap tersedia. Fitur ini merupakan alat administratif proyek, bukan menjamin keabsahan hukum tanpa pengujian forensik resmi.
        </p>
      </div>
      
      {isError && <p className="rounded border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400" data-testid="status-evidence-error">Bukti gagal dimuat. Coba muat ulang halaman.</p>}
      {!isLoading && !isError && evidence.length === 0 && <div className="rounded border border-dashed border-border bg-card p-16 text-center"><Database className="mx-auto text-slate-600 mb-4" size={32} /><p className="text-sm text-slate-500" data-testid="text-empty-evidence">Vault kosong. Belum ada bukti yang diregistrasikan.</p></div>}
      
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {evidence.map((item, index) => (
            <div key={item.id} className={cn(
              "fade-up flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors group",
              `delay-${(index % 4) + 1}`
            )} data-testid={`row-evidence-${item.id}`}>
              <div className="flex gap-4 items-start w-full sm:w-auto">
                <div className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded border border-border bg-background text-slate-400 group-hover:text-primary transition-colors">
                  <FileCheck2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.description ?? 'Tanpa uraian'}</p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <span className="flex items-center gap-1 rounded bg-white/5 border border-border px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                      <Hash size={10} /> EVD-{item.id}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">{item.kind}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:text-right border-t border-border sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                <p className="font-mono text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString('id-ID')}</p>
                <p className="sm:mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                  <Lock size={10} /> Tersimpan
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="rounded-lg border border-border bg-card p-6 h-fit shadow-card">
          <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-slate-200">
            <Fingerprint size={16} className="text-primary" /> Status Register
          </h3>
          <p className="text-xs leading-relaxed text-slate-500 mb-6">
            Setiap pendaftaran menerima ID urut dan waktu pencatatan dari server. Gunakan ID ini sebagai referensi saat mediasi.
          </p>
          <div className="rounded border border-border bg-background p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full"></div>
            <p className="font-mono text-[10px] uppercase text-slate-500 tracking-wider">Total Item Tersimpan</p>
            <p className="mt-1 font-display text-3xl font-bold text-white tracking-tight" data-testid="text-evidence-count">
              {isLoading ? '—' : evidence.length}
            </p>
          </div>
        </div>
      </div>
      {showAdd && <EvidenceModal onClose={() => setShowAdd(false)} />}
    </Shell>
  );
}

function EvidenceModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState('Dokumen');
  const [project, setProject] = useState('');
  const queryClient = useQueryClient();
  const createEvidence = useCreateWorkItem();
  const submit = () => createEvidence.mutate(
    { data: { category: 'evidence', title, description, kind, project, owner: 'RA', status: 'Berjalan' } },
    { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListWorkItemsQueryKey({ category: 'evidence' }) }); onClose(); } },
  );
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-border pb-4 mb-4"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Register Bukti</p><h2 className="mt-1 font-display text-xl font-bold text-white">Amankan Data Baru</h2></div><button onClick={onClose} className="rounded p-2 text-slate-500 hover:text-white hover:bg-white/5 transition-colors" data-testid="button-close-evidence"><X size={18} /></button></div><div className="grid gap-4"><label><span className="mb-2 block text-xs font-bold text-slate-300">Nama/Judul Bukti</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors" data-testid="input-evidence-title" placeholder="Cth: Foto Retak Kolom" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-xs font-bold text-slate-300">Kategori Form</span><input value={kind} onChange={(event) => setKind(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors" data-testid="input-evidence-kind" /></label><label><span className="mb-2 block text-xs font-bold text-slate-300">Lokasi/Proyek</span><input value={project} onChange={(event) => setProject(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors" data-testid="input-evidence-project" placeholder="Opsional" /></label></div><label><span className="mb-2 block text-xs font-bold text-slate-300">Uraian / Deskripsi Konteks</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors" data-testid="input-evidence-description" placeholder="Uraikan apa yang ditunjukkan bukti ini dan hubungannya dengan potensi sengketa..." /></label></div><div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border"><button onClick={onClose} className="rounded px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors" data-testid="button-cancel-evidence">Batal</button><button onClick={submit} disabled={!title.trim() || createEvidence.isPending} className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors" data-testid="button-save-evidence"><Lock size={12} />{createEvidence.isPending ? 'Menyimpan…' : 'Simpan ke Vault'}</button></div></div></div>;
}
