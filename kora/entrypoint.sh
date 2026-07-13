#!/bin/sh
# Start the Kora RPC node. Injects the optional API key at boot (kept out of the
# committed config), then points Kora at our Solana RPC + signer.
set -e

if [ -n "$KORA_API_KEY" ]; then
  sed -i "s|# api_key = \"set-via-env\"|api_key = \"$KORA_API_KEY\"|" /app/kora.toml
  echo "kora: api-key auth enabled"
else
  echo "kora: WARNING running without api_key (rate-limited, USDC-payment still required per tx)"
fi

exec kora \
  --config /app/kora.toml \
  --rpc-url "${SOLANA_RPC_URL:?set SOLANA_RPC_URL to a Solana mainnet RPC (Helius)}" \
  rpc start \
  --signers-config /app/signers.toml
