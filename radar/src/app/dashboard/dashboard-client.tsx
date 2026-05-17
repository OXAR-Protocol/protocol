"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useCallback, useEffect, useState } from "react";

interface KeyRecord {
  id: string;
  name: string | null;
  keyPrefix: string;
  tier: string;
  rateLimitPerMin: number;
  monthlyQuota: number;
  createdAt: string;
}

interface CreateResponse {
  apiKey: string;
  record: KeyRecord;
}

export function DashboardClient() {
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [newKey, setNewKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const token = await getAccessToken();
      const r = await fetch("/api/user/keys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as { data: KeyRecord[] };
      setKeys(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (ready && authenticated) void refresh();
  }, [ready, authenticated, refresh]);

  async function createKey() {
    setError(undefined);
    setNewKey(undefined);
    const token = await getAccessToken();
    const r = await fetch("/api/user/keys", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: `Key ${new Date().toISOString().slice(0, 10)}` }),
    });
    if (!r.ok) {
      setError(`Mint failed: HTTP ${r.status}`);
      return;
    }
    const data = (await r.json()) as CreateResponse;
    setNewKey(data.apiKey);
    void refresh();
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this key? Any client using it will start getting 401.")) return;
    const token = await getAccessToken();
    const r = await fetch(`/api/user/keys/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) {
      setError(`Revoke failed: HTTP ${r.status}`);
      return;
    }
    void refresh();
  }

  if (!ready) {
    return <p className="text-sm text-[var(--color-text-muted)]">Loading…</p>;
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => login()}
        className="rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-black hover:opacity-90"
      >
        Sign in
      </button>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[var(--color-surface-1)] px-4 py-3">
        <div className="font-mono text-xs text-[var(--color-text-muted)]">
          {user?.email?.address ?? user?.wallet?.address ?? user?.id}
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="text-xs text-[var(--color-text-muted)] hover:text-white"
        >
          Sign out
        </button>
      </div>

      {newKey && (
        <div className="rounded-lg border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 p-4">
          <div className="font-mono text-[11px] uppercase tracking-widest text-[var(--color-accent)]">
            New API key — copy it now
          </div>
          <code className="mt-2 block break-all font-mono text-sm">{newKey}</code>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Shown once. After you leave this page it cannot be recovered — only rotated.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void createKey()}
        className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
      >
        + Mint free key
      </button>

      {loading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading keys…</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">No active keys yet.</p>
      ) : (
        <div className="divide-y divide-white/5 rounded-lg border border-white/10 bg-[var(--color-surface-1)]">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="text-sm font-medium">{k.name ?? "(unnamed)"}</div>
                <div className="mt-0.5 font-mono text-xs text-[var(--color-text-muted)]">
                  {k.keyPrefix}… · {k.tier} · {k.rateLimitPerMin}/min
                </div>
              </div>
              <button
                type="button"
                onClick={() => void revokeKey(k.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
