import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  getListReferencesQueryKey,
  getListReferenceImportsQueryKey,
  getSearchReferencesQueryKey,
  useCreateReferenceImport,
  useGetWorkspace,
  useListReferenceImports,
  useListReferences,
  useRequestReferenceUploadUrl,
  useSearchReferences,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader, Shell } from '@/components/layout';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  FileSearch,
  FileText,
  Fingerprint,
  LoaderCircle,
  Search,
  ShieldAlert,
  Upload,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Referensi() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const deferredQuery = useDeferredValue(query.trim());
  const canSearch = deferredQuery.length >= 2;

  const workspaceQuery = useGetWorkspace();
  const documentsQuery = useListReferences();
  const isManager = workspaceQuery.data?.role === 'manager';
  const importsQuery = useListReferenceImports({
    query: {
      enabled: isManager,
      queryKey: getListReferenceImportsQueryKey(),
      refetchInterval: (queryState) =>
        queryState.state.data?.some((item) => item.status === 'processing') ? 2000 : false,
    },
  });
  const uploadUrlMutation = useRequestReferenceUploadUrl();
  const createImportMutation = useCreateReferenceImport();
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
  const isUploading = uploadUrlMutation.isPending || createImportMutation.isPending;

  useEffect(() => {
    if (!importsQuery.data?.some((item) => item.status === 'ready')) return;
    void queryClient.invalidateQueries({ queryKey: getListReferencesQueryKey() });
  }, [importsQuery.data, queryClient]);

  async function handleUpload(file: File) {
    setUploadError('');
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) {
      setUploadError('Format harus PDF, DOC, atau DOCX.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Ukuran berkas maksimal 20 MB.');
      return;
    }
    try {
      const target = await uploadUrlMutation.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type || 'application/octet-stream' },
      });
      const upload = await fetch(target.uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!upload.ok) throw new Error('Berkas gagal dikirim ke penyimpanan.');
      await createImportMutation.mutateAsync({ data: { objectPath: target.objectPath, sourceFilename: file.name } });
      await importsQuery.refetch();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unggahan tidak dapat diproses.');
    }
  }

  return (
    <Shell>
      <PageHeader
        eyebrow="Penunjang Keputusan"
        title="Referensi Hukum & Standar"
        description="Telusuri teks sumber yang tersedia di katalog. Hasil pencarian bukan penetapan status, keberlakuan, atau penerapan hukum."
        action={
          <div className="hidden text-right md:block">
            <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Dokumen Terindeks</p>
            <p className="font-display text-xl font-bold text-primary tracking-tight">{documents.length} Dokumen</p>
          </div>
        }
      />

      {isManager && (
        <section className="mb-8 rounded-lg border border-primary/25 bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Kelola Pustaka</p>
              <h2 className="mt-1 font-display text-lg font-bold text-slate-100">Tambahkan dokumen rujukan</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Unggah PDF, DOC, atau DOCX hingga 20 MB. Judul, kategori, topik, dan segmen pencarian akan dibuat otomatis.
              </p>
            </div>
            <label className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-slate-950 transition-opacity',
              isUploading && 'pointer-events-none opacity-60',
            )}>
              {isUploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
              {isUploading ? 'Mengunggah...' : 'Pilih Dokumen'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                disabled={isUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
            </label>
          </div>
          {uploadError && (
            <p className="mt-4 flex items-center gap-2 rounded border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
              <XCircle size={15} /> {uploadError}
            </p>
          )}
          {(importsQuery.data?.length ?? 0) > 0 && (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-3 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-500">Status pemrosesan terbaru</p>
              <div className="space-y-2">
                {importsQuery.data?.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-background/60 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-200">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{item.sourceFilename}</p>
                      {item.error && <p className="mt-1 text-xs text-red-400">{item.error}</p>}
                    </div>
                    <span className={cn(
                      'inline-flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[9px] font-bold uppercase',
                      item.status === 'ready' && 'border-emerald-800 bg-emerald-950/30 text-emerald-400',
                      item.status === 'failed' && 'border-red-900 bg-red-950/30 text-red-400',
                      item.status === 'processing' && 'border-amber-900 bg-amber-950/30 text-amber-400',
                    )}>
                      {item.status === 'ready' ? <CheckCircle2 size={12} /> : item.status === 'failed' ? <XCircle size={12} /> : <LoaderCircle size={12} className="animate-spin" />}
                      {item.status === 'ready' ? `${item.sectionCount ?? 0} segmen — siap` : item.status === 'failed' ? 'gagal' : 'memproses'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mb-8 rounded-lg border border-border bg-card p-5 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        <label htmlFor="reference-search" className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Cari istilah, pasal, atau kata kunci
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
          <input
            id="reference-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cth: kegagalan bangunan, mediasi, force majeure..."
            className="h-12 w-full rounded-md border border-border bg-background pl-12 pr-4 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600 focus:border-primary focus:ring-1 focus:ring-primary shadow-inner"
          />
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={cn(
                'whitespace-nowrap rounded border px-3 py-1.5 text-xs font-bold transition-colors',
                category === item
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent bg-background text-slate-400 hover:border-border hover:text-slate-200',
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {query.trim().length === 1 && (
        <div className="mb-5 rounded border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          Masukkan minimal 2 karakter untuk memulai pencarian teks.
        </div>
      )}

      {isLoading && (
        <div className="grid min-h-[200px] place-items-center rounded-lg border border-border bg-card">
          <div className="text-center text-slate-400">
            <LoaderCircle className="mx-auto mb-4 animate-spin text-primary" size={28} />
            <p className="text-sm font-mono tracking-wide">MENELUSURI INDEKS...</p>
          </div>
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-5 text-red-200">
          <div className="flex items-center gap-2 font-bold mb-2"><AlertTriangle size={18} className="text-red-500" /> API Error: Indeks referensi tidak merespons</div>
          <p className="text-sm text-red-300/80">Coba muat ulang halaman. Aplikasi tidak akan mensimulasikan hasil pencarian untuk menghindari kesalahan sitasi hukum.</p>
        </div>
      )}

      {!isLoading && !isError && canSearch && searchQuery.data && (
        <section className="fade-up">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary mb-1">Hasil Pencarian</p>
              <h2 className="font-display text-xl font-bold text-slate-200">
                {searchQuery.data.total} rujukan ditemukan untuk "{searchQuery.data.query}"
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-mono">Dibatasi 50 top hit</p>
          </div>

          <div className="space-y-4">
            {searchQuery.data.results.map((result) => (
              <article key={result.id} className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40 group">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[9px] uppercase tracking-wider text-primary mb-1">
                      {result.category} • Bagian {result.sectionNumber}
                    </p>
                    <h3 className="font-display text-lg font-bold text-slate-200 group-hover:text-white transition-colors">{result.title}</h3>
                    <p className="mt-1 text-xs text-slate-400 font-medium">{result.heading}</p>
                  </div>
                  <span className="rounded border border-border bg-background px-2 py-1 font-mono text-[10px] font-bold text-slate-400">{result.fileType}</span>
                </div>

                <blockquote className="my-4 border-l-2 border-primary bg-background/50 px-4 py-3 text-sm leading-relaxed text-slate-300">
                  {result.excerpt}
                </blockquote>

                {result.topics.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {result.topics.map((topic) => (
                      <span key={topic} className="rounded bg-white/5 border border-border px-2 py-1 text-[9px] font-mono text-slate-400">{topic}</span>
                    ))}
                  </div>
                )}

                <div className="grid gap-3 border-t border-border pt-4 text-xs md:grid-cols-[1fr_auto]">
                  <div className="min-w-0 text-slate-500">
                    <p className="flex items-center gap-2"><FileText size={13} className="shrink-0" /><span className="truncate text-slate-300">{result.sourceFilename}</span></p>
                    <p className="mt-1.5 flex items-center gap-2 font-mono text-[9px]" title={result.sourceChecksum}>
                       <Fingerprint size={12} className="shrink-0" /> Checksum sumber: {result.sourceChecksum.slice(0, 16)}…
                    </p>
                  </div>
                  <div className="flex max-w-md items-start gap-2 rounded border border-amber-900/30 bg-amber-950/10 px-3 py-2 text-amber-400/80">
                    <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                    <span className="text-[10px] leading-relaxed">Checksum hanya penanda teknis sumber yang diindeks, bukan bukti keaslian atau keberlakuan. Periksa perubahan, pencabutan, tanggal berlaku, dan penerapannya melalui JDIH/sumber resmi sebelum menggunakan rujukan.</span>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {searchQuery.data.results.length === 0 && (
            <div className="grid min-h-[200px] place-items-center rounded-lg border border-dashed border-border bg-card text-center">
              <div>
                <FileSearch className="mx-auto mb-3 text-slate-600" size={32} />
                <p className="font-bold text-slate-300">Tidak ada klausul yang cocok</p>
                <p className="mt-1 text-sm text-slate-500">Gunakan kata kunci yang lebih generik atau pilih kategori "Semua".</p>
              </div>
            </div>
          )}
        </section>
      )}

      {!isLoading && !isError && !canSearch && query.trim().length !== 1 && (
        <section className="fade-up">
          <div className="mb-5 border-b border-border pb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary mb-1">Katalog Tersedia</p>
            <h2 className="font-display text-xl font-bold text-slate-200">Dokumen Sumber yang Dapat Ditelusuri</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleDocuments.map((document, index) => (
              <article key={document.id} className={cn(
                "flex flex-col rounded-lg border border-border bg-card p-5 hover:border-slate-600 transition-colors",
                `delay-${(index % 4) + 1}`
              )}>
                <div className="mb-4 flex items-start justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded bg-primary/10 border border-primary/20 text-primary"><BookOpen size={16} /></span>
                  <span className="font-mono text-[9px] uppercase border border-border px-1.5 py-0.5 rounded text-slate-400">{document.fileType}</span>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-primary mb-1">{document.category}</p>
                <h3 className="font-display text-base font-bold leading-snug text-slate-200">{document.title}</h3>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {document.topics.slice(0, 3).map((topic) => (
                    <span key={topic} className="rounded bg-background border border-border px-2 py-0.5 text-[9px] font-mono text-slate-400">{topic}</span>
                  ))}
                  {document.topics.length > 3 && (
                    <span className="rounded bg-background border border-border px-2 py-0.5 text-[9px] font-mono text-slate-500">+{document.topics.length - 3}</span>
                  )}
                </div>
                <div className="mt-auto border-t border-border pt-4 mt-5 text-xs text-slate-500">
                  <p className="flex items-center gap-2"><Database size={13} /> {document.sectionCount} segmen teks terindeks</p>
                  <p className="mt-1.5 truncate" title={document.sourceFilename}>{document.sourceFilename}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}
