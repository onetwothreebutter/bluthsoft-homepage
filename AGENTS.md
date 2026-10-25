# Working in this repo

BluthSoft's marketing homepage: Astro (static, plus one on-demand route), Tailwind v4, deployed on Vercel.

- **pnpm only.** Node 22+.
- **Copy lives in `src/content/`:** `home.ts` for the homepage, `navigation.ts` for the header and footer, `pages.ts` for the other pages, `site.ts` for site-wide strings (brand name, structured-data wording, the skip link). Components and layouts render from these and never hard-code copy. The design's copy is verbatim; don't "fix" it — known contradictions are logged in `DECISIONS.md`.
- **Any new copy (not in the Figma design) gets listed in the PR description** under "New copy", so it can be reviewed separately from the design's.
- **Design tokens live in `src/styles/global.css` (`@theme`).** Use them (`bg-forest`, `text-ink/72`, `rounded-tile`, `shadow-press`) instead of arbitrary values.
- **Analytics goes through `src/lib/analytics.ts` (browser) and `src/lib/conversion.ts` (server-side conversion events) only.** Never import `posthog-js` or `posthog-node` elsewhere, and don't call `track()` from components: spread `trackCta(location)` onto calls to action and `trackLink(href, location)` onto navigation links (`src/lib/links.ts`), mark sections with `data-section` and lead forms with `data-lead-form`; page-level listeners do the rest.
- **Event names are Object Action in Title Case** (`CTA Clicked`, `Form Started`, `Lead Created`). Add a new event to the tracking plan in `README.md` in the same PR.
- **Leads go through `src/pages/api/lead.ts`,** which validates, forwards to HubSpot, and records the conversion server-side. Conversion events are never fired from the browser.
- **Product mockups are drawings:** one `role="img"` with an `aria-label` summary, contents `aria-hidden`, no focusable buttons inside.
- **Links to pages that don't exist yet use real paths** (`/pricing`), which land on the 404 page; never `href="#"`. Add a page to `builtPaths` in `src/lib/links.ts` when it ships, or its links keep recording `Link Clicked`.
- **Layout follows the two Figma frames:** phone (375) and desktop (1440). Display type, ledes and the side padding (`page-gutter`) are fluid between them; other sizes switch at a breakpoint.
- **Browser tests run against the stub.** `playwright.config.ts` blanks the HubSpot and PostHog variables for its own server; keep it that way, or a local `.env` turns a test run into real contacts and events.
- **Before pushing:** `pnpm check && pnpm format:check && pnpm test && pnpm build && pnpm test:e2e`.
- **Record decisions** (and AI suggestions that were turned down) in `DECISIONS.md` as they happen.
