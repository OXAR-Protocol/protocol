import "server-only";

import type { Chain, ProtocolCategory, ProtocolMetadata } from "@oxar/radar-core";

import { getDb } from "./client";

export interface DbProtocol extends ProtocolMetadata {
  id: string;
  isActive: boolean;
}

interface ProtocolRow {
  id: string;
  slug: string;
  name: string;
  chain: string;
  category: string;
  contract_address: string;
  decimals: number;
  description: string | null;
  issuer_name: string;
  issuer_jurisdiction: string | null;
  website_url: string | null;
  estimated_apy_bps: number;
  is_active: boolean;
}

export async function listActiveProtocols(): Promise<DbProtocol[]> {
  const sql = getDb();
  const rows = await sql<ProtocolRow[]>`
    select id, slug, name, chain, category, contract_address, decimals,
           description, issuer_name, issuer_jurisdiction, website_url,
           estimated_apy_bps, is_active
    from radar.protocols
    where is_active = true
    order by chain, slug
  `;
  return rows.map(rowToProtocol);
}

export async function getProtocolBySlug(slug: string): Promise<DbProtocol | null> {
  const sql = getDb();
  const rows = await sql<ProtocolRow[]>`
    select id, slug, name, chain, category, contract_address, decimals,
           description, issuer_name, issuer_jurisdiction, website_url,
           estimated_apy_bps, is_active
    from radar.protocols
    where slug = ${slug}
    limit 1
  `;
  return rows[0] ? rowToProtocol(rows[0]) : null;
}

function rowToProtocol(row: ProtocolRow): DbProtocol {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    chain: row.chain as Chain,
    category: row.category as ProtocolCategory,
    contractAddress: row.contract_address,
    decimals: row.decimals,
    description: row.description ?? "",
    issuerName: row.issuer_name,
    issuerJurisdiction: row.issuer_jurisdiction ?? undefined,
    websiteUrl: row.website_url ?? "",
    estimatedApyBps: row.estimated_apy_bps,
    isActive: row.is_active,
  };
}
