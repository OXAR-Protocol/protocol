#!/usr/bin/env python3
"""
Builds OXAR-pitch.pptx.

This file is the deck. Not a copy of it, not an export of it — the deck. Which is
the whole reason it exists: the previous deck was React, and a React deck cannot be
opened by the person who needs to change one word before a meeting. A .pptx opens in
Google Slides, Keynote and PowerPoint, and every figure in it still comes from one
place that can be reviewed in a diff.

Every number here was checked on 2026-08-16 against the production database, the
code, or a published source named on the slide. Nothing goes in that we cannot
stand behind.

    python3 pitch/build_pptx.py [output.pptx]

Images are deliberately absent. Each slide carries a note saying what its picture
has to prove — a picture that only sets a mood is how the last deck ended up with a
crumpled banknote illustrating a table about competitors.
"""

from __future__ import annotations

import sys
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Inches, Pt

# --- The look -----------------------------------------------------------------
# Same three colours and one typeface as the app and the landing page: black,
# white, and the violet that only ever marks the stressed word.

FONT = "DM Sans"
INK_DARK, PAPER_DARK = RGBColor(0xFF, 0xFF, 0xFF), RGBColor(0x00, 0x00, 0x00)
INK_LIGHT, PAPER_LIGHT = RGBColor(0x0A, 0x0A, 0x0A), RGBColor(0xFF, 0xFF, 0xFF)
ACCENT = RGBColor(0x8B, 0x5C, 0xF6)

W, H = Inches(13.333), Inches(7.5)
PAD = Inches(0.85)
COL = Inches(7.4)  # text column; the rest of the frame is left for a picture

MUTED_DARK, MUTED_LIGHT = RGBColor(0x8C, 0x8C, 0x8C), RGBColor(0x6B, 0x6B, 0x6B)
FAINT_DARK, FAINT_LIGHT = RGBColor(0x5E, 0x5E, 0x5E), RGBColor(0x9A, 0x9A, 0x9A)
RULE_DARK, RULE_LIGHT = RGBColor(0x24, 0x24, 0x24), RGBColor(0xE2, 0xE2, 0xE2)


class Deck:
    def __init__(self) -> None:
        self.prs = Presentation()
        self.prs.slide_width, self.prs.slide_height = W, H

    # -- primitives ------------------------------------------------------------

    def _slide(self, light: bool):
        s = self.prs.slides.add_slide(self.prs.slide_layouts[6])
        fill = s.background.fill
        fill.solid()
        fill.fore_color.rgb = PAPER_LIGHT if light else PAPER_DARK
        return s

    def _box(self, s, left, top, width, height):
        tb = s.shapes.add_textbox(left, top, width, height)
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        return tf

    def _para(self, tf, first: bool):
        return tf.paragraphs[0] if first else tf.add_paragraph()

    def _write(self, p, segments, *, size, color, bold=False, italic=False, spacing=1.0):
        """A paragraph built from (text, is_accent) pairs, so one word can carry the
        violet italic without the whole line changing typeface."""
        p.line_spacing = spacing
        for text, accent in segments:
            r = p.add_run()
            r.text = text
            f = r.font
            f.name, f.size, f.bold = FONT, Pt(size), bold
            f.italic = italic or accent
            f.color.rgb = ACCENT if accent else color

    def _rule(self, s, top, width, light: bool):
        line = s.shapes.add_connector(1, PAD, top, PAD + width, top)
        line.line.color.rgb = RULE_LIGHT if light else RULE_DARK
        line.line.width = Pt(0.75)

    # -- slide furniture -------------------------------------------------------

    def _head(self, s, kicker, title, sub, light, *, top=Inches(1.15), title_size=44):
        ink = INK_LIGHT if light else INK_DARK
        muted = MUTED_LIGHT if light else MUTED_DARK

        tf = self._box(s, PAD, top, COL, Inches(0.3))
        self._write(self._para(tf, True), [(f"[ {kicker} ]", False)], size=13, color=muted)

        tf = self._box(s, PAD, top + Inches(0.5), COL, Inches(1.6))
        self._write(self._para(tf, True), title, size=title_size, color=ink, bold=True, spacing=0.95)

        bottom = top + Inches(0.5) + Inches(0.62) * (1 + max(0, len(_plain(title)) // 34))
        if sub:
            tf = self._box(s, PAD, bottom + Inches(0.2), Inches(6.6), Inches(1.4))
            self._write(self._para(tf, True), [(sub, False)], size=15, color=muted, spacing=1.35)
            bottom += Inches(0.2) + Inches(0.32) * (1 + len(sub) // 62)
        return bottom

    def _foot(self, s, text, light):
        if not text:
            return
        tf = self._box(s, PAD, H - Inches(1.15), Inches(10.2), Inches(0.8))
        self._write(
            self._para(tf, True), [(text, False)],
            size=11, color=FAINT_LIGHT if light else FAINT_DARK, spacing=1.35,
        )

    def _note(self, s, text):
        s.notes_slide.notes_text_frame.text = text

    # -- slide kinds -----------------------------------------------------------

    def title(self, title, sub, note):
        s = self._slide(False)
        tf = self._box(s, PAD, Inches(2.6), Inches(11.6), Inches(2.0))
        self._write(self._para(tf, True), title, size=60, color=INK_DARK, bold=True, spacing=0.95)
        tf = self._box(s, PAD, Inches(4.5), Inches(7.4), Inches(1.2))
        self._write(self._para(tf, True), [(sub, False)], size=16, color=MUTED_DARK, spacing=1.4)
        self._note(s, note)
        return s

    def statement(self, kicker, title, sub, light, note, footer=None):
        s = self._slide(light)
        self._head(s, kicker, title, sub, light, top=Inches(2.2), title_size=50)
        self._foot(s, footer, light)
        self._note(s, note)
        return s

    def columns(self, kicker, title, cols, light, note, footer=None):
        s = self._slide(light)
        top = self._head(s, kicker, title, None, light)
        ink = INK_LIGHT if light else INK_DARK
        muted = MUTED_LIGHT if light else MUTED_DARK

        n = len(cols)
        gutter = Inches(0.5)
        width = Emu(int((W - 2 * PAD - gutter * (n - 1)) / n))
        y = top + Inches(1.0)
        self._rule(s, y - Inches(0.3), W - 2 * PAD, light)
        for i, (label, body) in enumerate(cols):
            x = Emu(int(PAD + i * (width + gutter)))
            tf = self._box(s, x, y, width, Inches(0.35))
            self._write(self._para(tf, True), [(label, False)], size=15, color=ink)
            tf = self._box(s, x, y + Inches(0.5), width, Inches(2.4))
            self._write(self._para(tf, True), [(body, False)], size=12.5, color=muted, spacing=1.4)
        self._foot(s, footer, light)
        self._note(s, note)
        return s

    def stats(self, kicker, title, sub, items, light, note, footer=None):
        s = self._slide(light)
        top = self._head(s, kicker, title, sub, light)
        ink = INK_LIGHT if light else INK_DARK
        muted = MUTED_LIGHT if light else MUTED_DARK
        faint = FAINT_LIGHT if light else FAINT_DARK

        n = len(items)
        gutter = Inches(0.45)
        width = Emu(int((W - 2 * PAD - gutter * (n - 1)) / n))
        y = max(top + Inches(0.55), Inches(3.9))
        for i, (figure, label, note_text) in enumerate(items):
            x = Emu(int(PAD + i * (width + gutter)))
            tf = self._box(s, x, y, width, Inches(0.9))
            self._write(self._para(tf, True), [(figure, False)], size=40, color=ink, bold=True, spacing=0.9)
            tf = self._box(s, x, y + Inches(0.78), width, Inches(0.3))
            self._write(self._para(tf, True), [(label, False)], size=12, color=muted)
            tf = self._box(s, x, y + Inches(1.14), width, Inches(1.3))
            self._write(self._para(tf, True), [(note_text, False)], size=10.5, color=faint, spacing=1.35)
        self._foot(s, footer, light)
        self._note(s, note)
        return s

    def rows(self, kicker, title, items, light, note, footer=None):
        s = self._slide(light)
        top = self._head(s, kicker, title, None, light)
        ink = INK_LIGHT if light else INK_DARK
        muted = MUTED_LIGHT if light else MUTED_DARK

        y = top + Inches(0.75)
        avail = H - Inches(1.5) - y
        step = Emu(int(avail / len(items)))
        for label, body, strong in items:
            self._rule(s, y, W - 2 * PAD, light)
            tf = self._box(s, PAD, y + Inches(0.18), Inches(2.4), Inches(0.4))
            self._write(self._para(tf, True), [(label, False)], size=13, color=ink if strong else muted, bold=strong)
            tf = self._box(s, PAD + Inches(2.7), y + Inches(0.18), Inches(8.9), step - Inches(0.3))
            self._write(self._para(tf, True), [(body, False)], size=12, color=ink if strong else muted, spacing=1.35)
            y = Emu(int(y + step))
        self._foot(s, footer, light)
        self._note(s, note)
        return s

    def steps(self, kicker, title, items, light, note, footer=None):
        s = self._slide(light)
        top = self._head(s, kicker, title, None, light)
        ink = INK_LIGHT if light else INK_DARK
        muted = MUTED_LIGHT if light else MUTED_DARK

        y = top + Inches(0.8)
        step = Inches(1.25)
        for i, body in enumerate(items, start=1):
            self._rule(s, y, W - 2 * PAD, light)
            tf = self._box(s, PAD, y + Inches(0.2), Inches(1.2), Inches(0.7))
            self._write(self._para(tf, True), [(f"0{i}", False)], size=30, color=ink, bold=True)
            tf = self._box(s, PAD + Inches(1.5), y + Inches(0.34), Inches(9.5), Inches(0.8))
            self._write(self._para(tf, True), [(body, False)], size=13.5, color=muted, spacing=1.35)
            y += step
        self._foot(s, footer, light)
        self._note(s, note)
        return s

    def save(self, path: Path) -> Path:
        self.prs.save(str(path))
        return path


def _plain(segments) -> str:
    return "".join(t for t, _ in segments)


# --- The deck -----------------------------------------------------------------
# Fifteen slides in four movements: the setup, the product, the business, the close.
# Two slides from the old seventeen are gone — "trust" repeated the money path, and
# "every way to grow in one place" repeated the product.

def build() -> Deck:
    d = Deck()

    # -- setup ----------------------------------------------------------------
    d.title(
        [("where does your money ", False), ("sleep?", True)],
        "a non-custodial savings app on solana. hold dollars, earn real yield, "
        "own global assets — no bank, no broker, no crypto.",
        "PICTURE: the eyes through torn paper. It has to say 'money is watching you, "
        "and doing nothing' — not decoration, the question itself.",
    )

    d.statement(
        "the problem",
        [("inflation ", False), ("eats", True), (" your savings.", False)],
        "save in your local currency and you lose value every year. holding dollars "
        "that actually earn is the hard part.",
        False,
        "PICTURE: the dripping hundred — value visibly draining out of a note. Must "
        "read as loss over time, not as 'money' in general.",
    )

    d.columns(
        "today's options",
        [("every door is ", False), ("half shut.", True)],
        [
            ("banks & neobanks", "4–5% at best, and the best usually needs a us bank account. everyone else gets a local-currency rate that inflation eats."),
            ("crypto wallets", "0%. your dollars sit still, and you carry the seed phrase, the gas and the scams yourself."),
            ("brokers", "treasuries, stocks, gold — real assets, gated by geography, paperwork and market hours."),
        ],
        False,
        "PICTURE: hands reaching for money just out of reach. Three columns already "
        "carry the argument, so the picture should be small and to one side.",
        footer="and the tools that do reach real yield are built for traders — seed phrases, gas, jargon, scams.",
    )

    d.statement(
        "who it's for",
        [("for the people the system ", False), ("forgets.", True)],
        "emerging-market savers, cross-border freelancers — anyone who wants dollars "
        "that grow, without becoming a crypto trader.",
        True,
        "PICTURE: the crowd of hats with one figure in violet. The one person picked "
        "out of the crowd is the whole slide.",
    )

    # -- product --------------------------------------------------------------
    d.statement(
        "the solution",
        [("a dollar account that ", False), ("actually earns.", True)],
        "one non-custodial account: hold dollars, earn yield, own treasuries, stocks "
        "and gold. email sign-in, apple pay, withdraw anytime.",
        False,
        "PICTURE: money asleep on a cloud — the product's own metaphor, and the only "
        "slide where a soft image is the right answer.",
    )

    d.columns(
        "the product",
        [("four things, ", False), ("one account.", True)],
        [
            ("earn", "dollars into curated yield sources — jupiter lend, ondo usdy (us treasuries), maple (institutional credit), onre. 5–12% apy."),
            ("own", "tokenized stocks and gold, held in your own wallet. real price exposure, on-chain p&l, no broker."),
            ("fund it", "apple pay, card, or any crypto you already hold. gas is paid for you — you never need to buy sol."),
            ("your pile", "every position in one view, with what it earned. withdraw any of it, any time, without asking us."),
        ],
        True,
        "PICTURE: a real screenshot of the app, not a collage. This is the slide where "
        "an investor wants to see the thing exists.",
        footer="one tap each, no apps to juggle, nothing to learn about crypto.",
    )

    d.steps(
        "how it works",
        [("your money never ", False), ("passes through us.", True)],
        [
            "sign in with an email. a wallet is created for you — no seed phrase to write down.",
            "fund it with apple pay, a card, or crypto you already hold.",
            "the money moves straight from your wallet into an audited protocol. the position is yours.",
        ],
        False,
        "PICTURE: none, or a diagram we draw ourselves — wallet → protocol, with OXAR "
        "beside the arrow and not on it. A stock photo would weaken the one slide that "
        "is a factual claim about custody.",
        footer="oxar ships no smart contract of its own — we sit on top of audited protocols. "
               "nothing to hack, no keys for us to lose, no withdrawal for us to approve.",
    )

    # -- business -------------------------------------------------------------
    d.stats(
        "market",
        [("the dollars are ", False), ("already here, asleep.", True)],
        "we are not waiting on a behaviour change. the money is already on-chain, "
        "already in dollars, and already sitting still.",
        [
            ("$295B", "tam", "on-chain dollars earning nothing — about 95% of a $312b stablecoin market, held across 150m+ addresses"),
            ("$15B", "sam", "the idle share of solana's $16.7b stablecoin supply — money we can reach without asking anyone to bridge"),
            ("$3M", "som · year one", "two basis points of the idle solana float — about 1,400 savers at the $2,080 an average stablecoin address holds"),
        ],
        True,
        "PICTURE: something that means 'asleep', not 'finance'. A skyline meant nothing; "
        "the eye through the sky at least watches. Keep it to one side of the figures.",
        footer="sources: artemis and visa onchain analytics, q2 2026. yield-bearing share is 2–6% "
               "depending on whose definition, so 95% idle is the conservative read.",
    )

    d.rows(
        "business model",
        [("a quarter of a percent, ", False), ("named before you sign.", True)],
        [
            ("the model", "0.25% on a conversion — buying or selling anything that has to be swapped, where dollars are one side of the trade. putting dollars into a dollar product is not a conversion and costs nothing.", False),
            ("why not yield", "the position sits in the user's own wallet on a public market, and we are not in the flow when they leave. a performance fee needs custody, and custody is the promise we sell.", False),
            ("the price", "revolut charges 1.49% to convert plus a 1.5–2.5% spread; phantom 0.85% hidden inside the quote; metamask 0.875%. we take 0.25%, as its own line, before you sign.", False),
            ("what it earns", "revenue tracks turnover, not deposits — about $1 for every $400 swapped. money that sleeps earns us nothing, which is the honest cost of building for savers.", False),
        ],
        False,
        "PICTURE: none. Four rows of argument is already a full slide, and the last deck "
        "put a photograph behind a table and lost both.",
        footer="built, disclosed in the terms, and switched off behind two switches — neither of them set. "
               "today, before launch, we take 0%.",
    )

    d.rows(
        "competition",
        [("nobody covers ", False), ("both halves.", True)],
        [
            ("revolut", "2.33% on dollars for a standard account, up to 3.68% only on a paid tier — with capital at risk if the fund's nav falls. converting costs 1.49% plus a 1.5–2.5% spread.", False),
            ("us savings apps", "4–5%, the honest ceiling of a treasury rate — and they need a us bank account, which is the whole problem for everyone else.", False),
            ("crypto wallets", "0% on the dollars sitting in them. phantom charges 0.85% to convert and hides it in the quote; metamask 0.875%.", False),
            ("defi frontends", "the yield is real and the fee is often zero — but the interface is built for people who already speak the language.", False),
            ("oxar", "5–12%, real assets, nothing held by us, and 0.25% to convert — a sixth of revolut, a third of phantom, printed on screen before you sign.", True),
        ],
        False,
        "PICTURE: none. Five rows, and the numbers are the argument.",
        footer="the defensible part is not the yield — anyone can route to a protocol. "
               "it is who we serve, and that they trust us with the first dollar.",
    )

    d.stats(
        "traction",
        [("small numbers, ", False), ("honestly counted.", True)],
        None,
        [
            ("live", "on solana mainnet", "not a prototype — real money, from your own wallet"),
            ("99+", "waitlist signups", "16 of them arrived through someone else's referral link, with nothing spent on acquisition"),
            ("$75k", "intended deposits", "self-reported by the ten who named a figure — an intention, not a commitment. median $1,200"),
            ("36", "assets", "5 yield sources, 28 tokenized stocks, gold and silver"),
        ],
        False,
        "PICTURE: the app, or nothing. Four figures with their caveats is a dense slide "
        "already.",
        footer="counted against the production database on 16 august 2026, not remembered. gasless deposits, "
               "apple-pay funding, a live portfolio, english and ukrainian — shipped in months, bootstrapped.",
    )

    d.statement(
        "why now",
        [("the timing is ", False), ("now.", True)],
        "tokenized assets crossed into the billions, crypto payroll is mainstream, "
        "card-to-crypto onramps finally work. the window is open 12–24 months before "
        "revolut and coinbase close it.",
        True,
        "PICTURE: the crowd reading the news — many people turning at once. It has to "
        "mean 'everyone is arriving', not 'the future'.",
    )

    # -- close ----------------------------------------------------------------
    d.rows(
        "roadmap",
        [("the product is built. ", False), ("now the people.", True)],
        [
            ("now", "live on mainnet in closed alpha: dollar yield, tokenized stocks, gold — end to end, from your own wallet. apple pay funding and gasless deposits both shipped.", False),
            ("next", "open the door. the product is built and the gate is an allowlist; what is missing is people, not features.", False),
            ("q4 2026", "assets from issuers jupiter cannot route today, and from a us broker-dealer whose liquidity beats most of our shelf. euro yield, once lend positions are priced in their own currency.", False),
            ("2027", "native ios and android. more currencies than the dollar. geographic expansion through local partners.", False),
        ],
        False,
        "PICTURE: a child pointing at what's ahead, small and to one side — or nothing.",
    )

    d.columns(
        "the team",
        [("two founders, one ", False), ("live product.", True)],
        [
            ("daniel lohachov", "product and engineering. founder of the prior oxar iteration; in the solana ecosystem since 2023."),
            ("anna tarapatska", "operations, legal and partnerships."),
        ],
        False,
        "PICTURE: the chrome mark, large and to the right. This is the slide where the "
        "brand can simply be itself.",
        footer="building from ukraine, bootstrapped — a live product on mainnet in months.",
    )

    d.rows(
        "the ask",
        [("funding the launch, ", False), ("not the runway.", True)],
        [
            ("not raising", "no traditional angel round. a crypto vc seed is planned for post-pmf, 12–18 months out.", False),
            ("raising instead", "grants, accelerators and hackathon prizes — $30k to carry the launch.", False),
            ("in motion", "solana foundation ecosystem grant, colosseum. partnerships with delora, privy and kora already live in the product.", False),
        ],
        False,
        "PICTURE: the hand-drawn study of the mark, faint. The closing slide is the one "
        "place a sketch belongs — but crop out the handwritten '4-18%' and '$230B', "
        "because neither is a number this deck uses.",
        footer="oxar.app · daniel.l@oxar.app · @eternaki",
    )

    return d


if __name__ == "__main__":
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.home() / "Desktop" / "OXAR-pitch.pptx"
    build().save(out)
    print(f"{out}  ·  {len(build().prs.slides.__iter__.__self__._sldIdLst)} slides")
