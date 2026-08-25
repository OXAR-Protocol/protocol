/**
 * Addresses that only ever appear on transactions we built.
 *
 * The chain carries no author, with one exception: somebody had to pay the network
 * fee. On the ordinary path that is our gasless relayer, and nothing else can put
 * its address in that field — which makes it the only proof of authorship available
 * to us, and the basis for telling our own volume apart from what these wallets did
 * in other apps.
 *
 * A SET rather than one address, because the live payer is whatever the relayer node
 * currently answers with, and a key rotation would orphan every transaction signed
 * by the old one. Add the new address when the key rotates; never remove the old.
 *
 * It lives in the SDK rather than beside the Kora client because that client is a
 * `"use client"` module. Importing this from a server route through that file gave
 * every export a client-reference proxy, and reading the set threw on every
 * transaction — a sync that reported zero and blamed the network.
 */
export const KORA_FEE_PAYERS: ReadonlySet<string> = new Set([
  "MQwRCwbeRmhpNdAjvkMysLHS92WSXQvw7wJ8hPoYFrL",
]);
