import Link from 'next/link'

export const metadata = {
  title: 'ETNY Protocol — Press Kit',
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
            <h2>About ETNY</h2>
            <p>
              ETNY is a platform for <strong>buying, selling, and sending real gold digitally</strong>. Each ETNYG token represents 1 gram of physical gold, backed by audited reserves.
            </p>
          </section>

          <section>
            <h2>Key Facts</h2>
            <ul className="list-none space-y-3 mt-4">
              <li>→ <strong>Founded:</strong> 2026</li>
              <li>→ <strong>Category:</strong> Real World Assets (RWA) / Fintech</li>
              <li>→ <strong>Token:</strong> $ETNYG (1 token = 1 gram gold)</li>
              <li>→ <strong>Network:</strong> Arbitrum (L2)</li>
              <li>→ <strong>Backing:</strong> Physical gold reserves</li>
            </ul>
          </section>

          <section>
            <h2>Logo</h2>
            <p className="mb-6">
              The ETNY logo is available in multiple color variants. Use the white version on dark backgrounds and the black version on light backgrounds. Do not modify, rotate, or distort the logo.
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
                  <img src={`/images/${logo.file}`} alt={`ETNY ${logo.name}`} className="h-16 w-auto" />
                  <span className="text-white/50 text-xs">{logo.name}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2>Brand Colors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {[
                { name: 'Background', hex: '#0A0A0A', color: '#0a0a0a' },
                { name: 'Accent Blue', hex: '#72A2F0', color: 'rgb(114, 162, 240)' },
                { name: 'Accent Purple', hex: '#8B5CF6', color: 'rgb(139, 92, 246)' },
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
              ETNY uses the <strong>Geist</strong> font family by Vercel. <strong>Geist Sans</strong> for headings and display text. <strong>Geist Mono</strong> for body text, labels, and code.
            </p>
          </section>

          <section>
            <h2>Usage Guidelines</h2>
            <ul className="list-none space-y-3 mt-4">
              <li>→ Do not modify or distort the logo</li>
              <li>→ Maintain clear space around the logo equal to the height of the logo mark</li>
              <li>→ Do not place the logo on busy backgrounds without sufficient contrast</li>
              <li>→ Do not use the logo to imply endorsement without written permission</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  )
}
