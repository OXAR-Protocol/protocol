"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { VAULT_CONFIGS } from "@oxar/sdk";

import { useVaults, type VaultAccount } from "@/hooks/use-vaults";
import { useBondDeposit } from "@/hooks/use-bond-deposit";
import { deriveVaultPda } from "@/lib/pda";
import { formatUsdc } from "@/lib/format";
import { useWarp } from "@/components/warp-transition";

import { DEFAULT_PAYMENT_METHOD_ID } from "@/lib/payment-methods";
import { UkraineMap } from "./ukraine-map";
import { BondFromPanel } from "./bond-from-panel";
import { BondToPanel } from "./bond-to-panel";
import { BondDetails } from "./bond-details";
import { BondSelectModal } from "./bond-select-modal";
import { FromSelectModal } from "./from-select-modal";

interface BondSwapProps {
  mode?: "app" | "landing";
}

export function BondSwap({ mode = "app" }: BondSwapProps) {
  const [selectedId, setSelectedId] = useState(VAULT_CONFIGS[0]?.id ?? "");
  const [selectedPaymentId, setSelectedPaymentId] = useState(
    DEFAULT_PAYMENT_METHOD_ID,
  );
  const [amount, setAmount] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [fromModalOpen, setFromModalOpen] = useState(false);

  const { vaults } = useVaults();
  const { startWarp } = useWarp();

  const selectedConfig = useMemo(
    () => VAULT_CONFIGS.find((c) => c.id === selectedId) ?? VAULT_CONFIGS[0],
    [selectedId],
  );

  const { invest, loading: depositing, error: depositError } = useBondDeposit(
    selectedConfig!,
  );

  const vaultData: VaultAccount | undefined = useMemo(() => {
    if (!selectedConfig) return undefined;
    const [pda] = deriveVaultPda(
      selectedConfig.region,
      selectedConfig.denomination,
      selectedConfig.assetSubtype,
      selectedConfig.series,
    );
    return vaults.find((v) => v.publicKey.toBase58() === pda.toBase58());
  }, [selectedConfig, vaults]);

  if (!selectedConfig) return null;

  const parsedAmount = parseFloat(amount);
  const hasAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  // apyBps is bounded (<10000), safe to toNumber()
  const apyPercent =
    (vaultData?.account.apyBps.toNumber() ?? selectedConfig.apy * 100) / 100;
  const receiveAmount = hasAmount ? parsedAmount * (1 + apyPercent / 100) : 0;
  const tvl = vaultData ? formatUsdc(vaultData.account.totalDeposits) : null;

  const handleInvest = async () => {
    if (mode === "landing") {
      startWarp("/login");
      return;
    }
    if (hasAmount) {
      await invest(parsedAmount);
      setAmount("");
    }
  };

  const buttonDisabled = mode === "app" && (!hasAmount || depositing);

  return (
    <div className="w-full max-w-[1300px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(260px,0.9fr)_minmax(0,2.8fr)_minmax(260px,0.9fr)] gap-6 md:gap-8 items-stretch">
        <div className="order-2 md:order-2 xl:order-1 relative z-10">
          <BondFromPanel
            selectedMethodId={selectedPaymentId}
            amount={amount}
            hasAmount={hasAmount}
            onAmountChange={setAmount}
            onSelectMethod={() => setFromModalOpen(true)}
          />
        </div>

        <div className="order-1 md:order-1 md:col-span-2 xl:col-span-1 xl:order-2 relative flex items-center justify-center min-h-[240px] md:min-h-[360px] z-0">
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[100px] opacity-60"
              style={{
                background:
                  "radial-gradient(circle, rgba(114,162,240,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)",
              }}
            />
          </div>
          <div className="relative w-full xl:scale-[1.12] origin-center">
            <UkraineMap selectedId={selectedId} onPinClick={setSelectedId} />
          </div>
        </div>

        <div className="order-3 md:order-3 xl:order-3 relative z-10">
          <BondToPanel
            config={selectedConfig}
            receiveAmount={receiveAmount}
            hasAmount={hasAmount}
            apyPercent={apyPercent}
            onSelectBond={() => setModalOpen(true)}
          />
        </div>
      </div>

      <button
        onClick={handleInvest}
        disabled={buttonDisabled}
        className={`mt-6 w-full py-5 rounded-[5px] font-mono text-sm uppercase tracking-[0.15em] transition-all ${
          buttonDisabled
            ? "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/5"
            : "bg-white text-black hover:bg-white/90"
        }`}
      >
        {depositing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Processing
          </span>
        ) : mode === "landing" ? (
          "Launch App to Invest"
        ) : hasAmount ? (
          `Invest $${parsedAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
        ) : (
          "Enter amount"
        )}
      </button>

      {depositError && (
        <p className="mt-2 text-loss font-mono text-[11px] text-center">
          {depositError}
        </p>
      )}

      <div className="mt-8">
        <BondDetails
          config={selectedConfig}
          amount={hasAmount ? parsedAmount : 0}
          apyPercent={apyPercent}
          tvl={tvl}
        />
      </div>

      <BondSelectModal
        open={modalOpen}
        selectedId={selectedId}
        onClose={() => setModalOpen(false)}
        onSelect={setSelectedId}
      />

      <FromSelectModal
        open={fromModalOpen}
        selectedId={selectedPaymentId}
        onClose={() => setFromModalOpen(false)}
        onSelect={setSelectedPaymentId}
      />
    </div>
  );
}
