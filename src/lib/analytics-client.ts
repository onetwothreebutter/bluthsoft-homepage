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
  createAnalytics,
  observeSections,
} from "./analytics";
import { bindLeadForms } from "./lead-form";

export const analytics = createAnalytics({
  key: PUBLIC_POSTHOG_KEY,
  host: PUBLIC_POSTHOG_HOST,
  url: window.location.href,
  referrer: document.referrer,
  environment: PUBLIC_VERCEL_ENV,
});

analytics.page();
bindClickTracking(document, analytics);
observeSections(document, analytics);
bindLeadForms(document, analytics);
