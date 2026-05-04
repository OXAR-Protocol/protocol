"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { VAULT_CONFIGS } from "@oxar/sdk";

import { useVaults, type VaultAccount } from "@/hooks/use-vaults";
import { useBondDeposit } from "@/hooks/use-bond-deposit";
import { useTransferTokens } from "@/hooks/use-transfer-tokens";
import { usePortfolio } from "@/hooks/use-portfolio";
import { deriveVaultPda } from "@/lib/pda";
import { formatUsdc } from "@/lib/format";
import { useWarp } from "@/components/warp-transition";
import { type SwapSource, DEFAULT_SOURCE } from "@/lib/swap-source";

import { UkraineMap } from "./ukraine-map";
import { BondFromPanel } from "./bond-from-panel";
import { BondToPanel } from "./bond-to-panel";
import { BondDetails } from "./bond-details";
import { BondSelectModal } from "./bond-select-modal";
import { FromSelectModal } from "./from-select-modal";
import { HoldingFromPanel } from "./holding-from-panel";
import { AddressToPanel } from "./address-to-panel";

interface BondSwapProps {
  mode?: "app" | "landing";
}

export function BondSwap({ mode = "app" }: BondSwapProps) {
  const [source, setSource] = useState<SwapSource>(DEFAULT_SOURCE);
  const [selectedId, setSelectedId] = useState(VAULT_CONFIGS[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [transferSignature, setTransferSignature] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fromModalOpen, setFromModalOpen] = useState(false);

  const { vaults } = useVaults();
  const { positions } = usePortfolio();
  const { startWarp } = useWarp();

  const isSendMode = source.kind === "bond";

  // In send mode the active config follows the selected holding,
  // in buy mode it follows the To-panel selection.
  const activeId = isSendMode ? source.vaultId : selectedId;

  const selectedConfig = useMemo(
    () => VAULT_CONFIGS.find((c) => c.id === activeId) ?? VAULT_CONFIGS[0],
    [activeId],
  );

  const { invest, loading: depositing, error: depositError } = useBondDeposit(
    selectedConfig!,
  );
  const { transfer, loading: transferring, error: transferError } =
    useTransferTokens();

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

  const sendingPosition = useMemo(() => {
    if (!isSendMode || !selectedConfig) return undefined;
    const [pda] = deriveVaultPda(
      selectedConfig.region,
      selectedConfig.denomination,
      selectedConfig.assetSubtype,
      selectedConfig.series,
    );
    return positions.find(
      (p) => p.vault.publicKey.toBase58() === pda.toBase58(),
    );
  }, [isSendMode, selectedConfig, positions]);

  const balanceTokens = sendingPosition
    ? sendingPosition.balance.toNumber() / 1_000_000
    : 0;

  if (!selectedConfig) return null;

  const parsedAmount = parseFloat(amount);
  const hasAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const apyPercent =
    (vaultData?.account.apyBps.toNumber() ?? selectedConfig.apy * 100) / 100;
  const receiveAmount = hasAmount ? parsedAmount * (1 + apyPercent / 100) : 0;
  const tvl = vaultData ? formatUsdc(vaultData.account.totalDeposits) : null;

  const recipientPubkey = useMemo(() => {
    if (!isSendMode) return null;
    const trimmed = recipientAddress.trim();
    if (!trimmed) return null;
    try {
      return new PublicKey(trimmed);
    } catch {
      return null;
    }
  }, [isSendMode, recipientAddress]);

  const overBalance =
    isSendMode && hasAmount && parsedAmount > balanceTokens && balanceTokens > 0;

  const handleAction = async () => {
    if (mode === "landing") {
      startWarp("/login");
      return;
    }
    if (isSendMode) {
      if (!hasAmount || !recipientPubkey || overBalance || !sendingPosition) return;
      const [vaultPda] = deriveVaultPda(
        selectedConfig.region,
        selectedConfig.denomination,
        selectedConfig.assetSubtype,
        selectedConfig.series,
      );
      const amountBn = new BN(Math.floor(parsedAmount * 1_000_000));
      const sig = await transfer(vaultPda, recipientPubkey, amountBn);
      if (sig) {
        setTransferSignature(sig);
        setAmount("");
        setRecipientAddress("");
      }
      return;
    }
    if (hasAmount) {
      await invest(parsedAmount);
      setAmount("");
    }
  };

  const buyDisabled = mode === "app" && (!hasAmount || depositing);
  const sendDisabled =
    mode === "app" &&
    (!hasAmount || !recipientPubkey || overBalance || transferring);
  const buttonDisabled = isSendMode ? sendDisabled : buyDisabled;
  const isProcessing = isSendMode ? transferring : depositing;
  const errorMessage = isSendMode ? transferError : depositError;

  const buttonLabel = (() => {
    if (isProcessing) return null;
    if (mode === "landing") return "Launch App to Invest";
    if (isSendMode) {
      if (overBalance) return "Exceeds balance";
      if (!hasAmount) return "Enter amount";
      if (!recipientPubkey) return "Enter recipient";
      return `Send ${parsedAmount.toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })} ox${selectedConfig.denomination}`;
    }
    if (hasAmount)
      return `Invest $${parsedAmount.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })}`;
    return "Enter amount";
  })();

  return (
    <div className="w-full max-w-[1300px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(260px,0.9fr)_minmax(0,2.8fr)_minmax(260px,0.9fr)] gap-6 md:gap-8 items-stretch">
        <div className="order-2 md:order-2 xl:order-1 relative z-10">
          {isSendMode ? (
            <HoldingFromPanel
              config={selectedConfig}
              amount={amount}
              hasAmount={hasAmount}
              balanceTokens={balanceTokens}
              onAmountChange={setAmount}
              onSelectMethod={() => setFromModalOpen(true)}
            />
          ) : (
            <BondFromPanel
              selectedMethodId={
                source.kind === "fiat" ? source.methodId : "USDC"
              }
              amount={amount}
              hasAmount={hasAmount}
              onAmountChange={setAmount}
              onSelectMethod={() => setFromModalOpen(true)}
            />
          )}
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
            <UkraineMap selectedId={activeId} onPinClick={isSendMode ? () => {} : setSelectedId} />
          </div>
        </div>

        <div className="order-3 md:order-3 xl:order-3 relative z-10">
          {isSendMode ? (
            <AddressToPanel
              address={recipientAddress}
              onAddressChange={setRecipientAddress}
            />
          ) : (
            <BondToPanel
              config={selectedConfig}
              receiveAmount={receiveAmount}
              hasAmount={hasAmount}
              apyPercent={apyPercent}
              onSelectBond={() => setModalOpen(true)}
            />
          )}
        </div>
      </div>

      <button
        onClick={handleAction}
        disabled={buttonDisabled}
        className={`mt-6 w-full py-5 rounded-[5px] font-mono text-sm uppercase tracking-[0.15em] transition-all ${
          buttonDisabled
            ? "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/5"
            : "bg-white text-black hover:bg-white/90"
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Processing
          </span>
        ) : (
          buttonLabel
        )}
      </button>

      {errorMessage && (
        <p className="mt-2 text-loss font-mono text-[11px] text-center">
          {errorMessage}
        </p>
      )}

      {transferSignature && isSendMode && (
        <p className="mt-2 text-white/40 font-mono text-[11px] text-center">
          Sent. Signature: {transferSignature.slice(0, 8)}…{transferSignature.slice(-8)}
        </p>
      )}

      {!isSendMode && (
        <div className="mt-8">
          <BondDetails
            config={selectedConfig}
            amount={hasAmount ? parsedAmount : 0}
            apyPercent={apyPercent}
            tvl={tvl}
          />
        </div>
      )}

      <BondSelectModal
        open={modalOpen}
        selectedId={selectedId}
        onClose={() => setModalOpen(false)}
        onSelect={setSelectedId}
      />

      <FromSelectModal
        open={fromModalOpen}
        source={source}
        onClose={() => setFromModalOpen(false)}
        onSelect={(s) => {
          setSource(s);
          setAmount("");
          setTransferSignature(null);
          if (s.kind === "bond") {
            setSelectedId(s.vaultId);
          }
        }}
      />
    </div>
  );
}
