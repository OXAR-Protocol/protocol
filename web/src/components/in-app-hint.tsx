"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import { isInAppBrowser } from "@oxar/sdk";

import { useT } from "@/lib/i18n";

/**
 * Shown only inside another app's browser, beside the way in.
 *
 * Google refuses OAuth in an embedded webview, so a sign-in started from a link
 * opened in Telegram or Instagram comes back "Authentication failed" with nothing
 * wrong on our side. Email still works there, so this doesn't block anything — it
 * names the fix, and hands over the address to open elsewhere.
 */
export function InAppHint() {
  const { t } = useT();
  const [inApp, setInApp] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInApp(isInAppBrowser(navigator.userAgent));
  }, []);

  if (!inApp) return null;

  const copy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <p className="mt-3 text-[12px] leading-snug text-black/45">
      {t("signin.inApp")}{" "}
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1 lowercase tracking-wide text-[#3c05c7]/80 transition hover:text-[#3c05c7]"
      >
        {copied ? <Check size={11} strokeWidth={2} /> : <Copy size={11} strokeWidth={1.5} />}
        {copied ? t("common.copied") : t("signin.copyLink")}
      </button>
    </p>
  );
}
