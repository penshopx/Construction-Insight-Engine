import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, FileText, Search, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader, Shell } from "@/components/layout";
import { cn } from "@/lib/utils";
import {
  getListFailureCasesQueryKey, useCreateFailureCase, useListContractCases,
  useListFailureCases, FailureCase,
} from "@workspace/api-client-react";

const input = "w-full rounded border border-border bg-background px-3 py-2 text-sm text-slate-200";

export default function Kegagalan() {
  const qc = useQueryClient();
  const list = useListFailureCases({ query: { staleTime: 30_000, refetchOnWindowFocus: true, queryKey: getListFailureCasesQueryKey() } });
  const cases = useListContractCases({ query: { staleTime: 30_000, queryKey: ["contract-cases"] } });
  const create = useCreateFailureCase({ mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: getListFailureCasesQueryKey() }) } });
  const [selected, setSelected] = useState<number>();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", project: "", category: "Struktur", severity: "Sedang", description: "", eventDate: new Date().toISOString().slice(0, 10), caseId: "" });
  const failures = list.data ?? [];
  useEffect(() => { if (!selected && failures[0]) setSelected(failures[0].id); }, [failures, selected]);
  const filtered = useMemo(() => failures.filter((f) => `${f.title} ${f.project} ${f.reference}`.toLowerCase().includes(search.toLowerCase())), [failures, search]);
  const active = failures.find((f) => f.id === selected);
  const update = (key: keyof typeof form, value: string) => setForm((v) => ({ ...v, [key]: value }));
  return <Shell>
    <PageHeader eyebrow="Pilar 2: Forensik Bangunan" title="Kegagalan Bangunan & Konstruksi" description="Ruang dokumentasi kolaboratif untuk mencatat kejadian, bukti administratif, dan penugasan ahli. Catatan ini bukan pendapat teknis atau penetapan hukum." action={<div className="flex items-center gap-2 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3"><AlertTriangle className="text-amber-500" size={20}/><span className="text-xs text-amber-200/80">Utamakan K3 dan evakuasi sebelum pemeriksaan.</span></div>}/>
    <div className="mb-6 rounded border border-primary/30 bg-primary/5 p-3 text-xs text-slate-300"><strong className="text-primary">CATATAN ADMINISTRATIF:</strong> Data tersimpan untuk kolaborasi organisasi. Integritas berkas, pengujian teknis, dan penerimaan hukum harus diverifikasi secara terpisah.</div>
    <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
      <div className="space-y-4">
        <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/><input data-testid="input-search-failure" className={`${input} pl-9`} placeholder="Cari laporan..." value={search} onChange={(e) => setSearch(e.target.value)}/></div>
        {list.isLoading && <p className="text-xs text-slate-500">Memuat laporan tersimpan...</p>}
        {list.isError && <p className="text-xs text-red-400">Laporan gagal dimuat. Coba lagi.</p>}
        {!list.isLoading && !filtered.length && <p className="rounded border border-dashed border-border p-5 text-center text-xs text-slate-500">Belum ada laporan dalam organisasi ini.</p>}
        <div className="max-h-[500px] space-y-3 overflow-y-auto">{filtered.map((f) => <button data-testid={`card-failure-${f.id}`} key={f.id} onClick={() => setSelected(f.id)} className={cn("w-full rounded-lg border p-4 text-left", selected === f.id ? "border-amber-500/50 bg-amber-500/5" : "border-border bg-card")}>
          <div className="flex justify-between"><span className="font-mono text-[10px] text-amber-400">{f.severity}</span><span className="font-mono text-[10px] text-slate-500">{f.reference}</span></div><h3 className="mt-2 text-sm font-bold text-slate-200">{f.title}</h3><p className="mt-1 text-xs text-slate-500">{f.project} · {f.category}</p><p className="mt-2 text-[10px] text-slate-400">{f.status}</p>
        </button>)}</div>
        <form className="space-y-2 rounded-lg border border-dashed border-border bg-card p-4" onSubmit={(e) => { e.preventDefault(); create.mutate({ data: { ...form, caseId: form.caseId ? Number(form.caseId) : undefined } }, { onSuccess: (v) => { setSelected(v.id); setForm({ title: "", project: "", category: "Struktur", severity: "Sedang", description: "", eventDate: new Date().toISOString().slice(0, 10), caseId: "" }); } }); }}>
          <h3 className="text-sm font-bold text-slate-200"><Building2 size={15} className="mr-1 inline"/>Buat laporan baru</h3>
          <input data-testid="input-failure-title" required className={input} placeholder="Judul kejadian" value={form.title} onChange={(e) => update("title", e.target.value)}/>
          <input data-testid="input-failure-project" required className={input} placeholder="Proyek" value={form.project} onChange={(e) => update("project", e.target.value)}/>
          <div className="grid grid-cols-2 gap-2"><input className={input} placeholder="Kategori" value={form.category} onChange={(e) => update("category", e.target.value)}/><select className={input} value={form.severity} onChange={(e) => update("severity", e.target.value)}><option>Sedang</option><option>Tinggi</option><option>Kritis</option></select></div>
          <input type="date" className={input} value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)}/>
          <select className={input} value={form.caseId} onChange={(e) => update("caseId", e.target.value)}><option value="">Hubungkan ke kasus kontrak (opsional)</option>{(cases.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.reference} · {c.title}</option>)}</select>
          <textarea data-testid="input-failure-description" required className={`${input} min-h-20`} placeholder="Uraian kejadian" value={form.description} onChange={(e) => update("description", e.target.value)}/>
          <button data-testid="button-create-failure" disabled={create.isPending} className="w-full rounded bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">{create.isPending ? "Menyimpan..." : "Simpan laporan"}</button>
        </form>
      </div>
      {active ? <FailureDetail failure={active}/> : <div className="flex min-h-96 items-center justify-center rounded-lg border border-dashed border-border text-sm text-slate-500">Pilih laporan untuk melihat ruang kolaborasi.</div>}
    </div>
  </Shell>;
}

function FailureDetail({ failure }: { failure: FailureCase }) {
  return <div className="rounded-lg border border-border bg-card p-6 shadow-card"><div className="flex items-start justify-between border-b border-border pb-5"><div><p className="font-mono text-xs text-slate-500">{failure.reference}</p><h2 data-testid={`text-failure-title-${failure.id}`} className="mt-2 font-display text-2xl font-bold text-white">{failure.title}</h2><p className="mt-2 text-sm text-slate-400">{failure.project} · {failure.category} · {failure.eventDate}</p></div><span className="rounded border border-amber-500/30 px-3 py-1 text-xs text-amber-400">{failure.severity}</span></div><div className="grid gap-5 pt-5 md:grid-cols-2"><section className="rounded border border-border bg-background p-4"><h3 className="mb-3 text-sm font-bold text-slate-200"><FileText size={15} className="mr-2 inline text-primary"/>Uraian kejadian</h3><p className="text-sm leading-relaxed text-slate-300">{failure.description}</p></section><section className="rounded border border-border bg-background p-4"><h3 className="mb-3 text-sm font-bold text-slate-200"><ShieldCheck size={15} className="mr-2 inline text-primary"/>Kolaborasi</h3><p className="text-xs leading-relaxed text-slate-400">Laporan ini tersimpan pada organisasi dan dapat dihubungkan dengan penugasan ahli atau ruang mediasi. Aktivitas yang tercatat adalah rekam administratif, bukan penerimaan hukum otomatis.</p><p className="mt-4 text-xs text-slate-500">Status: {failure.status}</p></section></div></div>;
}