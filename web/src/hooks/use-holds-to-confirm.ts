"use client";

import { useEffect, useState } from "react";

/**
 * Should confirming ask for a press-and-hold, or a plain click?
 *
 * Not "phone or desktop", and not "our app or a browser" — what matters is what the
 * finger is. A thumb holds the device one-handed, has just been scrolling the list
 * the button sits under, and lands within a millimetre of an accident; the extra
 * moment is worth it. A mouse doesn't slip, and asking someone to hold a button
 * down for most of a second reads as broken rather than careful.
 *
 * The first attempt asked whether we were inside the native shell, and that was the
 * wrong question in a way only real use could show: signing in with a wallet opens
 * the app inside Phantom's own browser, which is neither our WebView nor Safari, and
 * the hold vanished exactly where a thumb was doing the pressing.
 *
 * `pointer: coarse` covers all three — our shell, Safari, someone else's in-app
 * browser — and leaves a laptop alone. The native check stays as a second opinion,
 * so a device with both kinds of input running the app still gets the hold.
 *
 * Read after mount, never during render: the server has neither a pointer nor a user
 * agent, and a value that disagrees between the two makes React throw the markup
 * away. So the first paint is the click, which is the safe answer — a tap works
 * everywhere, a hold does not.
 */
export function useHoldsToConfirm(): boolean {
  const [hold, setHold] = useState(false);

  useEffect(() => {
    const touch = window.matchMedia?.("(pointer: coarse)");
    const native =
      typeof (window as { Capacitor?: unknown }).Capacitor !== "undefined" ||
      navigator.userAgent.includes("OXARApp");

    const read = () => setHold(native || !!touch?.matches);
    read();

    // A convertible laptop can switch input mid-session; nothing else changes here.
    touch?.addEventListener?.("change", read);
    return () => touch?.removeEventListener?.("change", read);
  }, []);

  return hold;
}
