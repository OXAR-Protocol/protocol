import { describe, it, expect } from "vitest";

import { isInAppBrowser } from "@oxar/sdk";

/** Real user agents, kept verbatim — the whole check is a claim about these strings. */
const SAFARI_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const CHROME_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.108 Mobile/15E148 Safari/604.1";
const TELEGRAM_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const INSTAGRAM_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 300.0.0.29.110";
const ANDROID_WEBVIEW =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7 wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const CHROME_DESKTOP =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

describe("isInAppBrowser", () => {
  it("flags an iOS webview with no Safari token — the Telegram case that failed Google login", () => {
    expect(isInAppBrowser(TELEGRAM_IOS)).toBe(true);
  });

  it("flags apps that name themselves", () => {
    expect(isInAppBrowser(INSTAGRAM_IOS)).toBe(true);
  });

  it("flags an Android WebView by its 'wv' marker", () => {
    expect(isInAppBrowser(ANDROID_WEBVIEW)).toBe(true);
  });

  it("leaves real browsers alone", () => {
    expect(isInAppBrowser(SAFARI_IOS)).toBe(false);
    expect(isInAppBrowser(CHROME_IOS)).toBe(false);
    expect(isInAppBrowser(CHROME_ANDROID)).toBe(false);
    expect(isInAppBrowser(CHROME_DESKTOP)).toBe(false);
  });

  it("says no when there's nothing to read", () => {
    expect(isInAppBrowser(null)).toBe(false);
    expect(isInAppBrowser("")).toBe(false);
  });
});
