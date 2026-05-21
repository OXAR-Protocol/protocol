import "server-only";

import { PrivyClient } from "@privy-io/server-auth";

import { getServerEnv } from "./env";
import { PRIVY_APP_ID } from "./privy";

let cached: PrivyClient | undefined;

export class PrivyAuthError extends Error {
  constructor(public readonly code: "missing_token" | "invalid_token" | "server_not_configured") {
    super(code);
  }
}

function getClient(): PrivyClient {
  if (cached) return cached;
  const env = getServerEnv();
  if (!env.privyAppSecret) {
    throw new PrivyAuthError("server_not_configured");
  }
  cached = new PrivyClient(PRIVY_APP_ID, env.privyAppSecret);
  return cached;
}

/**
 * Verify a Privy access token from an Authorization header and return the user DID.
 *
 * Throws PrivyAuthError on missing / invalid token, which callers translate to
 * 401 responses.
 */
export async function verifyPrivyToken(authHeader: string | null): Promise<string> {
  const match = authHeader?.match(/^Bearer\s+(\S+)$/i);
  if (!match) throw new PrivyAuthError("missing_token");

  try {
    const client = getClient();
    const verified = await client.verifyAuthToken(match[1]!);
    return verified.userId;
  } catch (err) {
    if (err instanceof PrivyAuthError) throw err;
    throw new PrivyAuthError("invalid_token");
  }
}
