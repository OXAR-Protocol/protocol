import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";

const OPENAPI = {
  openapi: "3.1.0",
  info: {
    title: "OXAR Radar API",
    description:
      "Risk monitoring, wallet analytics, and protocol intelligence for the Real World Assets market across Ethereum and Solana. Educational analytics only — not investment advice.",
    version: "0.1.0",
    contact: { name: "OXAR", url: "https://oxar.app" },
  },
  servers: [{ url: "https://radar.oxar.app/api/v1", description: "Production" }],
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/protocols": {
      get: {
        summary: "List supported RWA protocols",
        responses: {
          "200": {
            description: "Active protocols and their metadata.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProtocolList" } } },
          },
          "401": { description: "Missing or invalid API key" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/protocols/{slug}": {
      get: {
        summary: "Single protocol with its latest snapshot",
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string", example: "ondo-usdy" },
          },
        ],
        responses: {
          "200": {
            description: "Protocol detail with latest snapshot inline.",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProtocolDetail" } } },
          },
          "404": { description: "Unknown slug" },
          "401": { description: "Missing or invalid API key" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "rdr_live_<base64url>",
        description: "Pass your API key as `Authorization: Bearer rdr_live_...`.",
      },
    },
    schemas: {
      Issuer: {
        type: "object",
        properties: {
          name: { type: "string", example: "Ondo Finance" },
          jurisdiction: { type: ["string", "null"], example: "BVI" },
        },
      },
      Snapshot: {
        type: "object",
        properties: {
          capturedAt: { type: "string", format: "date-time" },
          nav: { type: "number", example: 1.10 },
          tvlUsd: { type: ["number", "null"], example: 720245696 },
          holderCount: { type: ["integer", "null"] },
          apyBps: { type: ["integer", "null"], example: 480 },
          top10ConcentrationPct: { type: ["number", "null"] },
          redemptionQueueUsd: { type: ["number", "null"] },
        },
      },
      Protocol: {
        type: "object",
        properties: {
          slug: { type: "string", example: "ondo-usdy" },
          name: { type: "string", example: "Ondo USDY" },
          chain: { type: "string", enum: ["ethereum", "solana"] },
          category: { type: "string", example: "us-treasuries" },
          contractAddress: { type: "string" },
          decimals: { type: "integer" },
          description: { type: "string" },
          issuer: { $ref: "#/components/schemas/Issuer" },
          websiteUrl: { type: "string", format: "uri" },
          estimatedApyBps: { type: "integer", example: 480 },
        },
      },
      ProtocolList: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Protocol" } },
        },
      },
      ProtocolDetail: {
        allOf: [
          { $ref: "#/components/schemas/Protocol" },
          {
            type: "object",
            properties: {
              snapshot: { oneOf: [{ $ref: "#/components/schemas/Snapshot" }, { type: "null" }] },
            },
          },
        ],
      },
    },
  },
} as const;

export function GET(): NextResponse {
  return NextResponse.json(OPENAPI, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
