"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Banknote, Building2, CreditCard, Loader2, Wallet } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { SheetShell } from "@/components/sheet-shell";
import { FundAddress } from "@/components/fund-address";
import { FundCardAmount } from "@/components/fund-card-amount";
import { CardRouteSheet, type CardRoute } from "@/components/card-route-sheet";
import { TopUpSheet, TOP_UP_FEATURE } from "@/components/top-up-sheet";
import { useCardTopUp, getUsdcUi } from "@/hooks/use-card-topup";
import { useFeature } from "@/hooks/use-features";
import { useSolanaContext } from "@/providers/solana-provider";
import { useT } from "@/lib/i18n";

/** The card on-ramp's own floor, in dollars. */
const CARD_MIN_USD = 20;

type Way = null | "crypto" | "exchange" | "card";

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
  const { walletAddress, connection, isExternal } = useSolanaContext();
  const { topUp, busy } = useCardTopUp();
  const paybisTopUp = useFeature(TOP_UP_FEATURE);

  const [way, setWay] = useState<Way>(null);
  const [amount, setAmount] = useState("50");
  const [showRoutes, setShowRoutes] = useState(false);
  const [showPaybis, setShowPaybis] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  // The card widget black-screens inside a mobile wallet's in-app browser — the
  // same blocker the deposit panel carries, for the same reason.
  const [isMobile, setIsMobile] = useState(false);

  const address = walletAddress?.toBase58() ?? "";

  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    void getUsdcUi(connection, walletAddress).then((v) => {
      if (!cancelled) setBalance(v);
    });
    return () => {
      cancelled = true;
    };
  }, [connection, walletAddress]);

  const cardRoutes: CardRoute[] = [
    {
      key: "builtin",
      title: "cardroute.builtin.title",
      body: "cardroute.builtin.body",
      unavailable: isExternal && isMobile ? t("deposit.cardInAppBrowser") : undefined,
      onSelect: () => {
        setShowRoutes(false);
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

  const row =
    "flex w-full items-center gap-3 rounded-[10px] border border-black/12 px-4 py-3.5 text-left transition hover:border-black/40";

  return (
    <>
      <SheetShell label={t("fund.label")} title={t("fund.title")} onClose={onClose}>
        {way === null ? (
          <>
            <p className="mb-4 text-[13px] text-black/50">
              {t("fund.free")}:{" "}
              <span className="tabular-nums text-black/80">
                {balance === null ? "…" : `$${formatUsdAmount(balance)}`}
              </span>
            </p>

            <div className="flex flex-col gap-2">
              <button type="button" onClick={() => setWay("crypto")} className={row}>
                <Wallet size={16} strokeWidth={1.5} className="shrink-0 text-black/45" />
                <span className="min-w-0">
                  <span className="block text-[14px] text-black">{t("fund.crypto.title")}</span>
                  <span className="block text-[12px] leading-snug text-black/45">
                    {t("fund.crypto.body")}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setWay("card")}
                disabled={busy}
                className={`${row} disabled:opacity-50`}
              >
                {busy ? (
                  <Loader2 size={16} className="shrink-0 animate-spin text-black/45" />
                ) : (
                  <CreditCard size={16} strokeWidth={1.5} className="shrink-0 text-black/45" />
                )}
                <span className="min-w-0">
                  <span className="block text-[14px] text-black">{t("fund.card.title")}</span>
                  <span className="block text-[12px] leading-snug text-black/45">
                    {t("fund.card.body")}
                  </span>
                </span>
              </button>

              <button type="button" onClick={() => setWay("exchange")} className={row}>
                <Building2 size={16} strokeWidth={1.5} className="shrink-0 text-black/45" />
                <span className="min-w-0">
                  <span className="block text-[14px] text-black">{t("fund.exchange.title")}</span>
                  <span className="block text-[12px] leading-snug text-black/45">
                    {t("fund.exchange.body")}
                  </span>
                </span>
              </button>
            </div>

            <p className="mt-5 flex items-start gap-2 text-[11px] leading-snug text-black/40">
              <Banknote size={13} strokeWidth={1.5} className="mt-px shrink-0" />
              {t("fund.timing")}
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setWay(null)}
              className="mb-4 inline-flex items-center gap-1.5 text-[13px] lowercase text-black/40 transition hover:text-black"
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
