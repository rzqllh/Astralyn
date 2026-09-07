# Astralyn deployment

## Public status

- [GitHub repository](https://github.com/rzqllh/Astralyn)
- [GitHub deployment records](https://github.com/rzqllh/Astralyn/deployments)
- Live application origin: **not published**

The repository currently has no GitHub Deployment, GitHub Pages site, or fixed production origin. This document therefore does not advertise a guessed Cloudflare URL.

## What is ready

- `pnpm build` compiles the React client and performs a dry-run Cloudflare Worker build.
- `apps/worker/wrangler.jsonc` defines the Worker name, compatibility settings, observability, and D1 binding.
- The web client uses same-origin `/api/*` requests and Vite proxies those calls to the Worker during local development.
- User data migrations live in `apps/worker/drizzle/migrations/`.
- Production secrets are not tracked.

## What still needs an operator decision

The current repository does not yet define how the built web client and Worker API share one production origin. Before publishing, choose and commit one supported topology:

1. Cloudflare Worker Static Assets serving `apps/web/dist` and `/api/*` from one Worker; or
2. Cloudflare Pages for the client with an explicit same-origin route or proxy to the API Worker.

That configuration is release work, not documentation-only work. It must be reviewed because auth cookies, trusted origins, OAuth callbacks, static knowledge paths, and API routing depend on it.

## Required production configuration

- A production D1 database and verified migration run.
- `BETTER_AUTH_SECRET` stored as a Cloudflare secret.
- `BETTER_AUTH_URL` set to the final HTTPS origin.
- Production `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` stored as Cloudflare secrets.
- Google OAuth redirect URI set to `<production-origin>/api/auth/callback/google`.
- `INTERNAL_BUILDER_SECRET` if the protected release export endpoint is enabled.
- A decision on production game artwork. The current safe default is the fallback silhouette.

## Release verification

Run with Node 24.19.x:

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm knowledge:check
pnpm data:check
pnpm assets:check
pnpm build
git diff --check
```

After deployment, verify at minimum:

- `/` loads the current knowledge release;
- `/api/health` reports Worker and D1 status;
- guest `All Characters` recommendations work;
- Google sign-in, callback, session persistence, and sign-out work on the production origin;
- roster and saved-team writes are scoped to the signed-in user;
- authenticated `All Characters` and `My Roster` requests behave correctly for empty, short, and full rosters;
- DU manual flow and browser-local persistence work;
- direct navigation and reload work for every production route;
- browser console and network logs contain no uncaught runtime errors;
- cache headers and HTTPS cookie behavior match the chosen topology.

Only after these checks pass should the README replace **not deployed yet** with the verified live origin.
