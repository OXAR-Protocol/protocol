"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInAppBrowser = isInAppBrowser;
/**
 * Is this page running inside another app's browser?
 *
 * It matters because Google refuses OAuth in an embedded webview — a sign-in
 * started from a link opened in Telegram, Instagram or X comes back as
 * "Authentication failed" with nothing wrong on our side. Email login works
 * there, so the answer isn't to block the door, it's to say which browser opens it.
 *
 * A heuristic, and deliberately a conservative one: on iOS, Safari's own user
 * agent always carries a "Safari/" token while an app-embedded WKWebView drops it;
 * on Android the marker is explicit ("wv"). Named apps cover what follows neither.
 */
const NAMED_IN_APP = [
    "FBAN", // Facebook
    "FBAV",
    "Instagram",
    "Line/",
    "Twitter",
    "MicroMessenger", // WeChat
    "TikTok",
    "Snapchat",
];
/** True when the user agent looks like an app's embedded browser. */
function isInAppBrowser(userAgent) {
    if (!userAgent)
        return false;
    if (NAMED_IN_APP.some((marker) => userAgent.includes(marker)))
        return true;
    // Android WebView announces itself.
    if (/\bwv\b/.test(userAgent))
        return true;
    // iOS: Chrome (CriOS) and Firefox (FxiOS) are real browsers with their own
    // tokens; Safari carries "Safari/". Anything else on an iPhone is embedded.
    if (/iPhone|iPad|iPod/.test(userAgent)) {
        return !/Safari\/|CriOS|FxiOS/.test(userAgent);
    }
    return false;
}
