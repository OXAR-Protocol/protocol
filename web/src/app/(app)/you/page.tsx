"use client";

import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";

import { ProfileMoney } from "@/components/profile-money";
import { MoneyPanel } from "@/components/money-panel";
import { StartHere } from "@/components/start-here";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useSignIn } from "@/hooks/use-sign-in";
import { useRise } from "@/lib/motion";
import { useT } from "@/lib/i18n";

/**
 * You, and your money — one page.
 *
 * There were two: a portfolio and a profile, both leading with a total, both
 * listing the positions, both ending in the history. Two screens for one object
 * meant every change had to be made twice, and they drifted anyway. This is the
 * portfolio; it happens to know your name.
 *
 * Order follows the questions: who am I here, what can I spend, what is it all
 * worth, what is it made of, what did I do. Settings sit behind the gear up top,
 * because a page you open to see what you're worth shouldn't end in configuration.
 */
export default function YouPage() {
  const { ready, authenticated } = usePrivy();
  const { totalUsdc, loading } = useAggregatePersonalBalance();
  const { t } = useT();
  const rise = useRise();
  const signIn = useSignIn();

  const nothingWorking = totalUsdc === 0 && !loading;

  if (!ready) return null;

  // Signed out there is no profile and no money — so the page is the ask.
  if (!authenticated) {
    return (
      <div className="mx-auto max-w-[800px] pb-32">
        <motion.section
          {...rise(0)}
          className="mt-10 rounded-card border border-ink/10 bg-paper p-6 text-center"
        >
          <p className="text-sm text-ink/45">{t("guest.you.body")}</p>
          <button
            type="button"
            onClick={signIn}
            className="mt-4 rounded-full bg-ink px-6 py-2.5 text-[14px] lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85"
          >
            {t("common.signIn")}
          </button>
        </motion.section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] pb-32">

      {/* The balance is always on this page now, whatever it says. Nothing at work
          is a fine thing for it to say — $0.00 working, $500 free to use — and it is
          a great deal more use than a picture of coins where the number should be.
          `StartHere` sits under it as a nudge; `MoneyPanel` is the smaller nudge for
          a wallet that already has something working, so only one shows at a time. */}
      <ProfileMoney
        wallet={nothingWorking ? null : <MoneyPanel />}
        startHere={nothingWorking ? <StartHere /> : null}
      />
    </div>
  );
}
