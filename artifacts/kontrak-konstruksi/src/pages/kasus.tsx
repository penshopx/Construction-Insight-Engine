import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader, Shell } from '@/components/layout';
import {
  Search, Plus, ArrowRight, ArrowLeft, CheckCircle2,
  FileText, Scale, Activity, GitPullRequest,
  X, AlertTriangle, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';
import {
  useListContractCases,
  useCreateContractCase,
  useUpdateContractCase,
  useListContractCaseActivities,
  getListContractCasesQueryKey,
  getListContractCaseActivitiesQueryKey,
  ContractCase,
  ContractCaseType,
  ContractCaseStatus,
  getListFailureCasesQueryKey,
  getListExpertAssignmentsQueryKey,
  getListMediationRoomsQueryKey,
  useListFailureCases,
  useListExpertAssignments,
  useListMediationRooms,
} from '@workspace/api-client-react';

// Constants
const STAGES = [
  { level: 0, title: 'Kejadian', desc: 'Identifikasi awal kejadian atau instruksi' },
  { level: 1, title: 'Notice', desc: 'Pemberitahuan resmi kepada pihak terkait' },
  { level: 2, title: 'Bukti & Dampak', desc: 'Pengumpulan dokumen dan perhitungan nilai' },
  { level: 3, title: 'Review', desc: 'Evaluasi klaim oleh konsultan/owner' },
  { level: 4, title: 'Keputusan', desc: 'Persetujuan, penolakan, atau eskalasi' }
];

const SPECIFIC_FIELDS: Record<ContractCaseType, { key: string, label: string }[]> = {
  VO: [
    { key: 'instructionSource', label: 'Sumber Instruksi (Surat/Memo)' },
    { key: 'valuationMethod', label: 'Metode Penilaian (Harga Satuan/Lumpsum)' }
  ],
  EOT: [
    { key: 'delayCause', label: 'Penyebab Keterlambatan' },
    { key: 'daysRequested', label: 'Jumlah Hari Diajukan' }
  ],
  CLAIM: [
    { key: 'claimCategory', label: 'Kategori Klaim (Idle/Acceleration dll)' },
    { key: 'amountBasis', label: 'Dasar Perhitungan Nilai' }
  ],
  NCR: [
    { key: 'location', label: 'Lokasi Ketidaksesuaian' },
    { key: 'severity', label: 'Tingkat Keparahan (Mayor/Minor)' },
    { key: 'correctiveAction', label: 'Usulan Tindakan Perbaikan' }
  ]
};

function CreateCaseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const createCase = useCreateContractCase({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListContractCasesQueryKey() });
        onClose();
      }
    }
  });

  const [type, setType] = useState<ContractCaseType>('VO');
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [noticeDueDate, setNoticeDueDate] = useState('');
  const [clauseBasis, setClauseBasis] = useState('');
  const [description, setDescription] = useState('');
  const [impactValue, setImpactValue] = useState('');
  const [typeDetails, setTypeDetails] = useState<Record<string, string>>({});

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCase.mutate({
      data: {
        type, title, project, eventDate, noticeDueDate: noticeDueDate || undefined,
        clauseBasis, description, impactValue: impactValue || undefined, typeDetails,
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-card">
         <div className="flex justify-between items-center p-4 border-b border-border">
            <h3 className="font-display font-bold text-lg">Inisiasi Kasus Baru</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
         </div>
         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Tipe Kasus</label>
                <select value={type} onChange={e => { setType(e.target.value as ContractCaseType); setTypeDetails({}); }} className="w-full bg-background border border-border rounded p-2 text-sm text-slate-200">
                   <option value="VO">Variation Order (VO)</option>
                   <option value="EOT">Extension of Time (EOT)</option>
                   <option value="CLAIM">Klaim Biaya (CLAIM)</option>
                   <option value="NCR">Non-Conformance (NCR)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Judul Kasus</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-sm text-slate-200" placeholder="Contoh: Perubahan Fasad" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Proyek</label>
                <input required value={project} onChange={e => setProject(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-sm text-slate-200" placeholder="Kode / Nama Proyek" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Klausul Referensi</label>
                <input required value={clauseBasis} onChange={e => setClauseBasis(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-sm text-slate-200" placeholder="Contoh: GCC 4.1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Tanggal Kejadian</label>
                <input type="date" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-sm text-slate-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Tenggat Notice (Opsional)</label>
                <input type="date" value={noticeDueDate} onChange={e => setNoticeDueDate(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-sm text-slate-200" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Deskripsi Kasus</label>
              <textarea required value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-background border border-border rounded p-2 text-sm text-slate-200 min-h-[80px]" placeholder="Uraian detail kejadian..." />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Perkiraan Dampak (Opsional)</label>
              <input value={impactValue} onChange={e => setImpactValue(e.target.value)} placeholder="Misal: Rp 500.000.000 atau 14 Hari" className="w-full bg-background border border-border rounded p-2 text-sm text-slate-200" />
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded p-4 space-y-4">
               <h4 className="text-xs font-bold font-mono text-primary uppercase">Detail Khusus {type}</h4>
               <div className="grid grid-cols-2 gap-4">
                 {SPECIFIC_FIELDS[type].map(field => (
                   <div key={field.key} className="space-y-1">
                     <label className="text-xs font-bold text-slate-300">{field.label}</label>
                     <input required value={typeDetails[field.key] || ''} onChange={e => setTypeDetails({...typeDetails, [field.key]: e.target.value})} className="w-full bg-background border border-border rounded p-2 text-sm text-slate-200" />
                   </div>
                 ))}
               </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-2">
               <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white">Batal</button>
               <button type="submit" disabled={createCase.isPending} className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded hover:bg-primary/90 disabled:opacity-50">
                 {createCase.isPending ? 'Menyimpan...' : 'Simpan Kasus'}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}

function CaseWorkflow({ caseData }: { caseData: ContractCase }) {
  const queryClient = useQueryClient();
  const updateCase = useUpdateContractCase({
     mutation: {
        onSuccess: () => {
           queryClient.invalidateQueries({ queryKey: getListContractCasesQueryKey() });
           queryClient.invalidateQueries({ queryKey: getListContractCaseActivitiesQueryKey(caseData.id) });
        }
     }
  });

  const handleAdvance = () => {
     if (caseData.currentStage >= 4) return;
     const nextStage = STAGES[caseData.currentStage + 1];
     const note = prompt(`Maju ke tahap "${nextStage.title}".\nMasukkan catatan (opsional):`) ?? `Melanjutkan ke tahap ${nextStage.title}`;
     updateCase.mutate({ id: caseData.id, data: { currentStage: caseData.currentStage + 1, changeNote: note } });
  };

  const handleRegress = () => {
     if (caseData.currentStage <= 0) return;
     const prevStage = STAGES[caseData.currentStage - 1];
     const note = prompt(`Kembali ke tahap "${prevStage.title}".\nMasukkan catatan alasan mundurnya tahap ini:`);
     if (note === null) return;
     updateCase.mutate({ id: caseData.id, data: { currentStage: caseData.currentStage - 1, changeNote: note || `Mundur ke tahap ${prevStage.title}` } });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
       <div className="flex justify-between items-center mb-5">
          <h3 className="font-display font-bold text-sm flex items-center gap-2"><GitPullRequest size={16} className="text-primary" /> Alur Resolusi (Workflow)</h3>
          <div className="flex items-center gap-2">
             <button onClick={handleRegress} disabled={caseData.currentStage === 0 || updateCase.isPending} className="p-1.5 bg-white/5 border border-border rounded text-slate-400 hover:text-white disabled:opacity-30"><ArrowLeft size={14} /></button>
             <button onClick={handleAdvance} disabled={caseData.currentStage === 4 || updateCase.isPending} className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded text-xs font-bold hover:bg-primary/20 disabled:opacity-30 flex items-center gap-2">
                Maju Tahap <ArrowRight size={14} />
             </button>
          </div>
       </div>

       <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-4 w-[2px] bg-border z-0"></div>
          <div className="space-y-6 relative z-10">
             {STAGES.map((stage) => {
                const isDone = stage.level < caseData.currentStage;
                const isCurrent = stage.level === caseData.currentStage;
                const isPending = stage.level > caseData.currentStage;

                return (
                   <div key={stage.level} className="flex gap-4">
                      <div className={cn(
                         "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 bg-card -ml-[11px] mt-0.5",
                         isDone ? "border-primary text-primary" :
                         isCurrent ? "border-amber-400 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)] bg-amber-400/10" :
                         "border-border text-slate-600"
                      )}>
                         {isDone ? <CheckCircle2 size={12} strokeWidth={3} /> :
                          isCurrent ? <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div> :
                          <span className="font-mono text-[9px]">{stage.level + 1}</span>}
                      </div>

                      <div className={cn(
                         "flex-1 border rounded-lg p-3 transition-colors",
                         isCurrent ? "border-amber-900/50 bg-amber-950/10" :
                         isDone ? "border-border bg-background/50 opacity-80" :
                         "border-dashed border-border bg-transparent opacity-50"
                      )}>
                         <div className="flex justify-between items-start mb-1">
                            <h4 className={cn(
                               "text-sm font-bold",
                               isCurrent ? "text-amber-400" :
                               isDone ? "text-slate-200" : "text-slate-500"
                            )}>{stage.title}</h4>
                         </div>
                         <p className="text-xs text-slate-400">{stage.desc}</p>
                      </div>
                   </div>
                )
             })}
          </div>
       </div>
    </div>
  );
}

function EvidenceManager({ caseData }: { caseData: ContractCase }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const updateCase = useUpdateContractCase({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListContractCasesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListContractCaseActivitiesQueryKey(caseData.id) });
        setOpen(false);
        setName('');
        setNote('');
      }
    }
  });

  const handleAdd = (e: React.FormEvent) => {
     e.preventDefault();
     updateCase.mutate({
        id: caseData.id,
        data: {
          evidence: [...(caseData.evidence || []), { name, note: note || undefined }],
          changeNote: `Menambahkan bukti: ${name}`
        }
     });
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
       <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-bold flex items-center gap-2"><FileText size={16} className="text-primary" /> Metadata Dokumen Pendukung</h4>
          {!open && <button onClick={() => setOpen(true)} className="text-[10px] font-bold px-2 py-1 bg-white/5 border border-border rounded hover:bg-white/10">+ Tambah</button>}
       </div>

       {open && (
          <form onSubmit={handleAdd} className="mb-4 bg-background border border-border rounded p-3 space-y-2">
             <input required placeholder="Nama Dokumen / Jenis Bukti" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-slate-200" />
             <input placeholder="Catatan Tambahan (Opsional)" value={note} onChange={e=>setNote(e.target.value)} className="w-full bg-card border border-border rounded px-2 py-1.5 text-xs text-slate-200" />
             <div className="flex gap-2 justify-end pt-1">
                <button type="button" onClick={() => setOpen(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-200">Batal</button>
                <button type="submit" disabled={updateCase.isPending} className="text-[10px] font-bold px-3 py-1.5 bg-primary text-primary-foreground rounded disabled:opacity-50">Simpan Bukti</button>
             </div>
          </form>
       )}

       <div className="space-y-2">
          {(!caseData.evidence || caseData.evidence.length === 0) && (
            <p className="text-xs text-slate-500 italic">Belum ada bukti yang dilampirkan ke dalam kasus ini.</p>
          )}
          {caseData.evidence?.map((ev, i) => (
             <div key={i} className="flex flex-col p-3 bg-white/5 border border-white/5 rounded">
                <span className="text-xs font-bold text-slate-200">{ev.name}</span>
                {ev.note && <span className="text-[10px] text-slate-400 mt-1">{ev.note}</span>}
             </div>
          ))}
       </div>
    </div>
  );
}

function ActivitiesPanel({ caseId }: { caseId: number }) {
  const { data: activities = [] } = useListContractCaseActivities(caseId, {
    query: { enabled: !!caseId, queryKey: getListContractCaseActivitiesQueryKey(caseId) }
  });

  return (
    <div className="bg-card border border-border rounded-lg p-5">
       <h4 className="text-sm font-bold mb-5 flex items-center gap-2"><Activity size={16} className="text-primary" /> Riwayat Perubahan yang Dicatat</h4>
       <div className="space-y-5 max-h-[300px] overflow-y-auto scrollbar-thin pr-2">
          {activities.length === 0 && <p className="text-xs text-slate-500 italic">Belum ada riwayat aktivitas yang tercatat.</p>}
          {activities.map(act => (
             <div key={act.id} className="relative pl-4 border-l border-border">
                <div className="absolute w-2 h-2 rounded-full bg-slate-700 left-[-4.5px] top-1"></div>
                <p className="text-[9px] font-mono text-slate-500 mb-0.5">{new Date(act.createdAt).toLocaleString('id-ID')}</p>
                <p className="text-xs font-bold text-slate-200">{act.action}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{act.detail}</p>
                {act.actor && <p className="text-[9px] text-slate-500 mt-1 font-mono">Oleh: {act.actor}</p>}
             </div>
          ))}
       </div>
    </div>
  );
}

function CollaborationLinks({ caseId }: { caseId: number }) {
  const failures = useListFailureCases({ query: { staleTime: 30_000, queryKey: getListFailureCasesQueryKey() } });
  const experts = useListExpertAssignments({ query: { staleTime: 30_000, queryKey: getListExpertAssignmentsQueryKey() } });
  const rooms = useListMediationRooms({ query: { staleTime: 30_000, queryKey: getListMediationRoomsQueryKey() } });
  const linkedFailures = (failures.data ?? []).filter((item) => item.caseId === caseId);
  const linkedExperts = (experts.data ?? []).filter((item) => item.contractCaseId === caseId);
  const linkedRooms = (rooms.data ?? []).filter((item) => item.contractCaseId === caseId);
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h4 className="text-sm font-bold mb-1 flex items-center gap-2"><Briefcase size={16} className="text-primary" /> Kolaborasi Terhubung</h4>
      <p className="text-[11px] text-slate-500 mb-4">Rekam administratif yang terkait dengan kasus ini.</p>
      {failures.isLoading || experts.isLoading || rooms.isLoading ? <p className="text-xs text-slate-500">Memuat ruang kolaborasi...</p> : (
        <div className="space-y-3">
          <CollaborationGroup title="Kegagalan bangunan" href="/kegagalan" items={linkedFailures.map((item) => ({ id: item.id, label: `${item.reference} · ${item.title}` }))} empty="Belum ada laporan kegagalan terhubung." />
          <CollaborationGroup title="Penugasan ahli" href="/penilai-ahli" items={linkedExperts.map((item) => ({ id: item.id, label: `${item.expertName} · ${item.status}` }))} empty="Belum ada penugasan ahli terhubung." />
          <CollaborationGroup title="Ruang mediasi" href="/mediasi" items={linkedRooms.map((item) => ({ id: item.id, label: `${item.reference} · ${item.title}` }))} empty="Belum ada ruang mediasi terhubung." />
        </div>
      )}
    </div>
  );
}

function CollaborationGroup({ title, href, items, empty }: { title: string; href: string; items: Array<{ id: number; label: string }>; empty: string }) {
  return <div className="rounded border border-border bg-background p-3"><div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-300">{title}</span><Link href={href} className="text-[10px] font-bold text-primary hover:underline">Buka ruang</Link></div>{items.length ? items.map((item) => <p data-testid={`linked-collaboration-${item.id}`} key={item.id} className="mt-2 text-xs text-slate-400">{item.label}</p>) : <p className="mt-2 text-[11px] italic text-slate-600">{empty}</p>}</div>;
}

export default function Kasus() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: cases = [], isLoading } = useListContractCases();
  const queryClient = useQueryClient();

  const updateCase = useUpdateContractCase({
     mutation: {
        onSuccess: (updated) => {
           queryClient.invalidateQueries({ queryKey: getListContractCasesQueryKey() });
           queryClient.invalidateQueries({ queryKey: getListContractCaseActivitiesQueryKey(updated.id) });
        }
     }
  });

  useEffect(() => {
    if (cases.length > 0 && !selectedId) {
      setSelectedId(cases[0].id);
    }
  }, [cases, selectedId]);

  const filteredCases = cases.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.reference.toLowerCase().includes(search.toLowerCase()) ||
    c.project.toLowerCase().includes(search.toLowerCase())
  );

  const activeCase = cases.find(c => c.id === selectedId);

  const handleStatusChange = (newStatus: ContractCaseStatus) => {
     if (!activeCase) return;
     const note = prompt(`Ubah status ke ${newStatus}. Masukkan catatan:`);
     if (note !== null) {
        updateCase.mutate({ id: activeCase.id, data: { status: newStatus, changeNote: note } });
     }
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Manajemen Kasus & Resolusi"
        title="Joint Case Room"
        description="Ruang kerja operasional untuk alur VO, EOT, CLAIM, dan NCR. Catatan aplikasi membantu administrasi, tetapi bukan audit independen, pendapat hukum, atau chain of custody."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
         <div className="flex flex-col gap-4 h-full max-h-[800px]">
            <div className="flex gap-2 shrink-0">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    placeholder="Cari Kasus..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-background border border-border rounded-md py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
               </div>
               <button onClick={() => setCreateOpen(true)} className="bg-primary text-primary-foreground px-3 rounded-md flex items-center justify-center hover:bg-primary/90 transition-colors font-bold text-xs gap-1">
                  <Plus size={16} />
               </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 scrollbar-thin pr-2 pb-4">
               {isLoading && <p className="text-xs font-mono text-slate-500 text-center py-4 uppercase tracking-widest animate-pulse">Menghubungkan...</p>}
               {!isLoading && filteredCases.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Tidak ada kasus ditemukan.</p>}
               {filteredCases.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border transition-all fade-up group block",
                      `delay-${(i % 4) + 1}`,
                      selectedId === c.id
                        ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(0,180,255,0.05)]'
                        : 'border-border bg-card hover:border-slate-600 hover:bg-white/5'
                    )}
                  >
                     <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                           "font-mono text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded",
                           selectedId === c.id ? "bg-primary/20 text-primary" : "bg-white/5 text-slate-400 group-hover:text-slate-300"
                        )}>
                           {c.type}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{c.reference}</span>
                     </div>
                     <h4 className={cn("text-sm font-bold mb-1 leading-tight", selectedId === c.id ? "text-white" : "text-slate-200")}>{c.title}</h4>
                     <p className="text-xs text-slate-500 mb-3">{c.project}</p>
                     <div className="flex justify-between items-center text-[11px]">
                        <span className="font-mono font-bold text-slate-300">{c.impactValue || 'TBD'}</span>
                        <span className={cn(
                           "px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap",
                           c.status === 'Active' ? "bg-primary/10 text-primary border border-primary/20" :
                            c.status === 'Under Review' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                           c.status === 'Decided' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                           "bg-white/5 text-slate-400 border border-border"
                        )}>{c.status}</span>
                     </div>
                  </button>
               ))}
            </div>
         </div>

         {activeCase ? (
            <div className="rounded-lg border border-border bg-card flex flex-col h-full max-h-[800px] fade-up overflow-hidden shadow-card relative">
               {updateCase.isPending && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
                     <div className="text-primary font-mono text-xs uppercase animate-pulse font-bold tracking-widest border border-primary/30 bg-primary/10 px-4 py-2 rounded">Sinkronisasi Data...</div>
                  </div>
               )}
               <div className="border-b border-border p-6 bg-background/50 shrink-0">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <span className="font-mono text-[10px] uppercase font-bold text-primary tracking-wider">{activeCase.type}</span>
                           <span className="text-slate-600">•</span>
                           <span className="text-xs text-slate-400">{activeCase.project}</span>
                           <span className="text-slate-600">•</span>
                           <span className="font-mono text-[10px] text-slate-500">{activeCase.reference}</span>
                        </div>
                        <h2 className="font-display text-2xl font-bold text-white mb-2">{activeCase.title}</h2>
                        <p className="text-slate-300 font-mono text-lg">{activeCase.impactValue || 'TBD'}</p>
                     </div>

                     <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2 rounded bg-background border border-border px-3 py-1.5">
                           <Scale size={14} className="text-slate-400" />
                           <span className="text-xs text-slate-300 font-medium">Jalur: <span className="text-primary font-bold">Konstruktif</span></span>
                        </div>
                        <div className="flex items-center gap-2 rounded bg-background border border-border px-2 py-1">
                           <span className="text-[10px] uppercase font-mono text-slate-400">Status:</span>
                           <select value={activeCase.status} onChange={e => handleStatusChange(e.target.value as ContractCaseStatus)} className="bg-transparent border-none text-xs font-bold text-slate-200 focus:outline-none cursor-pointer">
                              <option value="Draft" className="bg-card text-slate-200">Draft</option>
                              <option value="Active" className="bg-card text-slate-200">Active</option>
                              <option value="Under Review" className="bg-card text-slate-200">Under Review</option>
                              <option value="Decided" className="bg-card text-slate-200">Decided</option>
                              <option value="Closed" className="bg-card text-slate-200">Closed</option>
                           </select>
                        </div>
                        {activeCase.owner && (
                           <div className="flex items-center gap-2 px-2 mt-1">
                              <Briefcase size={12} className="text-slate-500" />
                              <span className="text-[10px] text-slate-400">PIC: {activeCase.owner}</span>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                  <div className="grid lg:grid-cols-2 gap-6 pb-6">
                     <div className="space-y-6">
                        <CaseWorkflow caseData={activeCase} />
                        <ActivitiesPanel caseId={activeCase.id} />
                     </div>
                     <div className="space-y-6">
                        <div className="bg-card border border-border rounded-lg p-5">
                           <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-primary" /> Rincian Kasus</h4>
                           <div className="space-y-4">
                              <div>
                                 <span className="text-[10px] uppercase font-mono text-slate-500">Deskripsi Kejadian</span>
                                 <p className="text-sm text-slate-200 mt-1 leading-relaxed">{activeCase.description}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                 <div>
                                    <span className="text-[10px] uppercase font-mono text-slate-500">Tanggal Kejadian</span>
                                    <p className="text-sm text-slate-200 font-bold mt-1">{new Date(activeCase.eventDate).toLocaleDateString('id-ID')}</p>
                                 </div>
                                 <div>
                                    <span className="text-[10px] uppercase font-mono text-slate-500">Klausul Referensi</span>
                                    <div><span className="text-xs text-slate-200 font-mono bg-white/5 px-2 py-0.5 rounded border border-border mt-1 inline-block">{activeCase.clauseBasis}</span></div>
                                 </div>
                              </div>
                              {activeCase.noticeDueDate && (
                                 <div className="pt-4 border-t border-border/50">
                                    <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-500" /> Tenggat Notice (Kontraktual)</span>
                                    <p className="text-sm text-amber-400 font-bold mt-1">{new Date(activeCase.noticeDueDate).toLocaleDateString('id-ID')}</p>
                                 </div>
                              )}
                           </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                           <h4 className="text-xs font-bold font-mono text-primary uppercase mb-4 tracking-widest border-b border-primary/20 pb-2">Spesifikasi {activeCase.type}</h4>
                           <div className="grid gap-4">
                              {Object.entries(activeCase.typeDetails || {}).map(([key, val]) => {
                                 const label = SPECIFIC_FIELDS[activeCase.type]?.find(f => f.key === key)?.label || key;
                                 return (
                                    <div key={key}>
                                       <span className="text-[10px] font-mono text-primary/70 uppercase">{label}</span>
                                       <p className="text-sm text-slate-200 font-medium mt-0.5">{val as string}</p>
                                    </div>
                                 );
                              })}
                           </div>
                        </div>

                        <EvidenceManager caseData={activeCase} />
                         <CollaborationLinks caseId={activeCase.id} />
                     </div>
                  </div>
               </div>
            </div>
         ) : (
            <div className="rounded-lg border border-border bg-card flex items-center justify-center h-full min-h-[400px]">
               <div className="text-center text-slate-500">
                  <Scale size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Pilih kasus dari daftar untuk meninjau data atau buat kasus baru.</p>
               </div>
            </div>
         )}
      </div>
      <CreateCaseDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </Shell>
  );
}
