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
    <div className="mt-3 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="rounded-full border border-black/15 px-4 py-1.5 text-[11px] lowercase tracking-wide text-black/55 transition hover:border-black/40 hover:text-black"
      >
        {label}
      </button>
    </div>
  );
}
