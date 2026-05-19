import type { Metadata } from "next";

import { CopyButton } from "../_components/copy-button";
import { Callout, DocPage, DocSection } from "../_components/prose";

import { AI_PROMPTS } from "./prompts-data";

export const metadata: Metadata = {
  title: "AI prompts — OXAR Radar",
  description:
    "Drop-in prompts for Claude, Cursor, Codex, and Aider. Paste at the top of an agent thread and the agent immediately understands the Radar API.",
};

const TOC = [
  { id: "how-to-use", label: "How to use" },
  ...AI_PROMPTS.map((p) => ({ id: p.id, label: p.title })),
];

export default function AiPromptsPage() {
  return (
    <DocPage
      eyebrow="For developers"
      title="AI agent prompts"
      description="Paste any of these into Claude, Cursor, Codex, Aider, or any other coding agent. They include the full Radar context plus a specific task definition so the agent can ship without further setup."
      toc={TOC}
    >
      <DocSection id="how-to-use" title="How to use">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Mint a free API key in the dashboard and put it in your env.</li>
          <li>
            Open a fresh agent thread (Claude, Cursor, Codex — whichever you prefer).
          </li>
          <li>
            Click <em>Copy</em> on a recipe below, paste the entire block as your first
            message, and let the agent execute.
          </li>
        </ol>
        <Callout>
          The first recipe ("Agent handoff context") is the bare API context with no
          task attached — paste it once at the top of an agent thread when you want the
          model to know about Radar before you describe what to build.
        </Callout>
      </DocSection>

      {AI_PROMPTS.map((p) => (
        <DocSection key={p.id} id={p.id} title={p.title}>
          <p>{p.blurb}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
              Verified with
            </span>
            {p.agents.map((agent) => (
              <span
                key={agent}
                className="inline-flex items-center rounded border border-white/10 bg-surface-1 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white/60"
              >
                {agent}
              </span>
            ))}
          </div>
          <div className="rounded-[5px] border border-white/10 bg-surface-0">
            <div className="flex items-center justify-between border-b border-white/10 bg-surface-1 px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                Prompt
              </span>
              <CopyButton text={p.prompt} label="Copy prompt" />
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words p-4 font-mono text-[12px] leading-relaxed text-white">
              {p.prompt}
            </pre>
          </div>
        </DocSection>
      ))}
    </DocPage>
  );
}
