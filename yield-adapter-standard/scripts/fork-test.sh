#!/usr/bin/env bash
# One-command Kamino mainnet-fork e2e.
#
# Spins up a local solana-test-validator that clones the real klend USDC-reserve
# account set from mainnet, injects the reserve + Scope price accounts with their
# cached slots rewritten low (so klend's `clock.slot - last_update` math is sane
# WITHOUT warping — warping to a ~423M mainnet slot exceeds macOS's open-file
# limit during accounts-hash), deploys the two programs, and runs the e2e.
#
# Usage:  MAINNET_RPC_URL=<rpc> ./scripts/fork-test.sh
# Default RPC is public mainnet-beta (rate-limited; a private RPC is faster).
set -euo pipefail
cd "$(dirname "$0")/.."

RPC="${MAINNET_RPC_URL:-https://api.mainnet-beta.solana.com}"
U="http://127.0.0.1:8899"
LEDGER="/tmp/yas-fork-ledger"

echo "▸ refreshing patched reserve/scope fixtures from mainnet"
MAINNET_RPC_URL="$RPC" node scripts/gen-fork-fixtures.js

echo "▸ launching local fork validator (no warp; slots patched low)"
pkill -f solana-test-validator 2>/dev/null || true
sleep 1
rm -rf "$LEDGER"
solana-test-validator --reset --quiet --ledger "$LEDGER" --url "$RPC" \
  --clone-upgradeable-program KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD \
  --clone 7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF \
  --clone Bgq7trRgVMeq33yt235zM2onQ4bRDBsY5EWiTetF4qw6 \
  --clone B8V6WVjPxW1UGwVDfxH2d2r8SyT4cqn7dQRK6XneVa7D \
  --clone 3DzjXRfxRm6iejfyyMynR4tScddaanrePJ1NJU2XnPPL \
  --clone EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v \
  --account D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59 tests/fork/fixtures/reserve-patched.json \
  --account 3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH tests/fork/fixtures/scope-patched.json \
  --account 96mBCxzaYW4nwyXac5oLGV6m16aEmXbwWZ4XsTq4AJBT tests/fork/fixtures/usdc-funded.json &
VPID=$!
trap 'kill $VPID 2>/dev/null || true' EXIT

echo "▸ waiting for validator health"
for _ in $(seq 1 30); do
  if curl -s -m 3 "$U" -X POST -H 'Content-Type: application/json' \
      -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' | grep -q '"result":"ok"'; then
    break
  fi
  sleep 2
done

echo "▸ funding + deploying programs"
solana airdrop 1000 --url "$U" >/dev/null 2>&1 || true
solana airdrop 1000 --url "$U" >/dev/null 2>&1 || true
solana program deploy --url "$U" --program-id target/deploy/dispatcher-keypair.json target/deploy/dispatcher.so
solana program deploy --url "$U" --program-id target/deploy/kamino_usdc-keypair.json target/deploy/kamino_usdc.so

echo "▸ running e2e"
yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/fork/02-kamino-native.ts
