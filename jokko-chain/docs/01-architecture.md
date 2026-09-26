# Architecture

Status: **proposed** (no code yet). IDs like D5 / P1 refer to `00-decision-log.md`.

## 1. Principles

1. **Jokko never holds funds or keys.** Keys are generated and used through Privy, and
   transactions are signed on the user's device only. Jokko's servers can read public chain
   data, talk to providers, and send notifications. They cannot move user funds.
2. **The blockchain is the source of truth for balances.** Our database is an index and cache
   for history, threads, notifications and reporting. Sending decisions always use a fresh
   on-chain balance.
3. **Every provider sits behind an adapter.** Each adapter implements a typed interface, is
   configured per chain, and can be swapped out. No screen and no business rule may call a
   provider SDK directly.
4. **Config, not code, decides availability.** Chains, assets, capabilities, feature flags,
   limits and thresholds live in configuration. The server can **switch features off** as a kill
   switch, but can never switch on something the app's code doesn't support.
5. **Defence in depth.** Each layer assumes the one before it may have failed (see
   `02-security.md`).

## 2. System overview

```
                        ┌──────────────────────────────┐
                        │  Privy (auth + key shares,   │
                        │  TEE / Nitro enclaves)       │
                        └──────▲───────────────▲───────┘
            login, sign (user) │               │ verify access token (server)
┌──────────────────────┐       │               │        ┌──────────────────────────┐
│  Mobile app (Expo)   │───────┘               └────────│  Jokko API (NestJS)      │
│  • signs locally     │── HTTPS (attested) ───────────▶│  • no signing path       │
│  • builds unsigned tx│                                │  • webhooks, quotes,     │
│    from adapters     │── RPC (read + broadcast) ──┐   │    status, notifications │
└──────────────────────┘                            │   └───┬─────────┬────────────┘
                                                    ▼       │         │
                              ┌───────────────────────┐     │         │
                              │ Chains: Ethereum,     │◀────┘         ▼
                              │ Polygon, Solana, BTC  │  indexers  ┌──────────────────┐
                              │ (QuickNode + backups) │  webhooks  │ PostgreSQL, Redis│
                              └───────────────────────┘            └───────▲──────────┘
                                                                           │ read replica
  Providers (ramps, LI.FI, Everstake, Twilio, …) ◀──adapters──▶ Jokko API  │ (no PII views)
                                                                   ┌───────┴──────────┐
                              Staff (SSO + hardware key) ─────────▶│ Admin console +  │
                                                                   │ Metabase reports │
                                                                   └──────────────────┘
```

## 3. Repository layout (inside `jokko-chain/`)

```
apps/
  mobile/        Expo (expo-router), strict TypeScript
  api/           NestJS (Fastify adapter). HTTP API + webhook receivers
  workers/       Background jobs: indexer consumers, notification sender, escrow keeper,
                 health-factor monitor (later). Same codebase as api, separate process
  admin/         Staff-only admin console (Next.js), deployed on a private network behind SSO
contracts/       Phone-send escrow (Solidity + Foundry + OpenZeppelin), audited before mainnet
packages/
  core/          Money types, chain + asset registry, capability map, validation schemas (zod)
  adapters/      Provider interfaces + implementations, split into server/ and client/
  i18n/          French (default) and English strings
  ui/            Design tokens and shared React Native components
  config/        Shared lint, TypeScript and test configuration
infra/           Terraform (AWS), one workspace per environment
docs/            This documentation, plus docs/adr/ once code exists
design/          Screenshots and tokens
```

Package manager: **pnpm** workspaces with **Turborepo**, all rooted in `jokko-chain/`.

## 4. Technology choices

| Layer | Choice | Why |
|---|---|---|
| Mobile | Expo (managed, EAS Build), expo-router, TanStack Query, Zustand (minimal global state), react-hook-form + zod | Standard, well-supported stack; Privy has a first-party Expo SDK |
| Mobile security | expo-secure-store, expo-local-authentication, freeRASP (root / jailbreak / tamper / hook detection), App Attest / Play Integrity, screenshot blocking on sensitive screens | OWASP MASVS L2 + R target |
| Backend | NestJS on the Fastify adapter (P9) | DI modules map 1:1 to adapters; Fastify performance |
| Database | PostgreSQL 16+ (AWS RDS, Multi-AZ, encrypted, point-in-time recovery) | Relational integrity for money-adjacent records |
| ORM / migrations | Drizzle ORM, SQL migrations reviewed in PRs | SQL-first, explicit, no hidden queries |
| Jobs / queue | Redis (ElastiCache) + BullMQ, with a transactional outbox table | Reliable side effects (notifications, refunds) that never fire twice |
| Hosting | AWS eu-west-3 (Paris) — ECS Fargate, RDS, ElastiCache, KMS, Secrets Manager, WAF, CloudTrail, GuardDuty — all in Terraform (P8) | Fintech-grade controls from day one. Paris is the closest major AWS region to Dakar and inside GDPR; cross-border data transfer from Senegal to be confirmed by counsel (see `06`) |
| Smart contracts | Solidity, Foundry, OpenZeppelin, Slither + external audit | Escrow only (P2); nothing else on-chain is Jokko-owned |
| Admin | Next.js + our API (admin scope), Metabase on a read replica | See §10 |

Alternative for speed: Fly.io / Railway + Neon + Upstash, as the original spec suggested.
Faster to start, but it means migrating money-adjacent infrastructure later. Engineering
recommends AWS from the start.

## 5. Environments

| Env | Chains | Purpose | Isolation |
|---|---|---|---|
| `local` | Testnets / local forks | Developer machines | Local Postgres/Redis in Docker |
| `dev` | Testnets (Sepolia, Amoy, Solana devnet, Bitcoin testnet4/signet) | Integration | Own Privy app, own DB, provider sandbox keys |
| `staging` | Testnets | Production-like rehearsal, QA, pen test target | Mirrors prod infrastructure |
| `prod` | Mainnets | Real users | Separate AWS account, separate Privy app, restricted access |

- Each environment has its own **app bundle ID** (`com.jokkochain.app`, `.staging`, `.dev`), so
  builds can live side by side on a phone and can never share keys or sessions.
- The **network is compiled into the build.** A dev or staging build contains no mainnet
  configuration, and at startup the app asserts that its chain IDs match its environment.
- Each environment is a separate AWS account (AWS Organizations), so a mistake in dev cannot
  touch prod.

## 6. Wallet type (P1) — plain wallet vs smart account vs EIP-7702

Applies to Ethereum + Polygon only. Solana and Bitcoin don't have this choice.

| | Plain wallet (EOA) | Smart account (ERC-4337) | Plain wallet + EIP-7702 (**recommended**) |
|---|---|---|---|
| Address | Normal address | A **different** contract address | **Same** as the plain wallet |
| Jokko pays gas ("gasless") | ✗ user must hold ETH/POL | ✓ | ✓ |
| One-tap batches (approve + swap) | ✗ two signatures | ✓ | ✓ |
| Export key → MetaMask shows the funds | ✓ | ✗ funds sit at the contract address; needs a smart-account-aware wallet | ✓ |
| Compatibility with exchanges, ramps, dApps | Best | Good (some signature edge cases) | Same as plain wallet |
| Setup cost | None | Contract deployed per chain on first use (sponsorable) | One small delegation transaction (sponsorable) |
| Extra smart-contract risk | None | The wallet contract | The delegate contract (audited, pinned by address) |
| Maturity | Highest | Since 2023 | Mainnet since 2025 (Ethereum Pectra; Polygon Bhilai hard fork) |
| Can users still pay gas themselves if our sponsor is down? | n/a | Depends on bundler | ✓ it's still a normal wallet |

**What each option loses:**
- **Plain wallet:** no gasless sends. A new user who buys USDC can't send it until they also buy
  POL or ETH for fees. That is the single biggest UX failure in crypto onboarding.
- **ERC-4337:** a second address confuses users. Exporting to MetaMask shows an empty wallet,
  and every swap, ramp and bridge must be checked for contract-account support.
- **EIP-7702:** newest of the three. The one real new risk is a user being tricked into
  delegating to a malicious contract, which is why the app only ever signs a delegation to our
  pinned, audited delegate address and refuses any other.

**Setup:** Privy embedded wallet → EIP-7702 delegation to an audited implementation, via
**Alchemy** (Gas Manager + bundler) or ZeroDev. The sponsorship policy only allows allowlisted
contracts and methods, with per-user caps (see `02-security.md`). Before building, confirm with
Privy that EIP-7702 signing is supported in the Expo SDK (O1).

- **Solana:** gas sponsored by **Kora** (the Solana Foundation's fee relayer), run by us with a
  KMS-held fee-payer key that is only ever a fee payer.
- **Bitcoin:** no gasless option. Every send pays a small network fee, shown up front.

## 7. Networks and assets (D7, D8, P6, P7)

**Supported networks at launch:** Ethereum, Polygon, Solana, Bitcoin.

**Labels shown to users:**

| Network | Label | Example assets |
|---|---|---|
| Polygon | **Polygon** | USDC, USDT, POL |
| Ethereum | **Ethereum (ERC20)** | ETH, USDC, USDT |
| Solana | **Solana** | SOL, USDC, USDT |
| Bitcoin | **Bitcoin** | BTC |

**Asset list (home screen):**
- Each asset appears automatically once its balance is above zero, **only if it's on the
  curated allowlist (P7)**. Unknown tokens (usually scam airdrops) are hidden, with a "Hidden
  tokens" entry for advanced users.
- The same asset on several networks shows as **one row with a total**, small network badges,
  and an expand chevron. The expanded view shows the per-network balance and a **Consolidate**
  button, which moves everything to the recommended network via LI.FI and shows the fee first.
- Empty state (new user): a **Top up** call-to-action instead of an empty list.

**Choosing a network when sending:**

| Recipient | Behaviour |
|---|---|
| Another Jokko user (by phone or contact) | **No choice shown.** The app sends on the cheapest network where the sender has funds (normally Polygon). The recipient just sees "USDC". |
| External address | Ask **which network the recipient uses**. Every option shows its live fee in FCFA. **Recommended** = cheapest suitable network (Polygon in almost all cases, D8). Warn when the fee is over 5% of the amount. If the address format doesn't match the network (e.g. a Bitcoin address on Polygon), block the send. |

**Receive screen:** one address per network family: EVM (shared by Ethereum and Polygon),
Solana, Bitcoin. A clear line on each says "Only send USDC/USDT/POL on **Polygon** or
**Ethereum** to this address".

**Wrong-network safety net:** because the EVM address is the same on every EVM network, funds
sent on BNB Chain, Base or Arbitrum arrive at an address the user owns, but the app won't show
them. A background check watches those networks for our users' addresses and shows "We found
funds on BNB Chain", then helps move them. Adding a full EVM network later (e.g. BNB Chain, O10)
is mostly configuration. Tron (TRC20) would need a new wallet type and is a separate decision.

## 8. Money handling (non-negotiable)

- **Chain amounts:** `bigint` in base units (wei, lamports, satoshis). Postgres
  `NUMERIC(78,0)`. Never a JavaScript `number`.
- **Fiat amounts:** `decimal.js` with explicit rounding. Postgres `NUMERIC(24,8)`, rounded for
  display using the currency's official minor units.
  - **XOF and XAF have no minor unit** (ISO 4217: 0 decimals), so "12 500 FCFA", never
    "12 500,00".
- **Types:** branded types (`BaseUnits<'USDC'>`, `FiatAmount<'XOF'>`), with lint rules that
  forbid `number` for amounts and forbid mixing assets.
- **FX:** XOF and XAF are pegged to the euro at 655.957, so fiat values only need EUR/USD plus
  asset prices (`05-providers-and-tools.md`). Displayed values are labelled "≈" (indicative).

## 9. The transaction pipeline

Every money-moving action (send, phone-send, swap, stake, unstake, consolidate, and later
borrow) goes through the same pipeline in `packages/core`:

```
validate (address format, network match, amount, limits)
  → screen (sanctions / risk, adapter; stub until the provider is chosen)
  → build (adapter returns an UNSIGNED transaction or intent)
  → verify (the app checks destination, amount, token, spender, and approval amount inside the
            built transaction match what the user asked for; any mismatch → abort)
  → simulate (dry-run; Privy/Blockaid scan where available)
  → preview (fees in FCFA, network, recipient, total; clear confirmation copy)
  → authorise (biometric / passcode; Privy MFA if enrolled)
  → sign (on device via Privy)
  → broadcast → track (status updates, push notification, history + thread)
```

The **verify** step matters most. Even if our backend or a provider API is compromised and
returns a malicious transaction, the app refuses to sign anything that doesn't match the user's
intent.

## 10. Admin console and reporting (D11)

**Two tools, different jobs.**

**1. Admin console (custom, `apps/admin`)** for operations, support and compliance:
- Login via Google Workspace SSO + hardware security key. Reachable only through a private
  network or zero-trust proxy, never on the public internet.
- Roles: `support`, `compliance`, `marketing`, `finance`, `admin`. Each role sees only what it
  needs. Phone numbers and emails are **masked by default**, and revealing one is logged with a
  reason.
- Views: user profile and security level, wallets and addresses, transaction history,
  ramp/swap/stake sessions and their provider status, phone-send invites and refunds, screening
  alerts, webhook log, notification log, feature flags and kill switches, app-version gating.
- Sensitive actions (kill switch, flag changes, blocking app access for a sanctioned user)
  need a **second approver** (four-eyes). Every action goes into the append-only `audit_log`.
- **What it cannot do:** move, freeze or recover user funds. That's by design (non-custodial),
  and support scripts must say so.

**2. Reporting and marketing lists (Metabase, self-hosted)**
- Connected to a **read replica** through database views. Marketing views exclude sensitive
  fields by design.
- Dashboards: sign-ups and activation funnel, active wallets, volume by product, provider,
  country and network, ramp success/failure rates, swap and staking volumes, fee revenue,
  phone-send claim rate, notification delivery, support drivers.
- **List builder** with advanced filters (country, language, signup date, activity, products
  used, balance band, security level, referral source, …) and CSV export.
- **Marketing exports include only users who opted in** (the "Marketing updates" toggle,
  stored with timestamp in `consents`). Every export is logged: who, when, filters, row count.
- Segments sync to the marketing tool (Brevo or Customer.io) through a server job, so most
  campaigns never need a manual export at all.
- Product analytics (funnels, retention) in PostHog, with no personal data sent.

## 11. Notifications (D12)

| Channel | Used for | Tool |
|---|---|---|
| Push | Incoming/outgoing transactions, status changes, price alerts, security alerts | FCM (Android) + APNs (iOS) via `expo-notifications` tokens, sent from our workers |
| In-app inbox | Same events, persistent | Our DB (`notifications` table) |
| SMS / WhatsApp | Login codes (sent by **Privy**), phone-send claim links and reminders, critical security alerts | Privy for login OTP; **Twilio** (WhatsApp first, SMS fallback) for everything else |
| Email (transactional) | Receipts, security alerts (new device, recovery change, key export), statements | Amazon SES (on AWS) with SPF/DKIM/DMARC on `jokkochain.com` |
| Email / SMS / push (marketing) | Campaigns, newsletters, lifecycle | Brevo (French, email + SMS + WhatsApp, GDPR-friendly) or Customer.io |

Every send goes through the **outbox** (exactly one notification per event, even on retries)
and respects the user's preferences, except security alerts, which are always on (P11).

## 12. Webhooks and idempotency

Every provider webhook (ramps, LI.FI status, Everstake, indexers, Twilio delivery, later Julaya
and Aave events) goes through the same receiver:

1. Verify the signature and timestamp window (reject replays older than 5 minutes).
2. Insert into `webhook_events` with a unique `(provider, provider_event_id)`. A duplicate
   insert is acknowledged and dropped, so it can never double-credit.
3. Process inside a database transaction. Status changes follow a **state machine** that only
   moves forward; an illegal transition is logged and alerted, never applied.
4. Side effects (notifications) go through the outbox.

Client requests that create things (ramp session, swap quote acceptance, phone-send) carry an
**idempotency key**, so a double-tap or a retry never creates two.

## 13. Configuration, flags, kill switches

- `feature_flags`: per flag, per segment, per percentage; evaluated server-side and cached in
  the app.
- **Kill switch per provider and per capability** (e.g. "disable LI.FI swaps on Solana") for
  incidents.
- **Minimum supported app version.** The server can force an update if a vulnerability is found
  in an old version.
- Capability map: static in code, server can only narrow it (Principle 4).

## 14. Observability

- **OpenTelemetry** traces, logs and metrics, sent to Datadog or Grafana Cloud. **Sentry** for
  errors (EU region), with personal data scrubbed on the client and server.
- **Alerts:** webhook failures, stuck state machines, provider error spikes, paymaster / fee-payer
  / keeper balance and spend anomalies, unusual admin activity, OTP volume spikes.
- **Public status page** (Better Stack) and on-call rota before launch.

## 15. Documentation standard

See `CLAUDE.md` → "Engineering standard". In short: TSDoc on every export (lint-enforced), a
README per app/package, an ADR per architectural decision, a generated OpenAPI spec, and
runbooks in `docs/runbooks/` for every alert.
