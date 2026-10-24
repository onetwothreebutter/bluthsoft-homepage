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

const idParam = "vid";
const referrerParam = "ref";
/** Answers a link can carry, such as the stand count from the setup questions. */
const answerParams = ["stands"] as const;
type Answers = Partial<Record<(typeof answerParams)[number], string>>;

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
  for (const [key, value] of Object.entries(answers))
    if (value) url.searchParams.set(key, value);
  return url.pathname + url.search + url.hash;
}

export interface Handoff {
  distinctId?: string;
  referrer?: string;
  answers: Answers;
  /**
   * The URL without the carried values, for the address bar, or null if the
   * link wasn't a hand-off. A campaign link that points straight at /demo is
   * left alone.
   */
  cleanUrl: string | null;
}

export function readHandoff(href: string): Handoff {
  const url = new URL(href);
  const params = url.searchParams;
  const id = params.get(idParam);
  const answers: Answers = {};
  for (const key of answerParams) {
    const value = params.get(key);
    if (value) answers[key] = value;
  }
  const handoff = {
    distinctId: id && idPattern.test(id) ? id : undefined,
    referrer: params.get(referrerParam) || undefined,
    answers,
  };

  if (![idParam, referrerParam, ...answerParams].some((key) => params.has(key)))
    return { ...handoff, cleanUrl: null };
  for (const key of [idParam, referrerParam, ...answerParams, ...utmKeys])
    params.delete(key);
  return { ...handoff, cleanUrl: url.pathname + url.search + url.hash };
}

/**
 * Adds the hand-off to every link to /demo as it's followed. Runs in the
 * bubbling phase, after the click tracking has recorded the link's plain href.
 */
export function bindHandoffLinks(root: Document, analytics: Analytics): void {
  const carry = (event: Event) => {
    const link = (event.target as Element | null)?.closest?.("a[href]");
    if (!(link instanceof HTMLAnchorElement)) return;
    const href = link.getAttribute("href") ?? "";
    if (new URL(href, base).pathname !== handoffPath) return;
    link.setAttribute("href", handoffUrl(href, analytics));
  };
  root.addEventListener("click", carry);
  root.addEventListener("auxclick", carry);
}
