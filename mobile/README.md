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

## Android / Seeker (later)

```bash
npx cap add android
npx cap open android   # Android Studio → run on emulator or device
```
Seeker publishing = signed APK → Solana dApp Store via `@solana-mobile/dapp-store-cli`.
