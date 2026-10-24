/**
 * Copy for the pages other than the homepage. None of these were in the
 * design, so everything here is new copy, written in the homepage's voice.
 */

import { startFree } from "./navigation";
import { site } from "./site";

/** Every path that doesn't exist: missing pages and mistyped URLs alike. */
export const notFound = {
  meta: {
    title: `Not built yet — ${site.name}`,
    description: "This page isn't here yet.",
  },
  eyebrow: "404",
  heading: "This page isn’t here yet.",
  body: "Either we haven’t built it, or the link is off. Clicks like yours tell us what to build next. In the meantime, your first stand is free.",
  primary: startFree,
  secondary: { label: "Back to the homepage", href: "/" },
} as const;

/** For more than 20 stands, and every "Book a demo" link. */
export const demo = {
  meta: {
    title: `Book a demo — ${site.name}`,
    description:
      "Running more than a few stands? Tell us about them and we’ll walk you through BluthSoft with your own menu.",
  },
  eyebrow: "BOOK A DEMO",
  heading: "Running more than a few stands? Let’s talk.",
  lede: "Tell us about your stands and we’ll walk you through BluthSoft with your own items, par levels and rules.",
  checklist: [
    "A walkthrough with your own menu",
    "Reporting across every location",
    "Help moving off spreadsheets",
  ],
  form: {
    name: "Your name",
    email: "Work email",
    emailPlaceholder: "you@yourstand.com",
    stands: "How many stands do you run?",
    standsPlaceholder: "Choose one",
    note: "Anything we should know?",
    optional: "Optional",
    submit: "Book a demo",
  },
  errors: {
    name: "Tell us who to ask for.",
    email: "Enter an email address like you@yourstand.com.",
    network:
      "We couldn’t reach BluthSoft. Check your connection and try again.",
  },
  success: {
    heading: "Thanks — we’ll be in touch.",
    body: "Someone from BluthSoft will email you within a day to find a time.",
  },
} as const;

/** Where a form submitted without JavaScript lands. */
export const thanks = {
  meta: {
    title: `Thanks — ${site.name}`,
    description: "We’ve got your details.",
  },
  heading: "Thanks — we’ve got it.",
  body: "We’ll email you shortly.",
  back: { label: "Back to BluthSoft", href: "/" },
} as const;

/**
 * Describes what the site actually does. Keep it in step with
 * src/lib/analytics.ts, src/lib/hubspot.ts and the PostHog project settings.
 */
export const privacy = {
  meta: {
    title: `Privacy — ${site.name}`,
    description:
      "What this site collects, where it goes, and what it doesn't do.",
  },
  heading: "Privacy",
  updated: "Last updated October 24, 2026",
  intro:
    "BluthSoft is a fictional company and this site is a demonstration. The forms and the analytics are real, though, so this page says exactly what they collect.",
  sections: [
    {
      heading: "What you send us",
      body: [
        "When you sign up or ask for a demo, we receive what you type: your email address, and your name, how many stands you run, what you sell and any note, if you give them. They go to HubSpot, the system we keep contacts in, along with the campaign tags in the link you arrived from.",
        "We use them to reply to you. We don’t sell them or share them with anyone else.",
      ],
    },
    {
      heading: "What we measure",
      body: [
        "We use PostHog to see how the page is used: which pages are viewed, which buttons are clicked, how far down the page people get, and which form steps they finish. We also record sessions to see where the page is confusing; everything typed into a form is masked in those recordings.",
        "No cookies are set, and nothing is stored on your device. The ID that ties a visit together lives only in the open page, so a return visit can’t be linked to an earlier one. PostHog discards IP addresses.",
      ],
    },
    {
      heading: "What we don’t do",
      body: [
        "No advertising trackers, no third-party fonts, no selling or renting data.",
      ],
    },
    {
      heading: "Hosting",
      body: [
        "The site is served by Vercel, which keeps standard server logs to run and secure it.",
      ],
    },
  ],
  back: { label: "Back to the homepage", href: "/" },
} as const;
