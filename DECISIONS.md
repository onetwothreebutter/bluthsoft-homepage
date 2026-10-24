# Decisions

A running log of what was decided, why, and what was changed from the supplied design. Newest entries at the bottom of each section.

## 2026-10-24 — Planning

### How the work is done

- **Time budget: 6 hours total, in two sittings.** The 6 hours cover planning, reviewing the mobile layout in Figma, building, the README and the Loom. Account signups (Vercel, PostHog, HubSpot) are not counted. Sitting 1 ends only when the page is submittable: live, the form delivering leads, and the funnel visible in analytics.
- **AI use.** I make the design and product decisions; Claude Code implements them in small PRs, and I read and merge each one. AI suggestions I turned down are logged below.
- **Cut order when time runs short.** Tier 3 first (animation, the floating notice, automated accessibility and Lighthouse checks in CI, a generated social image), then the end of Tier 2 (the receipt, then the stats-and-testimonial polish). Tier 1 — the hero, the signup flow, `/demo`, `/privacy`, the final CTA, the footer, search tags and analytics — is never cut.

### Stack and hosting

- **Astro + Tailwind v4.** The page is mostly content; Astro ships no JavaScript unless a piece needs it, which keeps it fast. Pages are prerendered; only the lead endpoint runs on demand.
- **Vercel, deployed from GitHub,** so every PR gets a preview URL. Production is `bluthsoft-homepage.vercel.app`.
- **All copy in one typed file** (`src/content/home.ts`). A CMS is the obvious next step, and its schema would mirror this file's types; it wasn't worth the setup time here.
- **Fonts are self-hosted** (Bricolage Grotesque, Schibsted Grotesk, IBM Plex Mono, all OFL) rather than loaded from Google, so loading the page sends nothing about the visitor to a third party.

### Conversion

- **Email first.** The hero form creates the lead as soon as an email is submitted; the setup questions then enrich that same lead. A visitor who abandons the questions is still a lead.
- **The "Set up your stand in three questions" quiz is the signup flow:** how many stands → what you sell → your email. Only step 1 was designed; steps 2 and 3 follow its pattern. Every "Start free" and "Build your first rule" CTA scrolls to it. Without JavaScript it renders as one form posting to the same endpoint.
- **"More than 20" stands routes to `/demo`,** a real page with a short form (name, work email, stands, optional note). "Book a demo" goes there too. Not a booking widget: bookings would land on a real person's calendar.
- **Steps 2 and 3 of the setup questions:** "What do you sell?" (four answers, pick any, optional) and "Where should we send your login?". A hero signup skips the email question, so it's two steps, and the counter says so. Choosing "More than 20" turns Continue into "Book a demo" before it goes there, so the jump isn't a surprise.
- **A hero signup and its setup answers are two submissions of one lead.** HubSpot merges them by email. PostHog records `Lead Created` for each (`source` hero, then setup), so signups are counted as people, not events. The alternative, a separate "lead updated" event, would mean the funnel's last step depends on which form someone started in.
- **`/demo` reuses the setup card,** with name, work email, stands (filled in when it comes from "More than 20") and an optional note. It has no design of its own.
- **Leads go to HubSpot** through a server route that validates the form and traps spam bots, and the conversion is recorded server-side so ad blockers can't hide it. If HubSpot isn't configured, the route is a clearly labelled stub.
- **A HubSpot failure fails the submission; a PostHog failure doesn't.** If HubSpot rejects the lead, or doesn't answer within 10 seconds, the visitor gets "We couldn't save that just now. Please try again in a minute." A failed analytics event is only logged: it isn't worth losing a signup over.
- **Previews don't send leads to HubSpot.** `HUBSPOT_*` is set for Production only, so testing the forms on a preview link runs the labelled stub instead of creating real contacts.
- **Without JavaScript, a validation error gets its own short page** listing what to fix. Redirecting back to the form would show the same empty, prerendered form with no explanation.

### Measurement

- **PostHog behind a Segment-shaped `track()` / `page()` / `identify()` wrapper,** so moving to Segment later is a change in two files: `analytics.ts` in the browser and `conversion.ts` on the server. PostHog over GA4 because funnels and session replay are available the same day.
- **No cookies, no consent banner.** PostHog keeps its ID in memory and IPs are dropped. The homepage funnel happens on one page, so it measures end to end there; the cost is that return visits aren't linked. `/demo` is a separate page, so the link carries the visitor across (next entry).
- **Session replay is on with every input masked.**
- **UTM tags and the referrer** are read from the landing URL and attached to every event and to every form submission.
- **Event names follow Segment's Object Action style:** `CTA Clicked`, `Form Started` / `Submitted` / `Error`, `Lead Created`, `Demo Requested`, `Section Viewed`, `Link Clicked`.
- **Memory persistence, not PostHog's `cookieless_mode`.** Cookieless mode is the obvious fit for "no cookies", but it assigns identity on PostHog's servers, which leaves the browser no ID to send with the form — so the server-side `Lead Created` couldn't join the visitor's funnel.
- **IP addresses are dropped by a PostHog project setting, not in code.** The SDK's `ip` option is deprecated and has no effect.
- **The visitor's ID and original campaign data travel to `/demo` in the link.** Links to `/demo` carry the analytics ID and the landing page's UTM tags and referrer. `/demo` reads them, starts PostHog with the same ID, and removes them from the address bar before recording anything, so a shared or bookmarked `/demo` link doesn't carry them. Nothing is stored on the device, so the no-cookies, no-banner basis holds, and `Demo Requested` joins the homepage visit and its campaign. Turned down: `sessionStorage`, which EU rules treat like a cookie; and accepting unattributed demo requests. Built with the `/demo` page.
- **Autocapture is off; page views and clicks are recorded explicitly,** so the event stream is the tracking plan rather than every click on the page.
- **The server reuses the public PostHog key** for conversion events. It's write-only and already in the page, so there's no second secret to manage.
- **Server-side events skip GeoIP.** They're sent from Vercel's region, so GeoIP would place every lead there.
- **Every event carries `environment`** (production, preview or development), read from Vercel at build time, so QA traffic on preview links can be filtered out of the funnel.

### Content and design

- **Tabs become Inventory · Sales · Bluth AI.** The product has four areas — inventory, automation, reporting, and an AI assistant — and the design only showed two (Staff and Forecast tabs had no content). Automation keeps its own section. The new panels reuse the Inventory panel's layout.
- **The design's copy is untouched.** New copy is written only where none exists (the two new tab panels, quiz steps 2–3, success messages, `/demo`, the 404 page, `/privacy`, page title and description), in the existing voice, and listed in each PR.
- **Every designed link is kept.** Links with a matching section on the page jump to it. The rest go to real paths (`/pricing`, `/careers`, …) that land on one branded "not built yet" page with a Start free button, and the click is tracked as `Link Clicked` — a fake-door test for which page to build next.
- **`/privacy` is real,** because the forms collect email addresses and the site records sessions.
- **Product mockups are HTML/CSS, not images:** sharp at any size, light, and they keep the headline as the first thing to render. Each reads to screen readers as one labelled illustration, and the buttons drawn inside them aren't focusable.
- **Mobile is designed before it's built:** a 375px frame in Figma covering every section plus the open phone menu, reviewed before implementation. In-between widths are handled in code and checked at 768 and 1024px. The phone nav keeps the logo and Start free visible, with a menu for the rest.
- **Sizes between the two frames are interpolated, not invented.** Display type, ledes and side padding are exactly the phone frame's at 375px and the desktop frame's at 1440px, on a straight line between, so 768 and 1024 aren't guesses at a third design.
- **The hero is two columns from 1024px.** Stacked, a 1024 screen showed the copy and card side by side with half the width empty. The product card lays out by its own width rather than the screen's, so the narrower two-column card uses the phone frame's sizes.
- **Headline type uses Bricolage's automatic optical size.** The scaffold pinned it to 14 because that's what Figma's code export lists; measured against Figma's own render, the pinned version set the hero headline about 9% wider and rewrapped it onto four lines on phones.
- **The phone menu is a popover:** it opens and closes (and Escape closes it) without JavaScript. With JavaScript it behaves like a dialog: the page behind can't be reached and doesn't scroll, and choosing a link closes it.
- **The header and footer have one copy each** (`src/content/navigation.ts`), and their section links are written `/#product` so they work from every page.
- **Search:** production is indexable, with a sitemap, robots.txt, canonical URLs pointing at production (also from previews), and `Organization` + `SoftwareApplication` structured data on the homepage only (it describes the company and product, so other pages mustn't lend it their wording). Pages marked `noindex` carry no canonical link.

### AI suggestions I decided against

- **Dropping links to pages that don't exist** (Pricing, Sign in, most of the footer). I kept the designed navigation; the 404-plus-tracking approach above turns them into a demand signal instead.
- **Fixing the contradictions in the supplied copy** (below). Left as designed and noted here instead.
- **Inventing the mobile reflow in code.** I had the mobile layout drawn in Figma first so I could adjust it before anything was built.

## Open questions

- **Where the hero product card sits on phones.** The mobile layout keeps it after the email form and rating, so signup is reachable without much scrolling. Moving it up to right after the subheading would lead with the product, but pushes the email form about 1,000px down the page, below the first screen on any phone. A sticky nav that keeps Start free visible would soften that.
- **A scrolling marquee for the "Running on BluthSoft" strip on phones** — one row of names looping instead of three wrapped rows. If it ships, it needs a way to stop it (a pause button, or one pass and then stop; WCAG 2.2.2), the repeated names hidden from screen readers, and a still, swipeable row when the device asks for reduced motion.

## Noticed in the supplied design, left as-is

1. The inventory panel says "4 items below par", but the table flags 3.
2. The 31% stat appears twice, worded differently: "less spoilage after 90 days" (inventory panel) and "less spoilage in 90 days" (metrics).
3. The location chips say "+ 1,380 more" next to four named locations — 1,384 — beside "1,400+ stands on the platform".
4. Each metric has a progress bar under it that measures nothing ($0 is 97% full).
5. Pier Fruit Co. is a customer in the "Running on BluthSoft" strip and the supplier in the automation card.

Also: **no rating markup in the structured data.** Rating markup is meant to describe reviews the page actually shows; this page shows one testimonial, not 318 reviews.
