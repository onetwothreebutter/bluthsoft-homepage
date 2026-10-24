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

| Event                 | Fires when                                                                                 | Properties                                                          | Answers                                         |
| --------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------- |
| `$pageview`           | The page loads                                                                             | UTM tags, referrer                                                  | How many visitors, from where?                  |
| `CTA Clicked`         | A call to action is clicked                                                                | `location`, `label`, `destination`                                  | Which CTA, in which section, gets clicked?      |
| `Link Clicked`        | A link to a page that doesn't exist yet is clicked                                         | `location`, `label`, `destination`                                  | Which missing page do visitors want most?       |
| `Section Viewed`      | A section's top passes 60% down the viewport (once each)                                   | `section`                                                           | How far down the page do people get?            |
| `Tab Clicked`         | A product tab is chosen                                                                    | `location`, `label`                                                 | Which part of the product interests people?     |
| `Form Started`        | A visitor first types into, or picks an answer in, a form                                  | `form` (`hero`, `setup`, `demo`)                                    | Does the form attract attempts?                 |
| `Form Step Completed` | A setup question is answered                                                               | `form`, `step`, `step_number`, and the answer (`stands` or `sells`) | Which question loses people?                    |
| `Form Submitted`      | A form is sent to the server                                                               | `form`                                                              | Where do attempts drop off?                     |
| `Form Error`          | A form can't be sent: a field fails the check, the server rejects it, or the network fails | `form`, `fields`                                                    | Which field trips people up?                    |
| `Lead Created`        | The server accepted a signup (server-side)                                                 | `intent`, `source`, `stands`, `sells`, `referrer`, UTM tags         | How many signups, from which form and campaign? |
| `Demo Requested`      | The server accepted a demo request (server-side)                                           | `intent`, `source`, `stands`, `sells`, `referrer`, UTM tags         | How many sales conversations?                   |

A hero signup followed by the setup questions sends the same lead twice (the second adds the answers), so it records `Lead Created` twice: `source` hero, then setup. Count signups as people, not events. "More than 20" carries the visitor to `/demo` in the link, so `Demo Requested` joins the same person's funnel.

Every event also carries `environment` (`production`, `preview` or `development`), so QA traffic on preview deployments can be filtered out.

## Tests

- **Unit (Vitest):** lead validation, the honeypot, stub mode, HubSpot field mapping, error handling and timeout, the conversion event, UTM parsing, the analytics wrapper (a no-op without a key; replays early calls once loaded; stops queueing if PostHog can't load), the page-level click and section listeners and the form events (in happy-dom), which links count as unbuilt pages, the product tabs (click, arrow keys, Home and End), the `/demo` hand-off, and the setup questions (step by step, skipping the email the hero already took, "More than 20" to `/demo`, server errors).
- **Browser (Playwright):** the page's search tags and structured data, `robots.txt`, the lead endpoint, the phone menu, the product tabs, the 404 page and `/privacy`, and every signup path: the setup questions, a hero signup carried into them, "More than 20" arriving at `/demo` with the answer filled in, the demo form, and both forms posted without JavaScript.
- **Browser tests never reach HubSpot or PostHog:** `playwright.config.ts` starts its own server with those keys blanked, so a local `.env` can't turn a test run into real contacts.

## Time spent

TODO — the real total, what it covered, and what was excluded (account signups).

## What's next

TODO — a pricing page first: it's the most purchase-ready link in the nav and currently lands on the 404 page.
