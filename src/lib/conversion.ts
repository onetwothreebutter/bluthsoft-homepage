import { PostHog } from "posthog-node";
import type { Lead } from "./lead";
import { utmKeys } from "./analytics";

export interface ConversionEvent {
  event: "Lead Created" | "Demo Requested";
  distinctId: string;
  properties: Record<string, unknown>;
}

/**
 * The conversion event for a lead. Recorded by the server, not the browser,
 * so an ad blocker can't hide it. Carries no email address: the lead itself
 * lives in HubSpot, and analytics only needs to know that it happened and
 * where it came from.
 */
export function conversionEvent(
  lead: Lead,
  newId: () => string = () => crypto.randomUUID(),
): ConversionEvent {
  return {
    event: lead.intent === "demo" ? "Demo Requested" : "Lead Created",
    // Without JavaScript there is no client ID; the event still counts, it
    // just can't join the visitor's funnel.
    distinctId: lead.distinct_id ?? newId(),
    properties: {
      intent: lead.intent,
      source: lead.source,
      stands: lead.stands,
      sells: lead.sells,
      referrer: lead.referrer,
      ...Object.fromEntries(utmKeys.map((key) => [key, lead[key]])),
    },
  };
}

export interface PostHogServerConfig {
  key: string;
  host: string;
}

export async function recordConversion(
  conversion: ConversionEvent,
  config: PostHogServerConfig,
): Promise<void> {
  // One short-lived client per request: a serverless function may be frozen
  // as soon as it responds, so nothing can wait in a background queue.
  const client = new PostHog(config.key, { host: config.host, flushAt: 1 });
  try {
    // The request comes from our server, so GeoIP would place every lead in
    // the hosting region rather than where the visitor is.
    await client.captureImmediate({ ...conversion, disableGeoip: true });
  } finally {
    await client.shutdown();
  }
}
