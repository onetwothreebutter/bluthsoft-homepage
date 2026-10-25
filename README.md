# BluthSoft homepage

This is my take-home build of the BluthSoft homepage, the marketing site for an operating platform for banana stands, built from a supplied Figma design.

**Live:** [bluthsoft-homepage.vercel.app](https://bluthsoft-homepage.vercel.app)

I kept a running log of my decisions, the changes I made from the design, and the AI suggestions I turned down in [`DECISIONS.md`](DECISIONS.md). This README covers the tools that shaped the build, how it fits together, and what I'd do next.

## Run it locally

```sh
pnpm install
pnpm dev            # http://localhost:4321
```

Everything runs without environment variables. To point it at real services, copy `.env.example` to `.env`.

| Command             | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `pnpm check`        | Type-checks `.astro` and `.ts` files            |
| `pnpm format:check` | Prettier                                        |
| `pnpm test`         | Unit tests (Vitest)                             |
| `pnpm build`        | Production build into `.vercel/output`          |
| `pnpm test:e2e`     | Browser tests (Playwright, against `astro dev`) |

## Tools and libraries that shaped the approach

I picked **Astro 7** because a marketing page is mostly content, and I wanted HTML first, with JavaScript only where something actually needs it. Astro makes that the default instead of extra work. Every page is prerendered except the lead endpoint, which runs on demand through the Vercel adapter. Because the HTML stands on its own, every form posts and validates without JavaScript, and the phone menu is a native popover. `astro:env` types the environment variables, and they're all optional, so a fresh clone runs with no setup.

I worked from **Figma through its MCP connection**, so the build uses the design's real values instead of eyeballed ones. The file has no variables, so the tokens are the literal values from its frames. Before writing any layout code, I had the phone layout drawn as a 375px frame in my copy of the file and reviewed it there. One thing I learned: Figma's code export isn't the same as Figma's render. The export lists `opsz 14` for the headline font, but Figma renders it with automatic optical sizing, and pinning it made the hero headline about 9% wider. So type here is matched against Figma's screenshots, not its export.

**Tailwind v4** keeps every token in one `@theme` block in `src/styles/global.css`. Display type, ledes and side padding scale in a straight line between the 375 and 1440 frames, so the widths in between follow the two designs rather than a third one I'd have to guess at.

I use AI heavily, and **Claude Code** is my main coding partner. Here, I made the design and product calls, and Claude Code wrote the code in small, stacked PRs that I reviewed and merged one at a time. Those reviews caught real bugs before they shipped, like another site's `?ref=` tag erasing campaign attribution on the way to `/demo`. The rules it works under are in `AGENTS.md`: copy lives in `src/content/`, analytics only goes through page-level listeners, and decisions get logged as they happen. The suggestions I turned down are in `DECISIONS.md`.

I went with **PostHog** (`posthog-js` and `posthog-node`) over GA4 because funnels and session replay work on day one. It sits behind a small Segment-shaped wrapper (`track`, `page`, `identify`), so moving to Segment or adding another destination means changing two files. The visitor's ID lives in memory rather than in PostHog's `cookieless_mode`. Cookieless mode sounds like the obvious fit for a site with no cookies, but it assigns IDs on PostHog's servers. That leaves the browser no ID to send with the form, so the server-side conversion couldn't join the visitor's funnel.

Leads land in HubSpot through the **HubSpot Forms API v3**. I skipped the SDK: it's one `fetch` with a 10-second deadline. The HubSpot keys are only set in production, so preview deployments run a clearly labelled stub and never create real contacts.

With **zod 4**, one schema validates leads from all three forms and produces the per-field messages the forms show. It only runs on the server, so it stays out of the browser bundle.

For tests, **Vitest with happy-dom** covers the page-level listeners and form logic, and **Playwright** drives the real page. Playwright runs against `astro dev`, since the Vercel adapter doesn't support `astro preview`, and its config blanks the service keys so a test run can't create real contacts or events.

## How it's built

- **Copy** lives in `src/content/`: `home.ts` for the homepage, `navigation.ts` for the header and footer, `pages.ts` for the other pages, and `site.ts` for site-wide strings. Components only render it.
- **Analytics** goes through `src/lib/analytics.ts` (`track`, `page`, `identify`, `anonymousId`).
  - posthog-js only downloads when `PUBLIC_POSTHOG_KEY` is set, and it loads as its own chunk.
  - There are no cookies and no storage (`persistence: "memory"`). Session replay masks every input, and autocapture is off, so the event stream is exactly the tracking plan below.
  - One page-level listener tracks clicks from `data-track` attributes, and an IntersectionObserver on `[data-section]` tracks sections. Components never import analytics.
  - UTM tags and an outside referrer come from the landing URL and ride along on every event.
- **The lead endpoint** (`src/pages/api/lead.ts`, with the logic in `src/lib/lead-handler.ts`) is the only route that runs on demand.
  - It validates the submission, drops anything that fills the honeypot (while answering it like any other), sends the lead to HubSpot, and then records `Lead Created` or `Demo Requested` server-side against the visitor's analytics ID. Ad blockers can't hide conversions, and the event never carries an email address.
  - The forms' JavaScript gets JSON back. Without JavaScript, a successful post redirects to `/thanks`, and a failed one gets a short page listing what to fix.
  - Without HubSpot configured, it runs as a stub: it validates, logs a redacted line, stores nothing, and answers with `"stub": true`.

## Tracking plan

Every event is here because it answers a question, which is the last column.

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

A hero signup followed by the setup questions sends the same lead twice (the second time with the answers), so it records `Lead Created` twice: once with `source` hero, then once with setup. Count signups as people, not events. "More than 20" carries the visitor over to `/demo` in the link, so `Demo Requested` lands in the same person's funnel.

Every event also carries `environment` (`production`, `preview` or `development`), so you can filter QA traffic on preview deployments out of the funnel.

## Tests

- **Unit tests (Vitest)** cover lead validation, the honeypot, stub mode, HubSpot field mapping, error handling and the timeout, the conversion event, UTM parsing, and the analytics wrapper (a no-op without a key, replaying early calls once it loads, and no more queueing if PostHog can't load). In happy-dom, they also cover the page-level click, tab and section listeners, the form events, which links count as unbuilt pages, the hero card's content fitting its animation, the product tabs (click, arrow keys, Home and End), the `/demo` hand-off, and the setup questions (step by step, skipping the email the hero already took, "More than 20" going to `/demo`, and server errors).
- **Browser tests (Playwright)** cover the page's search tags and structured data, `robots.txt`, the lead endpoint, the phone menu, the hero card's animation waiting until it's in view on a phone, the product tabs, every in-page link having a section to land on, the 404 page and `/privacy`. They also cover every signup path: the setup questions, a hero signup carried into them, "More than 20" arriving at `/demo` with the answer filled in, the demo form, and both forms posted without JavaScript.
- **The browser tests never touch HubSpot or PostHog.** `playwright.config.ts` starts its own server with those keys blanked, so a local `.env` can't turn a test run into real contacts.

## Time spent

TODO — the real total, what it covered, and what was excluded (account signups).

## What's next

With more time, here's what I'd do, roughly in priority order:

1. **A pricing page.** It's the most purchase-ready link in the nav, and right now it lands on the "not built yet" page. `Link Clicked` will show whether people actually want it. When it ships, its path goes in `builtPaths` in `src/lib/links.ts`, or its links keep counting as unbuilt.
2. **Rate limiting on `/api/lead`.** The honeypot only stops lazy bots. A script posting real-looking emails could still fill up HubSpot, so I'd add a per-IP limit (a Vercel firewall rule or Upstash) before the HubSpot call.
3. **Accessibility and performance checks in CI.** I cut these from Tier 3: axe through Playwright, plus Lighthouse CI with budgets. Code review caught a focus ring at 1.45:1 on the dark section, and product panels that Tab skipped right over. I'd rather a machine catch the next one.
4. **A social image.** `Base.astro` already outputs `og:image` and a large Twitter card when a page passes an image, but no page does yet, so shared links show up plain.
5. **Visual regression tests against the frames.** I compared sections with Figma at 375 and 1440 by hand. Playwright screenshots would make that repeatable.
6. **More browsers.** The browser tests only run in Chromium. WebKit is the one I'd add first: Safari doesn't focus a button when you click it, and the phone menu depends on the popover API.
7. **Counting middle-clicks on calls to action.** The click listener only hears `click`, and a middle-click that opens a new tab only fires `auxclick`, so those go uncounted. The `/demo` hand-off already handles both, so the fix is small.
8. **Two Dependabot alerts inside Vercel's packages.** `zod` 4.1.11 and `path-to-regexp` 6.1.0 are pinned exactly by `@astrojs/vercel`'s dependencies. Neither is reachable from visitor input: the first reads the Vercel CLI's local config, and the second builds route patterns at build time. Overriding the second to 6.3.0 leaves the generated routing config byte-identical. They'll clear when Vercel bumps them, or with pnpm overrides scoped to those two packages.
9. **A CMS for the copy.** The copy is already in typed files in `src/content/`, so a CMS schema would mirror those types.
10. **Linking return visits.** That needs an ID that sticks around between visits, which means consent and a banner. It's a product call as much as an engineering one, so I logged it in `DECISIONS.md` instead of building it.
