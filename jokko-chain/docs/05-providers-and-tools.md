# Providers, tools and platforms

> **2026-09-26: the founder accepted this list (D18).** Every row marked "Proposed" below is
> now **decided** unless it says "Open". The labels are kept to show where each choice came from.

Status legend: **Decided** · **Proposed** (engineering recommendation, accepted via D18) ·
**Open** (needs founder or provider input). Every provider sits behind an adapter so it can be replaced.
Public facts below were checked on 2026-09-26. Anything that affects money or compliance must
be confirmed in writing with the provider (`08-provider-questions.md`).

## 1. Core wallet and chain access

| Need | Recommended | Alternatives | Status | Notes |
|---|---|---|---|---|
| Login + wallets (keys) | **Privy** (**Scale or Enterprise plan**) | — | Decided | Self-custodial embedded wallets, TEE + key sharding. Login by SMS **or** WhatsApp (only one, account-wide, permanent: O12). **African numbers need "bring your own Twilio"** (Scale/Enterprise). Passkey / TOTP wallet MFA. Expo SDK supports EVM, Solana and **Bitcoin** embedded wallets; **Tron** support announced 2026-09-23, in-app user wallets to confirm (O1). Pregeneration covers Ethereum + Solana wallets. Custom email sender = Enterprise only |
| EVM gasless + batching (EIP-7702) | **Alchemy** (Gas Manager + bundler + audited 7702 delegate) | ZeroDev, Pimlico, Biconomy | Decided (D14) | Ethereum, Polygon, BNB Chain (all support 7702). If Alchemy doesn't sponsor on BNB Chain, use Pimlico/ZeroDev there behind the same adapter |
| Tron fees | **Energy**: Jokko stakes TRX and delegates energy, or rents energy per transfer | Energy rental marketplaces | Proposed | Without energy, a USDT transfer burns ~$2–4 of TRX (2026). Fee shown up front; see `01` §6 |
| Solana gasless | **Kora** (Solana Foundation fee relayer), self-hosted, KMS signer | Custom relayer | Proposed | Only ever the fee payer; strict transaction validation |
| RPC (primary) | **QuickNode** (Ethereum, Polygon, BNB Chain, Solana, Tron, Bitcoin) | — | Decided (spec) | One vendor for all networks. Confirm Tron + BNB Chain endpoints on our plan |
| RPC (failover) | **Alchemy** (EVM), **Helius** (Solana), **TronGrid** (Tron, official) | Infura, Triton | Proposed | An RPC outage must not stop sends |
| Transaction history + incoming alerts | **Alchemy** Notify + Transfers API (EVM, incl. BNB Chain if covered, else QuickNode Streams), **Helius** webhooks (Solana), **TronGrid** / QuickNode (Tron), **QuickNode** Bitcoin (Blockbook add-on or Streams) | Moralis, GoldRush (Covalent), self-hosted Esplora for BTC | Proposed | Feeds `transactions`, threads and "you received money" pushes |
| Bitcoin transaction building | **@scure/btc-signer** or **bitcoinjs-lib** (in-app), signed via Privy | — | Proposed | We select coins, estimate fees and build the transaction; Privy signs; we broadcast via QuickNode |
| Prices | **CoinGecko** Pro API | CoinMarketCap; Chainlink on-chain feeds as sanity check | Proposed | Cached server-side; stale-price guard |
| FX (USD↔FCFA) | **Fixed EUR peg** (1 EUR = 655.957 XOF/XAF) + EUR/USD from **ECB** daily reference or Open Exchange Rates (intraday) | — | Proposed | No FCFA market feed needed thanks to the peg |

## 2. Money features

| Need | Recommended | Alternatives | Status | Notes |
|---|---|---|---|---|
| Swap (same-chain + cross-chain, incl. BTC, Tron) | **LI.FI** | Layerswap (kept as an adapter option) | Decided (D2) | Native BTC routes via THORChain; Tron supported. **Jokko's swap commission = LI.FI integrator fee** (% taken in LI.FI's fee contract, withdrawn by Jokko; `09`). Exact-amount approvals only |
| Staking | **Everstake** | — | Decided (spec) | ETH pooled staking minimum is now **0.01 ETH** (was 0.1; the existing screen's "Min 0.1 ETH" is outdated, so the app must read minimums from the provider). **ETH + SOL at launch (D16)**; POL later |
| Fiat ramp XOF/XAF (mobile money) | **Fonbnk**, **IvoryPay** | — | Open (O2, O3) | Fonbnk's public docs list Senegal and Côte d'Ivoire and settlement on Polygon / Ethereum / Solana among others. XAF countries and IvoryPay coverage still unconfirmed |
| Fiat ramp USD/EUR (diaspora) | **Bridge** | — | Decided (spec) | Confirm KYB for a Senegalese SA |
| Card on-ramp | One of **Transak / MoonPay / Ramp / Banxa** | — | Open (O6) | Pick on: SN/CI/CM card acceptance, USDC-on-Polygon delivery, fees, French KYC flow, webhooks |
| Lending (after launch) | **Aave V3** | — | Decided (spec) | Ethereum + Polygon |
| Cash top-up (after launch) | **Julaya** | — | Open (O5) | Liquidity decision first |
| Card issuing (after launch) | **Immersve / Rain** | UPay, Union54 | Open (O8) | Coverage unconfirmed |
| Multi-source send (phase 2) | Custom routing on **LI.FI** | Particle Universal Accounts | Later | — |

## 3. Security and compliance

| Need | Recommended | Alternatives | Status | Notes |
|---|---|---|---|---|
| Sanctions / address screening | **Chainalysis** free sanctions screening API at launch → full KYT before scale | TRM Labs, Elliptic | Proposed (O7) | Flag, don't block, except hard sanctions matches (per spec) |
| Transaction / dApp scanning | **Blockaid** (via Privy integration) | — | Proposed | Warns on malicious contracts and approvals |
| Mobile app protection (RASP) | **freeRASP** (Talsec) | Guardsquare (paid) | Proposed | Root / jailbreak / hooking / tamper detection |
| App attestation | **App Attest** (iOS) + **Play Integrity** (Android) | — | Proposed | Blocks bots and scripted abuse of our API |
| Code scanning | **Semgrep** or **CodeQL**, **gitleaks**, **OSV-Scanner**, **Socket.dev** | Snyk | Proposed | In CI on every PR |
| Dependency updates | **Renovate** (grouped, reviewed) | Dependabot | Proposed | — |
| Smart contract tooling | **Foundry**, **OpenZeppelin**, **Slither** | — | Proposed | Escrow contract (P2) |
| Smart contract audit | Independent audit firm (quotes from 2–3) | — | Open | Book early: gates phone-send to non-users (P3) |
| Pen test | Independent firm (mobile + API + admin) | — | Open | Before launch |
| Bug bounty | **Immunefi** | HackerOne | Later | After launch |

## 4. Messaging and notifications

| Need | Recommended | Alternatives | Status | Notes |
|---|---|---|---|---|
| Login codes (SMS **or** WhatsApp, O12) | **Privy**, delivered through **Jokko's own Twilio Verify account** ("bring your own Twilio") | — | Proposed (P14, P15) | Our sender name, our fraud rules (Fraud Guard, geo-permissions), carrier costs billed to our Twilio |
| Claim links, reminders, SMS/WhatsApp alerts | **Twilio** (WhatsApp Business + SMS) | **Infobip** or **Africa's Talking** as fallback for regional delivery | Decided (spec) + Proposed fallback | Sender ID registration per country |
| Push | **FCM** (Android) + **APNs** (iOS), tokens via `expo-notifications` | Expo Push Service, OneSignal | Proposed | Sent from our workers |
| Transactional email | **Amazon SES** | Postmark, Resend | Proposed | SPF / DKIM / DMARC on `jokkochain.com` (also protects against phishing that impersonates us) |
| Marketing (email / SMS / WhatsApp / push campaigns) | **Brevo** (French company, strong in francophone markets, GDPR) | Customer.io, Braze | Proposed | Only opted-in users; segments synced from our DB |
| Customer support | **Crisp** (French, WhatsApp channel, cheaper) | Intercom, Zendesk | Proposed | WhatsApp support matters in the region |

## 5. Platform, data and operations

| Need | Recommended | Alternatives | Status | Notes |
|---|---|---|---|---|
| Cloud hosting | **AWS eu-west-3 (Paris)**: ECS Fargate, RDS PostgreSQL (Multi-AZ), ElastiCache Redis, KMS, Secrets Manager, WAF, CloudTrail, GuardDuty | GCP; Fly.io/Railway + Neon + Upstash (faster MVP, later migration) | Proposed (P8) | One AWS account per environment |
| Infrastructure as code | **Terraform** | Pulumi, AWS CDK | Proposed | Every resource in code, reviewed |
| Database | **PostgreSQL 16+** (RDS) + **Drizzle** ORM | Prisma, Kysely | Proposed (P9) | SQL migrations reviewed |
| Queue / jobs | **BullMQ** on Redis + outbox table | AWS SQS | Proposed | — |
| Secrets | **AWS Secrets Manager** | Doppler | Proposed | Never `.env` in git |
| Errors | **Sentry** (EU data region) | — | Decided (spec) | Personal data scrubbed |
| Logs / metrics / traces | **Grafana Cloud**, via OpenTelemetry | Datadog | Proposed | Lower cost at our scale; OpenTelemetry keeps switching cheap |
| Uptime + status page | **Better Stack** | Statuspage | Proposed | — |
| Product analytics | **PostHog** (EU cloud) | — | Decided (spec) | No personal data; consent-aware |
| Admin dashboard (one tool, D19) | Custom (**Next.js**) in this monorepo, with **Metabase** charts embedded (signed, read-only) | Retool, Forest Admin | Decided (D19) | List builder + exports built natively (consent, masking, export log). See `01` §10 |
| Mobile builds / releases | **Expo EAS** Build + Submit (+ Update with code signing, or disabled in prod) | — | Decided (spec) | — |
| CI/CD | **GitHub Actions** | — | Decided (spec) | Root workflow filtered to `jokko-chain/**` |
| Feature flags | Own Postgres tables | PostHog flags | Decided (spec) | Kill switches included |
| Referral attribution | Own referral codes + deep links; **Google Play Install Referrer** (Android) to pre-fill codes | Branch, AppsFlyer | Proposed | Avoids another tracking vendor at launch; add an attribution tool later if paid campaigns need it |
| Translations | **i18next** + JSON in repo | Lokalise, Crowdin (when translators join) | Proposed | French default |
| Design | **Figma** (source of truth for tokens) | — | — | Current colours are sampled from screenshots |

## 6. Company-level (not code, but required)

| Need | Recommended | Status |
|---|---|---|
| Developer accounts | **Apple Developer Program as an organisation** (Jokko Chain SA; needs a D-U-N-S number), **Google Play Console** organisation account | To do |
| Identity for staff | **Google Workspace** SSO, **hardware security keys** (e.g. YubiKey) for everyone with production access | To do |
| Password manager | **1Password** (or Bitwarden) business | To do |
| Domain security | `jokkochain.com` DNS locked (registrar lock, DNSSEC), DMARC enforced | To do |
| Legal documents | Terms, Privacy Policy, Risk Disclosure (FR + EN), versioned in-app | Counsel |
| Data protection filings | Declaration to the CDP (Senegal) and equivalents in other launch countries | Counsel |
