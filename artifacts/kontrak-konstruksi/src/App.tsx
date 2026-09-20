import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';

import Dashboard from '@/pages/dashboard';
import Proyek from '@/pages/proyek';
import Tenggat from '@/pages/tenggat';
import Bukti from '@/pages/bukti';
import Kasus from '@/pages/kasus';
import Referensi from '@/pages/referensi';
import Kompetensi from '@/pages/kompetensi';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground cyber-grid">
      <div className="text-center fade-up">
        <h1 className="font-display text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-slate-400 mb-8 font-mono">Modul tidak ditemukan</p>
        <a href="/" className="rounded bg-white/5 border border-border px-4 py-2 text-sm font-bold hover:bg-white/10 transition-colors">
          Kembali ke Command Center
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/proyek" component={Proyek} />
          <Route path="/tenggat" component={Tenggat} />
          <Route path="/bukti" component={Bukti} />
          <Route path="/kasus" component={Kasus} />
          <Route path="/referensi" component={Referensi} />
          <Route path="/kompetensi" component={Kompetensi} />
          <Route component={NotFound} />
        </Switch>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
