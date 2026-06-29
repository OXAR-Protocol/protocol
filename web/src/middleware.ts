import { NextRequest, NextResponse } from "next/server";

const APP_DOMAIN = "app.oxar.app";
const MARKETING_DOMAIN = "oxar.app";

const APP_ROUTES = [
  "/home",
  "/yield",
  "/pile",
  "/you",
  "/asset",
  "/onboarding",
  "/login",
];

const MARKETING_ROUTES = [
  "/investors",
  "/terms",
  "/docs",
  "/kit",
];

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

function isMarketingRoute(pathname: string): boolean {
  // "/" is handled separately per-host — on the marketing domain it's the
  // landing page; on the app domain bare "/" routes to /home (the AllowlistGate
  // wrapper in (app)/layout then gates entry behind the email allowlist).
  return MARKETING_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname, search } = req.nextUrl;

  if (!host.endsWith("oxar.app")) {
    return NextResponse.next();
  }

  // Canonicalize www.oxar.app → oxar.app (permanent). Keeps one canonical host
  // for SEO and avoids any future SSL coverage questions for the www subdomain.
  if (host === `www.${MARKETING_DOMAIN}`) {
    const url = new URL(`https://${MARKETING_DOMAIN}${pathname}${search}`);
    return NextResponse.redirect(url, 308);
  }

  const isApp = host === APP_DOMAIN;
  const isMarketing = host === MARKETING_DOMAIN;

  // Bare app.oxar.app/ → send users to home.
  if (isApp && pathname === "/") {
    const url = new URL(`https://${APP_DOMAIN}/home${search}`);
    return NextResponse.redirect(url, 307);
  }

  if (isMarketing && isAppRoute(pathname)) {
    const url = new URL(`https://${APP_DOMAIN}${pathname}${search}`);
    return NextResponse.redirect(url, 308);
  }

  if (isApp && isMarketingRoute(pathname)) {
    const url = new URL(`https://${MARKETING_DOMAIN}${pathname}${search}`);
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|images|fonts).*)",
  ],
};
