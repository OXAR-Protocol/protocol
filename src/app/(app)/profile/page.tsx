"use client";

import { useState, useEffect, useCallback } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, ExternalLink, ChevronRight, Check, CreditCard } from "lucide-react";

import { useOxarProgram } from "@/hooks/use-oxar-program";
import { usePortfolio } from "@/hooks/use-portfolio";
import { shortenAddress, formatUsdc } from "@/lib/format";
import { DetailRow } from "@/components/explore/detail-row";

export default function ProfilePage() {
  const { logout } = usePrivy();
  const router = useRouter();
  const { walletAddress, connection } = useOxarProgram();
  const { usdcBalance, loading } = usePortfolio();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const fetchSolBalance = useCallback(async () => {
    if (!walletAddress || !connection) return;
    try {
      const bal = await connection.getBalance(walletAddress);
      setSolBalance(bal / LAMPORTS_PER_SOL);
    } catch {
      // ignore
    }
  }, [walletAddress, connection]);

  useEffect(() => {
    fetchSolBalance();
  }, [fetchSolBalance]);

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress.toBase58());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDisconnect = async () => {
    await logout();
    router.push("/login");
  };

  const fullAddress = walletAddress?.toBase58() ?? "";

  return (
    <div className="max-w-[720px] mx-auto py-8 space-y-6">
      <div className="rounded-[5px] border border-white/10 bg-surface-0 p-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-3">
          Account
        </span>
        <dl className="font-mono text-xs">
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-between py-1.5 border-b border-white/[0.04] text-left group"
          >
            <dt className="text-white/30 uppercase tracking-wide text-[10px]">
              Wallet
            </dt>
            <dd className="flex items-center gap-2 text-white/80">
              {copied ? (
                <>
                  <span>Copied</span>
                  <Check size={12} className="text-profit" />
                </>
              ) : (
                <>
                  <span>{shortenAddress(fullAddress)}</span>
                  <Copy
                    size={12}
                    className="text-white/40 group-hover:text-white transition-colors"
                  />
                </>
              )}
            </dd>
          </button>
          <DetailRow
            label="USDC Balance"
            value={loading ? "…" : formatUsdc(usdcBalance)}
          />
          <DetailRow label="SOL Balance" value={`${solBalance.toFixed(4)} SOL`} />
        </dl>

        <div className="mt-5 relative">
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 py-3 rounded-[5px] font-mono text-[11px] uppercase tracking-[0.15em] bg-white/[0.04] text-white/30 border border-white/5 cursor-not-allowed"
          >
            <CreditCard size={14} />
            Top Up with Card
          </button>
          <span className="block mt-2 text-center font-mono text-[10px] uppercase tracking-wide text-white/25">
            Available on mainnet
          </span>
        </div>
      </div>

      <div className="rounded-[5px] border border-white/10 bg-surface-0 p-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-3">
          Links
        </span>
        <div className="flex flex-col">
          <a
            href="https://github.com/OXAR-Protocol/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between py-2.5 border-b border-white/[0.04] font-mono text-xs text-white/50 hover:text-white transition-colors"
          >
            <span className="uppercase tracking-wide">Documentation</span>
            <ExternalLink size={12} />
          </a>
          <Link
            href="/terms"
            className="flex items-center justify-between py-2.5 border-b border-white/[0.04] font-mono text-xs text-white/50 hover:text-white transition-colors"
          >
            <span className="uppercase tracking-wide">Terms of Service</span>
            <ChevronRight size={12} />
          </Link>
          <Link
            href="/investors"
            className="flex items-center justify-between py-2.5 font-mono text-xs text-white/50 hover:text-white transition-colors"
          >
            <span className="uppercase tracking-wide">For Investors</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      </div>

      <button
        onClick={handleDisconnect}
        className="w-full py-4 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] border border-loss/30 text-loss hover:bg-loss/5 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
