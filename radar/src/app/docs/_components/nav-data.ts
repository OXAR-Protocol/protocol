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
    items: [
      { href: "/docs/examples", label: "End-to-end quickstart" },
      { href: "/docs/ai-prompts", label: "AI agent prompts" },
    ],
  },
];

export const TOP_TABS: readonly NavLink[] = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/protocols", label: "API Reference" },
  { href: "/docs/examples", label: "Examples" },
];

export const ORDERED_PAGES: readonly NavLink[] = NAV_GROUPS.flatMap((g) => g.items);

export interface Crumb {
  group: string;
  page: string;
}

export function getBreadcrumbs(pathname: string): Crumb | null {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.href === pathname);
    if (item) return { group: group.title, page: item.label };
  }
  return null;
}

export function getPrevNext(pathname: string): { prev: NavLink | null; next: NavLink | null } {
  const idx = ORDERED_PAGES.findIndex((p) => p.href === pathname);
  if (idx < 0) return { prev: null, next: null };
  return {
    prev: idx > 0 ? ORDERED_PAGES[idx - 1]! : null,
    next: idx < ORDERED_PAGES.length - 1 ? ORDERED_PAGES[idx + 1]! : null,
  };
}
