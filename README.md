# Astralyn

Astralyn is a local-first Honkai: Star Rail companion for browsing character knowledge, managing a roster, generating deterministic teams, and evaluating Divergent Universe choices.

[Repository](https://github.com/rzqllh/Astralyn) · [Deployment status](https://github.com/rzqllh/Astralyn/deployments) · [Documentation](docs/00-README.md)

> **Public demo:** not deployed yet. The repository currently has no published GitHub Deployment or fixed production origin. See [Deployment](docs/16-DEPLOYMENT.md) for the remaining release work. Do not treat a guessed `pages.dev` or `workers.dev` address as an Astralyn deployment.

## Current build

The checked-in knowledge release is HSR 4.5 / `v1.0.0`.

| Area                  | Current behavior                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| Character catalog     | 92 canonical characters with search and Path, element, rarity, and ownership filters                    |
| Character details     | Kit, traces, Eidolons, provenance, and deterministic team entry points                                  |
| Guest recommendations | `All Characters` scope without an account                                                               |
| Account features      | Google OAuth, D1-backed roster, onboarding, and saved teams when auth is configured                     |
| Team engine           | Deterministic Top 3, optional focus character, at most 16 candidates and 1,820 team evaluations         |
| DU assistant          | Local run state, manual choices, client-side screenshot OCR, and ranked blessing/equation/curio results |
| Knowledge cache       | Versioned static JSON, SHA-256 verification, and IndexedDB persistence                                  |
| Content and Settings  | Visible navigation placeholders; not implemented in this build                                          |
| Editorial consensus   | Data structures exist, but the public UI correctly reports editorial comparison as unavailable          |
| Production artwork    | No game artwork is approved for the production bundle; production uses fallback silhouettes             |

The static release contains 92 characters, 9 light cones, 6 relic sets, 4 enemies, 4 stages, and 7 Divergent Universe records. That uneven coverage is intentional repository state, not a claim of complete HSR content coverage.

## Requirements

- Node.js 24.19.x. The exact version is recorded in [`.node-version`](.node-version).
- pnpm 10.x. The workspace pins pnpm 10.20.0 in [`package.json`](package.json).

## Try it locally

Install dependencies and initialize the local D1 database:

```sh
pnpm install --frozen-lockfile
pnpm db:migrate:local
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api/*` to the local Worker at `http://127.0.0.1:8787`.

Without OAuth variables, the character catalog, `All Characters` recommendations, and local DU flow remain available. The account control reports an auth configuration error because authenticated features cannot initialize.

## Enable local sign-in

Copy [`.env.example`](.env.example) to `apps/worker/.dev.vars`, then provide a development-only Better Auth secret and Google OAuth credentials:

```sh
cp .env.example apps/worker/.dev.vars
pnpm db:migrate:local
pnpm dev
```

Register this local Google OAuth redirect URI:

```text
http://localhost:5173/api/auth/callback/google
```

Never commit `.dev.vars`. Wrangler reads it from `apps/worker`, and the repository ignores it. See [Auth and onboarding](docs/05-AUTH_ONBOARDING.md) for expected guest and authenticated states.

## Useful commands

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm knowledge:build
pnpm knowledge:check
pnpm data:check
pnpm assets:check
pnpm build
```

`knowledge:build` rewrites the published static snapshot. Use it only when intentionally changing canonical data, then review the generated diff.

## Repository layout

```text
apps/
  web/       React + Vite client
  worker/    Cloudflare Worker API, Better Auth, and D1 access
packages/
  shared/    Knowledge schemas and deterministic recommendation engines
tools/       Knowledge, migration, asset, and boundary checks
docs/        Product, architecture, policy, testing, and decision records
```

Start with the [documentation index](docs/00-README.md). It provides separate reading paths for evaluators, contributors, and maintainers.

## Project status

The local MVP flow is implemented and covered by automated tests. The main release gaps are public deployment, production OAuth and secrets, remote D1 migration verification, production-approved artwork, full non-character data coverage, and real editorial source adapters.

External contributions are not open yet. Bug reports and reproducible evaluation notes are welcome through [GitHub Issues](https://github.com/rzqllh/Astralyn/issues).

## License and attribution

Astralyn source code is licensed under the [MIT License](LICENSE). Honkai: Star Rail and its game assets belong to COGNOSPHERE / HoYoverse. Astralyn is an unofficial fan project and is not affiliated with or endorsed by HoYoverse.
