"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, Plus, Loader2, Trash2, Zap } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { CustomSelect } from "@/components/custom-select";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import {
  useUserRules,
  useRuleActions,
  type DestinationKind,
  type Direction,
  type Comparator,
  type RuleData,
} from "@/hooks/use-rules";
import { useUserGroupVaults } from "@/hooks/use-group-vault";
import { usePersonalVault } from "@/hooks/use-personal-vault";
import {
  TRIGGER_TOKENS,
  CUSTOM_TOKEN_SYMBOL,
  mintToPublicKey,
  findTokenByMint,
  type TriggerToken,
} from "@/lib/trigger-tokens";

interface DestinationDraft {
  destType: DestinationKind;
  percentBps: number;
  targetLabel: string;
  targetPda: PublicKey | null;
}

const DEFAULT_SPLIT: DestinationDraft[] = [
  {
    destType: "personalYield",
    percentBps: 6000,
    targetLabel: "Walking vault",
    targetPda: null,
  },
  {
    destType: "groupVault",
    percentBps: 2500,
    targetLabel: "(pick a pile)",
    targetPda: null,
  },
  {
    destType: "stayInWallet",
    percentBps: 1500,
    targetLabel: "Wallet",
    targetPda: null,
  },
];

const DIRECTION_OPTIONS: { value: Direction; label: string }[] = [
  { value: "receives", label: "arrives" },
  { value: "sends", label: "leaves" },
];

const COMPARATOR_OPTIONS: { value: Comparator; label: string }[] = [
  { value: "greaterOrEqual", label: "≥" },
  { value: "greater", label: ">" },
  { value: "equal", label: "=" },
  { value: "lessOrEqual", label: "≤" },
  { value: "less", label: "<" },
];

export default function RulesPage() {
  const { walletAddress } = useOxarProgram();
  const { rules, loading, refetch } = useUserRules();
  const actions = useRuleActions();
  const sleepy = usePersonalVault("sleepy");
  const walking = usePersonalVault("walking");
  const running = usePersonalVault("running");
  const groups = useUserGroupVaults();

  const [showForm, setShowForm] = useState(false);
  const [token, setToken] = useState<TriggerToken>(TRIGGER_TOKENS[0]);
  const [isCustom, setIsCustom] = useState(false);
  const [customMint, setCustomMint] = useState("");
  const [customSymbol, setCustomSymbol] = useState("");
  const [customDecimals, setCustomDecimals] = useState(6);
  const [customError, setCustomError] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>("receives");
  const [comparator, setComparator] = useState<Comparator>("greaterOrEqual");
  const [amount, setAmount] = useState(100);
  const [destinations, setDestinations] = useState<DestinationDraft[]>(DEFAULT_SPLIT);

  const activeToken: TriggerToken = isCustom
    ? {
        symbol: customSymbol || "TOKEN",
        label: customSymbol || "TOKEN",
        emoji: "🪙",
        mint: customMint.trim(),
        decimals: customDecimals,
      }
    : token;

  const customValid = (() => {
    if (!isCustom) return true;
    if (!customMint.trim()) return false;
    if (!customSymbol.trim()) return false;
    try {
      new PublicKey(customMint.trim());
      return true;
    } catch {
      return false;
    }
  })();

  const totalBps = destinations.reduce((a, d) => a + d.percentBps, 0);
  const canSave =
    totalBps === 10_000 &&
    customValid &&
    destinations.every((d) => {
      if (d.destType === "stayInWallet") return true;
      return d.targetPda !== null;
    });

  const personalVaultOptions = useMemo(() => {
    const list: { label: string; pda: string }[] = [];
    if (sleepy.exists && sleepy.vaultPda) list.push({ label: "😴 Sleepy", pda: sleepy.vaultPda });
    if (walking.exists && walking.vaultPda) list.push({ label: "🚶 Walking", pda: walking.vaultPda });
    if (running.exists && running.vaultPda) list.push({ label: "🏃 Running", pda: running.vaultPda });
    return list;
  }, [sleepy, walking, running]);

  const groupOptions = useMemo(
    () =>
      [...groups.created, ...groups.joined].map((g) => ({
        label: g.name,
        pda: g.pda.toBase58(),
      })),
    [groups.created, groups.joined],
  );

  const updateDest = (idx: number, patch: Partial<DestinationDraft>) => {
    setDestinations((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const handleSave = async () => {
    if (!walletAddress || !canSave) return;
    const input = {
      triggerWallet: walletAddress,
      triggerMint: mintToPublicKey(activeToken.mint),
      mintDecimals: activeToken.decimals,
      direction,
      comparator,
      amount,
      destinations: destinations.map((d) => ({
        destType: d.destType,
        percentBps: d.percentBps,
        target: d.targetPda,
      })),
    };
    const result = await actions.createRule(input);
    if (result) {
      setShowForm(false);
      setTimeout(() => refetch(), 1000);
    }
  };

  const handleCancel = async (rule: RuleData) => {
    if (!confirm("Cancel this rule? Account rent will refund.")) return;
    const sig = await actions.cancelRule(rule.pda, rule.ruleId);
    if (sig) {
      setTimeout(() => refetch(), 1000);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto pt-8 pb-32 px-4">
      <Link
        href="/you"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-white/40 hover:text-white mb-8"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Back to settings
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>Sleeping patterns</SectionLabel>
        <h1 className="mt-4 font-sans text-3xl text-white leading-tight">
          When money moves, what should happen?
        </h1>
        <p className="mt-3 font-mono text-sm text-white/40 max-w-lg">
          Build a trigger from token, direction, comparator and amount. We
          watch your wallet and send a notification when it matches — you
          approve the split with one tap.
        </p>
      </motion.div>

      {/* Existing rules */}
      {!loading && rules.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-10 space-y-3"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
            Your patterns
          </p>
          {rules.map((r) => {
            const tok = findTokenByMint(r.triggerMint);
            const symbol = tok?.symbol ?? "TOKEN";
            const decimals = tok?.decimals ?? 6;
            const cmpLabel =
              COMPARATOR_OPTIONS.find((o) => o.value === r.comparator)?.label ?? "≥";
            const dirLabel =
              DIRECTION_OPTIONS.find((o) => o.value === r.direction)?.label ??
              "arrives";
            return (
              <div
                key={r.pda.toBase58()}
                className="p-5 rounded-[8px] border border-white/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-sans text-sm text-white">
                      When {symbol} {dirLabel} {cmpLabel}{" "}
                      {(r.amount.toNumber() / Math.pow(10, decimals)).toLocaleString()}
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {r.destinations.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between font-mono text-xs"
                        >
                          <span className="text-white/50">
                            → {labelForDest(d.destType)}
                          </span>
                          <span className="text-white">
                            {(d.percentBps / 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                    {r.triggerCount > 0 && (
                      <p className="mt-3 font-mono text-[11px] text-white/30">
                        Triggered {r.triggerCount}{" "}
                        {r.triggerCount === 1 ? "time" : "times"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCancel(r)}
                    disabled={actions.loading}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-white/10 hover:border-red-500/40 hover:text-red-400 font-mono text-[10px] uppercase tracking-wide text-white/40 transition disabled:opacity-30"
                  >
                    <Trash2 size={11} strokeWidth={1.5} />
                    Cancel
                  </button>
                </div>
              </div>
            );
          })}
        </motion.section>
      )}

      {/* Add rule */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10"
      >
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            disabled={!walletAddress}
            className="w-full p-6 rounded-[8px] border border-dashed border-white/15 hover:border-white/30 transition-colors flex items-center gap-3 text-white/40 hover:text-white disabled:opacity-30"
          >
            <Plus size={18} strokeWidth={1.5} />
            <span className="font-mono text-sm">Add a pattern</span>
          </button>
        ) : (
          <div className="p-6 rounded-[8px] border border-white/10">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-sans text-lg text-white">New pattern</h2>
              <button
                onClick={() => setShowForm(false)}
                className="font-mono text-xs text-white/40 hover:text-white"
              >
                Cancel
              </button>
            </div>

            {/* Trigger builder */}
            <div className="mb-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
                Trigger when
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <CustomSelect
                  value={isCustom ? CUSTOM_TOKEN_SYMBOL : token.symbol}
                  onChange={(sym) => {
                    if (sym === CUSTOM_TOKEN_SYMBOL) {
                      setIsCustom(true);
                      setCustomError(null);
                    } else {
                      setIsCustom(false);
                      const next = TRIGGER_TOKENS.find((t) => t.symbol === sym);
                      if (next) setToken(next);
                    }
                  }}
                  options={[
                    ...TRIGGER_TOKENS.map((t) => ({
                      value: t.symbol,
                      label: `${t.emoji} ${t.label}`,
                    })),
                    { value: CUSTOM_TOKEN_SYMBOL, label: "🪙 Custom…" },
                  ]}
                />
                <CustomSelect
                  value={direction}
                  onChange={(v) => setDirection(v as Direction)}
                  options={DIRECTION_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                />
                <CustomSelect
                  value={comparator}
                  onChange={(v) => setComparator(v as Comparator)}
                  options={COMPARATOR_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  narrow
                />
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={amount}
                  onChange={(e) =>
                    setAmount(Math.max(0, Number(e.target.value)))
                  }
                  className="w-32 bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-mono text-lg text-white py-1 text-right"
                />
                <span className="font-mono text-sm text-white/50">
                  {activeToken.symbol}
                </span>
              </div>

              {isCustom && (
                <div className="mt-4 p-4 rounded-[6px] border border-white/10 bg-white/[0.02] space-y-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/30">
                    Custom token
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_100px] gap-3">
                    <label className="block">
                      <span className="block font-mono text-[10px] text-white/30 uppercase mb-1">
                        Mint address
                      </span>
                      <input
                        type="text"
                        spellCheck={false}
                        value={customMint}
                        onChange={(e) => {
                          setCustomMint(e.target.value);
                          setCustomError(null);
                        }}
                        placeholder="e.g. Es9vMFrzaCERm…"
                        className="w-full bg-black border border-white/10 focus:border-white/30 rounded px-2 py-1.5 font-mono text-xs text-white outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="block font-mono text-[10px] text-white/30 uppercase mb-1">
                        Symbol
                      </span>
                      <input
                        type="text"
                        maxLength={10}
                        value={customSymbol}
                        onChange={(e) =>
                          setCustomSymbol(e.target.value.toUpperCase())
                        }
                        placeholder="USDT"
                        className="w-full bg-black border border-white/10 focus:border-white/30 rounded px-2 py-1.5 font-mono text-sm text-white outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="block font-mono text-[10px] text-white/30 uppercase mb-1">
                        Decimals
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={18}
                        value={customDecimals}
                        onChange={(e) =>
                          setCustomDecimals(
                            Math.max(0, Math.min(18, Number(e.target.value))),
                          )
                        }
                        className="w-full bg-black border border-white/10 focus:border-white/30 rounded px-2 py-1.5 font-mono text-sm text-white outline-none"
                      />
                    </label>
                  </div>
                  {!customValid && customMint && (
                    <p className="font-mono text-[11px] text-red-400">
                      Invalid mint address — must be a base58 Solana pubkey.
                    </p>
                  )}
                  {customError && (
                    <p className="font-mono text-[11px] text-red-400">
                      {customError}
                    </p>
                  )}
                </div>
              )}

              <p className="mt-2 font-mono text-[11px] text-white/30">
                Example: {activeToken.symbol} {dirHuman(direction)}{" "}
                {cmpHuman(comparator)} {amount.toLocaleString()} →
                splits as below.
              </p>
            </div>

            {/* Destinations */}
            <div className="mb-6">
              <div className="flex items-baseline justify-between mb-3">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">
                  Split
                </p>
                <span
                  className={`font-mono text-xs ${
                    totalBps === 10000 ? "text-accent" : "text-red-400"
                  }`}
                >
                  {(totalBps / 100).toFixed(0)}% / 100%
                </span>
              </div>
              <div className="space-y-3">
                {destinations.map((d, idx) => (
                  <DestinationRow
                    key={idx}
                    draft={d}
                    onChange={(patch) => updateDest(idx, patch)}
                    personalOptions={personalVaultOptions}
                    groupOptions={groupOptions}
                    onRemove={
                      destinations.length > 1
                        ? () =>
                            setDestinations((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                        : undefined
                    }
                  />
                ))}
              </div>
              {destinations.length < 5 && (
                <button
                  onClick={() =>
                    setDestinations((prev) => [
                      ...prev,
                      {
                        destType: "stayInWallet",
                        percentBps: 0,
                        targetLabel: "Wallet",
                        targetPda: null,
                      },
                    ])
                  }
                  className="mt-3 font-mono text-xs text-white/40 hover:text-white inline-flex items-center gap-1"
                >
                  <Plus size={12} strokeWidth={1.5} />
                  Add destination
                </button>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!canSave || actions.loading}
              className="w-full px-6 py-3 rounded-[5px] bg-white text-black font-mono text-sm uppercase tracking-wide hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2"
            >
              {actions.loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Saving…
                </>
              ) : (
                <>
                  <Zap size={14} strokeWidth={1.5} />
                  Save pattern
                </>
              )}
            </button>

            {actions.error && (
              <p className="mt-3 font-mono text-xs text-red-400 text-center">
                {actions.error}
              </p>
            )}
          </div>
        )}
      </motion.section>

      {/* Empty + info */}
      {!loading && rules.length === 0 && !showForm && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-12"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
            How it works
          </p>
          <div className="space-y-3 text-white/50 font-mono text-sm leading-relaxed">
            <p>
              1. Build a trigger: pick token, direction, comparator, amount.
            </p>
            <p>
              2. We watch your wallet (read-only — no permission to move
              funds).
            </p>
            <p>
              3. When the condition matches, you get a notification.
            </p>
            <p>
              4. You tap "apply" → one transaction splits the amount across
              destinations (personal vault, group pile, or stay in wallet).
            </p>
            <p className="text-white/30">
              We never have permission to move your money. You always sign.
            </p>
          </div>
        </motion.section>
      )}
    </div>
  );
}

function labelForDest(kind: DestinationKind): string {
  switch (kind) {
    case "personalYield":
      return "Personal yield vault";
    case "groupVault":
      return "Friends pile";
    case "stayInWallet":
      return "Stay liquid in wallet";
  }
}

function dirHuman(d: Direction): string {
  return d === "receives" ? "arrives" : "leaves";
}

function cmpHuman(c: Comparator): string {
  switch (c) {
    case "greater":
      return ">";
    case "greaterOrEqual":
      return "≥";
    case "equal":
      return "=";
    case "lessOrEqual":
      return "≤";
    case "less":
      return "<";
  }
}

function DestinationRow({
  draft,
  onChange,
  personalOptions,
  groupOptions,
  onRemove,
}: {
  draft: DestinationDraft;
  onChange: (patch: Partial<DestinationDraft>) => void;
  personalOptions: { label: string; pda: string }[];
  groupOptions: { label: string; pda: string }[];
  onRemove?: () => void;
}) {
  const options =
    draft.destType === "personalYield"
      ? personalOptions
      : draft.destType === "groupVault"
        ? groupOptions
        : [];

  return (
    <div className="p-3 rounded border border-white/10 flex flex-wrap items-center gap-3">
      <CustomSelect
        value={draft.destType}
        onChange={(v) => {
          const kind = v as DestinationKind;
          onChange({
            destType: kind,
            targetPda: kind === "stayInWallet" ? null : draft.targetPda,
            targetLabel: kind === "stayInWallet" ? "Wallet" : draft.targetLabel,
          });
        }}
        options={[
          { value: "personalYield", label: "Personal yield" },
          { value: "groupVault", label: "Friends pile" },
          { value: "stayInWallet", label: "Stay in wallet" },
        ]}
      />

      {draft.destType !== "stayInWallet" && (
        <CustomSelect
          value={draft.targetPda?.toBase58() ?? ""}
          onChange={(v) => {
            const opt = options.find((o) => o.pda === v);
            onChange({
              targetPda: v ? new PublicKey(v) : null,
              targetLabel: opt?.label ?? "(pick)",
            });
          }}
          placeholder={options.length === 0 ? "(none available)" : "(pick)"}
          options={
            options.length === 0
              ? [{ value: "", label: "(none available)" }]
              : options.map((opt) => ({ value: opt.pda, label: opt.label }))
          }
          className="flex-1 min-w-[160px]"
        />
      )}

      <input
        type="number"
        min={0}
        max={100}
        value={(draft.percentBps / 100).toFixed(0)}
        onChange={(e) =>
          onChange({
            percentBps: Math.max(
              0,
              Math.min(100, Number(e.target.value)),
            ) * 100,
          })
        }
        className="w-16 bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-mono text-sm text-white py-1 text-right"
      />
      <span className="font-mono text-xs text-white/40">%</span>

      {onRemove && (
        <button
          onClick={onRemove}
          className="text-white/30 hover:text-red-400 transition"
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
