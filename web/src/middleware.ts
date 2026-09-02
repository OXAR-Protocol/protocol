import { NextRequest, NextResponse } from "next/server";

const APP_DOMAIN = "app.oxar.app";
const MARKETING_DOMAIN = "oxar.app";

/**
 * This deployment is the app, and only the app. oxar.app is now served by a
 * separate project (the landing), so there is no second host to route between:
 * everything shipped from here — including the long-form pages /terms,
 * /investors, /docs and /kit, which used to answer only on the marketing
 * domain — is served on app.oxar.app.
 */
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

  // Bare app.oxar.app/ → the catalog, signed in or not. The portfolio is the right
  // landing page only for someone who already has positions; for everyone else it
  // is an empty screen, and what they came for is the list of places to put money.
  if (host === APP_DOMAIN && pathname === "/") {
    const url = new URL(`https://${APP_DOMAIN}/market${search}`);
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|images|fonts).*)",
  ],
};
