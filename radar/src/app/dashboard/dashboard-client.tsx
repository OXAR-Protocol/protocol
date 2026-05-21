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
    return (
      <p className="font-mono text-sm uppercase tracking-[0.15em] text-white/40">Loading…</p>
    );
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => login()}
        className="inline-flex items-center gap-2 rounded-[5px] bg-white px-6 py-3 font-mono text-sm uppercase tracking-wide text-surface-0 transition hover:bg-white/90"
      >
        Sign in →
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-[5px] border border-white/10 bg-surface-1 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-xs text-white/60">
            {user?.email?.address ?? user?.wallet?.address ?? user?.id}
          </span>
        </div>
        <button
          type="button"
          onClick={() => logout()}
          className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/40 transition hover:text-white"
        >
          Sign out
        </button>
      </div>

      {newKey && (
        <div className="rounded-[5px] border border-accent/40 bg-accent/5 p-4 shadow-[0_0_40px_rgba(139,92,246,0.06)]">
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-accent">
            New API key · copy it now
          </div>
          <code className="mt-3 block break-all rounded border border-white/10 bg-surface-0 px-3 py-2 font-mono text-sm text-white">
            {newKey}
          </code>
          <p className="mt-3 font-mono text-xs leading-relaxed text-white/50">
            Shown once. After you leave this page it cannot be recovered — only
            rotated.
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-[5px] border border-red-500/30 bg-red-500/5 px-4 py-3 font-mono text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void createKey()}
        className="inline-flex items-center gap-2 rounded-[5px] border border-white/15 bg-surface-1 px-4 py-2.5 font-mono text-xs uppercase tracking-[0.15em] text-white transition hover:border-white/30"
      >
        + Mint free key
      </button>

      {loading ? (
        <p className="font-mono text-sm uppercase tracking-[0.15em] text-white/40">
          Loading keys…
        </p>
      ) : keys.length === 0 ? (
        <div className="rounded-[5px] border border-dashed border-white/15 bg-surface-1 p-6">
          <p className="font-mono text-sm leading-relaxed text-white/50">
            No active keys yet. Mint one above to start hitting{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-white">/api/v1/*</code>.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[5px] border border-white/10 bg-surface-1">
          <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/10 bg-surface-0 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            <span>Key · tier · limit</span>
            <span>Action</span>
          </div>
          {keys.map((k, i) => (
            <div
              key={k.id}
              className={`flex items-center justify-between px-4 py-3 ${
                i !== keys.length - 1 ? "border-b border-white/10" : ""
              }`}
            >
              <div>
                <div className="text-sm text-white">{k.name ?? "(unnamed)"}</div>
                <div className="mt-1 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-white/40">
                  <code className="text-white/60">{k.keyPrefix}…</code>
                  <span className="text-white/20">·</span>
                  <span className="text-accent">{k.tier}</span>
                  <span className="text-white/20">·</span>
                  <span>{k.rateLimitPerMin}/min</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void revokeKey(k.id)}
                className="font-mono text-[11px] uppercase tracking-[0.15em] text-loss/80 transition hover:text-loss"
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
