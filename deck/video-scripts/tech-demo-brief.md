# OXAR — Technical Demo Video Brief (EN)

> Purpose: 3-minute screen-recorded technical walkthrough for Colosseum / Y
> Combinator. Founder voice-over, full app flow, single browser window +
> Solana explorer. Daniil records this; Anna records the brand pitch
> separately.

---

## Opening (5–10 seconds)

**Recommended:**
> "This is OXAR. Live on Solana devnet. Full flow in three minutes."


---

### 1. Setup (0:00–0:15)

**Say:**
> "OXAR is on Solana — devnet today, all flows real: real program, real
> transactions, real on-chain state. I'll walk through deposit, hold,
> trade, and send."

---

### 2. Onboarding (0:15–0:40)


**Say:**
> "Sign-in via Privy. Email or external wallet — embedded Solana wallet
> created on the fly. No seed phrase, no extension. This removes 90% of
> onboarding friction for first-time crypto users — and that matters
> because our wedge is non-crypto-native diaspora capital."


---

### 3. Buy / Deposit (0:40–1:15)

**Say:**
> "Buying is a swap: source asset on the left, bond on the right. I'm
> picking UA-UAH-SHORT — eighteen percent APY, Ukrainian short-term OVDP,
> hryvnia denominated. Deposit USDC. The contract mints me a vault token —
> my position in the underlying bond."


---

### 4. Hold + NAV (1:15–1:35)

**Say:**
> "This is my position. NAV — net asset value — accrues every block. Not a
> distribution event every quarter; continuous compounding into the token
> itself. The longer I hold, the higher the NAV per share. Tokenized stocks
> can't do this for dividends — bonds do it by structure."


---

### 5. Marketplace + Transfer (1:35–2:30)


**Say:**
> "Holding is one option. I can also list on the on-chain marketplace —
> set my price, the contract escrows my tokens, any buyer redeems with one
> click. No intermediary, no listing fee to a centralized market.
>
> Or — just send. Back on Explore — pick my position on the left, paste a
> Solana address on the right, send. Transaction signed via Privy,
> recipient ATA auto-created, tokens delivered. Like Cash App for
> sovereign bonds."

---

## Closing (last 5–10 seconds)

**Recommended:**
> "First market — Ukraine. Architecture — global. OXAR."



**Rules:**
- Last on-screen frame should be Solana explorer on the most recent
  transaction OR the OXAR wordmark — never a half-loaded UI.
- No "thanks for watching." This is a tool, not a vlog.
- No music swell. The voice carries the closer.

---

## Key Phrases to Land (Proof Points)

These are your "edge phrases" — the lines that separate OXAR from any
generic RWA demo. Drop at least 3 of them naturally:

1. **"NAV accrues every block — continuous, not distribution events."**
   Closes the dividend gap that tokenized equity (xAAPL, xNVDA) cannot
   solve legally.

2. **"Privy embedded wallet — no seed phrase, no extension."**
   Onboarding edge for non-crypto-native users.

3. **"Compliance stack as code, not as a roadmap line."**
   When you show the contract, point at the extension points
   (`vault.is_active`, planned allowlist hook in `transfer_tokens.rs`).

4. **"Solo-authored, contracts to UI."**
   Drop once near the closer. Signal of execution capacity.

5. **"Like Cash App for sovereign bonds."**
   Cultural anchor for the transfer feature. Makes it instantly relatable.

---

## Recording Setup — Single Window + Explorer

**Use one Chrome window with two pinned tabs:**

```
[oxar.app/vaults]   [explorer.solana.com/?cluster=devnet]
```

**Why one window, not two:**
- One window stays clean and editorial.
- Solana explorer is more authoritative than a "second wallet" UI for
  proving on-chain state — judges (especially Colosseum) trust the
  explorer over any custom UI.
- Tab-switching takes 0.5s; window-switching looks amateurish.

**Browser hygiene:**
- Use a dedicated Chrome profile or Incognito.
- `Cmd+Shift+B` to hide the bookmarks bar.
- Close DevTools.
- Pin only the two relevant tabs — no Gmail, no Twitter, no work tabs.

**Recorder:**
- **CleanShot X** (recommended) or **Screen Studio** for cursor smoothing
  and zoom-in effects.
- QuickTime works as a fallback (Cmd+Shift+5).
- Export at 1080p or higher. Don't compress before editing.

**Pre-record checklist:**
- Devnet wallet pre-funded with USDC (use the in-app faucet ahead of time
  so the demo doesn't include the faucet flow unless intentional).
- 2–3 test recipient addresses saved in a notes file for the transfer
  demo.
- One existing position you've held long enough that NAV has visibly
  accrued — gives you something concrete to point at.
- Solana explorer pre-loaded on your program ID:
  `8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT`

---

## Delivery Notes

| Do | Don't |
|---|---|
| Pause 1–2 seconds after each transaction confirms — let the judge see it | Click through screens with no narration |
| Narrate the **why**, not the what — "yield accrues to NAV" beats "I click deposit" | Read the UI labels verbatim |
| Show Solana explorer at least once — verifiable proof | Apologize for devnet, mock data, or test conditions |
| Keep cursor smooth — Screen Studio adds easing automatically | Twitch the cursor; don't click rapidly in 5 places |
| If you face-cam, keep it small (corner) and only after first sentence | Lead with face-cam — open on the product |
| Subtitles in English (auto-generate via Descript / CapCut and clean up) | Leave only Ukrainian audio for a global audience |

---

## Background Audio

- **No music**, or **very faint ambient** (–28 dB) under voice.
- Voice should always be the dominant track.
- If you do use music, no swelling drops, no cliché tech beats.
- Record voice in a quiet room. AirPods Pro mic is acceptable; a USB
  condenser mic is better.

---

## Final Frame

The last visible frame should be one of:

1. **Solana explorer on the most recent transaction** — visual proof.
2. **The OXAR wordmark** on a clean black background — brand close.
3. **`oxar.app`** typed at the bottom — call-to-action without saying so.

Hold the final frame for 2 seconds before fade-out. No frantic cuts.

---

## Things to Cut From the Demo

- Mock/placeholder data screens.
- Loading spinners longer than 1 second (cut them in editing).
- Any UI bug or unexpected modal — re-record that segment.
- Anything that requires apology or explanation. If it's not perfect, cut
  it and reshoot.
- Captions describing what's already on screen ("clicking deposit
  button"). Trust the visual.

---

## Length Discipline

- **Under 3 minutes total.** Judges have short attention; longer demos
  rarely watch through.
- If the segment list above runs long, cut Onboarding (segment 2) — it's
  the lowest-information segment.
- The marketplace and transfer demos are your differentiators — protect
  their time budget first.

---

## One-Line Summary of the Whole Demo

If a viewer watched only 10 seconds of your demo, they should walk away
with this thought:

> "OXAR is a real on-chain protocol that lets anyone, anywhere, buy
> sovereign bonds, hold them, trade them, and send them — and the
> founder built it himself, end to end."

Make sure the demo communicates this even at sub-1x watch speed.
