import type { APIRoute } from "astro";
import {
  PUBLIC_POSTHOG_HOST,
  PUBLIC_POSTHOG_KEY,
  PUBLIC_VERCEL_ENV,
} from "astro:env/client";
import { HUBSPOT_FORM_GUID, HUBSPOT_PORTAL_ID } from "astro:env/server";
import { handleLead } from "../../lib/lead-handler";

// Runs on demand (a Vercel function); every other route is prerendered.
export const prerender = false;

export const POST: APIRoute = ({ request }) =>
  handleLead(request, {
    hubspot:
      HUBSPOT_PORTAL_ID && HUBSPOT_FORM_GUID
        ? { portalId: HUBSPOT_PORTAL_ID, formGuid: HUBSPOT_FORM_GUID }
        : undefined,
    // The project key is write-only and already public in the page, so the
    // server reuses it rather than taking a second secret.
    posthog: PUBLIC_POSTHOG_KEY
      ? { key: PUBLIC_POSTHOG_KEY, host: PUBLIC_POSTHOG_HOST }
      : undefined,
    environment: PUBLIC_VERCEL_ENV,
  });
