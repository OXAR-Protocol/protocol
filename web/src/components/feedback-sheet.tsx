"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Loader2, Send } from "lucide-react";

import type { FeedbackKind } from "@oxar/sdk";

import { useSolanaContext } from "@/providers/solana-provider";
import { useT } from "@/lib/i18n";

/** Where someone who'd rather just talk should go. */
const TELEGRAM_HANDLE = "eternaki";

/**
 * Tell us it's broken, or tell us what's missing.
 *
 * Two kinds, one form: a break needs the screen and the wallet to be
 * reproducible, a wish needs neither — but asking someone to pick a category is
 * cheaper than reading a hundred unsorted messages. The context is gathered, not
 * typed; nobody reports their own build number.
 */
export function FeedbackSheet({ onClose }: { onClose: () => void }) {
  const { t, locale } = useT();
  const { walletAddress } = useSolanaContext();

  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          message,
          contact,
          context: {
            wallet: walletAddress?.toBase58(),
            route: typeof window === "undefined" ? undefined : window.location.pathname,
            language: locale,
          },
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? t("feedback.errFailed"));
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("feedback.errFailed"));
    } finally {
      setSending(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-no-pull
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] rounded-[12px] border border-black/15 bg-white p-6 md:p-7"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] lowercase tracking-[0.2em] text-black/40">
              {t("feedback.label")}
            </p>
            <h2 className="mt-1 text-xl text-black">{t("feedback.title")}</h2>
          </div>
          <button onClick={onClose} className="text-black/45 transition hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {sent ? (
          <div className="py-6 text-center">
            <p className="text-lg text-black">{t("feedback.thanks")}</p>
            <p className="mt-1 text-[11px] text-black/45">{t("feedback.thanksHint")}</p>
            <button
              onClick={onClose}
              className="mt-5 rounded-full border border-black/15 px-4 py-2 text-xs lowercase tracking-wide text-black/60 transition hover:border-black/40 hover:text-black"
            >
              {t("common.close")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              {(["bug", "idea"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex-1 rounded-full border px-3 py-2 text-xs lowercase tracking-wide transition ${
                    kind === k
                      ? "border-black bg-black text-white"
                      : "border-black/15 text-black/55 hover:border-black/40 hover:text-black"
                  }`}
                >
                  {t(k === "bug" ? "feedback.kindBug" : "feedback.kindIdea")}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder={t(kind === "bug" ? "feedback.placeholderBug" : "feedback.placeholderIdea")}
              className="mt-3 w-full resize-none rounded-[10px] border border-black/10 p-3 text-sm text-black outline-none transition placeholder:text-black/30 focus:border-black/30"
            />

            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={120}
              placeholder={t("feedback.contactPlaceholder")}
              className="mt-2 w-full rounded-[10px] border border-black/10 px-3 py-2.5 text-sm text-black outline-none transition placeholder:text-black/30 focus:border-black/30"
            />

            {error && <p className="mt-3 text-[11px] text-red-600">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={!message.trim() || sending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-sm lowercase tracking-wide text-white transition disabled:opacity-40"
            >
              {sending ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <Send size={14} strokeWidth={1.5} />
              )}
              {t("feedback.send")}
            </button>

            {/* Some people would rather just talk. Making them fill a form first
                is how you never hear from them. */}
            <p className="mt-4 text-center text-[11px] text-black/45">
              {t("feedback.orTelegram")}{" "}
              <a
                href={`https://t.me/${TELEGRAM_HANDLE}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#3c05c7] hover:underline"
              >
                @{TELEGRAM_HANDLE}
              </a>
            </p>
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
