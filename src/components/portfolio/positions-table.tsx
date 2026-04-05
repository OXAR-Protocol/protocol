"use client";

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUsdc, formatTokens, formatApy, getMaturityCountdown } from "@/lib/format";
import { VAULT_CONFIGS, VaultConfig } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";
import { PortfolioPosition } from "@/hooks/use-portfolio";

interface PositionsTableProps {
  positions: PortfolioPosition[];
  claiming: boolean;
  claimError: string | null;
  onClaim: (vaultPubkey: PublicKey) => void;
}

function findVaultConfig(vaultPubkey: string): VaultConfig | undefined {
  for (const config of VAULT_CONFIGS) {
    const [pda] = deriveVaultPda(config.region, config.denomination, config.assetSubtype);
    if (pda.toBase58() === vaultPubkey) return config;
  }
  return undefined;
}

export function PositionsTable({ positions, claiming, claimError, onClaim }: PositionsTableProps) {
  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Your Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <p className="py-8 text-center text-gray-500">
            No positions yet. Deposit USDC into a vault to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Vault</TableHead>
                  <TableHead className="text-gray-400 text-right">Tokens</TableHead>
                  <TableHead className="text-gray-400 text-right">NAV/Share</TableHead>
                  <TableHead className="text-gray-400 text-right">Value</TableHead>
                  <TableHead className="text-gray-400 text-right">APY</TableHead>
                  <TableHead className="text-gray-400">Maturity</TableHead>
                  <TableHead className="text-gray-400 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((pos) => {
                  const vaultConfig = findVaultConfig(
                    pos.vault.publicKey.toBase58()
                  );
                  const navPerShare = pos.vault.account.navPerShare;
                  const value = pos.balance
                    .mul(navPerShare)
                    .div(new BN(1_000_000));
                  const maturity = getMaturityCountdown(
                    pos.vault.account.maturityTs
                  );

                  return (
                    <TableRow
                      key={pos.vault.publicKey.toBase58()}
                      className="border-gray-800"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-200">
                            {vaultConfig?.label || "Unknown Vault"}
                          </p>
                          {vaultConfig?.isWar && (
                            <Badge className="mt-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                              WAR
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-gray-200">
                        {formatTokens(pos.balance)}
                      </TableCell>
                      <TableCell className="text-right text-gray-200">
                        ${(navPerShare.toNumber() / 1_000_000).toFixed(6)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-white">
                        {formatUsdc(value)}
                      </TableCell>
                      <TableCell className="text-right text-[#00D4AA]">
                        {formatApy(pos.vault.account.apyBps)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={maturity.matured ? "default" : "outline"}
                          className={
                            maturity.matured
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "border-gray-600 text-gray-400"
                          }
                        >
                          {maturity.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() =>
                            onClaim(pos.vault.publicKey)
                          }
                          disabled={claiming || !maturity.matured}
                          className={
                            maturity.matured
                              ? "bg-[#00D4AA] text-gray-950 hover:bg-[#00B892]"
                              : "bg-gray-700 text-gray-500 cursor-not-allowed"
                          }
                        >
                          {claiming ? "..." : "Claim"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {claimError && (
          <p className="mt-4 text-xs text-red-400">{claimError}</p>
        )}
      </CardContent>
    </Card>
  );
}
