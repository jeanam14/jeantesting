# Roadmap

Status: **proposed**, built around launch scope D1 (top-up / withdrawal, send / receive, swap,
staking behind a flag). Supersedes the "Build phases" in `CLAUDE.md`. Phases overlap where they
don't depend on each other. Each phase ends only when its exit criteria are met and documented.

## Phase 0 — Decisions and external input (now, in parallel with Phase 1)

- Founder confirms the proposals P1–P14 (`00-decision-log.md`).
- Provider conversations (`08-provider-questions.md`): Privy (plan, country coverage, Expo
  capabilities), Fonbnk, IvoryPay, LI.FI, Everstake, Bridge, card on-ramp shortlist, Twilio.
- Counsel engaged on the PSAV question and the other items in `06` §8.
- Book the smart-contract audit slot (escrow) and the pen test.
- Company setup: D-U-N-S → Apple organisation account, Google Play organisation account, Google
  Workspace + hardware keys, AWS organisation.

**Exit:** P1, P4, P8, P9 confirmed. Privy plan confirmed for UEMOA phone numbers. Counsel
engaged.

## Phase 1 — Foundations

- Monorepo (pnpm + Turborepo) inside `jokko-chain/`, strict TypeScript, lint (incl. TSDoc
  enforcement), formatting, tests, CI workflow (root file filtered to `jokko-chain/**`).
- Security baseline in CI: Semgrep/CodeQL, gitleaks, OSV/Socket, CODEOWNERS, branch protection.
- `packages/core`: money types (bigint base units, decimal fiat, XOF/XAF 0-decimals), chain +
  asset registry, capability map, the transaction-pipeline skeleton. Property-based tests.
- `packages/i18n` (FR default + EN), `packages/ui` (design tokens from `design/README.md`).
- Expo app shell: navigation (P10), app lock, theming, error boundary, Sentry, environment
  guard.
- API shell: NestJS + Drizzle + migrations for identity/config tables, Privy token
  verification, rate limiting, audit log, feature flags + kill switches + minimum app version,
  OpenAPI.
- Infra: Terraform for `dev` (AWS), secrets, CI deploy.
- Admin console skeleton: SSO, roles, audit log viewer.
- Waitlist screens (Card, Business), which are simple, already specced, and useful for marketing.

**Exit:** app runs on iOS + Android in FR/EN against `dev`. CI green with all gates.
Architecture decision records written for every choice.

## Phase 2 — Onboarding, wallets, send / receive, history

- Onboarding flow (`03` §3), Privy login (SMS + WhatsApp), wallet creation on all 4 networks.
- Security levels, passkey MFA, email linking, security alerts, Settings → Sécurité, key export.
- Home: total balance (FCFA), asset list with network badges + consolidate entry point, History.
- Receive (QR per network family) with network warnings.
- Send to address (all 4 networks) with network picker + live fees + Recommended tag (P6).
- Send to another Jokko user by phone number (direct, no escrow; P3).
- Gasless: EIP-7702 + Alchemy sponsorship on Polygon/Ethereum (P1), Kora on Solana; Bitcoin
  fee display.
- Indexers → `transactions` → chat-style Payments threads + push notifications + in-app inbox.
- Screening adapter wired into the pipeline (stub or Chainalysis sanctions API).

**Exit:** end-to-end on testnets: sign up → receive → send on each network → thread + push
shows it. Privy configuration baseline checked. Internal security review of signing paths.

## Phase 3 — Top-up and withdrawal (fiat ramps)

- Fonbnk + IvoryPay (XOF/XAF mobile money), Bridge (USD/EUR), chosen card on-ramp.
- Provider-hosted KYC flows embedded/redirected (we store status only).
- Ramp status screens, webhook receiver + idempotency + state machines, reconciliation job.

**Exit:** sandbox top-up and withdrawal per provider and country. Replaying any webhook N times
produces exactly one record.

## Phase 4 — Swap (LI.FI)

- Same-chain and cross-chain swaps incl. BTC ↔ USDC, Consolidate action, exact approvals,
  slippage bounds, route status tracking, quote records.

**Exit:** swaps across all supported pairs on testnet/mainnet-fork. The verify step rejects
tampered routes (tested).

## Phase 5 — Staking (behind a flag)

- Everstake ETH (pooled, from 0.01 ETH) and SOL (P5). Positions, unbonding periods, rewards
  display with approved wording (`06`).

**Exit:** stake → rewards → unstake → withdraw on testnet. Copy approved by counsel.

## Phase 6 — Phone-send to non-users (escrow)

- Escrow contract (Foundry, 100% coverage, fuzz + invariants, Slither) → **external audit** →
  deploy (no admin).
- Keeper worker (auto-claim on sign-up, auto-refund at 48h), sender cancel, reminders, claim
  deep links.

**Exit:** audit report with all findings resolved. End-to-end on testnet incl. cancel, refund,
and claim races.

## Phase 7 — Admin, reporting, hardening, launch

- Admin console complete (`01` §10), Metabase dashboards + list builder + consented exports,
  Brevo sync.
- Production infra (`prod` AWS account), on-call, runbooks, status page.
- External pen test (mobile + API + admin), fixes verified.
- Address screening live. Privy configuration audit. Legal texts in-app.
- App store submissions (with licensing documentation per `06` §5).
- **Closed beta** in Senegal → public launch.

**Exit:** go/no-go checklist signed by the founder + engineering: pen test clean, audit clean,
counsel sign-off, monitoring in place, support trained on "what we can't do" (non-custodial).

## After launch (not scheduled yet)

Borrow (Aave V3) · Card (Immersve/Rain) · Julaya cash top-up · Jokko for Business ·
multi-source send · POL staking · additional networks (BNB Chain, Tron: O10) · referral
programme (if not in v1, O9) · bug bounty.
