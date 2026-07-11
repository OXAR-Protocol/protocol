// `bs58` ships no type declarations. Minimal typed shim for the bits we use
// (encoding a Solana signature returned by Privy's signAndSendTransaction).
declare module "bs58" {
  export function encode(data: Uint8Array): string;
  export function decode(str: string): Uint8Array;
  const bs58: {
    encode: (data: Uint8Array) => string;
    decode: (str: string) => Uint8Array;
  };
  export default bs58;
}
