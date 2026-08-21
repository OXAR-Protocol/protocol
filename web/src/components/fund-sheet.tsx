"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowLeftRight, Banknote, Building2, CreditCard, Wallet } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { SheetShell } from "@/components/sheet-shell";
import { SheetRow } from "@/components/sheet-row";
import { FundAddress } from "@/components/fund-address";
import { FundCardAmount } from "@/components/fund-card-amount";
import { DepositNetworks } from "@/components/deposit-networks";
import { FundConvert } from "@/components/fund-convert";
import { CardRouteSheet, type CardRoute } from "@/components/card-route-sheet";
import { TopUpSheet, TOP_UP_FEATURE } from "@/components/top-up-sheet";
import { useCardTopUp } from "@/hooks/use-card-topup";
import { useFeature } from "@/hooks/use-features";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { useSolanaContext } from "@/providers/solana-provider";
import { useT } from "@/lib/i18n";

/** The card on-ramp's own floor, in dollars. */
const CARD_MIN_USD = 20;

type Way = null | "crypto" | "network" | "exchange" | "card" | "convert";

/**
 * Getting dollars INTO the wallet — on its own, before any question of where they
 * then go.
 *
 * The two were one screen: the only way to put money in was to open an asset, where
 * the panel asked what you were paying with, how much, and dealt with gas and
 * bridging in the same breath. Someone with nothing in the app yet had no answer to
 * the first question they actually have — where do the dollars come from. This is
 * that answer; choosing what to put them into is the marketplace's job.
 */
export function FundSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const { walletAddress, isExternal } = useSolanaContext();
  const { topUp, busy } = useCardTopUp();
  const paybisTopUp = useFeature(TOP_UP_FEATURE);

  const [way, setWay] = useState<Way>(null);
  const [amount, setAmount] = useState("");
  const [showRoutes, setShowRoutes] = useState(false);
  const [showPaybis, setShowPaybis] = useState(false);
  const { usd: balance } = useUsdcBalance();
  // The card widget black-screens inside a mobile wallet's in-app browser — the
  // same blocker the deposit panel carries, for the same reason.
  const [isMobile, setIsMobile] = useState(false);

  const address = walletAddress?.toBase58() ?? "";

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const cardRoutes: CardRoute[] = [
    {
      key: "builtin",
      title: "cardroute.builtin.title",
      body: "cardroute.builtin.body",
      unavailable: isExternal && isMobile ? t("deposit.cardInAppBrowser") : undefined,
      onSelect: () => {
        setShowRoutes(false);
        // Close ours before theirs opens: a fixed overlay doesn't move when iOS
        // raises the keyboard, and the provider's amount field ended up under it.
        onClose();
        void topUp(Number(amount)).catch(() => {
          /* cancelled or declined — the provider has already said so */
        });
      },
    },
    ...(paybisTopUp
      ? [
          {
            key: "paybis",
            title: "cardroute.paybis.title",
            body: "cardroute.paybis.body",
            onSelect: () => {
              setShowRoutes(false);
              setShowPaybis(true);
            },
          } satisfies CardRoute,
        ]
      : []),
  ];


  return (
    <>
      <SheetShell label={t("fund.label")} title={t("fund.title")} onClose={onClose}>
        {way === null ? (
          <>
            <p className="mb-4 text-[13px] text-ink/50">
              {t("fund.free")}:{" "}
              <span className="tabular-nums text-ink/80">
                {balance === null ? "…" : `$${formatUsdAmount(balance)}`}
              </span>
            </p>

            <div className="flex flex-col gap-2">
              <SheetRow
                icon={Wallet}
                title={t("fund.crypto.title")}
                body={t("fund.crypto.body")}
                onClick={() => setWay("network")}
              />
              <SheetRow
                icon={CreditCard}
                title={t("fund.card.title")}
                body={t("fund.card.body")}
                busy={busy}
                onClick={() => setWay("card")}
              />
              <SheetRow
                icon={ArrowLeftRight}
                title={t("fund.convert.title")}
                body={t("fund.convert.body")}
                onClick={() => setWay("convert")}
              />
              <SheetRow
                icon={Building2}
                title={t("fund.exchange.title")}
                body={t("fund.exchange.body")}
                onClick={() => setWay("exchange")}
              />
            </div>

            <p className="mt-5 flex items-start gap-2 text-[11px] leading-snug text-ink/40">
              <Banknote size={13} strokeWidth={1.5} className="mt-px shrink-0" />
              {t("fund.timing")}
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setWay(way === "crypto" ? "network" : null)}
              className="mb-4 inline-flex items-center gap-1.5 text-[13px] lowercase text-ink/40 transition hover:text-ink"
            >
              <ArrowLeft size={13} strokeWidth={1.5} />
              {t("fund.back")}
            </button>
            {way === "card" ? (
              <FundCardAmount
                value={amount}
                min={CARD_MIN_USD}
                onChange={setAmount}
                onContinue={() => setShowRoutes(true)}
              />
            ) : way === "convert" ? (
              <FundConvert onConverted={() => setWay(null)} />
            ) : way === "network" ? (
              <DepositNetworks onSolana={() => setWay("crypto")} />
            ) : (
              <FundAddress
                address={address}
                hint={way === "crypto" ? t("fund.crypto.hint") : t("fund.exchange.hint")}
              />
            )}
          </>
        )}
      </SheetShell>

      <AnimatePresence>
        {showRoutes && (
          <CardRouteSheet routes={cardRoutes} onClose={() => setShowRoutes(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPaybis && <TopUpSheet onClose={() => setShowPaybis(false)} />}
      </AnimatePresence>
    </>
  );
}
