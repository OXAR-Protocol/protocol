import { DISPLAY } from "./fonts";

const ITEMS = [
  { label: "problem", href: "#problem" },
  { label: "how it works", href: "#how-it-works" },
  { label: "speeds", href: "#speeds" },
  { label: "roadmap", href: "#roadmap" },
  { label: "investors", href: "/investors" },
];

/** Editorial top bar (Figma): purple wordmark left, vertical centred menu,
 *  CTA right. Sits at the top of the content — "the problem" is the first
 *  section, the hero gate is gone by the time you see this. */
export function Nav() {
  return (
    <nav className="bg-white text-black">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start px-[clamp(24px,5.5vw,80px)] pt-[clamp(28px,2.6vw,40px)] pb-[clamp(40px,6vw,88px)]">
        <a
          href="#problem"
          className="text-[24px] font-bold leading-none text-[#3c05c7]"
          style={{ fontFamily: DISPLAY }}
        >
          OXAR.
        </a>

        <ul className="flex flex-col items-center gap-[8px] text-[clamp(18px,1.65vw,24px)] leading-tight">
          {ITEMS.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="lowercase text-black/80 transition-colors hover:text-[#3c05c7]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <a
            href="#waitlist"
            className="lowercase text-[clamp(16px,1.5vw,22px)] text-black transition-colors hover:text-[#3c05c7]"
          >
            get early access
          </a>
        </div>
      </div>
    </nav>
  );
}
