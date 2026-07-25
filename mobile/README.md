# OXAR mobile (Capacitor shell)

Native iOS + Android/Seeker shell that wraps the live web app. The WebView loads
`https://app.oxar.app` (see `capacitor.config.json` → `server.url`), so we reuse the
whole Next.js app as-is. `www/` is only an offline fallback splash.

This folder is **isolated from `web/`** — it does not touch the web build or the Vercel
deploy.

## Prerequisites (one-time)

- **Xcode** (full app, from the Mac App Store — ~7 GB) for iOS.
  After installing, point the toolchain at it:
  ```bash
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  ```
- **CocoaPods** (already installed here: `pod --version`).
- **Android Studio** (only when we do the Android/Seeker build).

## iOS spike — run on your own iPhone

```bash
cd mobile
npm install            # once (Capacitor deps)
npx cap add ios        # generates ios/ + runs pod install (needs Xcode)
npx cap open ios       # opens the project in Xcode
```

In Xcode:
1. Select the **App** target → **Signing & Capabilities** → set **Team** to your Apple ID
   (Xcode → Settings → Accounts → add your Apple ID first; a free account works for
   7-day on-device builds).
2. Plug in your iPhone, pick it as the run destination, press **▶ Run**.
3. On the phone: Settings → General → VPN & Device Management → trust the developer cert.

## What to validate in the WebView (the de-risk spike)

1. **Email login → embedded wallet** (Privy) — does the login popup/redirect return to the app?
2. **Deposit** — sign + send a transaction from inside the WebView.
3. **Card on-ramp** — does the MoonPay/Stripe/Apple Pay widget work, or must it open in Safari?

Report which of the three pass. Failures are usually fixed by opening that flow in the
system browser or adding a native plugin — not by abandoning Capacitor.

## Config

- `appId`: `app.oxar.mobile` (change before App Store submission to match the Apple bundle id).
- `appName`: `OXAR`.
- `server.url`: `https://app.oxar.app` — the shell points at prod. To test a branch/preview,
  temporarily change this URL and re-run `npx cap sync ios`.

## App icon

`assets/icon.png` (1024×1024, opaque — iOS rejects alpha and applies its own mask) is the
source of truth: the OXAR mark in purple on white, generated from `oxar-icons/purple.png`.

Native projects are gitignored, so after a fresh `cap add` copy it back in:

```bash
cp assets/icon.png ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
```

For the full set (Android adaptive icons, splash screens) use `npx @capacitor/assets generate`.

## Safe area

Capacitor makes the WebView the root view (`view = webView`, and `loadView()` is `final`),
so the page draws under the status bar and home indicator — you cannot fix it natively.
There is nothing shell-specific in the fix, and nothing to keep in sync here: the app
routes opt into `viewport-fit=cover` (`export const viewport` in `web/src/app/(app)/layout.tsx`)
and the `.safe-*` classes in `web/src/app/globals.css` pad the insets back out. Both are
plain web behaviour — `env(safe-area-inset-*)` is 0 wherever there are no insets.

Two things that cost hours, so don't undo them:

- **`viewport-fit=cover` must be server-rendered.** WebKit reads it while parsing the
  document and does *not* re-evaluate the insets if the meta tag is patched later, so a
  runtime script leaves `env(safe-area-inset-*)` at 0 — measured in this WebView.
- **`padding` on a parent does not move absolutely-positioned children.** They resolve
  `top` against the padding *edge*, hence the separate `.safe-top-6` for pinned links.

## Android / Seeker (later)

```bash
npx cap add android
npx cap open android   # Android Studio → run on emulator or device
```
Seeker publishing = signed APK → Solana dApp Store via `@solana-mobile/dapp-store-cli`.

**Known blocker for Google Play:** Capacitor 6 generates `targetSdkVersion = 34`; Play has
required 35 since August 2025. `android/` is gitignored, so editing `variables.gradle` does
not persist — the durable fix is upgrading to Capacitor 7 (which defaults to 35), and that
should be done together with an actual Android build, which needs Android Studio + SDK.
Not a blocker for the Solana dApp Store.
