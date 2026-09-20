# KontrakGuard

Platform kolaboratif untuk hukum dan administrasi kontrak, kegagalan bangunan/konstruksi, serta penyelesaian sengketa konstruktif bersama Penilai Ahli.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/kontrak-konstruksi run dev` — run the KontrakKonstruksi web app
- `pnpm --filter @workspace/kontrak-konstruksi run typecheck` — check the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/kontrak-konstruksi/` — React web application
- `artifacts/kontrak-konstruksi/src/App.tsx` — route registration
- `artifacts/kontrak-konstruksi/src/pages/` — command center and product modules
- `artifacts/kontrak-konstruksi/src/components/layout.tsx` — persistent application shell and three-pillar navigation
- `artifacts/kontrak-konstruksi/src/index.css` — visual tokens and theme
- `attached_assets/` — source reference documents supplied for the product
- `artifacts/api-server/` — shared Express API used by persisted work items and reference search

## Architecture decisions

- Product positioning uses three connected pillars: law and contract administration; building/construction failure; and expert assessment with consultation, assistance/advocacy, and mediation.
- The product favors constructive resolution: detect issues early, preserve evidence, assess technical and contractual questions, and create a shared path to resolution before escalation.
- Persisted work items and reference search use the API; new failure, expert, and mediation surfaces remain clearly labeled demonstration data until backend workflows are built.
- MVP priority remains reliable workflow, deadline visibility, evidence continuity, and accountable collaboration; AI analysis follows the workflow and data foundation.
- SKKNI content is presented as an orientation and evidence-tracking aid, not as formal certification.
- Legal and forensic claims are qualified: the app is decision support, not legal advice, certification, or a guarantee that evidence will be admitted.

## Product

- Executive command center for exposure, urgent deadlines, and high-risk projects.
- Project portfolio and contract-risk overview.
- Legal deadline center for notices, responses, EOT, guarantees, retention, and DLP.
- Evidence Vault prototype with provenance and chain-of-custody cues.
- Case-management views for VO, EOT, claims, NCR, and disputes.
- Building and construction failure workspace for initial documentation, investigation, cause analysis, impact, and expert opinion.
- Penilai Ahli directory for consultation, assistance/advocacy, and mediation use cases.
- Collaborative mediation workspace for issues, sessions, evidence access, and draft outcomes.
- Searchable construction-contract legal reference library.
- SKKNI 88-2015 competency map for Ahli Kontrak Kerja Konstruksi.

## User preferences

- Use Indonesian for the product and communication.
- Favor a high-contrast dark/black and light-blue visual pairing with bright, legible text.

## Gotchas

- Failure, Penilai Ahli, and mediation data are local demonstrations and reset after a page reload.
- Expert profiles, qualifications, ratings, availability, conflict checks, and institutional verification shown in demonstrations are not real.
- Independent expert assessment is distinct from party advocacy; do not imply every Penilai Ahli is a licensed advocate, certified mediator, or authorized legal representative.
- Evidence hashes, timestamps, risk scores, and chain-of-custody records are illustrative until backed by verified server-side controls.
- Reference documents may contain older regulations; verify legal currency before presenting content as current law.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
