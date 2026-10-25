import type { Analytics } from "./analytics";
import { utmKeys } from "./attribution";

/**
 * Carrying a visitor from one page to /demo. Nothing is stored on the device
 * (see DECISIONS.md), so links to /demo carry the analytics ID and the landing
 * page's campaign tags and referrer in the URL. /demo reads them, starts
 * analytics with the same ID, and removes them from the address bar before
 * anything is recorded, so a shared or bookmarked link doesn't carry them on.
 */

export const handoffPath = "/demo";

// Prefixed so they can't be mistaken for parameters other sites add to their
// own links: Product Hunt, newsletters and directories add `?ref=`.
const prefix = "bs_";
const idParam = `${prefix}vid`;
const referrerParam = `${prefix}ref`;
/** Answers a link can carry, such as the stand count from the setup questions. */
const answerKeys = ["stands"] as const;
type Answers = Partial<Record<(typeof answerKeys)[number], string>>;
const answerParam = (key: keyof Answers) => `${prefix}${key}`;
const carriedParams = [idParam, referrerParam, ...answerKeys.map(answerParam)];

// PostHog's anonymous IDs are UUIDs. Anything else in the parameter is
// ignored, so a hand-edited link can't set an arbitrary ID.
const idPattern = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

// Only the path and query matter; the base lets relative hrefs parse.
const base = "https://bluthsoft.invalid";

/** `href` with the visitor's ID, campaign tags, referrer and any answers added. */
export function handoffUrl(
  href: string,
  analytics: Analytics,
  answers: Answers = {},
): string {
  const url = new URL(href, base);
  const id = analytics.anonymousId();
  if (id) url.searchParams.set(idParam, id);
  const { referrer, ...tags } = analytics.attribution();
  for (const [key, value] of Object.entries(tags))
    if (value) url.searchParams.set(key, value);
  if (referrer) url.searchParams.set(referrerParam, referrer);
  for (const key of answerKeys) {
    const value = answers[key];
    if (value) url.searchParams.set(answerParam(key), value);
  }
  return url.pathname + url.search + url.hash;
}

export interface Handoff {
  distinctId?: string;
  referrer?: string;
  answers: Answers;
  /**
   * The URL without the carried values, for the address bar, or null if the
   * link wasn't a hand-off. A campaign link that points straight at /demo is
   * left alone, and so is every other page: only /demo is linked to with one.
   */
  cleanUrl: string | null;
}

export function readHandoff(href: string): Handoff {
  const url = new URL(href);
  const params = url.searchParams;
  if (
    url.pathname !== handoffPath ||
    !carriedParams.some((key) => params.has(key))
  )
    return { answers: {}, cleanUrl: null };

  const id = params.get(idParam);
  const answers: Answers = {};
  for (const key of answerKeys) {
    const value = params.get(answerParam(key));
    if (value) answers[key] = value;
  }
  const handoff = {
    distinctId: id && idPattern.test(id) ? id : undefined,
    // Left out unless it's a URL, so the browser's own referrer is used
    // instead of a hand-edited value that attribution would discard.
    referrer: absoluteUrl(params.get(referrerParam)),
    answers,
  };
  for (const key of [...carriedParams, ...utmKeys]) params.delete(key);
  return { ...handoff, cleanUrl: url.pathname + url.search + url.hash };
}

// Any absolute URL, not only http(s): apps send referrers like
// android-app://com.google.android.gm/, and the landing page keeps those.
function absoluteUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    new URL(value);
    return value;
  } catch {
    return undefined;
  }
}

/**
 * Adds the hand-off to every same-site link to /demo as it's followed, then
 * puts the plain href back. The page can stay open (a middle-click opens a
 * new tab) or come back from the back-forward cache, so the link must not
 * keep the visitor's ID: a later click would be tracked with it as the
 * destination, and "Copy link address" would share it. Runs in the bubbling
 * phase, after the click tracking has recorded the plain href.
 */
export function bindHandoffLinks(root: Document, analytics: Analytics): void {
  const carry = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    const href = link.getAttribute("href") ?? "";
    const target = new URL(href, root.location.href);
    if (
      target.origin !== root.location.origin ||
      target.pathname !== handoffPath
    )
      return;
    link.setAttribute("href", handoffUrl(href, analytics));
    // The browser reads the href when the event finishes, so by the time
    // this runs the navigation or new tab already has the rewritten one.
    setTimeout(() => link.setAttribute("href", href));
  };
  root.addEventListener("click", carry);
  // A middle-click opens a tab without firing `click`. Other buttons open
  // menus, so they leave the link alone.
  root.addEventListener("auxclick", (event) => {
    if (event.button === 1) carry(event);
  });
}
