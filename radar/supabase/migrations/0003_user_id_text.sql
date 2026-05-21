-- Privy DIDs ("did:privy:xxxx") are not UUIDs. Switch user_id to text
-- so Privy auth can claim ownership directly without an intermediate
-- users table. A dedicated radar.users table comes when we need extra
-- fields (display name, plan trial state, etc).

alter table radar.api_keys
  alter column user_id type text using user_id::text;
