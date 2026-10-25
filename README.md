# BluthSoft homepage

The marketing homepage for BluthSoft, the operating platform for banana stands — a take-home homepage build from a supplied Figma design.

**Live:** [bluthsoft-homepage.vercel.app](https://bluthsoft-homepage.vercel.app)

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

## Stack, and ## Tools and libraries that shaped the approach

- **Astro 7** made progressive enhancement the default instead of extra work. Pages are prerendered HTML, and JavaScript is added only where a piece needs it, so every form posts and validates without it, and the phone menu is a native popover. The one on-demand route is the lead endpoint, through the Vercel adapter. `astro:env` types the environment variables, all optional, so a fresh clone runs with no setup.
- **Figma, through its MCP connection.** Tokens and sizes were read from the frames rather than eyeballed. The file defines no variables, so `@theme` holds the literal values its frames use. The phone layout was drawn as a 375px frame and reviewed in Figma before any layout code. One lesson: the code export isn't the render. It lists `opsz 14` for the headline font, but Figma renders automatic optical sizing, so type is matched against Figma's screenshots, not its export.
- **Tailwind v4.** One `@theme` block (`src/styles/global.css`) holds the tokens. Display type, ledes and side padding interpolate linearly between the 375 and 1440 frames, so in-between widths follow the two designs instead of a guessed third.
- **Claude Code** wrote the code, in small stacked PRs that I reviewed and merged one at a time. I made the design and product calls. The rules it works under are in `AGENTS.md`: copy in `src/content/`, analytics only through page-level listeners, decisions logged as they happen. The suggestions I turned down are in `DECISIONS.md`.
- **PostHog** (`posthog-js` and `posthog-node`): funnels and session replay on day one. It sits behind a Segment-shaped wrapper (`track` / `page` / `identify`), so swapping or adding a destination changes two files. Identity is kept in memory, not in PostHog's `cookieless_mode`, because cookieless mode assigns IDs on PostHog's servers, which leaves the browser no ID to send with the form for the server-side conversion to join.
- **HubSpot Forms API v3:** where leads land. No SDK: one `fetch` with a 10-second deadline. HubSpot keys are set for production only, so preview deployments run a labelled stub instead of creating contacts.
- **zod 4:** one schema validates leads from all three forms and produces the per-field messages the forms show. It runs on the server only, so it stays out of the browser bundle.
- **Vitest with happy-dom, and Playwright.** happy-dom covers the page-level listeners and form logic. Playwright drives the real page, against `astro dev`, because the Vercel adapter doesn't support `astro preview`. Its config blanks the service keys, so a test run can't create real contacts or events.

ilt

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
| `Tab Selected`        | A product tab is chosen, by click or by key, and stays chosen for a second                 | `location`, `label`                                                 | Which part of the product interests people?     |
| `Form Started`        | A visitor first types into, or picks an answer in, a form                                  | `form` (`hero`, `setup`, `demo`)                                    | Does the form attract attempts?                 |
| `Form Step Completed` | A setup question is answered                                                               | `form`, `step`, `step_number`, and the answer (`stands` or `sells`) | Which question loses people?                    |
| `Form Submitted`      | A form is sent to the server                                                               | `form`                                                              | Where do attempts drop off?                     |
| `Form Error`          | A form can't be sent: a field fails the check, the server rejects it, or the network fails | `form`, `fields`                                                    | Which field trips people up?                    |
| `Lead Created`        | The server accepted a signup (server-side)                                                 | `intent`, `source`, `stands`, `sells`, `referrer`, UTM tags         | How many signups, from which form and campaign? |
| `Demo Requested`      | The server accepted a demo request (server-side)                                           | `intent`, `source`, `stands`, `sells`, `referrer`, UTM tags         | How many sales conversations?                   |

A hero signup followed by the setup questions sends the same lead twice (the second adds the answers), so it records `Lead Created` twice: `source` hero, then setup. Count signups as people, not events. "More than 20" carries the visitor to `/demo` in the link, so `Demo Requested` joins the same person's funnel.

Every event also carries `environment` (`production`, `preview` or `development`), so QA traffic on preview deployments can be filtered out.

## Tests

- **Unit (Vitest):** lead validation, the honeypot, stub mode, HubSpot field mapping, error handling and timeout, the conversion event, UTM parsing, the analytics wrapper (a no-op without a key; replays early calls once loaded; stops queueing if PostHog can't load), the page-level click, tab and section listeners and the form events (in happy-dom), which links count as unbuilt pages, the hero card's content fitting its animation, the product tabs (click, arrow keys, Home and End), the `/demo` hand-off, and the setup questions (step by step, skipping the email the hero already took, "More than 20" to `/demo`, server errors).
- **Browser (Playwright):** the page's search tags and structured data, `robots.txt`, the lead endpoint, the phone menu, the hero card's animation waiting until it's in view on a phone, the product tabs, every in-page link having a section to land on, the 404 page and `/privacy`, and every signup path: the setup questions, a hero signup carried into them, "More than 20" arriving at `/demo` with the answer filled in, the demo form, and both forms posted without JavaScript.
- **Browser tests never reach HubSpot or PostHog:** `playwright.config.ts` starts its own server with those keys blanked, so a local `.env` can't turn a test run into real contacts.

## Time spent

TODO — the real total, what it covered, and what was excluded (account signups).

## What's next

In priority order:

1. **A pricing page.** It's the most purchase-ready link in the nav, and it lands on the "not built yet" page. `Link Clicked` will show whether the demand is there. When it ships, add its path to `builtPaths` in `src/lib/links.ts`, or its links keep recording as unbuilt.
2. **Rate-limit `/api/lead`.** The honeypot stops only naive bots: a script posting valid-looking emails would fill HubSpot. A per-IP limit (a Vercel firewall rule, or Upstash) before the HubSpot call would close that.
3. **Accessibility and performance checks in CI.** These were cut from Tier 3: axe through Playwright, and Lighthouse CI with budgets. Review caught a focus ring at 1.45:1 on the dark section, and product panels that Tab skipped. A machine should catch the next one.
4. **A social image.** `Base.astro` already emits `og:image` and a large Twitter card when a page passes an image. No page does yet, so shares show a plain link.
5. **Visual regression against the frames.** Sections were compared with Figma at 375 and 1440 by hand. Playwright screenshots would make that repeatable.
6. **More browsers in the browser tests.** They run on Chromium only. WebKit is the one that matters: Safari doesn't focus a button when it's clicked, and the phone menu relies on the popover API.
7. **Count middle-clicks on calls to action.** The click listener hears `click`, and a middle-click that opens a new tab fires only `auxclick`, so it isn't recorded. The `/demo` hand-off already handles both.
8. **Two Dependabot alerts in Vercel's packages.** `zod` 4.1.11 and `path-to-regexp` 6.1.0 are pinned exactly inside `@astrojs/vercel`'s dependencies. Neither is reachable from visitor input: one reads the Vercel CLI's local config, and the other builds route patterns at build time. Overriding the second to 6.3.0 left the generated routing config byte-identical. They clear when Vercel bumps them, or with pnpm overrides scoped to those two packages.
9. **A CMS for the copy.** All copy is in one typed file (`src/content/home.ts`), so a CMS schema would mirror those types.
10. **Linking return visits.** That needs an ID that persists across visits, and so consent and a banner. It's a product decision, not just an engineering one, so it's in `DECISIONS.md` rather than built.
