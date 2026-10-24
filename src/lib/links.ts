/**
 * Which links get tracked, and how. Components spread the result onto the
 * element; the page-level listener in analytics.ts reads the attributes.
 *
 * - Calls to action (Start free, Book a demo, …) record `CTA Clicked`.
 * - Links to pages that aren't built yet record `Link Clicked`: they land on
 *   the 404 page, so the click is the demand signal for that page.
 * - Everything else (in-page anchors, built pages) isn't tracked as a click;
 *   `Section Viewed` already shows where people go on the page.
 */

/** Paths that exist. Every other same-site path lands on the 404 page. */
export const builtPaths: readonly string[] = ["/", "/demo", "/privacy"];

export type TrackingAttributes = Record<`data-${string}`, string>;

export function isBuilt(href: string): boolean {
  // Only the path matters; the base just lets relative hrefs parse.
  const { pathname } = new URL(href, "https://bluthsoft.invalid");
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return builtPaths.includes(path);
}

/** For navigation links: a fake-door `Link Clicked` if the page doesn't exist yet. */
export function trackLink(href: string, location: string): TrackingAttributes {
  return isBuilt(href)
    ? {}
    : { "data-track": "Link Clicked", "data-location": location };
}

/** For calls to action, wherever they point. */
export function trackCta(location: string): TrackingAttributes {
  return { "data-track": "CTA Clicked", "data-location": location };
}
