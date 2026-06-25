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
  const dim = { width: size, height: size, minWidth: size };

  if (!src || failed) {
    return (
      <span
        style={dim}
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-black/[0.06] font-medium text-black/55 ${className}`}
      >
        <span style={{ fontSize: Math.round(size * 0.34) }}>{initials}</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={dim}
      className={`shrink-0 rounded-full bg-white object-contain ring-1 ring-black/10 ${className}`}
    />
  );
}
