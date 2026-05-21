# OXAR Radar

Next.js 16 app — `radar.oxar.app`.

UI surface for OXAR Radar: landing, public AI wallet analyzer demo, API docs, customer dashboard, and B2B API endpoints under `/api/v1/*`.

All business logic lives in `packages/radar-core`. This app only handles HTTP, UI, and thin glue code.

## Development

```bash
cd radar
yarn install
yarn dev
```

App runs on http://localhost:3000.

## Structure

```
src/app/
├── page.tsx              landing
├── analyze/              public AI demo (Phase 1)
├── docs/                 API documentation (Phase 2)
├── dashboard/            API keys, usage, billing (Phase 3)
├── pricing/              pricing tiers (Phase 3)
└── api/v1/               B2B endpoints (Phase 2)
```

See `docs/plans/2026-05-15-oxar-radar-design.md` for the full design.
