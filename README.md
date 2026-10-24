# BluthSoft homepage

The marketing homepage for BluthSoft, the operating platform for banana stands — a take-home homepage build from a supplied Figma design.

**Live:** TODO — `https://bluthsoft-homepage.vercel.app` once the Vercel project is connected.

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
- **PostHog** — funnels and session replay on day one. Hidden behind a Segment-shaped wrapper, so it's replaceable.
- **HubSpot Forms API** — where leads land. No SDK: one `fetch` to the v3 submit endpoint.
- **zod** — one schema validates leads from all three forms and produces the per-field error messages.

## How it's built

- **Copy:** every string is in `src/content/home.ts`; components render from it.
- **Analytics** (`src/lib/analytics.ts`): `track` / `page` / `identify` / `anonymousId`, Segment-style.
  - posthog-js is only downloaded when `PUBLIC_POSTHOG_KEY` is set, as its own chunk.
  - No cookies or storage (`persistence: "memory"`), session replay with every input masked, and autocapture off, so the event stream is exactly the tracking plan.
  - Clicks are tracked by one page-level listener reading `data-track` attributes, and sections by an IntersectionObserver on `[data-section]`. Components never import analytics.
  - UTM tags and an external referrer are read from the landing URL and attached to every event.
- **Lead endpoint** (`src/pages/api/lead.ts` → `src/lib/lead-handler.ts`), the only route that runs on demand:
  - Validates, drops honeypot-filled submissions while answering them like any other, forwards to HubSpot, then records `Lead Created` / `Demo Requested` server-side against the visitor's analytics ID. Conversions survive ad blockers, and the event carries no email address.
  - JSON in, JSON out for the forms' JavaScript. Without JavaScript, a form post redirects to `/thanks`, or shows a short page listing what to fix.
  - Without HubSpot configured it runs as a stub: it validates and logs a redacted line, stores nothing, and says `"stub": true`.

## Tracking plan

| Event            | Fires when                                               | Properties                                                  | Answers                                         |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| `$pageview`      | The page loads                                           | UTM tags, referrer                                          | How many visitors, from where?                  |
| `CTA Clicked`    | A call to action is clicked                              | `location`, `label`, `destination`                          | Which CTA, in which section, gets clicked?      |
| `Link Clicked`   | A link to a page that doesn't exist yet is clicked       | `location`, `label`, `destination`                          | Which missing page do visitors want most?       |
| `Section Viewed` | A section's top passes 60% down the viewport (once each) | `section`                                                   | How far down the page do people get?            |
| `Form Started`   | TODO (signup flow PR)                                    |                                                             | Does the form attract attempts?                 |
| `Form Submitted` | TODO (signup flow PR)                                    |                                                             | Where do attempts drop off?                     |
| `Form Error`     | TODO (signup flow PR)                                    |                                                             | Which field trips people up?                    |
| `Lead Created`   | The server accepted a signup (server-side)               | `intent`, `source`, `stands`, `sells`, `referrer`, UTM tags | How many signups, from which form and campaign? |
| `Demo Requested` | The server accepted a demo request (server-side)         | `intent`, `source`, `stands`, `sells`, `referrer`, UTM tags | How many sales conversations?                   |

Every event also carries `environment` (`production`, `preview` or `development`), so QA traffic on preview deployments can be filtered out.

## Tests

- **Unit (Vitest):** lead validation, the honeypot, stub mode, HubSpot field mapping, error handling and timeout, the conversion event, UTM parsing, the analytics wrapper (a no-op without a key; replays early calls once loaded; stops queueing if PostHog can't load), and the page-level click and section listeners (in happy-dom).
- **Browser (Playwright):** the page's search tags and structured data, `robots.txt`, and the lead endpoint, including a form posted without JavaScript.

## Time spent

Budget: 6 hours in two sittings.

| Sitting | Date       | Time      | Covered                                                                                                                                                                                |
| ------- | ---------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1       | 2026-10-24 | 2.5 hours | Planning, the phone layout in Figma and its review, the build (scaffold, analytics and lead endpoint, every section, the setup questions, `/demo`), and setting up HubSpot and PostHog |

**Total so far: 2.5 of 6 hours.** Setting up HubSpot and PostHog is included, although the plan left account setup out of the budget.

## What's next

TODO — a pricing page first: it's the most purchase-ready link in the nav and currently lands on the 404 page.
