import Link from "next/link";
import { dmSans } from "./fonts";

/**
 * Shared chrome for the long-form pages (terms / press kit / investors) in the
 * editorial landing style: white canvas, DM Sans, bracket eyebrow + big head.
 */
export function DocPage({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main
      className={`${dmSans.variable} ${dmSans.className} min-h-screen bg-white px-[clamp(24px,5.5vw,80px)] pb-[clamp(80px,10vw,140px)] pt-[clamp(48px,6vw,80px)] text-black`}
    >
      <div className="mx-auto max-w-[860px]">
        <Link
          href="/"
          className="lowercase text-[14px] text-black/40 transition-colors hover:text-black"
        >
          ← back
        </Link>

        <p className="mt-[clamp(40px,6vw,80px)] lowercase text-[clamp(16px,1.4vw,22px)] text-black/45">
          [ {label} ]
        </p>
        <h1 className="mt-3 lowercase text-[clamp(34px,6vw,72px)] leading-[1.02] tracking-[-0.05em]">
          {title}
        </h1>

        <div className="mt-[clamp(40px,5vw,72px)] space-y-10 text-[clamp(15px,1.15vw,17px)] leading-relaxed text-black/60 [&_a]:text-[#3c05c7] [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-2 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-black/70 [&_em]:italic [&_h2]:mb-3 [&_h2]:mt-0 [&_h2]:text-[clamp(18px,1.7vw,24px)] [&_h2]:font-medium [&_h2]:tracking-[-0.02em] [&_h2]:text-black [&_strong]:font-medium [&_strong]:text-black">
          {children}
        </div>
      </div>
    </main>
  );
}
