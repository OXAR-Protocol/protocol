"use client";

import { PickButton } from "@/components/pick-button";
import { usePickSet } from "@/components/pick-set";
import type { ProviderGroup } from "@/lib/yield";
import { RISK_TONE, RISK_LABEL, fromBaseUnits } from "@/lib/yield";
import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc } from "@/lib/yield/asset-logo";
import { Sparkline } from "@/components/sparkline";
import { BanknoteBg } from "@/components/banknote-bg";
import { useApyHistory } from "@/hooks/use-apy-history";

interface Props {
  group: ProviderGroup;
  onOpen: () => void;
}

/**
 * One marketplace row for a collapsed protocol (e.g. Jupiter Lend USDC/USDT).
 * Shows the asset chips + "up to" the best APY; opening it reveals the asset picker.
 *
 * Same shape as the single-provider and stock rows — see `YieldProviderRow`.
 *
 * Picking one adds the source behind the headline rate. That isn't a guess: the row
 * already promises "up to X%", and X comes from exactly that source — so adding it is
 * what the row says it does. The allocation sheet then lists it by its full name
 * before anything is signed, so the choice is visible and undoable. Wanting the other
 * currency is still one tap away: opening the group shows each on its own.
 */
export function YieldGroupRow({ group, onOpen }: Props) {
  const pickSet = usePickSet();
  const top = group.views.reduce((a, b) => (b.apy > a.apy ? b : a), group.views[0]);
  const history = useApyHistory(top.defiLlamaPoolId);
  // Coloured by direction, same as the stock rows — see YieldProviderRow.
  const up = history.length > 1 && history[history.length - 1]! >= history[0]!;
  const positionTotal = group.views.reduce(
    (sum, v) => sum + fromBaseUnits(v.underlyingBalance, v.decimals),
    0,
  );

  return (
    <button
      onClick={onOpen}
      className="group relative isolate flex w-full items-center justify-between overflow-hidden rounded-[8px] border border-black/10 bg-white p-5 text-left transition-colors hover:border-black/30"
    >
      <BanknoteBg seed={group.views[0]?.id ?? group.name} />

      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <AssetIcon src={assetLogoSrc(group.views[0]?.id ?? "")} label={group.name} size={36} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <p className="truncate text-base text-black">{group.name}</p>
              <span className="text-[10px] lowercase tracking-wide text-emerald-600">● live</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {group.views.map((v) => (
                <span
                  key={v.id}
                  className="rounded border border-black/15 px-1.5 py-0.5 text-[10px] lowercase tracking-wide text-black/55"
                >
                  {v.assetSymbol}
                </span>
              ))}
            </div>
          </div>
        </div>
        {positionTotal > 0 && (
          <p className="mt-1 text-[11px] tabular-nums text-[#3c05c7]/80">
            you own ${positionTotal.toFixed(2)}
          </p>
        )}
      </div>

      {history.length > 1 && (
        <div className="mx-4 hidden max-w-[140px] flex-1 sm:block">
          <Sparkline values={history} height={32} className={`h-8 w-full ${up ? "text-emerald-400/40" : "text-red-400/40"}`} />
        </div>
      )}

      <div className="ml-3 text-right">
        <p className="text-xl tabular-nums text-black">up to {(group.maxApy * 100).toFixed(2)}%</p>
        <p className={`text-[10px] lowercase tracking-wide ${RISK_TONE[top.riskLevel] ?? "text-black/55"}`}>
          {RISK_LABEL[top.riskLevel] ?? top.riskLevel}
        </p>
      </div>

      {pickSet?.enabled && (
        <span className="ml-3">
          <PickButton
            picked={pickSet.picked.has(top.id)}
            onToggle={() => pickSet.toggle(top.id)}
            label={top.name}
          />
        </span>
      )}
    </button>
  );
}
