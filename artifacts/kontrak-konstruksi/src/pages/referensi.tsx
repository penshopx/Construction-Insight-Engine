import { useDeferredValue, useMemo, useState } from 'react';
import { getSearchReferencesQueryKey, useListReferences, useSearchReferences } from '@workspace/api-client-react';
import { PageHeader, Shell } from '@/components/layout';
import {
  AlertTriangle,
  BookOpen,
  Database,
  FileSearch,
  FileText,
  Fingerprint,
  LoaderCircle,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Referensi() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const deferredQuery = useDeferredValue(query.trim());
  const canSearch = deferredQuery.length >= 2;

  const documentsQuery = useListReferences();
  const searchParams = { q: deferredQuery || '--', category: category === 'Semua' ? undefined : category };
  const searchQuery = useSearchReferences(searchParams, {
    query: { enabled: canSearch, queryKey: getSearchReferencesQueryKey(searchParams) },
  });

  const documents = documentsQuery.data ?? [];
  const categories = useMemo(
    () => ['Semua', ...Array.from(new Set(documents.map((document) => document.category)))],
    [documents],
  );
  const visibleDocuments = category === 'Semua'
    ? documents
    : documents.filter((document) => document.category === category);
  const isLoading = documentsQuery.isLoading || (canSearch && searchQuery.isFetching);
  const isError = documentsQuery.isError || (canSearch && searchQuery.isError);

  return (
    <Shell>
      <PageHeader
        eyebrow="Perpustakaan Hukum"
        title="Cari Isi Dokumen Rujukan"
        description="Telusuri istilah hingga ke potongan isi pasal, klausul, dan topik sumber. Setiap kutipan tetap membawa identitas dokumen asalnya."
        action={
          <div className="hidden text-right md:block">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Indeks tersedia</p>
            <p className="mt-1 font-display text-xl font-bold text-primary">{documents.length} dokumen</p>
          </div>
        }
      />

      <section className="mb-6 rounded-lg border border-border bg-card p-4 shadow-card">
        <label htmlFor="reference-search" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Istilah, pasal, atau topik
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={18} />
          <input
            id="reference-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Contoh: wanprestasi, force majeure, pembayaran, sengketa..."
            className="h-12 w-full rounded-md border border-border bg-background pl-11 pr-4 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-primary"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={cn(
                'whitespace-nowrap rounded border px-3 py-2 text-xs font-bold transition-colors',
                category === item
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-border bg-background text-slate-400 hover:border-slate-600 hover:text-slate-200',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {query.trim().length === 1 && (
        <div className="mb-5 rounded border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
          Masukkan minimal 2 karakter untuk mencari isi dokumen.
        </div>
      )}

      {isLoading && (
        <div className="grid min-h-48 place-items-center rounded-lg border border-border bg-card">
          <div className="text-center text-slate-400">
            <LoaderCircle className="mx-auto mb-3 animate-spin text-primary" size={24} />
            <p className="text-sm">Menelusuri indeks dokumen…</p>
          </div>
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-5 text-red-200">
          <div className="flex items-center gap-2 font-bold"><AlertTriangle size={18} /> Indeks referensi tidak dapat dimuat</div>
          <p className="mt-2 text-sm text-red-300/80">Coba muat ulang halaman. Pencarian tidak menampilkan data pengganti agar sumber tidak menyesatkan.</p>
        </div>
      )}

      {!isLoading && !isError && canSearch && searchQuery.data && (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Hasil pencarian</p>
              <h2 className="mt-1 font-display text-xl font-bold text-slate-100">
                {searchQuery.data.total} kutipan untuk “{searchQuery.data.query}”
              </h2>
            </div>
            <p className="text-xs text-slate-500">Maksimal 50 hasil paling awal</p>
          </div>

          <div className="space-y-4">
            {searchQuery.data.results.map((result) => (
              <article key={result.id} className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
                      {result.category} · Bagian {result.sectionNumber}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold text-slate-100">{result.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{result.heading}</p>
                  </div>
                  <span className="rounded border border-border bg-background px-2 py-1 font-mono text-[10px] text-slate-400">{result.fileType}</span>
                </div>

                <blockquote className="my-4 border-l-2 border-primary bg-background/70 px-4 py-3 text-sm leading-7 text-slate-300">
                  {result.excerpt}
                </blockquote>

                {result.topics.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {result.topics.map((topic) => (
                      <span key={topic} className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">{topic}</span>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 border-t border-border pt-4 text-xs md:grid-cols-[1fr_auto]">
                  <div className="min-w-0 text-slate-400">
                    <p className="flex items-center gap-2"><FileText size={13} className="shrink-0 text-slate-500" /><span className="truncate">{result.sourceFilename}</span></p>
                    <p className="mt-1 flex items-center gap-2 font-mono text-[10px] text-slate-600" title={result.sourceChecksum}>
                      <Fingerprint size={12} className="shrink-0" /> SHA-256 {result.sourceChecksum.slice(0, 16)}…
                    </p>
                  </div>
                  <div className="flex max-w-md items-start gap-2 rounded border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-amber-200">
                    <ShieldAlert size={15} className="mt-0.5 shrink-0" />
                    <span>Periksa keberlakuan regulasi dan kesesuaiannya dengan kontrak sebelum digunakan.</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {searchQuery.data.results.length === 0 && (
            <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-border text-center">
              <div>
                <FileSearch className="mx-auto mb-3 text-slate-600" size={28} />
                <p className="font-bold text-slate-300">Tidak ada potongan isi yang cocok</p>
                <p className="mt-1 text-sm text-slate-500">Coba istilah yang lebih singkat atau pilih semua kategori.</p>
              </div>
            </div>
          )}
        </section>
      )}

      {!isLoading && !isError && !canSearch && query.trim().length !== 1 && (
        <section>
          <div className="mb-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Katalog terindeks</p>
            <h2 className="mt-1 font-display text-xl font-bold text-slate-100">Dokumen sumber yang dapat ditelusuri</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleDocuments.map((document) => (
              <article key={document.id} className="flex flex-col rounded-lg border border-border bg-card p-5">
                <div className="mb-4 flex items-start justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded border border-border bg-background text-primary"><BookOpen size={17} /></span>
                  <span className="font-mono text-[10px] text-slate-500">{document.fileType}</span>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary">{document.category}</p>
                <h3 className="mt-1 font-display text-base font-bold leading-snug text-slate-100">{document.title}</h3>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {document.topics.slice(0, 4).map((topic) => (
                    <span key={topic} className="rounded bg-white/5 px-2 py-1 text-[10px] text-slate-400">{topic}</span>
                  ))}
                </div>
                <div className="mt-auto border-t border-border pt-4 text-xs text-slate-500">
                  <p className="flex items-center gap-2"><Database size={13} /> {document.sectionCount} bagian teks terindeks</p>
                  <p className="mt-1 truncate" title={document.sourceFilename}>{document.sourceFilename}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}