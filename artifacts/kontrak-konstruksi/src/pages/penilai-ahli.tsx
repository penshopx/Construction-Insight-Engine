import { useEffect, useMemo, useState } from "react";
import { Briefcase, Info, Search, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Shell } from "@/components/layout";
import { cn } from "@/lib/utils";
import { ExpertAssignment, getListExpertAssignmentsQueryKey, useCreateExpertAssignment, useListExpertAssignments, useUpdateExpertAssignment } from "@workspace/api-client-react";

const input = "w-full rounded border border-border bg-background px-3 py-2 text-sm text-slate-200";
function ConflictEditor({ assignment, update }: { assignment: ExpertAssignment; update: ReturnType<typeof useUpdateExpertAssignment> }) {
  const server = { status: assignment.conflictStatus, declaration: assignment.conflictDeclaration ?? "" };
  const [draft, setDraft] = useState({ id: assignment.id, ...server, server, dirty: false, conflict: false });
  useEffect(() => setDraft((current) => {
    if (current.id !== assignment.id) return { id: assignment.id, ...server, server, dirty: false, conflict: false };
    const changed = current.server.status !== server.status || current.server.declaration !== server.declaration;
    return changed && current.dirty ? { ...current, server, conflict: true } : changed ? { id: assignment.id, ...server, server, dirty: false, conflict: false } : current;
  }), [assignment.id, server.status, server.declaration]);
  const save = (data: { conflictStatus?: string; conflictDeclaration?: string }) => {
    if (draft.conflict) return;
    update.mutate({ id: assignment.id, data }, { onSuccess: () => setDraft((v) => ({ ...v, dirty: false, server: { status: data.conflictStatus ?? v.server.status, declaration: data.conflictDeclaration ?? v.server.declaration } })) });
  };
  const reload = () => setDraft({ id: assignment.id, ...server, server, dirty: false, conflict: false });
  return <><select data-testid={`select-conflict-${assignment.id}`} value={draft.status} onChange={(e) => { setDraft((v) => ({ ...v, status: e.target.value, dirty: true })); save({ conflictStatus: e.target.value }); }} className={input}><option value="PENDING">Belum dideklarasikan</option><option value="CLEAR">Tidak ada konflik yang dinyatakan</option><option value="DISCLOSED">Konflik dinyatakan</option></select><textarea data-testid={`input-conflict-${assignment.id}`} className={`${input} min-h-20`} value={draft.declaration} onChange={(e) => setDraft((v) => ({ ...v, declaration: e.target.value, dirty: true }))} onBlur={(e) => save({ conflictDeclaration: e.target.value, conflictStatus: e.target.value ? "DISCLOSED" : draft.status })} placeholder="Deklarasi atau catatan konflik"/>{draft.conflict && <div data-testid={`notice-conflict-${assignment.id}`} className="rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200">Deklarasi berubah di server. Draf lokal dipertahankan.<button data-testid={`button-reload-conflict-${assignment.id}`} onClick={reload} className="ml-2 font-bold underline">Muat ulang</button></div>}</>;
}
export default function PenilaiAhli() {
  const qc = useQueryClient();
  const query = useListExpertAssignments({ query: { staleTime: 30_000, refetchOnWindowFocus: true, queryKey: getListExpertAssignmentsQueryKey() } });
  const create = useCreateExpertAssignment({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListExpertAssignmentsQueryKey() }) } });
  const update = useUpdateExpertAssignment({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListExpertAssignmentsQueryKey() }) } });
  const [selected, setSelected] = useState<number>();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ expertName: "", expertContact: "", role: "Penilai Ahli", scope: "" });
  const assignments = query.data ?? [];
  const filtered = useMemo(() => assignments.filter((x) => `${x.expertName} ${x.role} ${x.scope}`.toLowerCase().includes(search.toLowerCase())), [assignments, search]);
  const active = assignments.find((x) => x.id === selected);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  return <Shell><PageHeader eyebrow="Pilar 3: Ahli & Resolusi" title="Ruang Penilai Ahli" description="Kelola penugasan ahli, ruang lingkup, dan deklarasi konflik secara kolaboratif. Status verifikasi eksternal tidak disimpulkan oleh aplikasi."/>
    <div className="mb-6 flex gap-3 rounded border border-primary/30 bg-primary/5 p-3 text-xs text-slate-300"><Info className="shrink-0 text-primary" size={16}/><span><strong className="text-primary">CATATAN:</strong> Rekam penerimaan ruang lingkup dan konflik adalah catatan administratif untuk ditinjau para pihak.</span></div>
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]"><div className="space-y-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/><input data-testid="input-search-expert" className={`${input} pl-9`} placeholder="Cari penugasan ahli..." value={search} onChange={(e) => setSearch(e.target.value)}/></div>
      {query.isLoading && <p className="text-xs text-slate-500">Memuat penugasan...</p>}{query.isError && <p className="text-xs text-red-400">Penugasan gagal dimuat.</p>}{!query.isLoading && !filtered.length && <p className="rounded border border-dashed border-border p-6 text-center text-xs text-slate-500">Belum ada penugasan ahli.</p>}
      {filtered.map((x) => <button data-testid={`card-expert-${x.id}`} key={x.id} onClick={() => setSelected(x.id)} className={cn("w-full rounded-lg border p-5 text-left", selected === x.id ? "border-primary bg-primary/5" : "border-border bg-card")}><div className="flex items-start justify-between"><div className="flex gap-3"><Briefcase className="mt-1 text-primary" size={20}/><div><h3 className="font-bold text-slate-200">{x.expertName}</h3><p className="mt-1 text-xs text-slate-400">{x.role}</p></div></div><span className="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-400">{x.status}</span></div><p className="mt-3 text-xs text-slate-400">{x.scope}</p><p className="mt-3 text-[10px] text-slate-500">Konflik: {x.conflictStatus}</p></button>)}
    </div><div className="space-y-4"><form className="space-y-2 rounded-lg border border-dashed border-border bg-card p-5" onSubmit={(e) => { e.preventDefault(); create.mutate({ data: form }, { onSuccess: (v) => { setSelected(v.id); setForm({ expertName: "", expertContact: "", role: "Penilai Ahli", scope: "" }); } }); }}><h3 className="text-sm font-bold text-slate-200">Tambah penugasan</h3><input data-testid="input-expert-name" required className={input} placeholder="Nama ahli" value={form.expertName} onChange={(e) => set("expertName", e.target.value)}/><input className={input} placeholder="Kontak (opsional)" value={form.expertContact} onChange={(e) => set("expertContact", e.target.value)}/><input className={input} placeholder="Peran" value={form.role} onChange={(e) => set("role", e.target.value)}/><textarea data-testid="input-expert-scope" required className={`${input} min-h-24`} placeholder="Ruang lingkup penugasan" value={form.scope} onChange={(e) => set("scope", e.target.value)}/><button data-testid="button-create-expert" disabled={create.isPending} className="w-full rounded bg-primary py-2 text-xs font-bold text-primary-foreground">{create.isPending ? "Menyimpan..." : "Simpan penugasan"}</button></form>
      {active && <div className="space-y-3 rounded-lg border border-border bg-card p-5"><h3 className="font-bold text-slate-200">{active.expertName}</h3><p className="text-xs text-slate-400">Ruang lingkup: {active.scope}</p><button data-testid={`button-accept-scope-${active.id}`} disabled={active.status === "ACCEPTED" || update.isPending} onClick={() => update.mutate({ id: active.id, data: { scopeAccepted: true } })} className="w-full rounded border border-primary/30 px-3 py-2 text-xs font-bold text-primary">{active.status === "ACCEPTED" ? "Ruang lingkup diterima" : "Terima ruang lingkup"}</button><label className="text-[10px] uppercase text-slate-500">Status konflik</label><ConflictEditor assignment={active} update={update}/><p className="text-[10px] text-slate-500"><ShieldCheck size={12} className="mr-1 inline"/>Status ini tidak menggantikan pemeriksaan independen.</p></div>}</div></div>
  </Shell>;
}