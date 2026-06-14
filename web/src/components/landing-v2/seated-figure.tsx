/** Stylised seated-person silhouette — the "il gioco degli assenti" motif. */
export function SeatedFigure({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 84" fill="currentColor" className={className} aria-hidden>
      <circle cx="30" cy="12" r="11" />
      <path d="M12 44c0-12 8-20 18-20s18 8 18 20v3H12z" />
      <rect x="12" y="48" width="36" height="13" rx="5" />
      <rect x="15" y="60" width="12" height="24" rx="5" />
      <rect x="33" y="60" width="12" height="24" rx="5" />
    </svg>
  );
}
