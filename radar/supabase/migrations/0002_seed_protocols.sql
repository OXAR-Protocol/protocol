-- Seed `radar.protocols` from the static registry baked into radar-core.
-- Idempotent via ON CONFLICT (slug).
-- Re-apply after editing radar-core/protocols/registry.ts.

insert into radar.protocols
  (slug, name, chain, category, contract_address, decimals, description,
   issuer_name, issuer_jurisdiction, website_url, estimated_apy_bps)
values
  ('ondo-usdy', 'Ondo USDY', 'ethereum', 'us-treasuries',
   '0x96F6eF951840721AdBF46Ac996b59E0235CB985C', 18,
   'Tokenized short-term US Treasuries and bank demand deposits',
   'Ondo Finance', 'BVI', 'https://ondo.finance', 480),

  ('ondo-ousg', 'Ondo OUSG', 'ethereum', 'us-treasuries',
   '0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92', 18,
   'Tokenized BlackRock short-term Treasury ETF',
   'Ondo Finance', 'BVI', 'https://ondo.finance', 450),

  ('blackrock-buidl', 'BlackRock BUIDL', 'ethereum', 'us-treasuries',
   '0x7712c34205737192402172409a8F7ccef8aA2AEc', 6,
   'BlackRock USD Institutional Digital Liquidity Fund',
   'BlackRock', 'USA', 'https://securitize.io', 460),

  ('maple-finance', 'Maple Finance', 'ethereum', 'private-credit',
   '0x33349B282065b0284d756F0577FB39c158F935e6', 18,
   'Institutional capital pools for private credit lending',
   'Maple Finance', null, 'https://maple.finance', 1050),

  ('centrifuge', 'Centrifuge', 'ethereum', 'private-credit',
   '0xc4724E22F4B85bf4F8e7b9d6e2cE4F7D8C7d4B61', 18,
   'Real-world asset financing pools',
   'Centrifuge', null, 'https://centrifuge.io', 950),

  ('backed-bib01', 'Backed bIB01', 'ethereum', 'us-treasuries',
   '0xCA30c93B02514f86d5C86a6e375E3A330B435Fb5', 18,
   'Tokenized iShares Treasury Bond 0-1yr UCITS ETF',
   'Backed Finance', 'Switzerland', 'https://backed.fi', 470)

on conflict (slug) do update set
  name = excluded.name,
  chain = excluded.chain,
  category = excluded.category,
  contract_address = excluded.contract_address,
  decimals = excluded.decimals,
  description = excluded.description,
  issuer_name = excluded.issuer_name,
  issuer_jurisdiction = excluded.issuer_jurisdiction,
  website_url = excluded.website_url,
  estimated_apy_bps = excluded.estimated_apy_bps;
