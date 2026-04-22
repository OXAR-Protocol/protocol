"use client";

export function CertFrame() {
  return (
    <>
      {/* Guilloché — radial fine-line pattern at 3% opacity */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.04 }}
      >
        <defs>
          <pattern id="guilloche" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="60" cy="60" r="56" fill="none" stroke="white" strokeWidth="0.4" />
            <circle cx="60" cy="60" r="44" fill="none" stroke="white" strokeWidth="0.4" />
            <circle cx="60" cy="60" r="32" fill="none" stroke="white" strokeWidth="0.4" />
            <circle cx="60" cy="60" r="20" fill="none" stroke="white" strokeWidth="0.4" />
            <circle cx="60" cy="60" r="8" fill="none" stroke="white" strokeWidth="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#guilloche)" />
      </svg>

      {/* Double engraved border */}
      <div className="absolute inset-0 border border-white/15 rounded-[8px] pointer-events-none" />
      <div className="absolute inset-[6px] border border-white/[0.08] rounded-[5px] pointer-events-none" />

      {/* Corner ticks */}
      {[
        "top-3 left-3",
        "top-3 right-3 rotate-90",
        "bottom-3 left-3 -rotate-90",
        "bottom-3 right-3 rotate-180",
      ].map((pos) => (
        <svg
          key={pos}
          aria-hidden
          className={`absolute ${pos} w-4 h-4 text-white/30 pointer-events-none`}
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M0 0 H10 M0 0 V10 M2 2 H6 M2 2 V6" stroke="currentColor" strokeWidth="0.8" />
        </svg>
      ))}
    </>
  );
}
