import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getListWorkItemsQueryKey, useCreateWorkItem, useListWorkItems } from '@workspace/api-client-react';
import { PageHeader, Shell } from '@/components/layout';
import { Database, FileCheck2, Fingerprint, Hash, Lock, Plus, ShieldCheck, X } from 'lucide-react';

export default function Bukti() {
  const [showAdd, setShowAdd] = useState(false);
  const { data: evidence = [], isLoading, isError } = useListWorkItems({ category: 'evidence' });

  return (
    <Shell>
      <PageHeader
        eyebrow="Brankas Bukti"
        title="Evidence Vault"
        description="Catat dokumen dan bukti kontraktual dalam satu register permanen. Verifikasi forensik tetap harus dilakukan oleh ahli yang berwenang."
        action={<button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90" data-testid="button-add-evidence"><Plus size={14} /> Tambah Bukti</button>}
      />
      <div className="mb-6 flex items-start gap-3 rounded border border-primary/30 bg-primary/10 p-3"><ShieldCheck className="mt-0.5 shrink-0 text-primary" size={16} /><p className="text-xs leading-relaxed text-primary/80"><strong className="text-primary">REGISTER PERMANEN:</strong> Metadata bukti disimpan di database dan tetap tersedia setelah halaman dimuat ulang. Pencatatan ini bukan sertifikasi keaslian atau jaminan penerimaan sebagai alat bukti.</p></div>
      {isError && <p className="rounded border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400" data-testid="status-evidence-error">Bukti gagal dimuat. Coba muat ulang halaman.</p>}
      {!isLoading && !isError && evidence.length === 0 && <div className="rounded border border-dashed border-border bg-card p-12 text-center"><Database className="mx-auto text-slate-600" size={28} /><p className="mt-3 text-sm text-slate-500" data-testid="text-empty-evidence">Belum ada bukti yang dicatat.</p></div>}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {evidence.map((item, index) => (
            <div key={item.id} className={`fade-up delay-${index % 4 + 1} flex items-start justify-between rounded-lg border border-border bg-card p-4 hover:border-slate-700`} data-testid={`row-evidence-${item.id}`}>
              <div className="flex gap-4"><div className="mt-1 grid h-10 w-10 place-items-center rounded border border-border bg-background text-slate-400"><FileCheck2 size={18} /></div><div><p className="text-sm font-bold text-slate-200">{item.title}</p><p className="mt-0.5 text-xs text-slate-500">{item.description ?? 'Tanpa uraian'}</p><div className="mt-2 flex items-center gap-3"><span className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400"><Hash size={10} /> EVD-{item.id}</span><span className="font-mono text-[10px] text-slate-500">{item.kind}</span></div></div></div>
              <div className="text-right"><p className="font-mono text-[10px] text-slate-500">{new Date(item.createdAt).toLocaleDateString('id-ID')}</p><p className="mt-1 flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-500"><ShieldCheck size={10} /> Tersimpan</p></div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-5"><h3 className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-slate-200"><Fingerprint size={16} className="text-primary" /> Status Register</h3><p className="text-xs leading-relaxed text-slate-500">Setiap catatan memiliki ID database dan waktu pembuatan. Lampiran file serta hash kriptografis belum termasuk dalam register metadata ini.</p><div className="mt-6 rounded border border-border bg-background p-3"><p className="font-mono text-[10px] uppercase text-slate-500">Total bukti</p><p className="mt-1 font-display text-2xl font-bold text-white" data-testid="text-evidence-count">{isLoading ? '—' : evidence.length}</p></div></div>
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
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Register bukti</p><h2 className="mt-2 font-display text-xl font-bold text-white">Tambah bukti kontrak</h2></div><button onClick={onClose} className="rounded p-2 text-slate-500 hover:bg-white/5" data-testid="button-close-evidence"><X size={18} /></button></div><div className="mt-6 grid gap-4"><label><span className="mb-2 block text-xs font-bold text-slate-300">Nama bukti</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white" data-testid="input-evidence-title" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-xs font-bold text-slate-300">Jenis</span><input value={kind} onChange={(event) => setKind(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white" data-testid="input-evidence-kind" /></label><label><span className="mb-2 block text-xs font-bold text-slate-300">Proyek</span><input value={project} onChange={(event) => setProject(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white" data-testid="input-evidence-project" /></label></div><label><span className="mb-2 block text-xs font-bold text-slate-300">Uraian</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white" data-testid="input-evidence-description" /></label></div><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="rounded px-4 py-2 text-xs font-bold text-slate-400" data-testid="button-cancel-evidence">Batal</button><button onClick={submit} disabled={!title.trim() || createEvidence.isPending} className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50" data-testid="button-save-evidence"><Lock size={12} />{createEvidence.isPending ? 'Menyimpan…' : 'Simpan bukti'}</button></div></div></div>;
}