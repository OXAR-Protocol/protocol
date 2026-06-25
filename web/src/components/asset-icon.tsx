"use client";

import { useEffect, useState } from "react";

/** Round asset logo with a graceful monogram fallback (used when no logo URL is
 *  given or the image 404s — e.g. gold, yield sources, or a missing ticker). */
export function AssetIcon({
  src,
  label,
  size = 36,
  className = "",
}: {
  src?: string;
  label: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const initials =
    label.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || "•";
  const radius = Math.max(8, Math.round(size * 0.26));
  const dim = { width: size, height: size, minWidth: size, borderRadius: radius };
  const tile =
    "inline-flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-black/10";

  if (!src || failed) {
    return (
      <span style={dim} className={`${tile} bg-black/[0.04] font-medium text-black/55 ${className}`}>
        <span style={{ fontSize: Math.round(size * 0.36) }}>{initials}</span>
      </span>
    );
  }

  return (
    <span style={dim} className={`${tile} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-contain p-[14%]"
      />
    </span>
  );
}
