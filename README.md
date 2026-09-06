# Astralyn

A Honkai: Star Rail assistant built around your actual roster.

## What it does

Astralyn answers the practical questions HSR players have mid-session:

- Which characters should I build next from what I own?
- What is the current best build for this character?
- Which 1-3 teams can I actually put together from my roster?
- Which Divergent Universe blessing, equation, or curio should I pick right now?

For Divergent Universe, you paste or drop a screenshot of the reward screen. Astralyn reads it locally in your browser (no upload, no vision API), matches the options against canonical game data, and recommends a pick with a score and short reason.

## How it works

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, TanStack Router, Zustand
- **Backend:** Cloudflare Workers, D1 (SQLite), Drizzle ORM, Better Auth (Google OAuth)
- **Hosting:** Cloudflare Pages / Workers Static Assets
- **OCR:** [Tesseract.js](https://github.com/naptha/tesseract.js) runs in a Web Worker — your screenshot never leaves your device
- **Recommendations:** pure TypeScript scoring against canonical data, no paid AI dependency

## Status

In active development. Phase 8 (Automated Scheduled Ingestion & Knowledge Publishing Pipeline) is complete. See the [roadmap](docs/13-ROADMAP.md) for what is next.

## Setup

Requires Node.js 22+ and pnpm 10+.

```sh
pnpm install
cp .env.example .env          # fill in D1 credentials and OAuth client IDs
pnpm dev                      # starts web + worker dev servers
```

Run tests:

```sh
pnpm test
pnpm typecheck
pnpm lint
```

## Project structure

```
apps/
  web/        React frontend (Vite)
  worker/     Cloudflare Worker (auth, API)
packages/
  shared/     Knowledge types, recommendation engine, DU scoring
docs/         Product docs, architecture, data model, ADRs
tools/        Data ingestion scripts
```

## Contributing

Not open for external contributions yet. Issues and bug reports welcome.

## License

MIT. See [LICENSE](LICENSE).
