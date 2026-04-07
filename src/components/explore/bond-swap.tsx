"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { ArrowDownUp, ChevronDown, Loader2 } from "lucide-react";

import { useVaults, VaultAccount } from "@/hooks/use-vaults";
import { useDeposit } from "@/hooks/use-deposit";
import { VAULT_CONFIGS } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";
import { formatUsdc } from "@/lib/format";

const BANK_RATES: Record<string, number> = {
  UAH: 3,
  USD: 0.5,
  EUR: 0.3,
};

function MiniYieldChart({ apy, denomination }: { apy: number; denomination: string }) {
  const bankRate = BANK_RATES[denomination] ?? 1;
  const points = 12;
  const w = 280;
  const h = 80;
  const pad = 8;

  const oxarLine = Array.from({ length: points + 1 }, (_, i) => {
    const t = i / points;
    const x = pad + t * (w - 2 * pad);
    const value = 1 + (apy / 100) * t;
    const y = h - pad - ((value - 1) / (apy / 100 + 0.02)) * (h - 2 * pad);
    return `${x},${y}`;
  });

  const bankLine = Array.from({ length: points + 1 }, (_, i) => {
    const t = i / points;
    const x = pad + t * (w - 2 * pad);
    const value = 1 + (bankRate / 100) * t;
    const y = h - pad - ((value - 1) / (apy / 100 + 0.02)) * (h - 2 * pad);
    return `${x},${y}`;
  });

  const areaPath = `M${oxarLine[0]} ${oxarLine.map((p) => `L${p}`).join(" ")} L${pad + w - 2 * pad},${h - pad} L${pad},${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20 mb-2" preserveAspectRatio="none">
      <defs>
        <linearGradient id="oxarFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent, #8B5CF6)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-accent, #8B5CF6)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#oxarFill)" />
      <polyline points={oxarLine.join(" ")} fill="none" stroke="var(--color-accent, #8B5CF6)" strokeWidth="2" />
      <polyline points={bankLine.join(" ")} fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x={w - pad} y="16" textAnchor="end" className="fill-accent text-[9px] font-mono">
        OXAR {apy.toFixed(1)}%
      </text>
      <text x={w - pad} y={h - pad - 4} textAnchor="end" className="fill-white/20 text-[9px] font-mono">
        Bank {bankRate}%
      </text>
    </svg>
  );
}

export function BondSwap() {
  const [amount, setAmount] = useState("");
  const [selectedConfigId, setSelectedConfigId] = useState(VAULT_CONFIGS[0]?.id || "");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const { vaults } = useVaults();
  const { deposit, loading: depositing, error: depositError } = useDeposit();
  const router = useRouter();

  const selectedConfig = VAULT_CONFIGS.find((c) => c.id === selectedConfigId);

  const vaultData: VaultAccount | undefined = useMemo(() => {
    if (!selectedConfig) return undefined;
    const [pda] = deriveVaultPda(selectedConfig.region, selectedConfig.denomination, selectedConfig.assetSubtype);
    return vaults.find((v) => v.publicKey.toBase58() === pda.toBase58());
  }, [selectedConfig, vaults]);

  const vaultPda = selectedConfig
    ? deriveVaultPda(selectedConfig.region, selectedConfig.denomination, selectedConfig.assetSubtype)[0]
    : null;

  const parsedAmount = parseFloat(amount);
  const hasAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const apyBps = vaultData?.account.apyBps.toNumber() ?? (selectedConfig?.apy ?? 0) * 100;
  const apyPercent = apyBps / 100;

  const receiveAmount = hasAmount ? parsedAmount * (1 + apyPercent / 100) : 0;
  const yearlyYield = hasAmount ? (parsedAmount * apyPercent) / 100 : 0;
  const tokenName = selectedConfig ? `ox${selectedConfig.denomination}` : "oxUAH";

  const totalDeposited = vaultData ? formatUsdc(vaultData.account.totalDeposits) : null;

  const handleInvest = async () => {
    if (!vaultPda || !hasAmount) return;
    const amountBn = new BN(Math.floor(parsedAmount * 1_000_000));
    const tx = await deposit(vaultPda, amountBn);
    if (tx) {
      setAmount("");
      router.push("/portfolio");
    }
  };

  const bondTypeLabel = selectedConfig
    ? `${selectedConfig.isWar ? "War Bond" : "Gov Bond"} ${selectedConfig.denomination}`
    : "";

  const bondSubtypeLabel = selectedConfig
    ? selectedConfig.isWar
      ? "Military Defense Bond"
      : `OVDP ${selectedConfig.assetSubtype === "SHORT" ? "Short-term" : selectedConfig.assetSubtype === "MID" ? "Mid-term" : "Standard"}`
    : "";

  return (
    <div className="bg-surface-1 rounded-2xl border border-white/[0.08] p-5 relative">
      {selectedConfig && (
        <MiniYieldChart apy={selectedConfig.apy} denomination={selectedConfig.denomination} />
      )}

      {/* Deposit */}
      <p className="text-white/40 font-mono text-xs uppercase tracking-wide mb-2">Deposit</p>
      <div className="bg-surface-2 rounded-xl p-4 flex items-center justify-between">
        <input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-transparent text-white font-mono text-3xl font-bold w-full outline-none placeholder:text-white/20"
        />
        <span className="text-white/60 font-mono text-sm font-bold shrink-0 ml-2">USDC</span>
      </div>

      {/* Preset amounts */}
      <div className="flex justify-center gap-2 mt-2">
        {[100, 1000, 10000].map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p.toString())}
            className="font-mono text-[10px] px-2.5 py-1 rounded-full border border-white/[0.06] text-white/30 hover:text-white/50 transition-colors"
          >
            ${p.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Swap icon */}
      <div className="flex justify-center py-2">
        <ArrowDownUp size={20} className="text-white/30" />
      </div>

      {/* Receive */}
      <p className="text-white/40 font-mono text-xs uppercase tracking-wide mb-2">Receive</p>
      <div className="bg-surface-2 rounded-xl p-4 flex items-center justify-between relative">
        <span className="text-white font-mono text-3xl font-bold">
          {hasAmount ? receiveAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
        </span>
        <button
          onClick={() => setSelectorOpen(!selectorOpen)}
          className="text-accent font-mono text-sm font-bold flex items-center gap-1 shrink-0 ml-2"
        >
          {tokenName}
          <ChevronDown size={14} />
        </button>

        {selectorOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-2 border border-white/[0.08] rounded-xl overflow-hidden z-50">
            {VAULT_CONFIGS.map((config) => {
              const isSelected = config.id === selectedConfigId;
              return (
                <button
                  key={config.id}
                  onClick={() => {
                    setSelectedConfigId(config.id);
                    setSelectorOpen(false);
                  }}
                  className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.05] transition-colors ${
                    isSelected ? "bg-white/[0.03]" : ""
                  }`}
                >
                  <span className="text-white font-mono text-sm">{config.label}</span>
                  <span className="text-accent font-mono text-sm font-bold">{config.apy.toFixed(1)}%</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bond details */}
      {hasAmount && selectedConfig && (
        <div className="mt-4 space-y-2 pt-4 border-t border-white/[0.08]">
          <p className="text-white/40 font-mono text-xs">
            <span className="text-accent font-bold">{apyPercent.toFixed(1)}% APY</span>
            {" · 1yr: "}
            <span className="text-white/60">+${yearlyYield.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
          </p>
          <p className="text-white/40 font-mono text-xs">
            {bondTypeLabel} · {bondSubtypeLabel}
          </p>
          {totalDeposited && (
            <p className="text-white/40 font-mono text-xs">{totalDeposited} deposited</p>
          )}
        </div>
      )}

      {/* Invest button */}
      <button
        onClick={handleInvest}
        disabled={!hasAmount || depositing}
        className={`mt-4 w-full py-4 rounded-xl font-mono text-base uppercase tracking-wide transition-colors ${
          hasAmount && !depositing
            ? "bg-accent text-white hover:bg-accent/90"
            : "bg-white/[0.05] text-white/30 cursor-not-allowed"
        }`}
      >
        {depositing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Processing...
          </span>
        ) : hasAmount ? (
          `Invest $${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        ) : (
          "Enter amount"
        )}
      </button>

      {depositError && (
        <p className="mt-2 text-loss font-mono text-xs text-center">{depositError}</p>
      )}
    </div>
  );
}
