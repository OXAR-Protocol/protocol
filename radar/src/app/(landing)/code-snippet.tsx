"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";

import { AnimatedSection } from "@/components/animated-section";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";

import { ENDPOINTS, LANG_LABELS, type ApiEndpoint, type Lang } from "./code-snippet-data";

type RunStatus = "idle" | "running" | "done";

export function CodeSnippet() {
  const [endpoint, setEndpoint] = useState<ApiEndpoint>(ENDPOINTS[0]!);
  const [lang, setLang] = useState<Lang>("curl");
  const [run, setRun] = useState<RunStatus>("idle");
  const [shownResponse, setShownResponse] = useState<ApiEndpoint | null>(null);

  const selectEndpoint = useCallback((e: ApiEndpoint) => {
    setEndpoint(e);
    setRun("idle");
    setShownResponse(null);
  }, []);

  const execute = useCallback(() => {
    setRun("running");
    setShownResponse(null);
    const ms = endpoint.fakeLatencyMs + Math.random() * 60;
    setTimeout(() => {
      setShownResponse(endpoint);
      setRun("done");
    }, ms);
  }, [endpoint]);

  return (
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <AnimatedSection>
            <SectionLabel>Developer Experience</SectionLabel>
            <div className="mt-4">
              <SectionTitle>
                Pick an endpoint.
                <br />
                <span className="text-white/50">Run it.</span>
              </SectionTitle>
            </div>
            <p className="mt-6 max-w-md font-mono text-base leading-relaxed text-white/55 [&>strong]:font-normal [&>strong]:text-white">
              <strong>JSON in, JSON out.</strong> One bearer token, OpenAPI spec
              for code generation, no SDK lock-in.
            </p>

            <div className="mt-8 space-y-2">
              {ENDPOINTS.map((e) => (
                <EndpointButton
                  key={e.id}
                  endpoint={e}
                  active={e.id === endpoint.id}
                  onSelect={selectEndpoint}
                />
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="space-y-3">
              <CodeBlock title="Request" tabs={<LangTabs current={lang} onChange={setLang} />}>
                <pre className="overflow-x-auto whitespace-pre font-mono text-[12px] leading-relaxed text-white">
                  {endpoint.samples[lang]}
                </pre>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <RunStatusPill status={run} latencyMs={shownResponse?.fakeLatencyMs} />
                  <button
                    type="button"
                    onClick={execute}
                    disabled={run === "running"}
                    className="rounded bg-white px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-surface-0 transition hover:bg-white/90 disabled:opacity-60"
                  >
                    {run === "running" ? "Running…" : run === "done" ? "Run again" : "▶ Run"}
                  </button>
                </div>
              </CodeBlock>

              <CodeBlock title="Response">
                <AnimatePresence mode="wait">
                  {shownResponse ? (
                    <motion.pre
                      key={shownResponse.id + lang}
                      initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }}
                      className="overflow-x-auto whitespace-pre font-mono text-[12px] leading-relaxed text-white"
                    >
                      <Highlight json={shownResponse.response} />
                    </motion.pre>
                  ) : (
                    <p className="font-mono text-[12px] text-white/35">
                      {run === "running" ? "…awaiting response" : "Run the request to see the response."}
                    </p>
                  )}
                </AnimatePresence>
              </CodeBlock>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

interface EndpointButtonProps {
  endpoint: ApiEndpoint;
  active: boolean;
  onSelect: (e: ApiEndpoint) => void;
}

function EndpointButton({ endpoint, active, onSelect }: EndpointButtonProps) {
  return (
    <button type="button" onClick={() => onSelect(endpoint)}
      className={`w-full rounded-[5px] border px-4 py-3 text-left transition ${
        active ? "border-accent/40 bg-accent/5" : "border-white/10 bg-surface-1 hover:border-white/25"
      }`}>
      <div className="flex items-center gap-3">
        <MethodBadge method={endpoint.method} />
        <code className="font-mono text-[12px] text-white">{endpoint.path}</code>
      </div>
      <div className={`mt-1.5 font-mono text-[11px] ${active ? "text-white/70" : "text-white/40"}`}>
        {endpoint.description}
      </div>
    </button>
  );
}

function LangTabs({ current, onChange }: { current: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-1">
      {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.15em] transition ${
            current === l ? "bg-white text-surface-0" : "text-white/50 hover:text-white"
          }`}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  const isPost = method === "POST";
  return (
    <span
      className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] ${
        isPost ? "bg-accent/20 text-accent" : "bg-white/10 text-white/70"
      }`}
    >
      {method}
    </span>
  );
}

function RunStatusPill({ status, latencyMs }: { status: RunStatus; latencyMs?: number }) {
  if (status === "idle") {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        Ready
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
        Connecting…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/70">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      200 · {latencyMs}ms
    </span>
  );
}

function CodeBlock({ title, tabs, children }: { title: string; tabs?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[5px] border border-white/10 bg-surface-0">
      <div className="flex items-center justify-between border-b border-white/10 bg-surface-1 px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">{title}</span>
        {tabs ?? <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Highlight({ json }: { json: string }) {
  const parts = json.split(/(\".*?\"\s*:|\".*?\"|\d+\.?\d*|null|true|false)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\".*\"\s*:$/.test(part)) return <span key={i} className="text-accent">{part}</span>;
        if (/^\".*\"$/.test(part)) return <span key={i} className="text-white/75">{part}</span>;
        if (/^\d/.test(part)) return <span key={i} className="text-white">{part}</span>;
        if (/^(null|true|false)$/.test(part)) return <span key={i} className="text-white/50">{part}</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
