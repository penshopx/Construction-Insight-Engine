import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useAuth, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { dark } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ArrowRight, Building2, ShieldAlert, Users } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { getGetWorkspaceQueryKey, useAcceptWorkspaceInvitation } from '@workspace/api-client-react';

import Dashboard from '@/pages/dashboard';
import Proyek from '@/pages/proyek';
import Tenggat from '@/pages/tenggat';
import Bukti from '@/pages/bukti';
import Kasus from '@/pages/kasus';
import Kegagalan from '@/pages/kegagalan';
import PenilaiAhli from '@/pages/penilai-ahli';
import Mediasi from '@/pages/mediasi';
import Referensi from '@/pages/referensi';
import Kompetensi from '@/pages/kompetensi';

const queryClient = new QueryClient();
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkAppearance = {
  theme: dark,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#22d3ee',
    colorForeground: '#f8fafc',
    colorMutedForeground: '#94a3b8',
    colorDanger: '#f87171',
    colorBackground: '#07101f',
    colorInput: '#111c2f',
    colorInputForeground: '#f8fafc',
    colorNeutral: '#334155',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '8px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#07101f] rounded-2xl w-[440px] max-w-full overflow-hidden border border-slate-800',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-slate-50',
    headerSubtitle: 'text-slate-400',
    socialButtonsBlockButtonText: 'text-slate-100',
    formFieldLabel: 'text-slate-200',
    footerActionLink: 'text-cyan-400',
    footerActionText: 'text-slate-400',
    dividerText: 'text-slate-400',
    identityPreviewEditButton: 'text-cyan-400',
    formFieldSuccessText: 'text-emerald-400',
    alertText: 'text-slate-100',
    logoBox: 'h-12',
    logoImage: 'h-10',
    socialButtonsBlockButton: 'border-slate-700 bg-slate-900',
    formButtonPrimary: 'bg-cyan-400 text-slate-950 hover:bg-cyan-300',
    formFieldInput: 'border-slate-700 bg-slate-900 text-slate-50',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-slate-700',
    alert: 'border-slate-700 bg-slate-900',
    otpCodeFieldInput: 'border-slate-700 bg-slate-900 text-slate-50',
    formFieldRow: 'text-slate-100',
    main: 'gap-5',
  },
};

function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground cyber-grid">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded border border-primary/30 bg-primary/10 text-primary"><ShieldAlert size={20} /></span>
          <div><p className="font-display font-bold">KontrakGuard</p><p className="font-mono text-[9px] uppercase tracking-[.2em] text-primary">Defense System</p></div>
        </div>
        <a href={`${basePath}/sign-in`} className="rounded border border-border bg-white/5 px-4 py-2 text-sm font-bold text-slate-100 hover:bg-white/10">Masuk</a>
      </nav>
      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
        <div>
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[.2em] text-primary">Ruang kerja kontrak konstruksi</p>
          <h1 className="max-w-4xl font-display text-4xl font-bold leading-tight text-white md:text-6xl">Data kontrak perusahaan Anda, terpisah dan terkendali.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">Kelola tenggat, bukti, dan kasus dalam ruang kerja organisasi yang aman. Pengelola dan anggota mendapat akses sesuai perannya.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`${basePath}/sign-up`} className="inline-flex items-center gap-2 rounded bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground">Buat ruang kerja <ArrowRight size={16} /></a>
            <a href={`${basePath}/sign-in`} className="rounded border border-border bg-card px-5 py-3 text-sm font-bold text-slate-100">Masuk ke akun</a>
          </div>
        </div>
        <div className="grid gap-4">
          {[
            [Building2, 'Pemisahan organisasi', 'Setiap perusahaan hanya melihat data kontraknya sendiri.'],
            [Users, 'Peran tim', 'Pengelola mengatur ruang kerja; anggota bekerja di dalamnya.'],
            [ShieldAlert, 'Sesi aman', 'Akses aplikasi dan API dilindungi oleh akun terverifikasi.'],
          ].map(([Icon, title, text]) => {
            const FeatureIcon = Icon as typeof Building2;
            return <div key={title as string} className="rounded-xl border border-border bg-card/90 p-5"><FeatureIcon className="mb-4 text-primary" /><h2 className="font-display font-bold text-white">{title as string}</h2><p className="mt-2 text-sm leading-relaxed text-slate-400">{text as string}</p></div>;
          })}
        </div>
      </section>
    </main>
  );
}

function HomeRoute() {
  const pendingInvite = sessionStorage.getItem('pendingWorkspaceInvite');
  return <>
    <Show when="signed-in"><Redirect to={pendingInvite ? `/join?token=${encodeURIComponent(pendingInvite)}` : '/dashboard'} /></Show>
    <Show when="signed-out"><LandingPage /></Show>
  </>;
}

function JoinWorkspacePage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const { isSignedIn } = useAuth();
  const [message, setMessage] = useState('Memproses undangan ruang kerja…');
  const submitted = useRef(false);
  const acceptInvitation = useAcceptWorkspaceInvitation({
    mutation: {
      onSuccess: async () => {
        sessionStorage.removeItem('pendingWorkspaceInvite');
        queryClient.clear();
        await queryClient.invalidateQueries({ queryKey: getGetWorkspaceQueryKey() });
        setLocation('/dashboard', { replace: true });
      },
      onError: () => setMessage('Undangan tidak valid, sudah digunakan, atau kedaluwarsa.'),
    },
  });

  useEffect(() => {
    if (token) sessionStorage.setItem('pendingWorkspaceInvite', token);
  }, [token]);

  useEffect(() => {
    if (isSignedIn && token && !submitted.current) {
      submitted.current = true;
      acceptInvitation.mutate({ data: { token } });
    }
  }, [isSignedIn, token, acceptInvitation]);

  return <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 text-foreground cyber-grid">
    <Show when="signed-in">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <Users className="mx-auto mb-4 text-primary" />
        <h1 className="font-display text-xl font-bold text-white">Bergabung ke ruang kerja</h1>
        <p className="mt-3 text-sm text-slate-400">{message}</p>
      </div>
    </Show>
    <Show when="signed-out">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <Users className="mx-auto mb-4 text-primary" />
        <h1 className="font-display text-xl font-bold text-white">Anda diundang bergabung</h1>
        <p className="mt-3 text-sm text-slate-400">Masuk terlebih dahulu. Undangan ini akan diproses setelah akun Anda terverifikasi.</p>
        <a href={`${basePath}/sign-in`} className="mt-6 inline-flex rounded bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Masuk untuk bergabung</a>
      </div>
    </Show>
  </main>;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>
    <Show when="signed-in">{children}</Show>
    <Show when="signed-out"><Redirect to="/" /></Show>
  </>;
}

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 cyber-grid">
    {mode === 'sign-in'
      ? <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      : <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />}
  </div>;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const client = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const userId = user?.id ?? null;
    if (previousUserId.current !== undefined && previousUserId.current !== userId) client.clear();
    previousUserId.current = userId;
  }), [addListener, client]);
  return null;
}

function Routes() {
  return <Switch>
    <Route path="/" component={HomeRoute} />
    <Route path="/sign-in/*?">{() => <AuthPage mode="sign-in" />}</Route>
    <Route path="/sign-up/*?">{() => <AuthPage mode="sign-up" />}</Route>
    <Route path="/join">{() => <JoinWorkspacePage />}</Route>
    <Route path="/dashboard">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
    <Route path="/proyek">{() => <ProtectedRoute><Proyek /></ProtectedRoute>}</Route>
    <Route path="/tenggat">{() => <ProtectedRoute><Tenggat /></ProtectedRoute>}</Route>
    <Route path="/bukti">{() => <ProtectedRoute><Bukti /></ProtectedRoute>}</Route>
    <Route path="/kasus">{() => <ProtectedRoute><Kasus /></ProtectedRoute>}</Route>
    <Route path="/kegagalan">{() => <ProtectedRoute><Kegagalan /></ProtectedRoute>}</Route>
    <Route path="/penilai-ahli">{() => <ProtectedRoute><PenilaiAhli /></ProtectedRoute>}</Route>
    <Route path="/mediasi">{() => <ProtectedRoute><Mediasi /></ProtectedRoute>}</Route>
    <Route path="/referensi">{() => <ProtectedRoute><Referensi /></ProtectedRoute>}</Route>
    <Route path="/kompetensi">{() => <ProtectedRoute><Kompetensi /></ProtectedRoute>}</Route>
    <Route>{() => <Redirect to="/" />}</Route>
  </Switch>;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{
      signIn: { start: { title: 'Selamat datang kembali', subtitle: 'Masuk untuk membuka ruang kerja perusahaan' } },
      signUp: { start: { title: 'Buat akun KontrakGuard', subtitle: 'Mulai ruang kerja perusahaan Anda' } },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}>
      <ClerkQueryClientCacheInvalidator />
      <ErrorBoundary><Routes /></ErrorBoundary>
    </QueryClientProvider>
  </ClerkProvider>;
}

export default function App() {
  return <WouterRouter base={basePath}><ClerkProviderWithRoutes /></WouterRouter>;
}