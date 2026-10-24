import type { Lead } from "./lead";
import { utmKeys } from "./analytics";

/**
 * HubSpot's Forms API v3 submit endpoint (the unauthenticated one: it needs
 * only the portal and form IDs, which aren't secrets).
 * https://developers.hubspot.com/docs/api-reference/legacy/marketing/forms/v3-legacy/submit-data-unauthenticated
 */
export const hubspotSubmitUrl = (portalId: string, formGuid: string) =>
  `https://api.hsforms.com/submissions/v3/integration/submit/${encodeURIComponent(portalId)}/${encodeURIComponent(formGuid)}`;

export interface HubSpotConfig {
  portalId: string;
  formGuid: string;
}

export interface HubSpotContext {
  pageUri: string;
  pageName: string;
}

const CONTACT = "0-1";

/**
 * Lead fields → HubSpot contact properties. The form in HubSpot must contain a
 * field for every property named here, or HubSpot rejects the submission.
 * Empty values are left out rather than sent blank.
 */
export function hubspotFields(lead: Lead) {
  const properties: Record<string, string | undefined> = {
    email: lead.email,
    // One name field on our side; HubSpot's firstname holds it whole rather
    // than guessing where a first name ends.
    firstname: lead.name,
    message: lead.note,
    lead_intent: lead.intent,
    lead_source: lead.source,
    stands: lead.stands,
    sells: lead.sells?.join(";"),
    ...Object.fromEntries(utmKeys.map((key) => [key, lead[key]])),
  };
  return Object.entries(properties)
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([name, value]) => ({ objectTypeId: CONTACT, name, value }));
}

export async function submitToHubSpot(
  lead: Lead,
  config: HubSpotConfig,
  context: HubSpotContext,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    hubspotSubmitUrl(config.portalId, config.formGuid),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: hubspotFields(lead), context }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `HubSpot rejected the submission (${response.status}): ${await response.text()}`,
    );
  }
}
