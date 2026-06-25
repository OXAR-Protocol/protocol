"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// True only when a site key is configured — the form gates on a token only then.
export const TURNSTILE_ENABLED = !!SITE_KEY;

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
}

function getApi(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

/** Cloudflare Turnstile widget. Renders nothing when no site key is set. */
export function Turnstile({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    const render = () => {
      const api = getApi();
      if (!api || !ref.current || widgetId.current) return;
      widgetId.current = api.render(ref.current, {
        sitekey: SITE_KEY,
        callback: onVerify,
        theme: "dark",
      });
    };
    if (getApi()) {
      render();
      return;
    }
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = SCRIPT;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    return () => {
      script?.removeEventListener("load", render);
      const api = getApi();
      if (widgetId.current && api) api.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [onVerify]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="mt-3 flex justify-center" />;
}
