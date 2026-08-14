"use client";

interface Props {
  /** How many entries the next page would reveal — shown so the button is
   *  informative ("show 12 more"), not a bare, uninformative "more". */
  remaining: number;
  label: string;
  onClick: () => void;
}

/** "Load more" control for a paginated catalog section. Renders nothing once
 *  there is nothing left to reveal. */
export function LoadMoreButton({ remaining, label, onClick }: Props) {
  if (remaining <= 0) return null;
  return (
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="rounded-full border border-ink/25 bg-paper px-5 py-2 text-[13px] lowercase tracking-wide text-ink/70 shadow-sm transition hover:border-ink hover:text-ink"
      >
        {label}
      </button>
    </div>
  );
}
