import type { Analytics } from "./analytics";
import { formDataToObject } from "./form-data";
import { handoffPath, handoffUrl } from "./handoff";

/**
 * The lead forms with JavaScript: the hero's email form, the setup questions
 * and the /demo form. Without JavaScript each is a plain form posting to
 * /api/lead (see the components); this upgrades them to send JSON and answer
 * in place.
 *
 * Copy the script needs (button labels, error messages) comes from data
 * attributes the components render from src/content, so none is written here.
 *
 * Events: `Form Submitted` when a form is sent, `Form Error` when it can't be
 * (`fields` names what failed), and `Form Step Completed` for each setup
 * question. `Form Started` is in lead-form.ts.
 */

export type FieldErrors = Record<string, string>;
export interface LeadResult {
  ok: boolean;
  errors: FieldErrors;
}

/** Sends the form's fields to the lead endpoint as JSON. */
export async function sendLead(
  form: HTMLFormElement,
  analytics: Analytics,
  fetchImpl: typeof fetch = fetch,
): Promise<LeadResult> {
  const name = form.dataset.leadForm;
  analytics.track("Form Submitted", { form: name });
  // Building FormData fires the `formdata` event, which adds the analytics ID
  // and campaign tags (lead-form.ts).
  const body = formDataToObject(new FormData(form));
  let result: LeadResult;
  try {
    const response = await fetchImpl(form.action, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await response.json()) as { errors?: FieldErrors };
    result = { ok: response.ok, errors: json.errors ?? {} };
  } catch {
    result = {
      ok: false,
      errors: { network: form.dataset.networkError ?? "" },
    };
  }
  if (!result.ok)
    analytics.track("Form Error", {
      form: name,
      fields: Object.keys(result.errors),
    });
  return result;
}

/**
 * Shows each message in the form's `[data-error-for="<field>"]` element, or in
 * `[data-error-for="form"]` when the field has none. Clears the rest.
 */
export function showErrors(form: HTMLFormElement, errors: FieldErrors): void {
  const slots = new Map(
    [...form.querySelectorAll<HTMLElement>("[data-error-for]")].map((slot) => [
      slot.dataset.errorFor!,
      slot,
    ]),
  );
  const messages = new Map<string, string>();
  for (const [field, message] of Object.entries(errors)) {
    const key = slots.has(field) ? field : "form";
    if (!messages.has(key)) messages.set(key, message);
  }
  for (const [key, slot] of slots) {
    slot.textContent = messages.get(key) ?? "";
    slot.hidden = !messages.has(key);
  }
}

/** The names of the fields the browser's own checks reject. */
function invalidFields(root: ParentNode): string[] {
  return [
    ...new Set(
      [...root.querySelectorAll<HTMLInputElement>("[name]")]
        .filter((field) => !field.checkValidity())
        .map((field) => field.name),
    ),
  ];
}

/**
 * A one-step form (hero, /demo): checks it, sends it, and calls `onSuccess`
 * or shows what went wrong.
 */
export function enhanceForm(
  form: HTMLFormElement,
  analytics: Analytics,
  onSuccess: (data: FormData) => void,
  fetchImpl: typeof fetch = fetch,
): void {
  // Checked here instead, so a failed check can be recorded.
  form.noValidate = true;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const invalid = invalidFields(form);
    if (invalid.length) {
      analytics.track("Form Error", {
        form: form.dataset.leadForm,
        fields: invalid,
      });
      form.reportValidity();
      return;
    }
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]');
    if (submit) submit.disabled = true;
    const result = await sendLead(form, analytics, fetchImpl);
    if (submit) submit.disabled = false;
    showErrors(form, result.errors);
    if (result.ok) onSuccess(new FormData(form));
  });
}

type Step = "stands" | "sells" | "email";
const allSteps: Step[] = ["stands", "sells", "email"];

/**
 * The setup questions, one at a time: how many stands, what you sell, your
 * email. "More than 20" goes to /demo instead. If the hero form already took
 * the email, `useEmail` drops the last step.
 */
export function enhanceSetupForm(
  form: HTMLFormElement,
  analytics: Analytics,
  fetchImpl: typeof fetch = fetch,
  navigate: (url: string) => void = (url) => window.location.assign(url),
) {
  const copy = form.dataset;
  const back = form.querySelector<HTMLButtonElement>("[data-back]")!;
  const next = form.querySelector<HTMLButtonElement>("[data-next]")!;
  const email = form.querySelector<HTMLInputElement>('input[name="email"]')!;
  const stepElement = (step: Step) =>
    form.querySelector<HTMLElement>(`[data-step="${step}"]`)!;

  let steps = allSteps;
  let index = 0;
  const current = () => steps[index];
  const stands = () =>
    form.querySelector<HTMLInputElement>('input[name="stands"]:checked')?.value;
  const sells = () =>
    [
      ...form.querySelectorAll<HTMLInputElement>('input[name="sells"]:checked'),
    ].map((input) => input.value);
  const goesToDemo = () => current() === "stands" && stands() === "20+";

  function render() {
    for (const step of allSteps) stepElement(step).hidden = step !== current();
    const element = stepElement(current());
    element.querySelector("[data-step-of]")!.textContent = copy
      .counter!.replace("{step}", String(index + 1))
      .replace("{total}", String(steps.length));
    element.querySelector<HTMLElement>("[data-progress]")!.style.width =
      `${((index + 1) / steps.length) * 100}%`;
    back.hidden = false;
    back.disabled = index === 0;
    next.textContent =
      index === steps.length - 1
        ? copy.labelSubmit!
        : goesToDemo()
          ? copy.labelDemo!
          : copy.labelNext!;
  }

  function show(step: number) {
    index = step;
    render();
    showErrors(form, {});
    stepElement(current())
      .querySelector<HTMLElement>("[data-question]")
      ?.focus({ preventScroll: true });
  }

  // Answers the current step, or returns the error to show.
  function check(): FieldErrors {
    if (current() === "stands" && !stands())
      return { stands: copy.errorStands! };
    if (current() === "email" && !email.checkValidity())
      return { email: copy.errorEmail! };
    return {};
  }

  form.noValidate = true;
  form.addEventListener("change", () => render());
  back.addEventListener("click", () => show(Math.max(0, index - 1)));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const errors = check();
    showErrors(form, errors);
    if (Object.keys(errors).length) {
      analytics.track("Form Error", {
        form: copy.leadForm,
        fields: Object.keys(errors),
      });
      return;
    }

    analytics.track("Form Step Completed", {
      form: copy.leadForm,
      step: current(),
      step_number: index + 1,
      ...(current() === "stands" && { stands: stands() }),
      ...(current() === "sells" && { sells: sells() }),
    });

    if (goesToDemo()) {
      navigate(handoffUrl(handoffPath, analytics, { stands: stands() }));
      return;
    }
    if (index < steps.length - 1) {
      show(index + 1);
      return;
    }

    next.disabled = true;
    const result = await sendLead(form, analytics, fetchImpl);
    next.disabled = false;
    if (result.ok) {
      form.querySelector<HTMLElement>("[data-steps]")!.hidden = true;
      const success = form.querySelector<HTMLElement>("[data-success]")!;
      success.hidden = false;
      success.focus();
      return;
    }
    // A rejected email sends the visitor back to that question.
    if (result.errors.email && steps.includes("email"))
      show(steps.indexOf("email"));
    showErrors(form, result.errors);
  });

  render();

  return {
    /** The hero form already took the email: skip that question. */
    useEmail(address: string) {
      email.value = address;
      steps = allSteps.filter((step) => step !== "email");
      index = Math.min(index, steps.length - 1);
      render();
    },
    /** Moves focus to the current question. */
    focus() {
      stepElement(current())
        .querySelector<HTMLElement>("[data-question]")
        ?.focus({ preventScroll: true });
    },
  };
}

/** Wires up whichever lead forms the page has. */
export function bindSignup(root: Document, analytics: Analytics): void {
  const form = (name: string) =>
    root.querySelector<HTMLFormElement>(`form[data-lead-form="${name}"]`);

  const setupForm = form("setup");
  const setup = setupForm && enhanceSetupForm(setupForm, analytics);

  const hero = form("hero");
  if (hero)
    enhanceForm(hero, analytics, (data) => {
      hero.hidden = true;
      // A live region that's always on the page, so the message is announced.
      const status = root.querySelector<HTMLElement>("[data-hero-success]")!;
      status.textContent = status.dataset.message ?? "";
      if (!setup || !setupForm) return;
      setup.useEmail(String(data.get("email")));
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setupForm.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setup.focus();
    });

  const demo = form("demo");
  if (demo)
    enhanceForm(demo, analytics, () => {
      demo.querySelector<HTMLElement>("[data-fields]")!.hidden = true;
      const success = demo.querySelector<HTMLElement>("[data-success]")!;
      success.hidden = false;
      success.focus();
    });
}
