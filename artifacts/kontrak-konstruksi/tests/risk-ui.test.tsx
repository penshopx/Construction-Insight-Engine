import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReactNode } from 'react';
import { calculateIllustrativeScore, canDisplayOperationalScore, getRiskValidation, methodologyFingerprint, projectRiskSnapshots, riskModel, riskReviewHistory, type RiskReview } from '../src/lib/risk-model';

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
    expect(getRiskValidation().currentDecision).toBe('pending_expert_review');
    const page = await openProtectedPage(path);
    expect(page.querySelector('h1')?.textContent).toBe(title);

    const notice = page.querySelector('[data-testid="status-risk-model-validation"]');
    expect(notice?.textContent).toContain('Validasi model tertunda');
    expect(notice?.textContent).toContain('Skor operasional tidak ditampilkan');
    expect(notice?.textContent).toContain('persetujuan');
    expect(notice?.textContent).toContain(`Versi dipakai: ${riskModel.version}`);
    expect(notice?.textContent).toContain('Versi terakhir disetujui: Belum ada');
    expect(notice?.textContent).toContain('Riwayat perubahan dan keputusan review');

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

describe('review tied to the exact model revision', () => {
  const approvedReview: RiskReview = {
    version: riskModel.version,
    methodology: { factors: riskModel.factors, thresholds: riskModel.thresholds },
    fingerprint: methodologyFingerprint(riskModel),
    decision: 'approved',
    recordedAt: '2026-09-21T09:00:00+07:00',
    recordedBy: 'Reviewer independen',
    note: 'Hasil pengujian kasus representatif diterima.',
    reviewer: 'Reviewer ahli',
    verifiedCompetence: 'Kompetensi kontrak dan risiko konstruksi diperiksa',
    independence: 'Tidak ada konflik kepentingan',
    scope: 'Faktor, bobot, ambang, dan kasus representatif',
    limitations: 'Hanya untuk prioritas tinjauan',
  };
  const history = [...riskReviewHistory, approvedReview];

  it('allows only the version and methodology explicitly approved by the latest review', () => {
    expect(canDisplayOperationalScore()).toBe(false);
    expect(canDisplayOperationalScore(riskModel, history)).toBe(true);
    expect(getRiskValidation(riskModel, history).latestApproved).toBe(approvedReview);
    expect(canDisplayOperationalScore({ ...riskModel, version: 'KG-RISK-0.2' }, history)).toBe(false);
    expect(canDisplayOperationalScore({
      ...riskModel,
      factors: riskModel.factors.map((factor) => factor.key === 'contract' ? { ...factor, weight: 31 } : factor),
    }, history)).toBe(false);
    expect(canDisplayOperationalScore({
      ...riskModel,
      factors: [...riskModel.factors, { key: 'safety', label: 'Keselamatan', weight: 0 }],
    }, history)).toBe(false);
    expect(canDisplayOperationalScore({
      ...riskModel,
      thresholds: riskModel.thresholds.map((threshold) => threshold.label === 'Rendah' ? { ...threshold, max: 38 } : threshold),
    }, history)).toBe(false);
  });

  it('requires a fresh review after a pending revision and rejects mismatched review snapshots', () => {
    const pending: RiskReview = { ...riskReviewHistory[0], recordedAt: '2026-09-22T09:00:00+07:00' };
    expect(canDisplayOperationalScore(riskModel, [...history, pending])).toBe(false);
    expect(canDisplayOperationalScore(riskModel, [...history, { ...approvedReview, fingerprint: 'incorrect' }])).toBe(false);
    expect(canDisplayOperationalScore(riskModel, [...history, { ...approvedReview, reviewer: ' ' }])).toBe(false);
    expect(getRiskValidation(riskModel, [...history, pending]).latestApproved).toBe(approvedReview);
  });
});