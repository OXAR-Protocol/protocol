import { NextRequest, NextResponse } from "next/server";

const APP_DOMAIN = "app.oxar.app";
const MARKETING_DOMAIN = "oxar.app";

const APP_ROUTES = [
  "/vaults",
  "/marketplace",
  "/portfolio",
  "/profile",
  "/login",
  "/vault",
  "/gate",
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
  if (pathname === "/") return true;
  return MARKETING_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const { pathname, search } = req.nextUrl;

  if (!host.endsWith("oxar.app")) {
    return NextResponse.next();
  }

  const isApp = host === APP_DOMAIN;
  const isMarketing = host === MARKETING_DOMAIN || host === `www.${MARKETING_DOMAIN}`;

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
