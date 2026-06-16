import { DocPage } from "@/components/landing-v2/doc-page";

export const metadata = {
  title: "OXAR — Press Kit",
};

const LOGOS = [
  { name: "White", file: "white.svg", light: false },
  { name: "Black", file: "black.svg", light: true },
  { name: "Blue", file: "blue.svg", light: false },
  { name: "Purple", file: "purple.svg", light: false },
  { name: "Pink", file: "pink.svg", light: false },
  { name: "Breeze", file: "logo_breeze.svg", light: false },
];

const COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Accent", hex: "#3C05C7" },
  { name: "Profit", hex: "#22C55E" },
  { name: "Loss", hex: "#EF4444" },
];

export default function KitPage() {
  return (
    <DocPage label="brand" title="press kit">
      <section>
        <h2>About OXAR</h2>
        <p>
          OXAR is a <strong>savings-and-investing app for the crypto-paid generation</strong>. Where does your money sleep? Wake it up. Earn yield (5-12% APY) from curated sources, or buy tokenized stocks and gold to hold — withdraw anytime, never custodial. Wallet connect today, Apple Pay on the way.
        </p>
      </section>

      <section>
        <h2>Tagline</h2>
        <p className="text-black">Where does your money sleep?</p>
        <p className="mt-2">Sub: <em>Wake it up. Earn yield. Own real assets.</em></p>
      </section>

      <section>
        <h2>Key facts</h2>
        <ul className="mt-4 list-none space-y-3">
          <li>→ <strong>Founded:</strong> 2026</li>
          <li>→ <strong>Category:</strong> Consumer finance / DeFi / RWA</li>
          <li>→ <strong>Stack:</strong> Solana smart contracts, cross-chain via Delora, fiat via Ramp Network</li>
          <li>→ <strong>Custody model:</strong> Non-custodial (user holds keys)</li>
          <li>→ <strong>Auth:</strong> Privy (email + wallet + embedded Solana wallet)</li>
          <li>→ <strong>Founders:</strong> Daniel Lohachov + Anna Tarapatska</li>
        </ul>
      </section>

      <section>
        <h2>Logo</h2>
        <p className="mb-6">
          The OXAR logo is available in multiple color variants. Use the white version on dark backgrounds and the black version on light backgrounds. Do not modify, rotate, or distort.
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="flex flex-col items-center gap-4 rounded-[10px] border border-black/10 p-6"
              style={{ backgroundColor: logo.light ? "#f2f2f2" : "#171717" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/${logo.file}`} alt={`OXAR ${logo.name}`} className="h-14 w-auto" />
              <span className={`text-[12px] ${logo.light ? "text-black/45" : "text-white/50"}`}>{logo.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Brand colors</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {COLORS.map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-[6px] border border-black/15" style={{ backgroundColor: c.hex }} />
              <div>
                <div className="text-[12px] text-black">{c.name}</div>
                <div className="text-[12px] text-black/40">{c.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Typography</h2>
        <p>
          OXAR uses <strong>DM Sans</strong> across the board — display headlines, body copy, and the <strong>OXAR.</strong> wordmark (DM Sans Bold). <em>Italic</em> cuts carry emphasis; headlines run tight (negative tracking) and mostly lowercase.
        </p>
      </section>

      <section>
        <h2>Voice</h2>
        <p>
          Curious not corporate. Playful but precise. Slightly accusatory ("your money is napping!"). Warm not professional. Anti finance-jargon.
        </p>
        <p className="mt-4">Examples:</p>
        <ul className="mt-3 list-none space-y-2">
          <li>→ Avoid: "Auto-invest your salary" → Use: "Tell your money where to sleep"</li>
          <li>→ Avoid: "Buy tokenized securities" → Use: "Own a slice of Apple"</li>
          <li>→ Avoid: "Withdraw funds" → Use: "Wake some money up"</li>
        </ul>
      </section>

      <section>
        <h2>Usage guidelines</h2>
        <ul className="mt-4 list-none space-y-3">
          <li>→ Do not modify or distort the logo</li>
          <li>→ Maintain clear space around the logo equal to the height of the logo mark</li>
          <li>→ Do not place the logo on busy backgrounds without sufficient contrast</li>
          <li>→ Do not use the logo to imply endorsement without written permission</li>
        </ul>
      </section>

      <section>
        <h2>Press contact</h2>
        <p><a href="mailto:support@oxar.app">support@oxar.app</a> — general</p>
        <p className="mt-3">
          Telegram: <a href="https://t.me/eternaki">@eternaki</a> · <a href="https://t.me/tarapatska">@tarapatska</a>
        </p>
      </section>
    </DocPage>
  );
}
