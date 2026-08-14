"use client";

import { usePrivy } from "@privy-io/react-auth";
import { LogOut } from "lucide-react";

import { SheetShell } from "@/components/sheet-shell";
import { LanguagePicker } from "@/components/language-picker";
import { ThemePicker } from "@/components/theme-picker";
import { forgetIntro } from "@/components/intro-modal";
import { useSolanaContext } from "@/providers/solana-provider";
import { useT } from "@/lib/i18n";

/**
 * Settings, out of the way of the money.
 *
 * They used to run down the page under the positions — language, terms, sign out —
 * so the page you open to see what you're worth ended in configuration. A person
 * changes their language once and signs out rarely; both belong behind the gear,
 * and the page belongs to the money.
 */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const { logout, authenticated } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const address = walletAddress?.toBase58() ?? null;

  return (
    <SheetShell label={t("settings.label")} title={t("settings.title")} onClose={onClose}>
      <p className="mb-3 text-[11px] lowercase tracking-wide text-ink/40">{t("settings.appearance")}</p>
      <ThemePicker />

      <p className="mb-3 mt-6 text-[11px] lowercase tracking-wide text-ink/40">{t("you.language")}</p>
      <LanguagePicker />

      {/* /terms is a marketing route (see middleware.ts) that only resolves on
          oxar.app, not app.oxar.app — an absolute URL + hard navigation, not
          next/link, so it actually lands instead of hitting the domain-split
          redirect mid client-side transition. */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        <a
          href="https://oxar.app/terms"
          className="text-xs lowercase tracking-wide text-ink/40 transition hover:text-ink/60"
        >
          {t("you.terms")}
        </a>
        {address && (
          <button
            type="button"
            onClick={() => {
              forgetIntro(address);
              // A reload rather than local state: the welcome is mounted up in the
              // app layout, so this sheet can't re-trigger it directly.
              window.location.href = "/you";
            }}
            className="text-xs lowercase tracking-wide text-ink/40 transition hover:text-ink/60"
          >
            {t("you.replayTour")}
          </button>
        )}
      </div>

      {authenticated && (
        <button
          onClick={logout}
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-xs lowercase tracking-wide text-ink/60 transition hover:border-red-500/40 hover:text-loss"
        >
          <LogOut size={12} strokeWidth={1.5} />
          {t("you.signOut")}
        </button>
      )}
    </SheetShell>
  );
}
