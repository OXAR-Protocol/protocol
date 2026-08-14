"use client";

import { useEffect, useState } from "react";

/**
 * Are we inside the native shell, or a browser?
 *
 * The Capacitor app loads the same URL a browser does, so nothing about the page
 * tells them apart — the shell has to say so. It appends `OXARApp` to the user agent
 * (`mobile/capacitor.config.json`), and injects a `Capacitor` global when the bridge
 * is available; either is enough, and checking both means an older build of the app
 * still answers correctly.
 *
 * Read after mount, never during render: the server has no user agent to read, and a
 * value that differs between the two makes React throw the markup away and redraw.
 * So the first paint is always the browser answer, which is the safe one — a tap
 * works everywhere, a hold does not.
 */
export function useIsNativeApp(): boolean {
  const [native, setNative] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const bridged = typeof (window as { Capacitor?: unknown }).Capacitor !== "undefined";
    setNative(bridged || ua.includes("OXARApp"));
  }, []);

  return native;
}
