// Minimal types for bs58 v4 (CJS, ships no .d.ts). It's a transitive dep of
// @solana/web3.js; we use it to base58-encode a signAndSendTransaction signature.
declare module "bs58" {
  const bs58: {
    encode(buffer: Uint8Array | number[]): string;
    decode(str: string): Uint8Array;
  };
  export default bs58;
}
