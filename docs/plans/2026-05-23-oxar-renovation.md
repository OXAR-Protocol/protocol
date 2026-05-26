# OXAR Renovation — Master Strategy Document

**Дата:** 23 мая 2026
**Статус:** APPROVED (Anna co-founder approved 2026-05-23)
**Авторы:** Daniel (через серию /office-hours + /brainstorming сессий)
**Цель документа:** зафиксировать полный pivot OXAR с старой концепции на новую — для согласования с со-фаундером, юристами, инвесторами и команды разработки

---

## Executive Summary

OXAR трансформируется из **«токенизация украинских облигаций на Solana»** в **«Where does your money sleep? — financial app for crypto-paid generation»**.

Ключевые изменения:

1. **Не выпускаем свой токен** на украинские облигации (избегаем $70k+ securities структуры)
2. **Работаем с украинским брокером** как с partner для облигаций (Phase 2)
3. **Подключаем существующие RWA yields** (Ondo, Maple, Ethena, Sky) как core MVP
4. **Главная фича** — group savings vaults с auto-salary-split от crypto зарплаты
5. **Brand voice** — playful, curious («Where does your money sleep?»)
6. **ICP** — crypto-paid фрилансеры globally (не «emerging markets»)

Что **остаётся**: команда (Daniel 63% / Anna 37%), Solana как блокчейн, Privy для логина, миссия дать crypto-нативным людям доступ к качественным yield-источникам.

---

## Часть 1: Что было — старый OXAR

### Концепция (январь-май 2026)

**Pitch старой версии**: «Токенизация украинских государственных облигаций (ОВДП и Военные облигации) на Solana с daily NAV accrual и secondary marketplace».

**Шесть vault'ов в плане**:
- UA-UAH-SHORT (18% APY)
- UA-UAH-MID (17% APY)
- UA-USD-STD (4% APY)
- UA-EUR-STD (3.5% APY)
- UA-UAH-WAR (18% APY)
- UA-USD-WAR (4% APY)

**Что сделано**:
- Solana smart contracts деплоены на Devnet (Program ID `8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT`)
- Web app на Next.js 14 + Privy auth
- SDK + IDL архитектура
- Документация
- Брендинг и сайт oxar.app
- Параллельно делали Radar (отдельный продукт-исследователь) — теперь отвергнут

### Почему пришлось пивотить

**1. Юридическая стена**: юристы Aurum оценили securities-токенизацию в $70k+ только на легализацию (SPV + license + custodian agreements + ongoing compliance). Это блокировало запуск на 6-12 месяцев.

**2. Узость аудитории**: чисто украинские облигации — нишевый продукт. На вопрос «А я бы сам пользовался приложением только для украинских облигаций?» — Daniel честно ответил «не уверен». Если сам founder не убеждён в продукте — это сигнал.

**3. Фидбек с хакатона**: на Colosseum Frontier Hackathon Daniel получил отзыв от Никиты и других founders. Все успешные RWA-команды делают **connector-модели**, а не «всё своё с нуля». Securities tokenization — это не их игра.

**4. Backyard / Cashflow research**: Backyard.finance делает DeFi-агрегатор с синтетическим стейблом. Cashflow.fun делает router. Никто не объединяет crypto salary + group savings + RWA yield. **Пустая клетка на рынке**.

**5. Personal pain**: Daniel сам сейчас пытается копить с друзьями на квартиру в Лиссабоне. Без инфраструктуры — каждый тратит индивидуально, цель размывается. Это **personal validation** для нового продукта.

---

## Часть 2: Что есть — новый OXAR

### Headline

> **«Where does your money sleep?»**
>
> *Money has more fun with friends.*

### Что это значит для юзера

Crypto-paid фрилансер получает USDC зарплату на кошелёк. OXAR:

1. **Автоматически распределяет** её по правилам (например 60% в yield, 25% в group goal с друзьями, 15% liquid)
2. **Инвестирует yield-часть** в RWA через Ondo / sUSDe / Maple / Sky (5-12% APY в зависимости от risk profile)
3. **Капает yield в group goal vault** — общая цель с друзьями (квартира, поездка, оборудование, бизнес)
4. **Показывает прогресс** к цели в real-time, с milestone'ами и social pressure
5. **Позволяет вывести в любой момент** без lock'ов и penalty

### Brand voice

| Corporate (избегаем) | Daniel voice (используем) |
|---|---|
| Auto-invest your salary | Tell your money where to sleep |
| Group savings vault | Friends pile / Crew goal |
| Allocate yield | Wake up your money |
| Set up recurring deposit | Build a sleeping pattern |
| Withdraw funds | Wake some money up |
| Yield streaming | Sleepy money tips |

Принципы: curious not corporate · playful but precise · slightly accusatory · warm not professional · anti-finance-jargon.

### Архитектура продукта

```
┌─────────────────────────────────────────────────┐
│           BRAND LAYER (consumer UX)             │
│   «Where does your money sleep?»               │
│   One product, one narrative                    │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│      MoneyFlowRulesEngine (core)               │
│   Generic: Trigger → Condition → Action        │
│   MVP exposes: Salary-split (one rule type)    │
│   Phase 2+: buffer top-up, round-ups, etc      │
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

### ICP (Ideal Customer Profile)

**Crypto-paid фрилансеры / DAO contributors / remote workers globally**:

- Возраст 22-35
- Получают зарплату в USDC через Deel/Toku/Bitwage/Superfluid/direct
- Месячный paycheck $1k-$10k
- Уже имеют 2-5 близких друзей в той же категории
- Хотят копить на shared goal (квартира, путешествие, оборудование, бизнес)

**Не emerging markets ICP — JOB-based segmentation.** Украинский Solidity dev, бразильский UX designer, канадский DAO contributor, аргентинский маркетолог — все попадают.

**Beta cohort №1**: Daniel + друзья (Lisbon-квартира).

---

## Часть 3: Market & Competition

### Конкурентный landscape

Каждая из 4 ключевых фич существует зрелой, но **никто не объединяет всех четырёх**:

| Фича | Кто умеет | Лидер |
|---|---|---|
| Auto-split paycheck | Acorns, Bitwage, Toku | Acorns (5M users, $7B AUM) |
| Group savings vault | Revolut, Joola, Frich | Revolut (45M users) |
| Rules engine | Qapital, Squads, Superfluid | Qapital (2M users) |
| RWA yield aggregation | Ondo direct, Pendle | Ondo (TVL $500M+) |
| **Все четыре вместе** | **никто** | — |

### Главная угроза

**Revolut Group Vaults**:
- 45M пользователей, дистрибуция, brand
- Group vaults уже работают (запущено 2023)
- Могут добавить crypto + DeFi yield в любой момент
- **Окно 12-24 месяца** до конкуренции

### Защита (moat)

Дифференциация **не в фичах**, а в **ICP**:

- Revolut требует local банковский счёт, EU/UK KYC
- Coinbase ограничен US compliance
- Bitwage/Toku — только payroll
- Apple Cash — только iPhone, US

А crypto-native фрилансер globally — **необслуживаемая категория**. Мы строим для них с первого дня.

### Уникальность 8/10 по комбинации фич + ICP

---

## Часть 4: MVP Product Spec

### Onboarding (5 минут)

1. Sign up через Privy (email/wallet)
2. Линкует salary-wallet (USDC address куда приходит зарплата)
3. Настраивает personal split одним слайдером:
   - 60% → wake up your money (yield positions)
   - 25% → friends pile (group goals)
   - 15% → for spending
4. Выбирает risk template:
   - Conservative: Ondo USDY (~5%)
   - Balanced: mix USDY + sUSDe (~7%)
   - Aggressive: sUSDe + Maple (~9-12%)
5. Создаёт или присоединяется к group vault (по invite link)
6. Setup goal: название, target $, deadline

### Core user flows (MVP)

✅ Auto-split при поступлении USDC на linked wallet
✅ Personal yield positions работают по выбранному template
✅ Yield daily-drip в group vault'ы где юзер participates
✅ Manual boost в group vault
✅ Withdraw personal yield в любой момент (instant из liquid sources)
✅ Withdraw свою долю из group vault в любой момент (pro-rata, без согласия группы)
✅ Создание группы по invite link
✅ Real-time прогресс к цели

### Главные экраны

1. **Home** — personal balance + group goals progress + next salary indicator
2. **Friends pile** — group vault page (progress, contributors, leaderboard, milestones)
3. **Your sleeping money** — personal investments (positions, daily yield, withdraw)
4. **Settings** — salary split slider, risk profile, notifications

### Что НЕ в MVP (Phase 2+)

❌ Украинские облигации (нужен партнёр-брокер)
❌ Copy-investing / «invest with me»
❌ Advanced allocation panel (выбор протоколов вручную)
❌ Mobile native app (web first)
❌ Multi-currency (только USDC)
❌ Power-user rule builder (visual editor)
❌ Дополнительные rule types (buffer top-up, round-ups, catch-up)
❌ Bonus mechanics для приглашений (Phase 2 после product validation)

---

## Часть 5: Бизнес-модель

### Revenue streams

**MVP**: Performance fee 10-15% от заработанного юзером yield.

**Расчёт**:
- $1M TVL × средний 8% APY × 12% fee = **$9.6k/год**
- $10M TVL = **$96k/год**
- $50M TVL = **$480k/год**
- $100M TVL = **$960k/год**

**Phase 2**: добавляется spread на свапах (0.1-0.3% при минте/редемпшене) когда заработают multi-source vaults.

**Phase 3+**: возможно management fee (0.5% от TVL), token launch если регуляторика позволит.

### Стоимость запуска

| Item | Cost |
|---|---|
| Юр.структура (LLC + service agreements) | $10-15k |
| Smart contract аудит (3-й сторонний) | $5-10k (Phase 1.5) |
| Hosting / infrastructure | ~$200/мес |
| Privy / Helius / другие services | ~$300/мес |
| Анна + Daniel time | 8-10 недель, salary free (равные founders) |
| **Total cash до launch** | **~$15-20k** |

### Фандинг

- **Не нужен** для MVP launch
- **После MVP traction** (3-6 мес): seed $100-300k через ангелов
- **Цель grants**: Solana Foundation $50k + Мінцифри × Binance contest
- **VC seed (Phase 2-3)**: $500k-$1M когда есть PMF signal

---

## Часть 6: Go-to-Market

### Главный инсайт

**Product inherently viral**. Каждый group vault требует 2-5 человек = каждый активный юзер приводит N друзей **по дизайну продукта**. CAC ≈ $0 если продукт работает.

### Phase 0: Friends & Family (week 1-8, до MVP launch)

**Цель**: 3-5 групп готовых к launch.

- Lisbon-группа Daniel'а = beta cohort №1
- 2-4 других friend groups в сети Daniel/Anna
- Pre-launch waitlist лендинг на oxar.app

### Phase 1: Hackathon & Crypto network (month 2-3)

**Цель**: 50-100 групп, 200-500 юзеров.

- Colosseum hackathon network (Daniel прямо сейчас там)
- @the_oxar Twitter — Build in Public стратегия (1 пост/день)
- Crypto-paid freelancer communities (Telegram, Discord, Reddit)
- Hackathon prize visibility (если попадёт в финал)

### Phase 2: Ecosystem partners (month 3-6)

**Цель**: 500+ групп, 2-5k юзеров.

- Solana Foundation grant ($50k + co-marketing)
- Crypto payroll partnerships: Toku, Bitwage, Superfluid, Deel
- RWA co-marketing: Ondo, Maple, Ethena
- Conference circuit: Solana Breakpoint, Bali, Token2049

### Phase 3: Content & PR (month 4-9)

**Цель**: 5k+ юзеров, tier-1 media mentions.

- Blog + Newsletter weekly
- Founder PR (Crypto Twitter tier-1)
- Crypto media pitches (Defiant, Decrypt, CoinDesk)
- YouTube short videos

### Phase 4: Paid acquisition (month 9+, ТОЛЬКО после PMF)

**Триггер**: 30-day retention >40%, organic growth flattening, LTV>$50/user.

- Crypto Twitter sponsored
- Substack newsletter sponsorships
- Influencer partnerships

### Что НЕ делать

❌ Paid ads до 1000 organic юзеров
❌ Referral cashback из казны без лимитов (выгорает за 6 мес)
❌ Token launch в первые 12 месяцев
❌ Cold DMs в Telegram
❌ Lottery / gambling-like механики (регуляторика + brand mismatch)

---

## Часть 7: Юридическая структура

### Что меняется vs старая модель

| Аспект | Старая (Securities tokenization) | Новая (UX gateway) |
|---|---|---|
| Юр.форма | SPV + securities license | LLC + service agreements |
| Регуляторика | $70k+ securities filing | $10-15k payment gateway |
| Custody | Мы custody облигаций | **Не custody** (smart contracts non-custodial) |
| Эмиссия | Мы эмитент security token | **Не эмитент** ничего |
| Аудиты | Required ongoing | Optional (smart contract audit рекомендуется) |
| Time-to-launch | 6-12 месяцев | 2-3 месяца |

### Что мы НЕ делаем (защищает структуру)

- Не эмитируем токены под obligations
- Не custody средств юзеров (non-custodial multisig vaults)
- Не даём investment advice (просто доступ к источникам)
- Не gateway in/out fiat (юзеры приходят с USDC)
- Не KYC при минимальных TVL thresholds (Phase 2 при $10M+ TVL рассмотрим)

### Что нужно сделать

1. **Aurum consultation** на тему обновлённой структуры (~$2-3k для setup advice)
2. **Smart contract design** с явным non-custodial pattern (multisig group vaults, pro-rata claims)
3. **Terms of Service** which клиренят nature продукта (не investment, не securities)
4. **Geo-blocking** от US persons если потребуется (TBD по совету Aurum)

---

## Часть 8: Phase 2-4 Roadmap

### Phase 2 (3-6 месяцев после launch)

- 🇺🇦 Украинские облигации через брокера (Univer / ICU / Kinto / Goldman Solutions)
- 📐 Дополнительный rule type: «Buffer top-up» («Top up my checking from yield»)
- 👯 Copy-investing / «Invest with me» механика
- 💰 Round-up rule type (Acorns-style)
- 🎁 Bonus mechanics для приглашений (group size boost + first-deposit match)

### Phase 3 (6-12 месяцев)

- 📦 Catch-up rule («Group отстаёт — auto-pull»)
- 🏆 Milestone bonus mechanics (group unlocks)
- 📱 Solana mobile native app
- 💵 Multi-currency support (EUR, BRL stablecoins)
- 🌍 Сравнительный SEO contenthub по EM yields

### Phase 4 (12+ месяцев)

- ⚙️ Power-user mode: visual rule builder
- 🪙 Token launch (если регуляторика позволяет)
- 🗳 DAO governance над protocol params
- 🌎 Geographic expansion (Brazil, Turkey bonds через partners)

---

## Часть 9: Risks & Mitigations

### Risk 1: Revolut / Coinbase / Robinhood входят в категорию

**Mitigation**:
- Launch быстро (8 недель)
- Build moat через ICP (crypto-paid, не bank-native)
- Sticky retention через group vaults (друзья не уходят пока цель не достигнута)

### Risk 2: Anna не апрувит pivot

**Mitigation**:
- PDF на десктопе у Анны (отправлен 22 мая)
- Daniel звонит ей сегодня для discussion
- Готовы fallback варианты (hybrid модель, частичный pivot)

### Risk 3: Lisbon-группа не commit'нётся на $300/мес

**Mitigation**:
- Commitment test до начала разработки
- Если меньше 3 YES — корректируем спек до кода
- Customer interviews с 5 внешними фрилансерами как back-up validation

### Risk 4: Юр.вопросы вокруг multi-user vaults

**Mitigation**:
- Строго non-custodial smart contract design
- Каждый user — pro-rata claim, withdrawable без согласия других
- НЕ pooling decisions, НЕ investment club
- Aurum review до deployment

### Risk 5: Yield source riski (depeg, default)

**Mitigation**:
- На старте только Ondo USDY (самый стабильный, US Treasury-backed)
- Maple / sUSDe / Sky добавляются поэтапно с warnings
- Diversification внутри Aggressive template (никогда 100% в одном источнике)
- Real-time monitoring + автоматическая pause если depeg >2%

### Risk 6: Не достигаем PMF за 6 месяцев

**Mitigation**:
- Customer interviews + commitment test до кода — снижают вероятность
- Lean MVP — 8 недель, не 6 месяцев
- Fast iteration после launch (weekly releases)
- Если 30-day retention < 30% к месяцу 4 — переоценка стратегии

---

## Часть 10: Что мы НЕ делаем

Явный список того что осталось за рамками pivot:

❌ **OXAR Radar** (RWA wallet analyzer) — отдельный продукт-исследователь, был на oxar.app, теперь убран. Существует на radar.oxar.app как stand-alone, не приоритет.

❌ **Свой синтетический стейблкоин oxUSD** — обсуждали, отвергли. Слишком юр.сложный, premature.

❌ **Свои токены на облигации** (oxUA-UAH, oxUSD-WAR) — отвергнуто. Securities territory, $70k+ юр.

❌ **Войны / war-bond фрейминг** — продукт positioned как EM yields, не conflict-narrative.

❌ **DAO / token launch на старте** — Phase 3-4, не MVP.

❌ **DeFi-агрегатор для DeFi natives** — мы строим для mainstream crypto users, не для DeFi power users. Backyard/Yearn в этой нише — не наша.

---

## Часть 11: Assignment Daniel-у (ближайшие 7 дней)

### 1. Anna approval (день 0)

- Звонок сегодня
- Решение pivot Yes/No
- Если No — варианты hybrid модели

### 2. Customer research (week 1, 5 интервью)

С crypto-paid фрилансерами не из своей сети. Вопросы:

- Сейчас как ты копишь с друзьями?
- Что обычно фейлит когда копите вместе?
- Если бы существовал auto-split paycheck → group goal с yield — стал бы пользоваться?
- За какую цель готов commit на $X/мес?

Записать дословно. Это база для onboarding copy и feature priorities.

### 3. Commitment test (week 1)

Lisbon-группа напрямую:

> «Если я запущу продукт через 8 недель и засетапим Lisbon vault с auto-debit $300/мес до $80k или 24 месяцев — вы commit сейчас?»

Если < 3 YES → корректируем спек
Если 3+ YES → идём в код, есть beta cohort

### 4. Aurum consultation (week 1-2)

Обновлённый юр.запрос:
- Confirm structure для UX-layer без эмиссии
- Smart contract design review для non-custodial pattern
- Geo-blocking requirements

### 5. Pre-launch landing (week 2)

Simple landing на oxar.app:
- «Where does your money sleep?»
- Email capture
- Invite-a-friend mechanic
- Цель: 50-100 emails к моменту launch

### 6. Eng review с написанием implementation plan (week 2)

Запуск `/plan-eng-review` для архитектуры и `/write-plan` для разбиения работы.

---

## Часть 12: Success Criteria

### 30 дней после launch

- 30+ group vaults создано с 2+ contributors
- $50k+ TVL across personal + group positions
- 30%+ юзеров имеют активный auto-salary-split
- Median group vault: 3+ contributors, 2+ месяца retention
- 10+ unsolicited testimonials
- 1+ group vault достигает первого milestone

### 6 месяцев после launch

- 500+ active group vaults
- $1-2M TVL
- 40%+ 30-day retention
- 2-3 ecosystem partnerships закрыты (Toku/Bitwage/Ondo)
- Solana Foundation grant получен или в активной переписке

### 12 месяцев после launch

- $10M+ TVL
- 5k+ active users
- Phase 2 features released (UA bonds, copy-investing, additional rule types)
- Seed round attracted ($300k-$1M)
- Tier-1 crypto media coverage

---

## Часть 13: Open Questions

1. **Fee structure**: 10% vs 15% performance fee — нужен customer research
2. **Salary wallet integration**: read-only address watching vs full integration (Coinbase/Phantom API)
3. **KYC threshold**: при каком TVL включаем KYC? (TBD с Aurum)
4. **Multi-chain**: Solana only на MVP, EVM в Phase 2-3?
5. **Mobile**: web responsive на MVP, native app когда?
6. **Pricing transparency**: показывать ли fee на каждом yield-источнике или агрегированно?
7. **Group conflict resolution**: что если кто-то хочет вывести а другие не согласны? (юридически — non-custodial значит они могут, но UX-question)
8. **Tax compliance**: предоставляем ли CSV exports для tax reporting? Phase 2.

---

## Часть 14: Связанные документы

- **2026-05-15-oxar-radar-design.md** — Radar design (отдельный продукт, не приоритет)
- **2026-05-22-evolution-discussion-for-anna.md** — preliminary discussion с Анной (superseded этим документом)
- **2026-05-22-protocol-pre-launch-traction.md** — pre-launch tactics (адаптировать под новую модель)
- **2026-05-23-oxar-mvp-design.md** — детальный MVP design (technical spec)

---

## Часть 15: Финальное замечание

Этот pivot — не отказ от первоначальной миссии. Это **корректировка пути к той же цели**: дать crypto-нативным людям доступ к качественным yield-источникам, начиная с украинских облигаций.

Что изменилось:
- **Темп**: 8 недель до launch вместо 12 месяцев
- **Юр.стоимость**: $15k вместо $70k+
- **Аудитория**: глобальная crypto-paid generation вместо узкой украинской диаспоры
- **Продукт**: UX поверх инфраструктуры вместо своей securities tokenization
- **Brand**: playful & consumer вместо institutional & technical

Что НЕ изменилось:
- **Команда**: Daniel 63% + Anna 37%
- **Tech foundation**: Solana, Privy, наш существующий стек
- **Долгосрочная миссия**: открыть доступ к EM yields для crypto-аудитории (украинские облигации — Phase 2 priority)
- **Личная инвестиция**: Daniel сам клиент собственного продукта прямо сейчас

Мы строим компанию которая **запустится в этом году** — а не «через год если юристы дадут добро».

---

*Документ готов к шерингу с Анной, юристами, потенциальными партнёрами и инвесторами.*
