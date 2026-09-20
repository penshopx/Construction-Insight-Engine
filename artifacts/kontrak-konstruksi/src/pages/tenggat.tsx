import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListWorkItemsQueryKey,
  useCreateWorkItem,
  useListWorkItems,
  useUpdateWorkItem,
  type WorkItem,
} from '@workspace/api-client-react';
import { PageHeader, Shell } from '@/components/layout';
import { AlertTriangle, Calendar, Check, Clock, Info, Plus, X } from 'lucide-react';

type DeadlineFilter = 'all' | 'action_needed' | 'resolved';

export default function Tenggat() {
  const [filter, setFilter] = useState<DeadlineFilter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();
  const { data: deadlines = [], isLoading, isError } = useListWorkItems({ category: 'administration' });
  const updateDeadline = useUpdateWorkItem();
  const filtered = deadlines.filter((deadline) => {
    if (filter === 'resolved') return deadline.completed;
    if (filter === 'action_needed') return !deadline.completed && deadline.status === 'Perlu ditinjau';
    return true;
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListWorkItemsQueryKey({ category: 'administration' }) });
  const resolveDeadline = (deadline: WorkItem) => {
    updateDeadline.mutate(
      { id: deadline.id, data: { completed: true, status: 'Selesai' } },
      { onSuccess: refresh },
    );
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Early Warning System"
        title="Tenggat Hukum"
        description="Monitor deadline kontraktual kritis. Kegagalan memenuhi tenggat dapat menggugurkan hak klaim atau memicu denda keterlambatan."
        action={
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90" data-testid="button-add-deadline">
            <Plus size={14} /> Tambah Tenggat
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-border bg-card p-1">
          {([
            ['all', 'Semua'],
            ['action_needed', 'Perlu Tindakan'],
            ['resolved', 'Selesai'],
          ] as const).map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded px-3 py-1.5 text-xs font-bold ${filter === value ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`} data-testid={`button-deadline-filter-${value}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[10px] text-slate-500" data-testid="text-deadline-storage">Database aktif</span>
      </div>

      {isError && <p className="rounded border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400" data-testid="status-deadline-error">Tenggat gagal dimuat. Coba muat ulang halaman.</p>}
      {!isLoading && !isError && filtered.length === 0 && <p className="rounded border border-dashed border-border bg-card p-10 text-center text-sm text-slate-500" data-testid="text-empty-deadlines">Belum ada tenggat pada filter ini.</p>}
      <div className="grid gap-4">
        {filtered.map((deadline, index) => (
          <div key={deadline.id} className={`fade-up delay-${index % 4 + 1} flex flex-col justify-between gap-4 rounded-lg border p-4 md:flex-row md:items-center md:p-5 ${deadline.completed ? 'border-emerald-900/30 bg-emerald-950/10 opacity-70' : deadline.status === 'Perlu ditinjau' ? 'border-red-900/50 bg-red-950/10' : 'border-border bg-card'}`} data-testid={`row-deadline-${deadline.id}`}>
            <div className="flex gap-4">
              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${deadline.completed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
                {deadline.completed ? <Check size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-red-300">{deadline.kind}</span>
                  <span className="text-xs text-slate-500">{deadline.project ?? 'Tanpa proyek'}</span>
                </div>
                <h3 className={`text-sm font-bold ${deadline.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{deadline.title}</h3>
                {deadline.description && <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Info size={12} /> {deadline.description}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between gap-6 md:min-w-[280px] md:justify-end">
              <div className="text-left md:text-right">
                <p className="font-mono text-[10px] uppercase text-slate-500">Jatuh Tempo</p>
                <p className="font-mono font-bold text-slate-200">{deadline.due ?? 'Belum ditentukan'}</p>
                {!deadline.completed && <p className="mt-0.5 text-[10px] font-bold text-red-500"><Clock size={10} className="mr-1 inline" />Perlu dipantau</p>}
              </div>
              {!deadline.completed && <button onClick={() => resolveDeadline(deadline)} disabled={updateDeadline.isPending} className="shrink-0 rounded border border-primary/30 bg-primary/20 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/30 disabled:opacity-50" data-testid={`button-complete-deadline-${deadline.id}`}>Selesai</button>}
            </div>
          </div>
        ))}
      </div>
      {showAdd && <DeadlineModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
    </Shell>
  );
}

function DeadlineModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [due, setDue] = useState('');
  const [kind, setKind] = useState('Notice');
  const [description, setDescription] = useState('');
  const createDeadline = useCreateWorkItem();
  const submit = () => createDeadline.mutate(
    { data: { category: 'administration', title, project, due, kind, description, owner: 'RA', status: 'Perlu ditinjau' } },
    { onSuccess: () => { onSaved(); onClose(); } },
  );

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Agenda kontraktual</p><h2 className="mt-2 font-display text-xl font-bold text-white">Tambah tenggat hukum</h2></div><button onClick={onClose} className="rounded p-2 text-slate-500 hover:bg-white/5" data-testid="button-close-deadline"><X size={18} /></button></div><div className="mt-6 grid gap-4"><label><span className="mb-2 block text-xs font-bold text-slate-300">Tindakan</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white" data-testid="input-deadline-title" /></label><label><span className="mb-2 block text-xs font-bold text-slate-300">Proyek</span><input value={project} onChange={(event) => setProject(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white" data-testid="input-deadline-project" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-xs font-bold text-slate-300">Jenis</span><input value={kind} onChange={(event) => setKind(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white" data-testid="input-deadline-kind" /></label><label><span className="mb-2 block text-xs font-bold text-slate-300">Jatuh tempo</span><input value={due} onChange={(event) => setDue(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white" data-testid="input-deadline-due" /></label></div><label><span className="mb-2 block text-xs font-bold text-slate-300">Dasar klausul / catatan</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white" data-testid="input-deadline-description" /></label></div><div className="mt-6 flex justify-end gap-3"><button onClick={onClose} className="rounded px-4 py-2 text-xs font-bold text-slate-400" data-testid="button-cancel-deadline">Batal</button><button onClick={submit} disabled={!title.trim() || createDeadline.isPending} className="rounded bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50" data-testid="button-save-deadline">{createDeadline.isPending ? 'Menyimpan…' : 'Simpan tenggat'}</button></div></div></div>;
}