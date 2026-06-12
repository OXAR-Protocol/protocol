# OXAR Landing Redesign — "Still Waters" (the Dive)

Status: concept locked, production starting. Local-only until approved — no deploy.
Branch: `eternaki/rwa-hub-landing-redesign`.

## Core idea

**"Where does your money sleep?"** asked on a mirror-still lake at dawn — and answered
at the bottom: the **lakebed** (bed = where money sleeps). Scrolling = diving. The page
is one continuous descent: calm surface above, everything working underneath
("still waters run deep" / "deep liquidity").

Structural skeleton (object → dive → chapters in the deep → bottom) is inspired by
hashgraphvc.com, deliberately inverted so it reads as ours, not a copy:

| hashgraphvc | OXAR |
|---|---|
| storm, night, impact | dawn, calm, a quiet dive |
| cold electric blue | warm paper/amber light |
| stone falls and shatters | the viewer dives, nothing breaks |
| particles form theater (faces, logo) | currents are data: assets, honest cards, live APY |
| chapters //01 //02 | depth gauge −0m…−40m |
| ends on the seabed logo | ends on the lakebed: "where your money sleeps" + CTA |

## Honesty rules (non-negotiable)

- Numbers (APY) and CTA appear **only on the LIVE asset** (Jupiter Lend USDC), value
  fetched live, never hardcoded marketing numbers.
- Non-live assets carry status text only: `In development` (actually being built:
  Ondo USDY, syrupUSDC) or `On our roadmap` (direction, no commitment). **No numbers.**
- One framing line near the currents chapter: "One asset is live today. The rest is
  the world we're building toward."

## Storyboard (sections, copy, video)

Scroll = descent. A monospace **depth gauge** at the right edge ticks from −0 m to −40 m.
A live APY ticker (Geist Mono, tabular-nums) persists through the whole dive.
Theme toggle = time of day (dawn ↔ night), not a UI setting.

### 1. Surface — hero (−0 m)
- Visual: mirror-still lake at dawn, light mist, total calm. (Night variant: same
  frame, moonlight + stars.)
- Copy: `Where does your money sleep?` + sub: non-custodial USDC yield on Solana,
  no bank / no broker / no lock. Scroll cue: `Look beneath the surface ↓`
- Overlay: live APY ticker starts here.

### 2. The dive — transition (−2 m)
- Visual: camera slips under the surface (one-shot clip, not a loop; scroll-driven).
- Copy: `Asleep on the surface. Working underneath.`

### 3. Currents — the hub (−12 m)
- Visual: underwater god rays, drifting particle currents in the water column.
- Each current = an asset class. Hover (tap on mobile) → current highlights amber +
  card: name · status · (APY only if LIVE). Live current visibly flows; roadmap
  currents are faint in the depth.
- Cards v1: USDC Yield (LIVE, real APY, button → app), US Treasuries / USDY
  (In development), Private credit / syrupUSDC (In development), Metals, Real
  estate, Farmland (On our roadmap).

### 4. The deep — product, facts (−30 m)
- Visual: darker, calmer water; few rays; near-stillness. The deeper, the fewer
  metaphors, the more facts.
- Content: how it works (own wallet, non-custodial, withdraw anytime), real APY,
  screenshot/live numbers from app, `Launch app` CTA.

### 5. The lakebed — finale (−40 m)
- Visual: soft sandy bottom, a gentle pool of light, absolute stillness, faint
  glints. Inherently dark; barely differs day/night.
- Copy: `Where your money sleeps.` → `Right here. Earning in its sleep.`
- CTA: Get early access / Launch app. APY ticker still ticking — the proof.

## Video production list (Google Flow / Veo)

Method per scene: (1) generate the **still** first, approve composition →
(2) Frames-to-video; for loops set first frame = last frame (same image) →
seamless loop → (3) extend if needed. Camera: static or minimal drift —
scroll/code does all big movement. Keep one consistent palette across stills
(generate stills as a set before animating).

Deliverables: 16:9, highest export quality (we compress to webm/mp4 for web),
6–8 s loops unless noted.

| # | Scene | Variants | Type | Prompt sketch |
|---|---|---|---|---|
| V1 | Surface dawn | day + night | loop | Mirror-still lake at dawn, thin mist, warm low sun, no wind, photoreal, static camera, subtle water breathing. Night: same frame, moonlight, stars reflected. |
| V2 | The dive | one | one-shot 5–8 s | Camera slowly slips beneath a calm lake surface, waterline crosses the lens, bubbles, light shafts appear below, smooth, serene, no splash. |
| V3 | Currents | day + night | loop | Underwater scene, tall god rays through blue-green water, drifting particle currents, warm golden light from above (night: silver moon shafts), calm, photoreal. |
| V4 | The deep | one (grade night via CSS) | loop | Deep dark water, almost still, faint single light shaft, sparse particles, profound calm. |
| V5 | Lakebed | one | loop | Sandy lakebed in soft pool of light from above, absolute stillness, faint golden glints in the sand, serene, photoreal. |

≈ 7 clips total (V1×2, V2, V3×2, V4, V5).

## Design system notes

- Type: editorial serif display (two-tone headline: ink + muted), Geist Sans body,
  Geist Mono for numbers/labels (tabular-nums).
- Color: warm paper/ivory ↔ ink night; single amber accent = "awake/earning"
  (LIVE only); muted/outline = roadmap.
- Motion: slow, ambient, never stops (the yield never sleeps); hairline borders;
  no neon/web3 gradients.

## Tech plan (web/)

- Sections as full-viewport layers; scenes are `<video>` loops cross-faded /
  masked on scroll (no giant scrubbed file). V2 plays scrubbed or once on
  scroll-enter.
- Hover currents: polygon hotspots over video + DOM cards (geolava-style), works
  without WebGL; tap on mobile. Graceful fallback: static poster images +
  prefers-reduced-motion support (lesson from tenbinlabs' "Lost Contact").
- Depth gauge: fixed right-edge mono element bound to scroll progress.
- Theme toggle swaps day/night video sources (deep scenes: CSS grade).
- Live APY from existing yield provider data path; never hardcoded.
- Mobile: lighter posters or low-res loops, currents become a vertical list of
  the same honest cards.

## Post formats (marketing, later)

- The label card (name · status · number-if-live) over any real-world photo.
- Surreal "bed" imagery (Magritte-style bed on still water) — posts only, not site.
- New asset shipped = "a new current joins the river" announcement format.
