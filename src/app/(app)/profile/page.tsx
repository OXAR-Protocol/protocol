"use client";

import { useState, useEffect, useCallback } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, ExternalLink, ChevronRight } from "lucide-react";

import { useOxarProgram } from "@/hooks/use-oxar-program";
import { usePortfolio } from "@/hooks/use-portfolio";
import { shortenAddress, formatUsdc } from "@/lib/format";

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
    <div className="py-6 space-y-6">
      {/* Account Section */}
      <div>
        <h2 className="text-white/60 font-mono text-xs uppercase tracking-wide mb-3">
          Account
        </h2>

        {/* Wallet Address */}
        <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
          <span className="text-white/40 font-mono text-xs">Wallet</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-white font-mono text-sm hover:text-white/80 transition-colors"
          >
            {copied ? "Copied!" : shortenAddress(fullAddress)}
            <Copy size={14} className="text-white/40" />
          </button>
        </div>

        {/* USDC Balance */}
        <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
          <span className="text-white/40 font-mono text-xs">USDC Balance</span>
          <span className="text-white font-mono text-sm">
            {loading ? "..." : formatUsdc(usdcBalance)}
          </span>
        </div>

        {/* SOL Balance */}
        <div className="flex justify-between items-center py-3 border-b border-white/[0.05]">
          <span className="text-white/40 font-mono text-xs">SOL Balance</span>
          <span className="text-white font-mono text-sm">
            {solBalance.toFixed(4)} SOL
          </span>
        </div>
      </div>

      {/* Links Section */}
      <div>
        <h2 className="text-white/60 font-mono text-xs uppercase tracking-wide mb-3">
          Links
        </h2>

        <a
          href="https://github.com/OXAR-Protocol/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex justify-between items-center py-3 border-b border-white/[0.05] text-white/40 hover:text-white/60 transition-colors"
        >
          <span className="font-mono text-xs">Documentation</span>
          <ExternalLink size={14} />
        </a>

        <Link
          href="/terms"
          className="flex justify-between items-center py-3 border-b border-white/[0.05] text-white/40 hover:text-white/60 transition-colors"
        >
          <span className="font-mono text-xs">Terms of Service</span>
          <ChevronRight size={14} />
        </Link>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={handleDisconnect}
        className="w-full py-3 rounded-xl border border-loss/30 text-loss font-mono text-sm uppercase tracking-wide mt-8"
      >
        Disconnect
      </button>
    </div>
  );
}
