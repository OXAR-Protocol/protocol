# OXAR — Where does your money sleep?

**Дата:** 23 мая 2026
**Статус:** APPROVED
**Автор:** Daniel (через /office-hours session)
**Бренч:** eternaki/rio-de-janeiro-v1

---

## Headline

> **«Where does your money sleep?»**
> *Money has more fun with friends.*

## Problem Statement

Crypto-paid фрилансеры и удалённые сотрудники получают зарплату в USDC. Деньги «спят» на кошельках или тратятся индивидуально. У них нет инфраструктуры чтобы:

1. Автоматически распределять зарплату между накоплениями / тратами / yield-инвестициями
2. Копить с друзьями на shared real-world goals (квартира, поездка, бизнес)
3. Получать yield от Real World Assets (Ondo, Maple, Ethena) без необходимости разбираться в DeFi

**Personal evidence:** Daniel + друзья сейчас пытаются копить на 2-месячную аренду квартиры в Лиссабоне. Каждый тратит индивидуально → коллективная цель размывается → не накапливают. Текущий fail-mode который продукт решит первым.

## Target User (ICP)

Crypto-paid фрилансеры / DAO contributors / remote workers globally:

- Возраст 22-35
- Получают зарплату в USDC через Deel/Toku/Bitwage/Superfluid/direct
- $1k-$10k месячный paycheck
- Уже имеют 2-5 близких друзей в той же категории
- Хотят копить на shared goal (квартира, путешествие, оборудование, бизнес)

**Это не «emerging markets» ICP. Это JOB-based segmentation.** Украинский Solidity dev, бразильский UX designer, канадский DAO contributor, аргентинский маркетолог — все попадают.

**Beta cohort №1:** Daniel + друзья (Lisbon-квартира).

## Wedge

Категория **«crypto salary auto-split + group goal savings + RWA yield»** — пустая клетка на рынке.

Research validated (см. market scan в чате):
- Acorns делает auto-split (TradFi, no crypto, no group, no DeFi yield)
- Revolut делает group vaults (mainstream, no auto-split от crypto, no RWA yield, custodial)
- Qapital делает rules engine (TradFi, no crypto, no group)
- Bitwage делает crypto salary split (no yield, no group, no rules)
- Ondo/Maple/Pendle делают RWA yield (DeFi natives only, no consumer UX)

**Никто не объединяет все четыре.** Окно 12-24 месяца до того как Revolut/Coinbase придут.

## Brand Voice

- Curious not corporate
- Playful but precise
- Slightly accusatory («your money is napping!»)
- Warm not professional
- Anti-finance-jargon

Product copy translations:

| Corporate (избегаем) | Daniel voice (используем) |
|---|---|
| Auto-invest your salary | Tell your money where to sleep |
| Group savings vault | Friends pile / Crew goal |
| Allocate yield | Wake up your money |
| Set up recurring deposit | Build a sleeping pattern |
| Withdraw funds | Wake some money up |
| Yield streaming | Sleepy money tips |

## Архитектура

```
┌─────────────────────────────────────────────────┐
│           BRAND LAYER (consumer UX)             │
│   Where does your money sleep? — one product   │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│      MoneyFlowRulesEngine (core)               │
│   Generic: Trigger → Condition → Action        │
│   MVP exposes: Salary-split (one rule type)    │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│        RWA Yield Hub (backend, invisible)      │
│   Ondo USDY · sUSDe · Maple · Sky sDAI        │
│   Phase 2: UA bonds через брокера              │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│           Solana + Privy + USDC                │
└─────────────────────────────────────────────────┘
```

## MVP — что в продукте

### Onboarding (5 минут)

1. Sign up через Privy (email или wallet)
2. Линкует salary-wallet (USDC address куда приходит зарплата)
3. Настраивает personal split одним слайдером:
   - 60% → wake up your money (yield positions)
   - 25% → friends pile (group goals)
   - 15% → for spending
4. Выбирает risk template — Conservative (USDY 5%) / Balanced (mix 7%) / Aggressive (sUSDe 9-12%)
5. Создаёт или присоединяется к group vault (по invite link)
6. Setup goal: название, target $, deadline

### Core flows

- Auto-split при поступлении USDC на linked wallet
- Personal yield positions работают по выбранному risk template
- Yield daily-drip в group vault'ы где юзер participates
- Manual boost в group vault когда хочется ускорить
- Withdraw personal yield в любой момент (instant из liquid sources)
- Withdraw свою долю из group vault в любой момент (pro-rata, без согласия группы)

### Главные экраны

1. **Home** — personal balance, group goals progress, next salary indicator
2. **Friends pile** (group vault) — progress, contributors, leaderboard, milestones
3. **Your sleeping money** (personal investments) — yield positions, daily yield, withdraw
4. **Settings** — salary split slider, risk profile, notifications

### НЕ в MVP (отложено до Phase 2-4)

- Copy-investing / «invest with me»
- Advanced allocation panel (выбор конкретных протоколов вручную)
- UA облигации через брокера (Phase 2 после партнёрства)
- Native mobile app
- Multi-currency (только USDC в MVP)
- Power-user rule builder (visual editor)
- Дополнительные rule types: buffer top-up, overflow cleanup, round-ups, catch-up

Все отложенные фичи **не теряются** — они в backlog. MVP экспозит один rule type под brand'ом «salary-split», engine под капотом готов к расширению.

## Бизнес-модель

**Performance fee 10-15% от yield** (берём комиссию только с заработанного юзером дохода).

На цифрах: $1M TVL × средний yield 8% × 12% fee = $9.6k/год.
$10M TVL = $96k/год.
$50M TVL = $480k/год.

Plus возможно spread на свапах (0.1-0.3% при минте/редемпшене) — этот revenue stream активируется в Phase 2 когда будут multi-source vaults.

## Time-to-launch и стоимость

- **MVP development:** 6-8 недель (AI-assisted, 2-person team)
- **Юр.структура:** $10-15k (non-custodial vaults + payment gateway, без securities)
- **Initial liquidity:** не нужна на старте (юзеры приносят свой USDC)
- **Партнёрства до launch:** Ondo, Maple — позиции открываются permissionless, не требуют разрешений

## Метрики успеха (30 дней после launch)

- 30+ group vaults создано с 2+ contributors
- $50k+ TVL across personal + group positions
- 30%+ юзеров имеют активный auto-salary-split
- Median group vault: 3+ contributors, 2+ месяца retention
- 10+ unsolicited testimonials
- 1+ group vault достигает первого milestone

## Главные риски

1. **Revolut / Coinbase / Robinhood** добавляют RWA yield в group vaults → схлопывается дифференциация. Mitigation: launch быстро, build moat через ICP (crypto-paid, не bank-native).
2. **Анна не апрувит pivot** → блокирует всю работу. Mitigation: PDF на десктопе у неё, ждать ответа активно.
3. **Lisbon-группа не commit'нётся** на $300/мес → значит и юзеры не commit'нутся. Mitigation: тест до начала разработки (assignment ниже).
4. **Юр.вопросы вокруг multi-user vaults** → потенциально investment club rules. Mitigation: строго non-custodial, каждый юзер pro-rata claim, никакого pooling без явного контракта.
5. **Yield source riski** — depeg sUSDe, Maple default, Ondo issues. Mitigation: на старте только Ondo USDY (самый стабильный), остальные постепенно с warnings.

## Phase 2-4 roadmap

**Phase 2 (3-6 мес после launch):**
- UA облигации через брокера (Univer/ICU/Kinto)
- Дополнительный rule type: «Buffer top-up» («Top up my checking from yield»)
- Copy-investing / «Invest with me» механика
- Round-up rule type (Acorns-style)

**Phase 3 (6-12 мес):**
- Catch-up rule («Group отстаёт — auto-pull»)
- Bonus mechanics (group milestone unlocks, tier-based fee discounts)
- Solana mobile native app
- Multi-currency support (EUR, BRL stablecoins)

**Phase 4 (12+ мес):**
- Power-user mode: visual rule builder
- Token launch (если регуляторика позволяет)
- DAO governance над protocol params
- Geographic expansion (Brazil bonds, Turkey bonds через partners)

## Assignment Daniel-у на ближайшие 7 дней

**До того как написать первую строчку кода:**

### 1. Получить affirmative от Анны
- PDF уже на её десктопе
- Нужно явное «ОК с pivot к hub-модели + group savings»
- Это блокирует всё остальное

### 2. Customer research (5 интервью)
Поговорить с **5 crypto-paid freelancers** (не из своей Lisbon-группы — внешние):
- «Сейчас как ты копишь с друзьями?»
- «Что обычно фейлит когда копите вместе?»
- «Если бы существовал auto-split paycheck → group goal с yield — стал бы пользоваться?»
- «За какую цель готов был бы платить $X/мес commitment?»

Записать дословно. Это база для onboarding copy.

### 3. Commitment test
Спросить Lisbon-группу напрямую:
> «Если я запущу продукт через 8 недель, и мы засетапим Lisbon vault с auto-debit $300/мес с каждого до $80k или 24 месяца — вы готовы commit'нуться сейчас?»

Если меньше 3 YES → продукт не решает их боль так как ты думаешь → корректируем спек.
Если 3+ YES → есть beta-cohort, есть demand signal, идём в код.

## What I noticed about how you think

1. **Pattern recognition сильный.** Ты сам сделал connection между auto-salary-split и programmable rules через два часа после первого упоминания. Founder-level synthesis.

2. **Resistance to commitment — bottleneck.** За сессию добавил 6 фич прежде чем мы заставили выбрать одну. Classic failure mode. Знай это про себя и встречай в будущих design choices.

3. **Brand instinct сильный.** «Where does your money sleep?» — это voice который ты сгенерил интуитивно. Сэкономил $50k на копирайтере и попал точнее. Доверяй себе в этом.

4. **Personal stake = founding fuel.** Lisbon-история — самый сильный signal за сессию. Каждый раз когда сомневаешься «это real product or fake market?» — вспомни что ты сам фейлишь без него прямо сейчас.

---

## Next steps

После Anna approve и customer interviews:
- `/plan-eng-review` — engineering architecture lock-in (data flow, smart contracts, edge cases)
- `/feature-dev` или `/write-plan` — break MVP into implementable tasks
- Start coding sprint
