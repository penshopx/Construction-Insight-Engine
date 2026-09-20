import { PageHeader, Shell } from '@/components/layout';
import { Database, Fingerprint, Lock, ShieldCheck, FileCheck2, Camera, Mail, Hash } from 'lucide-react';

export default function Bukti() {
  return (
    <Shell>
      <PageHeader 
        eyebrow="Brankas Bukti (Immutable)" 
        title="Evidence Vault" 
        description="Setiap bukti yang diunggah dikunci dengan cryptographic hash (SHA-256) dan timestamp. Memenuhi standar alat bukti elektronik untuk mitigasi sengketa konstruksi."
        action={
          <button className="flex items-center gap-2 rounded bg-primary text-primary-foreground px-4 py-2 text-xs font-bold hover:bg-primary/90 transition-colors">
            <Lock size={14} /> Upload Bukti Baru
          </button>
        }
      />

      <div className="mb-6 rounded border border-primary/30 bg-primary/10 p-3 flex items-start gap-3">
        <ShieldCheck className="text-primary shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-primary/80 leading-relaxed">
          <strong className="text-primary">FORENSIC READINESS:</strong> Tampilan ini mensimulasikan vault. Di production, data di-anchor ke public blockchain untuk timestamping yang tak terbantah. Jangan gunakan data lokal ini di pengadilan nyata tanpa pengujian forensik yang valid.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <h2 className="font-display text-sm font-bold text-slate-300 flex items-center gap-2 border-b border-border pb-2">
            <Database size={16} className="text-slate-500" /> Bukti Terindeks (Kasus: EOT-002 Tower A)
          </h2>
          
          {[
            { type: 'document', name: 'IR-Struktur-L3.pdf', desc: 'Inspection Request disetujui MK', date: '12 Okt 2026, 14:22', hash: '8f4c...2b19', size: '2.4 MB' },
            { type: 'photo', name: 'IMG_4822_Waterstop.jpg', desc: 'Foto pemasangan sesuai spek', date: '12 Okt 2026, 09:15', hash: 'e2a7...99c4', size: '4.1 MB' },
            { type: 'email', name: 'Notice_of_Delay_Signed.eml', desc: 'Email konfirmasi pengiriman notice', date: '15 Okt 2026, 10:05', hash: '3c9f...1a88', size: '45 KB' },
            { type: 'document', name: 'Lab_Test_Beton_K350.pdf', desc: 'Hasil uji lab independen', date: '16 Okt 2026, 11:30', hash: '1d5e...7f22', size: '1.2 MB' },
          ].map((item, i) => (
            <div key={i} className={`fade-up delay-${i + 1} flex items-start justify-between rounded-lg border border-border bg-card p-4 hover:border-slate-700 transition-colors`}>
              <div className="flex gap-4">
                <div className="mt-1 grid h-10 w-10 place-items-center rounded bg-background border border-border text-slate-400">
                  {item.type === 'document' ? <FileCheck2 size={18} /> : item.type === 'photo' ? <Camera size={18} /> : <Mail size={18} />}
                </div>
                <div>
                  <p className="font-bold text-slate-200 text-sm">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="font-mono text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Hash size={10} /> {item.hash}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">{item.size}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] text-slate-500">{item.date}</p>
                <p className="text-[10px] font-bold text-emerald-500 mt-1 flex items-center justify-end gap-1"><ShieldCheck size={10} /> Verified</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 fade-up delay-4">
            <h3 className="font-display text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Fingerprint size={16} className="text-primary" /> Chain of Custody
            </h3>
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent pl-6 md:pl-0">
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-primary bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 -translate-x-2 md:left-1/2"></div>
                <div className="w-[calc(100%-1rem)] md:w-[calc(50%-1rem)] text-left md:text-right md:pr-4">
                  <p className="font-mono text-[9px] text-slate-500">16 Okt, 14:00</p>
                  <p className="text-xs font-bold text-slate-300">Bundle Exported</p>
                  <p className="text-[10px] text-slate-500">Oleh: Admin Legal</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 -translate-x-2 md:left-1/2"></div>
                <div className="w-[calc(100%-1rem)] md:w-[calc(50%-1rem)] text-left md:pl-4">
                  <p className="font-mono text-[9px] text-slate-500">15 Okt, 10:05</p>
                  <p className="text-xs font-bold text-slate-300">Notice Emailed</p>
                  <p className="text-[10px] text-slate-500">Hash: 3c9f...1a88</p>
                </div>
              </div>
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-border bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 -translate-x-2 md:left-1/2"></div>
                <div className="w-[calc(100%-1rem)] md:w-[calc(50%-1rem)] text-left md:text-right md:pr-4">
                  <p className="font-mono text-[9px] text-slate-500">12 Okt, 14:22</p>
                  <p className="text-xs font-bold text-slate-300">IR Disetujui</p>
                  <p className="text-[10px] text-slate-500">Signed: MK_Budi</p>
                </div>
              </div>
            </div>
            
            <button className="mt-6 w-full rounded border border-primary text-primary px-3 py-2 text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-all">
              Export Dossier (.zip)
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
