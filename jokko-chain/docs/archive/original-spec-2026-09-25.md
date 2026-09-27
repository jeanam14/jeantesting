# Jokko Chain — Project Instructions for Claude Code

## What this is
A non-custodial mobile crypto wallet for West/Central Africa (UEMOA/CEMAC) and the diaspora.
Jokko Chain builds the interface only. Every fiat-touching, staking, swap, and lending action
is delegated to a regulated/specialized third-party provider. Jokko Chain never takes custody
of user funds at any point.

**Platform:** Mobile only — iOS + Android, via Expo (React Native) + TypeScript.

---

## Non-negotiable architecture rules

These come from Jokko Chain's regulatory position (non-custodial → not a money transmitter).
Do not violate them even if a feature would be easier to build otherwise:

1. **Never enable Privy delegated actions** (server-signed transactions on a user's behalf).
   Every transaction must be signed client-side by the user.
2. **Never store or proxy user private keys** on our backend. Privy handles key generation
   and reconstitution client-side (Shamir's secret sharing + TEE) — our backend never sees them.
3. The phone-number-send feature uses Privy's `importUser` / pregenerate-wallet flow: a wallet
   is created for the recipient's phone number at send time, funds go directly on-chain to that
   address, and Jokko Chain has no signing authority over it before or after claim.
4. Address screening (sanctions/illicit-activity checks) should be integrated before mainnet
   launch — provider TBD (Chainalysis / TRM Labs / Elliptic). Flag interactions, don't silently
   block, unless a hard sanctions match.
5. Bridge, IvoryPay, Fonbnk handle all KYC/AML for fiat-touching flows. We never collect or
   store KYC documents ourselves — we redirect/embed their flows.
6. **Never enable Privy's custodial wallet mode** (launched 2026, backed by Bridge's custody
   infrastructure, offered alongside Privy's normal self-custodial embedded wallets). Jokko Chain
   uses **self-custodial embedded wallets only** — flipping this setting, even accidentally,
   turns the wallet custodial and breaks the entire non-custodial/not-a-money-transmitter position
   this project is built on.

**Note on naming:** "Bridge" (the Stripe company, our fiat ramp provider) and "bridging" (moving
crypto assets between chains, e.g. Layerswap's job) are unrelated despite the shared word. Bridge
does fiat↔stablecoin conversion and custody — it has no role in crypto-to-crypto or cross-chain
functionality.

---

## Chains and capability matrix

Wallet creation covers 4 chains via Privy. Feature availability differs per chain — **do not
build UI that implies a feature exists where the underlying protocol doesn't support it**:

| Chain    | Wallet | Stake (Everstake) | Swap/Bridge (Layerswap) | Borrow (Aave V3) | Card spend (Immersve/Rain) |
|----------|--------|--------------------|--------------------------|-------------------|------------------------------|
| Ethereum | ✅     | ✅                 | ✅                       | ✅                | ✅ |
| Polygon  | ✅     | ✅                 | ✅                       | ✅                | ✅ |
| Solana   | ✅     | ✅                 | ✅ (as bridge leg)       | ❌ not deployed   | ❌ not supported — convert to an EVM asset first |
| Bitcoin  | ✅     | ❌ no PoS          | ✅ (as bridge leg)       | ❌ no smart contracts | ❌ not supported — convert to an EVM asset first |

UI implication: hide the Stake tab for Bitcoin, hide the Borrow tab for Solana and Bitcoin.
Store this as config (`chain_capabilities` table or static map), not hardcoded per-screen logic.

---

## Design direction

Reference screenshots: 8 screens from the existing (unfinished) dev build in `/design/existing-build/`,
plus 2 Revolut screens in `/design/reference/` for layout inspiration only (not our branding).

**Overall positioning:** this should feel like a neobank app, not a crypto app. Non-crypto users
should never need to understand "chains" or "gas" to use it — those are implementation details,
not user-facing concepts. Lead with familiar financial-app language (balance, send, receive, buy,
sell) over crypto jargon.

**Home screen:**
- Keep: Total Balance header, Buy/Send/Receive/Sell action row, per-asset balance list below
- Change: replace the "Trending" tab (next to "My wallet") with **"History"** — transaction history,
  not trending tokens
- Remove: the large rotating card banner ("Instant transfer worldwide")
- Keep: the small promo tiles below the banner (staking promo, swap promo) as static cards, not a carousel

**Send/receive as chat-like threads:** group a contact's sent/received transactions into a
conversation-style thread (message bubbles, not a flat transaction list) — pure UI/data-modeling
change, group `transactions` by counterparty in the query layer, no new provider involved.

**Branding:** dark green background, lime green (`#c6f24e`-ish, sample exact hex from the existing
build's assets) as the primary accent, Jokko Chain logo/wordmark as shown in the Card waitlist screen.

---

## Advanced features

**Simplified security/recovery** — maps directly onto Privy's existing recovery model, not a custom build:
- Default: Privy's automatic recovery already ties wallet access to phone-number login — this
  *is* "phone number recovery," no extra work needed.
- After onboarding, in Settings, prompt the user to add a stronger recovery factor: Google Drive
  (Android + iOS) or iCloud (**iOS only** — Android has no iCloud equivalent, use Google Drive there).
- Also in Settings (progressive disclosure, not forced): an option to reveal the underlying
  recovery phrase/private key for users who want full self-custody control.

**Send by phone number** — as previously specced: Privy pregenerates a wallet for the recipient's
phone number; if they already have Jokko Chain, it's wallet-to-wallet; if not, send an SMS/WhatsApp
claim link via Twilio.

**Gasless transactions** — real, via Privy's smart-wallet (ERC-4337) upgrade path plus a paymaster
(Alchemy, Biconomy, ZeroDev, or Pimlico) registered in the Privy dashboard. Works on Ethereum and
Polygon. Solana needs a separate fee-payer/relayer implementation. Bitcoin has no smart contracts,
so gasless doesn't apply there — set that expectation in the UI rather than promising it everywhere.

**Multi-source pull (spend across chains/assets in one send)** — the hardest item in scope. See
Particle Network entry in the provider map above. Recommendation: phase 2, not v1.

---

## Provider map

| Function | Provider | Chains | Notes |
|---|---|---|---|
| Wallet infra / key management | **Privy** | ETH, Polygon, Solana, Bitcoin | Non-custodial, key-split + TEE. Pregenerate wallets for phone-send. |
| RPC / node access | **QuickNode** | ETH, Polygon, Solana, Bitcoin | One account covers all 4 chains — only major provider that does Bitcoin + EVM + Solana together. |
| Fiat ramp (mobile money, XOF/XAF) | **IvoryPay**, **Fonbnk** | n/a (fiat↔stablecoin) | **Verify current country/currency coverage directly with each provider** — public docs don't clearly confirm UEMOA/CEMAC coverage for IvoryPay, and Fonbnk historically settled on Stellar — confirm which chain(s) they settle to today. |
| Fiat ramp (USD/EUR, diaspora) | **Bridge** | n/a | Custodial/centralized on Bridge's side — keep entirely out of the user-key path. Good for diaspora funding in USD/EUR, not the XOF/XAF mobile money rail. |
| Staking | **Everstake** | ETH, Polygon, Solana | One integration, three chains. |
| Cross-chain swap/bridge | **Layerswap** | ETH, Polygon, Solana, Bitcoin | On-ramp path for BTC/SOL into EVM-borrowable assets. |
| Same-chain swap (DEX aggregation) | **1inch or 0x** (EVM), **Jupiter** (Solana) | ETH, Polygon, Solana | Layerswap does not aggregate same-chain DEX routes — needed for a plain "swap ETH for USDC" action. **Alternative:** consolidate same-chain + cross-chain under **LI.FI** instead of running Layerswap + a separate aggregator — open decision, see below. |
| Borrowing/lending | **Aave V3** | ETH, Polygon | Same Pool contract interface on both chains — one adapter, chain-configured. Morpho deferred until its Polygon deployment exits "infrastructure mode." |
| Card payments (own-liquidity on-ramp) | **Transak, MoonPay, Ramp Network, or Banxa** — pick one | n/a | **Not CinetPay** — CinetPay only aggregates payment methods into a merchant account, it has no crypto on the other side. Jokko needs a provider whose own liquidity delivers the crypto, same pattern as IvoryPay/Fonbnk, so Jokko never holds a crypto position. |
| SMS + WhatsApp (OTP, claim links) | **Twilio** | n/a | One integration for login OTP and phone-number-send claim notifications. |
| Gas sponsorship (gasless) | **Privy smart wallets + a paymaster** (Alchemy, Biconomy, ZeroDev, or Pimlico) | ETH, Polygon | Solana needs a separate fee-payer/relayer pattern, not the same paymaster mechanism. Bitcoin has no gasless concept — sends always carry a small BTC fee. |
| Chain abstraction (multi-source pull) | **Particle Network Universal Accounts** — open decision | ETH, Polygon, Solana (not Bitcoin) | For "pull $10 from 3 different chains/assets to fulfill one send." Newer/smaller vendor than the rest of this stack — treat as phase 2, not a v1 requirement, unless it's core to the pitch. Alternative: build custom routing on LI.FI instead of adding this vendor. |

---

## Backend & infra

| Layer | Choice |
|---|---|
| Backend | Node.js + TypeScript, Fastify or NestJS |
| Primary DB | PostgreSQL (Neon or Supabase) |
| Cache/queue | Redis (Upstash) |
| Hosting | Fly.io or Railway (MVP) → AWS/GCP later |
| Secrets | Doppler or AWS Secrets Manager — never plain `.env` in git |
| Monitoring | Sentry + Grafana/Datadog |
| Push notifications | Firebase Cloud Messaging |
| CI/CD | GitHub Actions + Expo EAS Build |
| Analytics | PostHog |
| Address screening | TBD — Chainalysis / TRM Labs / Elliptic |

### Suggested DB tables (starting point, refine as needed)
- `users` — phone/email, KYC status reference (not documents), referral code
- `wallets` — user_id, chain, address, privy_wallet_id
- `ramp_sessions` — provider, direction, fiat currency, amount, status, webhook history
- `staking_positions` — user_id, chain, validator, amount, status
- `loans` — user_id, chain, collateral asset, borrowed asset, health factor, status
- `swap_transactions` — provider, from_chain, to_chain, from_asset, to_asset, status
- `chain_capabilities` — chain → {stake: bool, borrow: bool, swap: bool}

---

## Build phases

1. **Repo setup** — Expo + TypeScript scaffold, this CLAUDE.md, testnet config for all providers
2. **Auth + wallet creation** — phone/OTP login, Privy wallet creation, pregenerated wallets for phone-send
3. **On/off-ramp** — IvoryPay + Fonbnk (XOF/XAF) and Bridge (USD/EUR), webhook handling, status screens
4. **Swap** — Layerswap integration, cross-chain routing UI
5. **Staking** — Everstake, per-chain validator selection
6. **Borrowing** — Aave V3 on Ethereum + Polygon, health-factor display, liquidation warnings
7. **Compliance + hardening** — address screening integration, security review, before mainnet

---

## Design reference
Screenshots live in `/design/<screen-name>/<state>.png` (empty, loaded, error per screen).
Treat them as **visual reference only** — rebuild natively in Expo/React Native components,
do not port any web/Lovable-generated code.

---

## Cash top-up (Julaya) — unresolved liquidity question

Flow as specced by founder:
1. User selects "cash" in the top-up flow and enters an amount
2. Jokko generates a unique, single-use transaction code
3. User goes to a Julaya cash collection point, hands over cash + code, gets a receipt
4. Jokko receives/confirms that receipt from Julaya
5. Julaya settles the fiat (no crypto) to a bank account
6. Crypto is sent to the user's wallet

**Open architectural decision on step 5/6 — read before building:** as specced, step 6 has
*Jokko itself* supplying the crypto from its own liquidity, in exchange for the fiat Julaya
settles to *Jokko's own* bank account. This directly conflicts with the zero-liquidity principle
applied to every other ramp method in this doc (IvoryPay, Fonbnk, Bridge, and the card on-ramp
above all deliver crypto from their own liquidity, never Jokko's). Two ways to resolve this —
founder to decide before this flow is built:
- **(A)** Accept Jokko runs its own crypto liquidity for this one channel — requires a treasury
  function, price-risk management between cash confirmation and crypto send, and a compliance
  review specific to this channel (it may change Jokko's regulatory classification).
- **(B)** Have Julaya settle into an account controlled by IvoryPay, Fonbnk, or a dedicated
  liquidity/OTC partner instead of Jokko's own account, with that party executing the crypto send
  once the receipt is confirmed — Jokko stays an orchestration layer only, as elsewhere. Requires
  confirming directly with IvoryPay/Fonbnk whether they can accept a Julaya receipt as a release
  trigger (not something their public docs will answer).

**Three options on the table (founder, [date of this session]):**
1. **Own liquidity** — Jokko sources crypto itself (exchange/OTC), sends to user. Cheapest
   potential cost (Julaya 1% + Jokko's own sourcing cost, likely well under IvoryPay's 3%), but
   Jokko holds the crypto position — see compliance note above.
2. **Julaya → Jokko (fiat) → IvoryPay (crypto to user)** — Jokko briefly holds customer *fiat*
   in transit. Cost floor: Julaya 1% + IvoryPay 3% = 4%, plus a likely extra bank-transfer fee for
   the added hop. Briefly holding customer fiat is its own form of touching funds — distinct from
   crypto custody, but can raise its own e-money/payment-facilitator licensing questions. Flag for
   legal counsel, not resolved here.
3. **Julaya → IvoryPay directly, IvoryPay → user** — Jokko never touches fiat or crypto. Same
   4% cost floor as Option 2 (IvoryPay's fee doesn't change with routing), no extra hop. Cleanest
   compliance profile, but needs confirming with both partners: can Julaya settle to a *third
   party's* account instead of the merchant's own, and can IvoryPay treat a Julaya reference code
   as a release trigger for a transaction it didn't originate? Neither is answerable from outside —
   direct conversation with both required.

**Cost note:** Options 2 and 3 cost the same (4% floor) since IvoryPay's fee is routing-independent.
Only Option 1 can lower the floor, at the cost of taking back the liquidity position. Consider
treating cash top-up as a breakeven acquisition channel (margin made elsewhere — swap spread,
borrow spread, staking take-rate) rather than expecting it to carry its own profit margin, and
disclosing the ~4% cost transparently as a cash-handling fee (comparable to or cheaper than
Western Union/MoneyGram/mobile-money agent cash rates in the region).

**Regardless of which option is chosen:** the code/receipt matching step needs server-side
one-time-use enforcement and amount verification — a reused code or mismatched amount is a real
fraud surface in a manual cash-handoff flow.

### New DB table
- `cash_topup_codes` — user_id, code (unique), amount, status (pending/confirmed/expired/redeemed), julaya_receipt_ref, created_at, confirmed_at

---

## Waitlists (not built yet, or partial)

- **Card waitlist** — already exists in the current design (screenshot reference). Goal: a
  virtual/physical card linked directly to the Jokko wallet, spending on-chain balances with
  real-time conversion at point of sale — not a separate pre-loaded account. That specific model
  is a category called crypto card issuing-as-a-service. Candidates, in order of fit:
  - **Immersve** (Mastercard) or **Rain** (Visa) — purpose-built for self-custodial wallets like
    Jokko's: user connects their wallet, spends directly from on-chain balance, provider converts
    to fiat in real time at the point of sale. Closest match to the actual goal. Caveats: EVM
    chains only (Ethereum, Polygon, Arbitrum, Base, BNB Chain, Sei on Immersve) — no Solana or
    Bitcoin support, and UEMOA/CEMAC coverage is unconfirmed (needs a direct conversation, not
    assumed from their other rollouts).
  - **UPay** — genuinely crypto-funded, but appears to be their own direct-to-consumer card/app,
    not a third-party embeddable API. Confirm directly whether they offer a white-label/API
    program before counting on this — as it stands it looks like a referral to a separate UPay
    account, not a Jokko-linked card.
  - **Union54** — real African card-issuing infrastructure, but **not crypto-native at all**. It
    provides the card rails only (BIN sponsorship, processing, issuance); Jokko would have to
    build the entire wallet-balance-to-fiat funding logic itself on top of it. Worth it only if
    Immersve/Rain don't cover the target market and an African-native issuing relationship
    matters more than a ready-made crypto-spend integration.
- **Business account waitlist ("Jokko for Business")** — not yet designed. Same pattern: simple
  email-capture screen, no backend logic beyond storing the signup.
- New DB table: `waitlist_signups` — email, product_interest (`card` | `business`), locale, created_at

## Localization — decide now, not later

The existing build mixes English (most screens) and French (promo tiles: "Gagne jusqu'à 6% par
an," "Echange librement") inconsistently. For a UEMOA/CEMAC-first product this needs a real
decision, not ad hoc strings: **route every user-facing string through an i18n layer from day
one (French + English minimum)**. Retrofitting this after screens multiply is real rework —
build it in now.

## Built for extensibility — expect many undecided future features

This app will grow features that aren't decided yet. Build accordingly, not just "aim for" this:
- **Feature-flag layer**: a Postgres-backed `feature_flags` table (flag name, enabled, user
  segment) is enough for now — gate new features behind it rather than hardcoding them in.
- **Bottom nav is already full** (Home, Swap, Card, Borrow, Invest = 5 icons, a comfortable
  mobile maximum). Any new major feature (Business, or anything else) needs a "More" overflow
  pattern designed in now, not squeezed in as a 6th icon later.
- **Every provider integration follows the adapter pattern already used elsewhere in this doc**
  (chain-configured, swappable) — this is what lets a provider be swapped or a chain added later
  without a rewrite. Treat this as a hard rule for all future provider integrations, not just the
  ones named in this doc.

## Cross-cutting technical rules (apply everywhere, easy to get subtly wrong)

- **Never use floating-point numbers for money or crypto amounts** — use a proper decimal
  library end to end. Floating point will eventually produce a balance rounding error.
- **Every provider webhook needs idempotency handling** (Julaya, IvoryPay, Fonbnk, the card
  on-ramp, Aave events, Everstake) — a retried or duplicate webhook must never double-credit a user.

---

## Open items — needs founder input before/during build
- [ ] Confirm IvoryPay and Fonbnk actual XOF/XAF country coverage (replaces earlier Yellow Card/Transak assumption in compliance drafts)
- [ ] Address screening provider decision (Chainalysis / TRM / Elliptic)
- [ ] Feature order for v1: all four core features at once, or phased (ramp + wallet core first)?
- [ ] Referral program — in v1 scope or later?
- [ ] App bundle identifier (iOS + Android)
- [ ] Registered entity name + jurisdiction for Privy/Bridge KYB (or confirm sandbox-only for now)
- [ ] Same-chain swap: 1inch/0x + Jupiter alongside Layerswap, or consolidate everything onto LI.FI?
- [ ] Multi-source pull (Particle Network Universal Accounts): confirm phase 2, or must-have for v1?
- [ ] Confirm with existing dev team whether their build ever wired up Solana and Bitcoin — current screenshots only show Ethereum/Polygon/BNB Smart Chain assets
- [ ] Existing dev team's code: hand off to Claude Code once received, or keep it out to avoid biasing the rebuild (per founder's current preference)
- [ ] **Julaya cash top-up: resolve the liquidity question (Option A vs B above) — this affects Jokko's regulatory position, not just implementation**
- [ ] Pick one card on-ramp: Transak, MoonPay, Ramp Network, or Banxa
- [ ] Card issuing provider: confirm Immersve or Rain's UEMOA/CEMAC coverage (best fit — wallet-linked, real-time crypto spend), vs UPay's white-label availability (unconfirmed), vs building on Union54 (non-crypto rails, more build work)
- [ ] Business account ("Jokko for Business") scope — not yet defined beyond a waitlist
