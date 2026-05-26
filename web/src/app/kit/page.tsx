import Link from 'next/link'

export const metadata = {
  title: 'OXAR — Press Kit',
}

export default function KitPage() {
  return (
    <main className="min-h-screen bg-surface-0 text-white px-6 py-32">
      <div className="max-w-[800px] mx-auto">
        <Link href="/" className="font-mono text-sm text-white/30 hover:text-white transition-colors mb-12 inline-block">
          ← Back
        </Link>

        <span className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-white/30 block mb-4">
          [ BRAND ]
        </span>
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-sans font-normal mb-8">
          Press Kit
        </h1>

        <div className="space-y-12 font-mono text-sm leading-relaxed text-white/30 [&_strong]:text-white [&_strong]:font-normal [&_h2]:text-white [&_h2]:font-sans [&_h2]:text-xl [&_h2]:font-normal [&_h2]:mb-4 [&_h2]:mt-0">
          <section>
            <h2>About OXAR</h2>
            <p>
              OXAR is a <strong>savings app for the crypto-paid generation</strong>. Where does your money sleep? Wake it up. Earn yield (5-12% APY) from curated RWA and DeFi sources, save together with friends on real goals, withdraw anytime — never custodial. Apple Pay or wallet connect, your choice.
            </p>
          </section>

          <section>
            <h2>Tagline</h2>
            <p className="text-white text-base">
              Where does your money sleep?
            </p>
            <p className="mt-2">
              Sub: <em>Wake it up. Earn yield. Save together.</em>
            </p>
          </section>

          <section>
            <h2>Key facts</h2>
            <ul className="list-none space-y-3 mt-4">
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { name: 'White', file: 'white.svg' },
                { name: 'Black', file: 'black.svg' },
                { name: 'Blue', file: 'blue.svg' },
                { name: 'Purple', file: 'purple.svg' },
                { name: 'Pink', file: 'pink.svg' },
                { name: 'Breeze', file: 'logo_breeze.svg' },
              ].map((logo) => (
                <div key={logo.name} className="p-6 rounded-[5px] border border-white/10 flex flex-col items-center gap-4">
                  <img src={`/images/${logo.file}`} alt={`OXAR ${logo.name}`} className="h-16 w-auto" />
                  <span className="text-white/50 text-xs">{logo.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Brand colors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                { name: 'Background', hex: '#000000', color: '#000000' },
                { name: 'Accent', hex: '#8B5CF6', color: '#8B5CF6' },
                { name: 'Profit', hex: '#22C55E', color: '#22C55E' },
                { name: 'Loss', hex: '#EF4444', color: '#EF4444' },
                { name: 'Text', hex: '#FFFFFF', color: '#ffffff' },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded border border-white/10" style={{ backgroundColor: c.color }} />
                  <div>
                    <div className="text-white text-xs">{c.name}</div>
                    <div className="text-white/30 text-xs">{c.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Typography</h2>
            <p>
              OXAR uses the <strong>Geist</strong> font family by Vercel. <strong>Geist Sans</strong> for headings and display text. <strong>Geist Mono</strong> for body text, labels, and code.
            </p>
          </section>

          <section>
            <h2>Voice</h2>
            <p>
              Curious not corporate. Playful but precise. Slightly accusatory ("your money is napping!"). Warm not professional. Anti finance-jargon.
            </p>
            <p className="mt-4">
              Examples:
            </p>
            <ul className="list-none space-y-2 mt-3">
              <li>→ Avoid: "Auto-invest your salary" → Use: "Tell your money where to sleep"</li>
              <li>→ Avoid: "Group savings vault" → Use: "Friends pile" or "Crew pile"</li>
              <li>→ Avoid: "Withdraw funds" → Use: "Wake some money up"</li>
            </ul>
          </section>

          <section>
            <h2>Usage guidelines</h2>
            <ul className="list-none space-y-3 mt-4">
              <li>→ Do not modify or distort the logo</li>
              <li>→ Maintain clear space around the logo equal to the height of the logo mark</li>
              <li>→ Do not place the logo on busy backgrounds without sufficient contrast</li>
              <li>→ Do not use the logo to imply endorsement without written permission</li>
            </ul>
          </section>

          <section>
            <h2>Press contact</h2>
            <p>
              <a href="mailto:support@oxar.app" className="text-accent hover:underline">support@oxar.app</a> — general
            </p>
            <p className="mt-3">
              Telegram: <a href="https://t.me/eternaki" className="text-accent hover:underline">@eternaki</a> · <a href="https://t.me/tarapatska" className="text-accent hover:underline">@tarapatska</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
