import type { Analytics } from "./analytics";

/**
 * The fields every lead form adds to its submission so the server can record
 * the conversion against this visit: the visitor's analytics ID and the
 * landing page's UTM tags and referrer. Empty values are left out.
 */
export function leadContext(analytics: Analytics): Record<string, string> {
  const fields: Record<string, string> = {};
  const id = analytics.anonymousId();
  if (id) fields.distinct_id = id;
  for (const [key, value] of Object.entries(analytics.attribution()))
    if (value) fields[key] = value;
  return fields;
}

/**
 * Wires up every `form[data-lead-form]` (the attribute's value names the form
 * in events): `Form Started` on the first input, and the lead context added
 * to the submission. Sending, and the events about it, is signup.ts.
 *
 * The context is added in the `formdata` event, which fires for a native post
 * and for `new FormData(form)` alike, so it needs no hidden inputs.
 */
export function bindLeadForms(root: Document, analytics: Analytics): void {
  for (const form of root.querySelectorAll<HTMLFormElement>(
    "form[data-lead-form]",
  )) {
    const name = form.dataset.leadForm;
    form.addEventListener(
      "input",
      () => analytics.track("Form Started", { form: name }),
      { once: true },
    );
    form.addEventListener("formdata", (event) => {
      for (const [key, value] of Object.entries(leadContext(analytics)))
        event.formData.set(key, value);
    });
  }
}
