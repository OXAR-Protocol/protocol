export interface PaymentMethod {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly network: string;
  readonly enabled: boolean;
  readonly color: string;
  readonly rgb: string;
}

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  {
    id: "USDC",
    symbol: "USDC",
    name: "USD Coin",
    network: "Solana",
    enabled: true,
    color: "#ffffff",
    rgb: "255,255,255",
  },
  {
    id: "USDT",
    symbol: "USDT",
    name: "Tether",
    network: "Solana",
    enabled: false,
    color: "rgba(38,184,123,1)",
    rgb: "38,184,123",
  },
  {
    id: "SOL",
    symbol: "SOL",
    name: "Solana",
    network: "Solana",
    enabled: false,
    color: "rgba(160,120,240,1)",
    rgb: "160,120,240",
  },
  {
    id: "FIAT",
    symbol: "$",
    name: "Bank / Card",
    network: "Fiat on-ramp",
    enabled: false,
    color: "rgba(200,200,200,1)",
    rgb: "200,200,200",
  },
];

export function getPaymentMethod(id: string): PaymentMethod | undefined {
  return PAYMENT_METHODS.find((m) => m.id === id);
}

export const DEFAULT_PAYMENT_METHOD_ID = "USDC";
