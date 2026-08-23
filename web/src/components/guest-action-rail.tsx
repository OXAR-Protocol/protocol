"use client";

import { useSignIn } from "@/hooks/use-sign-in";
import { useT } from "@/lib/i18n";

/**
 * What stands where the buy rail stands, for someone who hasn't signed in.
 *
 * The asset page is public so a shared link lands on the thing itself — the APY,
 * the chart, what backs it. Only the act of putting money in needs an account, so
 * that is the one place the visitor is asked, and the ask says why it's safe to.
 */
export function GuestActionRail() {
  const { t } = useT();
  const signIn = useSignIn();

  return (
    <div className="lg:sticky lg:top-24">
      <div className="rounded-2xl border border-ink/10 bg-paper/70 p-5">
        <p className="text-[15px] lowercase">{t("rail.guestTitle")}</p>
        <p className="mt-1.5 text-[13px] leading-snug text-ink/55">{t("rail.guestBody")}</p>
        <button
          type="button"
          onClick={signIn}
          className="mt-4 w-full rounded-full bg-ink px-4 py-3 text-[14px] lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85"
        >
          {t("rail.guestCta")}
        </button>
      </div>
    </div>
  );
}
