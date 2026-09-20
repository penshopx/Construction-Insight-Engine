# KontrakKonstruksi

Aplikasi kerja hukum dan administrasi kontrak konstruksi berbasis referensi Indonesia dan orientasi kompetensi SKKNI 88 Tahun 2015.

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
- `artifacts/kontrak-konstruksi/src/App.tsx` — routes, screens, and local prototype data
- `artifacts/kontrak-konstruksi/src/index.css` — visual tokens and theme
- `attached_assets/` — source reference documents supplied for the product
- `artifacts/api-server/` — shared Express API, currently not required by the frontend prototype

## Architecture decisions

- The first version is frontend-only and uses realistic local data so the product surface can be evaluated before persistence and user accounts are added.
- SKKNI content is presented as an orientation and evidence-tracking aid, not as formal certification.
- Legal content includes an explicit disclaimer: it is reference support, not a substitute for professional legal advice.

## Product

- Dashboard for contract agenda, monitored risks, activity, and decisions.
- Searchable construction-contract legal reference library.
- SKKNI 88-2015 competency map for Ahli Kontrak Kerja Konstruksi.
- Contract administration workspace with status filters and completion tracking.

## User preferences

- Use Indonesian for the product and communication.
- Favor a high-contrast dark/black and light-blue visual pairing with bright, legible text.

## Gotchas

- Current interactions are local prototype state and reset after a page reload.
- Reference documents may contain older regulations; verify legal currency before presenting content as current law.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
