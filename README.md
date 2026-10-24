# BluthSoft homepage

The marketing homepage for BluthSoft, the operating platform for banana stands — a take-home homepage build from a supplied Figma design.

**Live:** TODO — `https://bluthsoft.vercel.app` once the Vercel project is connected.

Decisions, changes from the design, and AI suggestions I turned down are logged in [`DECISIONS.md`](DECISIONS.md).

## Run it locally

```sh
pnpm install
pnpm dev            # http://localhost:4321
```

Copy `.env.example` to `.env` to set variables locally. Everything runs without them.

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `pnpm check`        | Type-checks `.astro` and `.ts` files            |
| `pnpm format:check` | Prettier                                        |
| `pnpm test`         | Unit tests (Vitest)                             |
| `pnpm build`        | Production build into `.vercel/output`          |
| `pnpm test:e2e`     | Browser tests (Playwright, against `astro dev`) |

## Stack, and why

- **Astro** — the page is content with a few interactive islands; Astro ships no JavaScript by default. Prerendered, except the lead endpoint.
- **Tailwind v4** — tokens from the Figma file live in one `@theme` block (`src/styles/global.css`).
- **Vercel** — preview URL per PR.
- TODO: PostHog, HubSpot, zod (plumbing PR).

## How it's built

- **Copy:** every string is in `src/content/home.ts`; components render from it.
- TODO: analytics wrapper, lead endpoint, signup flow.

## Tracking plan

TODO — one row per event: when it fires, its properties, and the question it answers.

## Tests

TODO

## Time spent

TODO — the real total, what it covered, and what was excluded (account signups).

## What's next

TODO — a pricing page first: it's the most purchase-ready link in the nav and currently lands on the 404 page.
