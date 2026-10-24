/**
 * The header and footer, which every page shares. Copy is verbatim from the
 * Figma frames (desktop 4:2, phone 4004:2, open phone menu 4005:2) unless a
 * comment says otherwise.
 */

import { site } from "./site";

export interface Link {
  label: string;
  href: string;
}

// Homepage sections. Written as "/#…" so the header and footer work from
// every page; on the homepage itself the browser just scrolls.
export const anchors = {
  product: "/#product",
  automation: "/#automation",
  customers: "/#customers",
  getStarted: "/#get-started",
} as const;

export const startFree: Link = {
  label: "Start free",
  href: anchors.getStarted,
};

// Links to paths that don't exist yet land on the 404 page, which records the
// click as demand for that page (see src/lib/links.ts).
export const header = {
  brand: site.name,
  links: [
    { label: "Product", href: anchors.product },
    { label: "Automation", href: anchors.automation },
    { label: "Customers", href: anchors.customers },
    { label: "Pricing", href: "/pricing" },
  ],
  signIn: { label: "Sign in", href: "/sign-in" },
  cta: startFree,
  // The open menu's note under its Start free button.
  menuNote: site.offer,
  // New copy: the phone menu button's accessible names.
  openMenu: "Open menu",
  closeMenu: "Close menu",
  // New copy: names the two navigation landmarks for screen readers.
  navLabel: "Main",
} as const;

export const footer = {
  brand: site.name,
  tagline: "The operating platform for banana stands. Built in Newport Beach.",
  columns: [
    {
      heading: "PRODUCT",
      links: [
        { label: "Inventory", href: anchors.product },
        { label: "Automation", href: anchors.automation },
        { label: "Bluth AI", href: anchors.product },
        { label: "Staff & shifts", href: "/staff" },
      ],
    },
    {
      heading: "COMPANY",
      links: [
        { label: "Customers", href: anchors.customers },
        { label: "Pricing", href: "/pricing" },
        { label: "Careers", href: "/careers" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      heading: "RESOURCES",
      links: [
        { label: "Docs", href: "/docs" },
        { label: "Operator guides", href: "/guides" },
        { label: "Rule library", href: "/rules" },
        { label: "Status", href: "/status" },
      ],
    },
  ],
  copyright: "© 2026 BLUTHSOFT, INC.",
  legal: [
    { label: "PRIVACY", href: "/privacy" },
    { label: "TERMS", href: "/terms" },
  ],
  motto: "THERE’S ALWAYS MONEY IN THE BANANA STAND.",
} as const;
