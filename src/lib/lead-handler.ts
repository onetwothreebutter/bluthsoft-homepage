import { formDataToObject } from "./form-data";
import { honeypotField, parseLead, type Lead, type LeadErrors } from "./lead";
import {
  submitToHubSpot,
  type HubSpotConfig,
  type HubSpotContext,
} from "./hubspot";
import {
  conversionEvent,
  recordConversion,
  type ConversionEvent,
  type PostHogServerConfig,
} from "./conversion";

/**
 * Everything the lead endpoint does, independent of Astro so it can be tested
 * with a plain Request. Two kinds of caller:
 *
 * - The forms' JavaScript posts JSON and gets JSON back: 200, or 422 with a
 *   message per field.
 * - Without JavaScript the form posts itself (form-encoded). Success redirects
 *   to /thanks. A validation error gets a short HTML page listing what to fix:
 *   the form lives on a prerendered page, so redirecting back to it would
 *   show the same empty form with no explanation.
 */

export interface LeadHandlerDeps {
  /** Unset → stub mode: the lead is validated and logged (redacted), not stored. */
  hubspot?: HubSpotConfig;
  /** Unset → no server-side conversion event. */
  posthog?: PostHogServerConfig;
  /** Deployment environment (production, preview, development), attached to the conversion event. */
  environment?: string;
  submit?: (
    lead: Lead,
    config: HubSpotConfig,
    context: HubSpotContext,
  ) => Promise<void>;
  record?: (
    conversion: ConversionEvent,
    config: PostHogServerConfig,
  ) => Promise<void>;
  log?: Pick<Console, "info" | "error">;
}

export const thanksPath = "/thanks";

export async function handleLead(
  request: Request,
  deps: LeadHandlerDeps,
): Promise<Response> {
  const {
    submit = submitToHubSpot,
    record = recordConversion,
    log = console,
  } = deps;
  const isJson = (request.headers.get("content-type") ?? "").includes(
    "application/json",
  );

  const unreadable = { form: "We couldn't read that submission." };
  let body: Record<string, unknown>;
  try {
    body = isJson
      ? await request.json()
      : formDataToObject(await request.formData());
  } catch {
    return respondInvalid(isJson, request, unreadable);
  }
  if (!body || typeof body !== "object") {
    return respondInvalid(isJson, request, unreadable);
  }

  // A bot that fills the hidden field gets the same answer as a person, so it
  // learns nothing, and the lead goes nowhere.
  if (body[honeypotField]) {
    log.info("[lead] dropped: honeypot field filled");
    return respondOk(isJson, request, { stub: !deps.hubspot });
  }

  const parsed = parseLead(body);
  if (!parsed.ok) return respondInvalid(isJson, request, parsed.errors);
  const { lead } = parsed;

  const page = formPage(request) ?? new URL(request.url);
  if (deps.hubspot) {
    try {
      await submit(lead, deps.hubspot, {
        pageUri: page.href,
        pageName: page.pathname,
      });
    } catch (error) {
      log.error("[lead] HubSpot submission failed", error);
      return respondUnavailable(isJson);
    }
  } else {
    log.info("[lead:stub] HubSpot is not configured; lead not stored", {
      email: redactEmail(lead.email),
      intent: lead.intent,
      source: lead.source,
    });
  }

  if (deps.posthog) {
    try {
      await record(
        conversionEvent(lead, { environment: deps.environment }),
        deps.posthog,
      );
    } catch (error) {
      // The lead is safe in HubSpot; losing its analytics event isn't worth
      // failing the visitor's submission over.
      log.error("[lead] recording the conversion failed", error);
    }
  }

  return respondOk(isJson, request, { stub: !deps.hubspot });
}

function respondOk(
  isJson: boolean,
  request: Request,
  result: { stub: boolean },
): Response {
  if (isJson) return Response.json({ ok: true, ...result });
  return Response.redirect(new URL(thanksPath, request.url), 303);
}

function respondInvalid(
  isJson: boolean,
  request: Request,
  errors: LeadErrors,
): Response {
  if (isJson) return Response.json({ ok: false, errors }, { status: 422 });
  const items = Object.values(errors)
    .map((message) => `<li>${escapeHtml(message ?? "")}</li>`)
    .join("");
  return new Response(
    page(
      "Check your details",
      `<p>We couldn't send that yet:</p><ul>${items}</ul><p><a href="${escapeHtml(backTo(request))}">Go back and fix it</a></p>`,
    ),
    {
      status: 422,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    },
  );
}

function respondUnavailable(isJson: boolean): Response {
  const message =
    "We couldn't save that just now. Please try again in a minute.";
  if (isJson)
    return Response.json(
      { ok: false, errors: { form: message } },
      { status: 502 },
    );
  return new Response(page("Something went wrong", `<p>${message}</p>`), {
    status: 502,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title} · BluthSoft</title></head><body><main><h1>${title}</h1>${body}</main></body></html>`;
}

/**
 * The page the form was on, from the Referer, if it's one of ours. Anything
 * else (missing, malformed, another site) is null: a JSON caller can send any
 * Referer it likes, and shouldn't get to choose the page HubSpot records.
 */
function formPage(request: Request): URL | null {
  try {
    const referer = new URL(request.headers.get("referer") ?? "");
    if (referer.origin === new URL(request.url).origin) return referer;
  } catch {
    // No or malformed Referer.
  }
  return null;
}

/** Where "Go back and fix it" leads: the form's page, or the homepage. (No `history.back()`: this page exists for visitors without JavaScript.) */
function backTo(request: Request): string {
  const page = formPage(request);
  return page ? page.pathname + page.search : "/";
}

function escapeHtml(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]!,
  );
}

/** j•••@yourstand.com — enough to spot a test submission in the logs, not enough to be a lead list. */
export function redactEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}
