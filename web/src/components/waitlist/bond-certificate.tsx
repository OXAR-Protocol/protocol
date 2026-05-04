"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CertFrame } from "./cert-frame";
import { CertEmail } from "./cert-email";
import { BondCenterpiece } from "./bond-centerpiece";
import { WaxSeal } from "./wax-seal";
import { downloadCertificatePng } from "./download-cert";
import { useWaitlist, formatSerial } from "@/hooks/use-waitlist";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function today(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function BondCertificate() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const { status, serial, savedEmail, existed, error, submit, reset } = useWaitlist();

  // When hook restores from localStorage, mirror the email into the field.
  useEffect(() => {
    if (savedEmail && !email) setEmail(savedEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedEmail]);

  const emailValid = EMAIL_RE.test(email);
  const sealed = status === "sealed";
  const submitting = status === "submitting";
  const disabled = sealed || submitting;

  const emailInvalidShown = emailTouched && email.length > 0 && !emailValid;
  const serialText = useMemo(
    () => (serial != null ? formatSerial(serial) : "—————"),
    [serial],
  );

  const handleSeal = async () => {
    setEmailTouched(true);
    if (!emailValid) return;
    await submit(email, honeypot);
  };

  const handleDownload = async () => {
    if (!certRef.current || serial == null) return;
    try {
      setDownloading(true);
      await downloadCertificatePng(certRef.current, formatSerial(serial));
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    reset();
    setEmail("");
    setHoneypot("");
    setEmailTouched(false);
  };

  return (
    <div className="w-full max-w-[640px] mx-auto">
      <motion.div
        ref={certRef}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        animate={sealed ? { rotate: [0, 0.6, -0.4, 0] } : undefined}
        className="relative bg-surface-0 overflow-hidden rounded-[8px] px-8 py-10 md:px-12 md:py-14 isolate"
        style={{
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.04), 0 30px 80px -40px rgba(114,162,240,0.25)",
        }}
      >
        <CertFrame />

        <div className="relative z-10 flex flex-col items-center gap-6 md:gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/40">
              Bond of Early Access
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">
              OXAR Protocol · Series 01
            </span>
          </div>

          <CertEmail
            value={email}
            onChange={(v) => {
              setEmail(v);
              if (!emailTouched) setEmailTouched(true);
            }}
            disabled={disabled}
            invalid={emailInvalidShown}
          />

          <BondCenterpiece />

          <WaxSeal sealed={sealed} />

          <div className="flex items-center justify-between w-full max-w-[420px] pt-2">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                Issued
              </span>
              <span className="font-mono text-[10px] text-white/55 mt-0.5">
                Devnet · {today()}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
                Nº
              </span>
              <motion.span
                key={serialText}
                initial={sealed && existed === false ? { opacity: 0, scale: 1.2, filter: "blur(6px)" } : false}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, delay: sealed && !existed ? 0.5 : 0 }}
                className="font-mono text-[11px] tracking-[0.18em] text-white/80 mt-0.5"
              >
                {serialText}
              </motion.span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Honeypot — hidden from users, bots fill it. Positioned off-screen so it's not tab-focusable by real users. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{
          position: "absolute",
          left: "-9999px",
          width: 1,
          height: 1,
          opacity: 0,
        }}
      />

      <div className="mt-6 flex flex-col items-center gap-3">
        {!sealed && (
          <button
            onClick={handleSeal}
            disabled={submitting || !emailValid}
            className="group relative inline-flex items-center justify-center px-10 py-4 rounded-[4px] font-mono text-[11px] uppercase tracking-[0.25em] bg-white text-surface-0 hover:bg-white/90 disabled:bg-white/[0.06] disabled:text-white/30 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? "Transmitting…" : "Seal Certificate"}
          </button>
        )}

        {emailInvalidShown && !sealed && (
          <span className="font-mono text-[10px] text-[#D4313C]">
            Invalid email format
          </span>
        )}

        {error && !sealed && (
          <span className="font-mono text-[10px] text-[#D4313C]">{error}</span>
        )}

        {sealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="flex flex-col items-center gap-5"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-white/70">
                {existed ? "Already on the list" : "Allocation reserved"}
              </span>
              <span className="font-mono text-[10px] text-white/40">
                Position {serialText} · keep this certificate
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-center">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[4px] font-mono text-[10px] uppercase tracking-[0.2em] bg-white text-surface-0 hover:bg-white/90 disabled:bg-white/[0.2] disabled:cursor-not-allowed transition-all"
              >
                <DownloadIcon />
                {downloading ? "Rendering…" : "Download certificate"}
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[4px] font-mono text-[10px] uppercase tracking-[0.2em] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/90 transition-all"
              >
                Use different email
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M6 1v7m0 0L3 5m3 3l3-3M2 10h8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="square"
      />
    </svg>
  );
}
