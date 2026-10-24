/**
 * Where a visitor came from: UTM tags and the referring site. The browser
 * wrapper reads it from the landing URL; the server receives it with a form
 * submission and passes it to HubSpot and PostHog. It lives apart from both so
 * the server's bundle doesn't pull in browser code for a list of keys.
 */

export const utmKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export type Attribution = Partial<
  Record<(typeof utmKeys)[number] | "referrer", string>
>;

/** UTM tags from the landing URL, plus the referrer when it's another site. */
export function readAttribution(url: string, referrer = ""): Attribution {
  const landing = new URL(url);
  const attribution: Attribution = {};
  for (const key of utmKeys) {
    const value = landing.searchParams.get(key)?.trim();
    if (value) attribution[key] = value;
  }
  if (referrer) {
    try {
      // A same-site referrer is just in-page navigation, not a source.
      if (new URL(referrer).origin !== landing.origin)
        attribution.referrer = referrer;
    } catch {
      // Not a URL (some browsers send "android-app://…" and similar); ignore it.
    }
  }
  return attribution;
}
