-- Optional Solana wallet for waitlist signups (Galxe quest verification + future
-- early-access / airdrop targeting). Email stays the required identifier; wallet
-- is captured only if the user chooses to connect/paste one.
alter table waitlist add column if not exists wallet text;

-- Fast lookup for the Galxe verification endpoint (/api/galxe/verify?address=...).
create index if not exists waitlist_wallet_idx on waitlist (wallet);

comment on column waitlist.wallet is 'Optional Solana wallet address (base58). Used for Galxe eligibility + early-access targeting.';
