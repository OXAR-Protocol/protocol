export interface NavLink {
  href: string;
  label: string;
}

export interface NavGroup {
  title: string;
  items: readonly NavLink[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: "Getting started",
    items: [
      { href: "/docs", label: "Overview" },
      { href: "/docs/authentication", label: "Authentication" },
      { href: "/docs/rate-limits", label: "Rate limits" },
      { href: "/docs/errors", label: "Errors" },
    ],
  },
  {
    title: "API Reference",
    items: [
      { href: "/docs/protocols", label: "Protocols" },
      { href: "/docs/analyze-wallet", label: "Analyze wallet" },
    ],
  },
  {
    title: "Examples",
    items: [{ href: "/docs/examples", label: "End-to-end quickstart" }],
  },
];

export const TOP_TABS: readonly NavLink[] = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/protocols", label: "API Reference" },
  { href: "/docs/examples", label: "Examples" },
];
