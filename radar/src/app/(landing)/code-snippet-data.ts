export type Lang = "curl" | "javascript" | "python";

export interface ApiEndpoint {
  id: string;
  method: "GET" | "POST";
  path: string;
  label: string;
  description: string;
  samples: Record<Lang, string>;
  response: string;
  /** Pretend network latency for the playful "Run" button, in ms. */
  fakeLatencyMs: number;
}

const BASE = "https://radar.oxar.app/api/v1";

export const LANG_LABELS: Record<Lang, string> = {
  curl: "cURL",
  javascript: "JavaScript",
  python: "Python",
};

export const ENDPOINTS: readonly ApiEndpoint[] = [
  {
    id: "list",
    method: "GET",
    path: "/protocols",
    label: "List all protocols",
    description: "Every tracked RWA issuer with its metadata.",
    samples: {
      curl: `curl ${BASE}/protocols \\
  -H "Authorization: Bearer rdr_live_..."`,
      javascript: `const r = await fetch(
  "${BASE}/protocols",
  { headers: { Authorization: "Bearer rdr_live_..." } }
);
const { data } = await r.json();`,
      python: `import requests

r = requests.get(
    "${BASE}/protocols",
    headers={"Authorization": "Bearer rdr_live_..."},
)
data = r.json()["data"]`,
    },
    response: `{
  "data": [
    {
      "slug": "buidl",
      "name": "BlackRock BUIDL",
      "chain": "ethereum",
      "estimatedApyBps": 460
    },
    {
      "slug": "ondo-usdy",
      "name": "Ondo USDY",
      "chain": "ethereum",
      "estimatedApyBps": 480
    },
    {
      "slug": "maple-finance",
      "name": "Maple Finance",
      "chain": "ethereum",
      "estimatedApyBps": 1050
    }
  ]
}`,
    fakeLatencyMs: 47,
  },
  {
    id: "usdy",
    method: "GET",
    path: "/protocols/ondo-usdy",
    label: "Single protocol snapshot",
    description: "Ondo USDY with its latest 5-minute snapshot inline.",
    samples: {
      curl: `curl ${BASE}/protocols/ondo-usdy \\
  -H "Authorization: Bearer rdr_live_..."`,
      javascript: `const r = await fetch(
  "${BASE}/protocols/ondo-usdy",
  { headers: { Authorization: "Bearer rdr_live_..." } }
);
const protocol = await r.json();`,
      python: `import requests

r = requests.get(
    "${BASE}/protocols/ondo-usdy",
    headers={"Authorization": "Bearer rdr_live_..."},
)
protocol = r.json()`,
    },
    response: `{
  "slug": "ondo-usdy",
  "name": "Ondo USDY",
  "chain": "ethereum",
  "contractAddress": "0x96F6eF951840721AdBF46Ac996b59E0235CB985C",
  "estimatedApyBps": 480,
  "snapshot": {
    "capturedAt": "2026-05-19T07:30:04.264Z",
    "nav": 1.10,
    "tvlUsd": 720245696,
    "apyBps": 480
  }
}`,
    fakeLatencyMs: 63,
  },
  {
    id: "buidl",
    method: "GET",
    path: "/protocols/buidl",
    label: "BlackRock BUIDL",
    description: "$2.1B fund, one of the most-traded tokenised treasuries.",
    samples: {
      curl: `curl ${BASE}/protocols/buidl \\
  -H "Authorization: Bearer rdr_live_..."`,
      javascript: `const r = await fetch(
  "${BASE}/protocols/buidl",
  { headers: { Authorization: "Bearer rdr_live_..." } }
);
const protocol = await r.json();`,
      python: `import requests

r = requests.get(
    "${BASE}/protocols/buidl",
    headers={"Authorization": "Bearer rdr_live_..."},
)
protocol = r.json()`,
    },
    response: `{
  "slug": "buidl",
  "name": "BlackRock BUIDL",
  "chain": "ethereum",
  "issuer": { "name": "BlackRock", "jurisdiction": "USA" },
  "estimatedApyBps": 460,
  "snapshot": {
    "capturedAt": "2026-05-19T07:30:04.264Z",
    "nav": 1.0,
    "tvlUsd": 2104500000,
    "apyBps": 460
  }
}`,
    fakeLatencyMs: 58,
  },
  {
    id: "analyze",
    method: "POST",
    path: "/analyze/wallet",
    label: "Analyze a wallet",
    description: "Pass any 0x address — get back positions + risk score.",
    samples: {
      curl: `curl -X POST ${BASE}/analyze/wallet \\
  -H "Authorization: Bearer rdr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{ "address": "0xd8dA…6045", "chains": ["ethereum"] }'`,
      javascript: `const r = await fetch(
  "${BASE}/analyze/wallet",
  {
    method: "POST",
    headers: {
      Authorization: "Bearer rdr_live_...",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address: "0xd8dA…6045",
      chains: ["ethereum"],
    }),
  }
);
const analysis = await r.json();`,
      python: `import requests

r = requests.post(
    "${BASE}/analyze/wallet",
    headers={
        "Authorization": "Bearer rdr_live_...",
        "Content-Type": "application/json",
    },
    json={"address": "0xd8dA…6045", "chains": ["ethereum"]},
)
analysis = r.json()`,
    },
    response: `{
  "totalValueUsd": 153400,
  "weightedApyBps": 612,
  "positions": [
    { "protocolSlug": "ondo-usdy", "valueUsd": 99000, "share": 0.645 },
    { "protocolSlug": "maple-finance", "valueUsd": 54400, "share": 0.355 }
  ],
  "riskScore": {
    "overall": 6,
    "concentrationRisk": "medium"
  }
}`,
    fakeLatencyMs: 432,
  },
];
