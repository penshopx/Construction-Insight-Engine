import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReactNode } from 'react';
import { calculateIllustrativeScore, projectRiskSnapshots, riskModel } from '../src/lib/risk-model';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Keep the actual App routes, Shell, pages, and risk components in the render.
// Only external identity and workspace network calls are replaced.
vi.mock('@clerk/react/internal', () => ({
  publishableKeyFromHost: () => 'pk_test_test_only',
}));
vi.mock('@clerk/react', () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
  Show: ({ when, children }: { when: string; children: ReactNode }) => when === 'signed-in' ? children : null,
  useAuth: () => ({ isSignedIn: true }),
  useUser: () => ({ user: { fullName: 'Penguji Risiko' } }),
  useClerk: () => ({ addListener: () => () => {}, signOut: () => {} }),
}));
vi.mock('@workspace/api-client-react', async (importOriginal) => ({
  ...await importOriginal<typeof import('@workspace/api-client-react')>(),
  useGetWorkspace: () => ({ data: { name: 'Ruang Uji', role: 'member' } }),
  useUpdateWorkspace: () => ({ mutate: () => {} }),
  useCreateWorkspaceInvitation: () => ({ mutate: () => {}, isPending: false }),
}));

import App from '../src/App';

let root: Root | undefined;
let host: HTMLDivElement | undefined;

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
});

async function openProtectedPage(path: string) {
  window.history.replaceState({}, '', path);
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root?.render(<App />));
  expect(host.querySelector('h1')).not.toBeNull();
  return host;
}

describe.each([
  ['/dashboard', 'Ruang Kolaborasi Terintegrasi', ['PRJ-01', 'PRJ-02', 'PRJ-03', 'PRJ-04']],
  ['/proyek', 'Portfolio Proyek', Object.keys(projectRiskSnapshots)],
])('risk model UI on %s', (path, title, projectIds) => {
  it('locks operational scores while showing validation status, sources, calculation time, and model version', async () => {
    expect(riskModel.validationStatus).toBe('pending_expert_review');
    const page = await openProtectedPage(path);
    expect(page.querySelector('h1')?.textContent).toBe(title);

    const notice = page.querySelector('[data-testid="status-risk-model-validation"]');
    expect(notice?.textContent).toContain('Validasi model tertunda');
    expect(notice?.textContent).toContain('Skor operasional tidak ditampilkan');
    expect(notice?.textContent).toContain('persetujuan');

    const expectedTime = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
    }).format(new Date(riskModel.calculatedAt));

    for (const id of projectIds) {
      const indicator = page.querySelector(`[data-testid="risk-indicator-${id}"]`);
      expect(indicator, `${id} must render on ${path}`).not.toBeNull();
      const visibleText = indicator?.textContent ?? '';
      expect(visibleText).toContain('Skor operasional dikunci');
      expect(visibleText).not.toMatch(/\bSkor\s+\d+\b/i);
      expect(visibleText).not.toContain(`Skor ${calculateIllustrativeScore(projectRiskSnapshots[id].inputs)}`);
      for (const source of projectRiskSnapshots[id].sources) expect(visibleText).toContain(source);
      expect(visibleText).toContain(`Dihitung ${expectedTime}`);
      expect(visibleText).toContain(riskModel.version);
    }
    expect(page.querySelectorAll('[data-testid^="risk-indicator-"]')).toHaveLength(projectIds.length);
  });
});