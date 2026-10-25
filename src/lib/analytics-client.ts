// The page's one analytics instance. Imported by the layout's script and by
// anything that needs `anonymousId()` or `attribution()` (the forms); Vite
// bundles it once, so every importer shares this instance.
import {
  PUBLIC_POSTHOG_HOST,
  PUBLIC_POSTHOG_KEY,
  PUBLIC_VERCEL_ENV,
} from "astro:env/client";
import {
  bindClickTracking,
  bindTabTracking,
  createAnalytics,
  observeSections,
} from "./analytics";
import { bindHandoffLinks, readHandoff } from "./handoff";
import { bindLeadForms } from "./lead-form";

// A link from another page may carry this visit's ID and campaign data (see
// handoff.ts). Read them, then take them out of the address bar before
// anything is recorded, so the page view and replays show the clean URL.
const landing = window.location.href;
export const handoff = readHandoff(landing);
if (handoff.cleanUrl) history.replaceState(history.state, "", handoff.cleanUrl);

export const analytics = createAnalytics({
  key: PUBLIC_POSTHOG_KEY,
  host: PUBLIC_POSTHOG_HOST,
  url: landing,
  referrer: handoff.referrer ?? document.referrer,
  distinctId: handoff.distinctId,
  environment: PUBLIC_VERCEL_ENV,
});

analytics.page();
bindClickTracking(document, analytics);
bindTabTracking(document, analytics);
observeSections(document, analytics);
bindLeadForms(document, analytics);
bindHandoffLinks(document, analytics);
