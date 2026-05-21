import type { ProtocolMetadata } from "../types";

export const PROTOCOL_REGISTRY: readonly ProtocolMetadata[] = [
  {
    slug: "ondo-usdy",
    name: "Ondo USDY",
    chain: "ethereum",
    category: "us-treasuries",
    contractAddress: "0x96F6eF951840721AdBF46Ac996b59E0235CB985C",
    decimals: 18,
    description: "Tokenized short-term US Treasuries and bank demand deposits",
    issuerName: "Ondo Finance",
    issuerJurisdiction: "BVI",
    websiteUrl: "https://ondo.finance",
    estimatedApyBps: 480,
  },
  {
    slug: "ondo-ousg",
    name: "Ondo OUSG",
    chain: "ethereum",
    category: "us-treasuries",
    contractAddress: "0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92",
    decimals: 18,
    description: "Tokenized BlackRock short-term Treasury ETF",
    issuerName: "Ondo Finance",
    issuerJurisdiction: "BVI",
    websiteUrl: "https://ondo.finance",
    estimatedApyBps: 450,
  },
  {
    slug: "blackrock-buidl",
    name: "BlackRock BUIDL",
    chain: "ethereum",
    category: "us-treasuries",
    contractAddress: "0x7712c34205737192402172409a8F7ccef8aA2AEc",
    decimals: 6,
    description: "BlackRock USD Institutional Digital Liquidity Fund",
    issuerName: "BlackRock",
    issuerJurisdiction: "USA",
    websiteUrl: "https://securitize.io",
    estimatedApyBps: 460,
  },
  {
    slug: "maple-finance",
    name: "Maple Finance",
    chain: "ethereum",
    category: "private-credit",
    contractAddress: "0x33349B282065b0284d756F0577FB39c158F935e6",
    decimals: 18,
    description: "Institutional capital pools for private credit lending",
    issuerName: "Maple Finance",
    websiteUrl: "https://maple.finance",
    estimatedApyBps: 1050,
  },
  {
    slug: "centrifuge",
    name: "Centrifuge",
    chain: "ethereum",
    category: "private-credit",
    contractAddress: "0xc4724E22F4B85bf4F8e7b9d6e2cE4F7D8C7d4B61",
    decimals: 18,
    description: "Real-world asset financing pools",
    issuerName: "Centrifuge",
    websiteUrl: "https://centrifuge.io",
    estimatedApyBps: 950,
  },
  {
    slug: "backed-bib01",
    name: "Backed bIB01",
    chain: "ethereum",
    category: "us-treasuries",
    contractAddress: "0xCA30c93B02514f86d5C86a6e375E3A330B435Fb5",
    decimals: 18,
    description: "Tokenized iShares Treasury Bond 0-1yr UCITS ETF",
    issuerName: "Backed Finance",
    issuerJurisdiction: "Switzerland",
    websiteUrl: "https://backed.fi",
    estimatedApyBps: 470,
  },
] as const;

export function getProtocol(slug: string): ProtocolMetadata | undefined {
  return PROTOCOL_REGISTRY.find((p) => p.slug === slug);
}

export function getProtocolsByChain(chain: ProtocolMetadata["chain"]): ProtocolMetadata[] {
  return PROTOCOL_REGISTRY.filter((p) => p.chain === chain);
}

export function getProtocolByContract(
  chain: ProtocolMetadata["chain"],
  contractAddress: string,
): ProtocolMetadata | undefined {
  const normalized = contractAddress.toLowerCase();
  return PROTOCOL_REGISTRY.find(
    (p) => p.chain === chain && p.contractAddress.toLowerCase() === normalized,
  );
}
