import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListWorkItemsQueryKey,
  getGetReminderSettingsQueryKey,
  useCreateWorkItem,
  useGetReminderSettings,
  useListWorkItems,
  useUpdateReminderSettings,
  useUpdateWorkItem,
  type ReminderSettings,
  type ReminderSettingsUpdate,
  type WorkItem,
} from '@workspace/api-client-react';
import { PageHeader, Shell } from '@/components/layout';
import { AlertTriangle, Bell, Check, Clock, Info, Mail, MessageCircle, Plus, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeadlineFilter = 'all' | 'action_needed' | 'resolved';

export default function Tenggat() {
  const [filter, setFilter] = useState<DeadlineFilter>('all');
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();
  const { data: deadlines = [], isLoading, isError } = useListWorkItems({ category: 'administration' });
  const updateDeadline = useUpdateWorkItem();
  const { data: reminderSettings } = useGetReminderSettings();
  const updateReminderSettings = useUpdateReminderSettings();
  const [showChannels, setShowChannels] = useState(false);
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
  const toggleReminderDay = (deadline: WorkItem, day: number) => {
    const reminderDays = deadline.reminderDays.includes(day)
      ? deadline.reminderDays.filter((value) => value !== day)
      : [...deadline.reminderDays, day].sort((a, b) => b - a);
    updateDeadline.mutate(
      { id: deadline.id, data: { reminderDays } },
      { onSuccess: refresh },
    );
  };

  return (
    <Shell>
      <PageHeader
        eyebrow="Pilar 1: Hukum & Kontrak"
        title="Tenggat Hukum & Administrasi"
        description="Catat batas waktu notifikasi kontraktual. Dampak keterlambatan terhadap hak klaim atau denda bergantung pada kontrak, fakta, dan hukum yang berlaku."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowChannels(true)} className="flex items-center gap-2 rounded border border-primary/30 bg-primary/10 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/20" data-testid="button-reminder-channels"><Bell size={14} /> Kanal</button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 rounded bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(0,180,255,0.2)]" data-testid="button-add-deadline">
              <Plus size={14} /> Tambah Tenggat
            </button>
          </div>
        }
      />
      <div className="mb-6 flex items-start gap-3 rounded border border-amber-900/40 bg-amber-950/20 p-3 text-xs leading-relaxed text-amber-200/80">
        <Info size={15} className="mt-0.5 shrink-0 text-amber-500" />
        Tanggal jatuh tempo dimasukkan manual dan tidak dihitung atau divalidasi oleh sistem. Verifikasi klausul, metode perhitungan, hari kalender/kerja, serta konsekuensi hukumnya sebelum bertindak.
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border border-border bg-card p-1">
          {([
            ['all', 'Semua'],
            ['action_needed', 'Perlu Tindakan'],
            ['resolved', 'Selesai'],
          ] as const).map(([value, label]) => (
            <button key={value} onClick={() => setFilter(value)} className={`rounded px-3 py-1.5 text-xs font-bold transition-colors ${filter === value ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:text-slate-200 border border-transparent'}`} data-testid={`button-deadline-filter-${value}`}>
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[10px] text-slate-500 uppercase tracking-wider" data-testid="text-deadline-storage">Database Aktif</span>
      </div>

      {isError && <p className="rounded border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400" data-testid="status-deadline-error">Tenggat gagal dimuat. Coba muat ulang halaman.</p>}
      {!isLoading && !isError && filtered.length === 0 && <p className="rounded border border-dashed border-border bg-card p-12 text-center text-sm text-slate-500" data-testid="text-empty-deadlines">Tidak ada data tenggat pada filter ini.</p>}
      
      <div className="grid gap-4">
        {filtered.map((deadline, index) => (
          <div key={deadline.id} className={cn(
            "fade-up flex flex-col justify-between gap-4 rounded-lg border p-4 md:flex-row md:items-center md:p-5 transition-colors",
            `delay-${(index % 4) + 1}`,
            deadline.completed ? 'border-emerald-900/30 bg-emerald-950/10 opacity-70' : 
            deadline.status === 'Perlu ditinjau' ? 'border-red-900/50 bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : 
            'border-border bg-card hover:border-slate-600'
          )} data-testid={`row-deadline-${deadline.id}`}>
            <div className="flex gap-4">
              <div className={cn(
                "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                deadline.completed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 
                deadline.status === 'Perlu ditinjau' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
                'border-primary/30 bg-primary/10 text-primary'
              )}>
                {deadline.completed ? <Check size={18} /> : deadline.status === 'Perlu ditinjau' ? <AlertTriangle size={18} /> : <Clock size={18} />}
              </div>
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className={cn(
                    "rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider",
                    deadline.completed ? 'bg-emerald-500/20 text-emerald-300' :
                    deadline.status === 'Perlu ditinjau' ? 'bg-red-500/20 text-red-300' :
                    'bg-white/5 text-slate-400'
                  )}>
                    {deadline.kind}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{deadline.project ?? 'Global'}</span>
                </div>
                <h3 className={`text-sm font-bold ${deadline.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>{deadline.title}</h3>
                {deadline.description && <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400"><Info size={12} className="shrink-0" /> {deadline.description}</p>}
                {deadline.caseId && !deadline.completed && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Bell size={12} className="mr-1 text-primary" />
                    {[14, 7, 3, 1].map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleReminderDay(deadline, day)}
                        disabled={updateDeadline.isPending}
                        className={cn(
                          "rounded border px-2 py-1 text-[10px] font-bold transition-colors disabled:opacity-50",
                          deadline.reminderDays.includes(day)
                            ? "border-primary/40 bg-primary/15 text-primary"
                            : "border-border bg-background text-slate-500 hover:text-slate-300",
                        )}
                        data-testid={`button-reminder-${deadline.id}-${day}`}
                      >
                        {day} hari
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-6 md:min-w-[280px] md:justify-end border-t border-border/50 md:border-t-0 pt-4 md:pt-0">
              <div className="text-left md:text-right">
                <p className="font-mono text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Jatuh Tempo</p>
                <p className="font-mono font-bold text-slate-200">{deadline.due ?? 'TBD'}</p>
                {!deadline.completed && deadline.status === 'Perlu ditinjau' && (
                  <p className="mt-0.5 text-[10px] font-bold text-red-400 flex items-center md:justify-end gap-1"><Clock size={10} /> Perlu ditinjau</p>
                )}
              </div>
              {!deadline.completed && (
                <button 
                  onClick={() => resolveDeadline(deadline)} 
                  disabled={updateDeadline.isPending} 
                  className="shrink-0 rounded border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors" 
                  data-testid={`button-complete-deadline-${deadline.id}`}
                >
                  Tandai Selesai
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {showAdd && <DeadlineModal onClose={() => setShowAdd(false)} onSaved={refresh} />}
      {showChannels && reminderSettings && (
        <ReminderChannelModal
          settings={reminderSettings}
          isSaving={updateReminderSettings.isPending}
          onClose={() => setShowChannels(false)}
          onSave={(data) => updateReminderSettings.mutate(
            { data },
            { onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetReminderSettingsQueryKey() });
              setShowChannels(false);
            } },
          )}
        />
      )}
    </Shell>
  );
}

function ReminderChannelModal({ settings, isSaving, onClose, onSave }: {
  settings: ReminderSettings;
  isSaving: boolean;
  onClose: () => void;
  onSave: (data: ReminderSettingsUpdate) => void;
}) {
  const [emailEnabled, setEmailEnabled] = useState(settings.emailEnabled);
  const [emailRecipients, setEmailRecipients] = useState(settings.emailRecipients.join(', '));
  const [emailFrom, setEmailFrom] = useState(settings.emailFrom ?? '');
  const [emailToken, setEmailToken] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(settings.whatsappEnabled);
  const [whatsappRecipients, setWhatsappRecipients] = useState(settings.whatsappRecipients.join(', '));
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState(settings.whatsappPhoneNumberId ?? '');
  const [whatsappTemplateName, setWhatsappTemplateName] = useState(settings.whatsappTemplateName ?? '');
  const [whatsappTemplateLanguage, setWhatsappTemplateLanguage] = useState(settings.whatsappTemplateLanguage);
  const [whatsappToken, setWhatsappToken] = useState('');
  const split = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
  const submit = () => onSave({
    emailEnabled,
    emailRecipients: split(emailRecipients),
    emailFrom: emailFrom || null,
    ...(emailToken ? { emailToken } : {}),
    whatsappEnabled,
    whatsappRecipients: split(whatsappRecipients),
    whatsappPhoneNumberId: whatsappPhoneNumberId || null,
    whatsappTemplateName: whatsappTemplateName || null,
    whatsappTemplateLanguage,
    ...(whatsappToken ? { whatsappToken } : {}),
  });
  return <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between border-b border-border pb-4"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Pengingat Eksternal</p><h2 className="mt-1 font-display text-xl font-bold text-white">Kanal & penerima organisasi</h2><p className="mt-1 text-xs text-slate-400">Token disimpan terenkripsi dan tidak pernah ditampilkan kembali.</p></div><button onClick={onClose} className="rounded p-2 text-slate-500 hover:bg-white/5 hover:text-white"><X size={18} /></button></div><div className="grid gap-4 md:grid-cols-2"><ChannelPanel icon={<Mail size={16} />} title="Email via Resend" enabled={emailEnabled} onEnabled={setEmailEnabled}><Field label="Penerima (pisahkan dengan koma)" value={emailRecipients} onChange={setEmailRecipients} placeholder="site@firma.id, pm@firma.id" /><Field label="Alamat pengirim terverifikasi" value={emailFrom} onChange={setEmailFrom} placeholder="KontrakGuard <notice@firma.id>" /><Field label={`API token${settings.emailCredentialConfigured ? ' (sudah tersimpan)' : ''}`} value={emailToken} onChange={setEmailToken} placeholder={settings.emailCredentialConfigured ? 'Kosongkan untuk mempertahankan token' : 'Masukkan token Resend'} secret /></ChannelPanel><ChannelPanel icon={<MessageCircle size={16} />} title="WhatsApp Cloud API" enabled={whatsappEnabled} onEnabled={setWhatsappEnabled}><Field label="Nomor penerima (pisahkan dengan koma)" value={whatsappRecipients} onChange={setWhatsappRecipients} placeholder="+62812..., +62813..." /><Field label="Phone number ID" value={whatsappPhoneNumberId} onChange={setWhatsappPhoneNumberId} placeholder="ID nomor dari Meta" /><Field label="Template disetujui Meta" value={whatsappTemplateName} onChange={setWhatsappTemplateName} placeholder="notice_reminder" /><Field label="Kode bahasa template" value={whatsappTemplateLanguage} onChange={setWhatsappTemplateLanguage} placeholder="id" /><p className="text-[10px] leading-relaxed text-slate-500">Template harus memiliki dua variabel body: judul notice dan rincian tenggat.</p><Field label={`Access token${settings.whatsappCredentialConfigured ? ' (sudah tersimpan)' : ''}`} value={whatsappToken} onChange={setWhatsappToken} placeholder={settings.whatsappCredentialConfigured ? 'Kosongkan untuk mempertahankan token' : 'Masukkan token Meta'} secret /></ChannelPanel></div><div className="mt-6 flex justify-end gap-3 border-t border-border pt-4"><button onClick={onClose} className="rounded px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Batal</button><button onClick={submit} disabled={isSaving} className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"><Save size={14} />{isSaving ? 'Menyimpan…' : 'Simpan Kanal'}</button></div></div></div>;
}

function ChannelPanel({ icon, title, enabled, onEnabled, children }: { icon: React.ReactNode; title: string; enabled: boolean; onEnabled: (value: boolean) => void; children: React.ReactNode }) {
  return <section className="rounded-lg border border-border bg-background/50 p-4"><label className="mb-4 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-bold text-slate-200">{icon}{title}</span><input type="checkbox" checked={enabled} onChange={(event) => onEnabled(event.target.checked)} className="h-4 w-4 accent-sky-500" /></label><div className={cn("grid gap-3", !enabled && "opacity-50")}>{children}</div></section>;
}

function Field({ label, value, onChange, placeholder, secret = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; secret?: boolean }) {
  return <label><span className="mb-1.5 block text-[11px] font-bold text-slate-400">{label}</span><input type={secret ? 'password' : 'text'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded border border-border bg-card px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:border-primary focus:outline-none" /></label>;
}

function DeadlineModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState('');
  const [due, setDue] = useState('');
  const [kind, setKind] = useState('Notice');
  const [description, setDescription] = useState('');
  const [reminderDays, setReminderDays] = useState<number[]>([]);
  const createDeadline = useCreateWorkItem();
  const submit = () => createDeadline.mutate(
    { data: { category: 'administration', title, project, due, kind, description, owner: 'RA', status: 'Perlu ditinjau', reminderDays } },
    { onSuccess: () => { onSaved(); onClose(); } },
  );

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl"><div className="flex items-start justify-between border-b border-border pb-4 mb-4"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-primary">Agenda Kontraktual</p><h2 className="mt-1 font-display text-xl font-bold text-white">Tambah Tenggat</h2></div><button onClick={onClose} className="rounded p-2 text-slate-500 hover:text-white hover:bg-white/5 transition-colors" data-testid="button-close-deadline"><X size={18} /></button></div><div className="grid gap-4"><label><span className="mb-2 block text-xs font-bold text-slate-300">Aksi/Kewajiban</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors" data-testid="input-deadline-title" placeholder="Cth: Submit Notice of Delay" /></label><label><span className="mb-2 block text-xs font-bold text-slate-300">Proyek (Opsional)</span><input value={project} onChange={(event) => setProject(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors" data-testid="input-deadline-project" placeholder="Cth: Tower A" /></label><div className="grid grid-cols-2 gap-3"><label><span className="mb-2 block text-xs font-bold text-slate-300">Jenis Dokumen</span><input value={kind} onChange={(event) => setKind(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors" data-testid="input-deadline-kind" /></label><label><span className="mb-2 block text-xs font-bold text-slate-300">Jatuh Tempo</span><input type="date" value={due} onChange={(event) => setDue(event.target.value)} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors" data-testid="input-deadline-due" /></label></div><fieldset><legend className="mb-2 text-xs font-bold text-slate-300">Ingatkan Sebelum Tenggat</legend><div className="flex flex-wrap gap-2">{[14, 7, 3, 1].map((day) => <button key={day} type="button" onClick={() => setReminderDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day].sort((a, b) => b - a))} className={cn("rounded border px-3 py-1.5 text-xs font-bold", reminderDays.includes(day) ? "border-primary/40 bg-primary/15 text-primary" : "border-border bg-background text-slate-500")} data-testid={`button-new-reminder-${day}`}>{day} hari</button>)}</div></fieldset><label><span className="mb-2 block text-xs font-bold text-slate-300">Klausul Rujukan / Catatan</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-colors" data-testid="input-deadline-description" placeholder="Cth: Sesuai Pasal 8.4 mengenai batas 14 hari..." /></label></div><div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border"><button onClick={onClose} className="rounded px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors" data-testid="button-cancel-deadline">Batal</button><button onClick={submit} disabled={!title.trim() || createDeadline.isPending} className="rounded bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50 hover:bg-primary/90 transition-colors" data-testid="button-save-deadline">{createDeadline.isPending ? 'Menyimpan…' : 'Simpan Tenggat'}</button></div></div></div>;
}
