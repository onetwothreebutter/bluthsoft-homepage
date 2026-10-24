# Working in this repo

BluthSoft's marketing homepage: Astro (static, plus one on-demand route), Tailwind v4, deployed on Vercel.

- **pnpm only.** Node 22+.
- **Copy lives in `src/content/home.ts`.** Components render from it and never hard-code copy. The design's copy is verbatim; don't "fix" it — known contradictions are logged in `DECISIONS.md`.
- **Any new copy (not in the Figma design) gets listed in the PR description** under "New copy", so it can be reviewed separately from the design's.
- **Design tokens live in `src/styles/global.css` (`@theme`).** Use them (`bg-forest`, `text-ink/72`, `rounded-tile`, `shadow-press`) instead of arbitrary values.
- **Analytics goes through `src/lib/analytics.ts` only.** Never import `posthog-js` elsewhere, and don't call `track()` from components: mark clickable elements with `data-track` / `data-location` / `data-label` / `data-destination` and sections with `data-section`; one page-level listener does the rest.
- **Event names are Object Action in Title Case** (`CTA Clicked`, `Form Started`, `Lead Created`). Add a new event to the tracking plan in `README.md` in the same PR.
- **Leads go through `src/pages/api/lead.ts`,** which validates, forwards to HubSpot, and records the conversion server-side. Conversion events are never fired from the browser.
- **Product mockups are drawings:** one `role="img"` with an `aria-label` summary, contents `aria-hidden`, no focusable buttons inside.
- **Links to pages that don't exist yet use real paths** (`/pricing`), which land on the 404 page; never `href="#"`.
- **Before pushing:** `pnpm check && pnpm format:check && pnpm test && pnpm build && pnpm test:e2e`.
- **Record decisions** (and AI suggestions that were turned down) in `DECISIONS.md` as they happen.
