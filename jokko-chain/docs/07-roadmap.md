# Roadmap

Status: **agreed direction**, built around launch scope D1 (top-up / withdrawal, send / receive,
swap, staking behind a flag) + referral programme (D22) + Jokko fees (D17). Supersedes the "Build phases" in `CLAUDE.md`. Phases overlap where they
don't depend on each other. Each phase ends only when its exit criteria are met and documented.

## Build order agreed with the founder (D23, 2026-09-27)

| Step | What you get | Covers |
|---|---|---|
| **A. Design** | Every screen of the app on a shared design canvas (phone artboards, French + English, all fixes from `design/README.md` applied). Reviewed and approved screen by screen before any screen is coded | Design for all phases |
| **B. Wallet shell** | The real Expo app on testnets. **Real:** Privy login, wallet creation, receive addresses + QR, balances, send/receive on test networks, app lock, FR/EN switch, settings. **Demo mode:** top-up/withdraw, swap, staking, payments threads, referral, card/business waitlists, shown with sample data and clearly labelled « Démo ». No backend needed yet | Phase 1 + the wallet part of Phase 2 |
| **C onwards** | Backend, then each feature connected one by one (ramps + referral, swap, staking, phone-send escrow), following the phases below | Phases 2–7 |

Demo mode is a feature flag that can never be on in a production build (enforced in CI).

## Progress (updated 2026-09-27)

Legend: ✅ done · 🟡 partly done · ⬜ not started. Details and next steps: `docs/HANDOFF.md`.

| Item | Status |
|---|---|
| **Step A: design** (37 screens, FR/EN) | ✅ done, **waiting for founder approval** |
| **Step B: wallet shell** (Expo app, real Privy wallet, demo mode elsewhere) | ⬜ waits for design approval |
| **Backend (D24)**, built ahead of Step B | 🟡 see the Phase 1 lines below |
| Phase 0: founder decisions and provider/counsel input | 🟡 D1–D25 decided; O1–O14 and P3, P6, P7, P10, P13–P17 still open (`00-decision-log.md`) |
| Phase 1: monorepo, strict TypeScript, TSDoc lint, formatting, tests | ✅ |
| Phase 1: CI workflow and security gates (Semgrep/CodeQL, gitleaks, OSV/Socket, CODEOWNERS, branch protection) | ⬜ |
| Phase 1: `packages/core` | 🟡 money, fiat, formatting, networks, assets, addresses, capabilities, fee engine, security levels and phone are done. Still to do: the transaction-pipeline skeleton and the P6 network recommendation |
| Phase 1: `packages/i18n`, `packages/ui` | ⬜ |
| Phase 1: Expo app shell | ⬜ (Step B) |
| Phase 1: API shell | 🟡 Done: database, all tables and migrations (beyond the planned identity/config scope), security hardening, config validation, encryption, audit, job queue, idempotency, flags. Written but not wired: Privy token check, auth guard, minimum app version, rate limits. Not started: HTTP server, OpenAPI |
| Phase 1: infrastructure (Terraform, `dev` AWS) | ⬜ |
| Phase 1: admin console skeleton | ⬜ (admin API planned in `HANDOFF.md` task 7) |
| Phase 1: waitlist screens | 🟡 designed; `waitlist_signups` table exists; no endpoint yet |
| Phases 2–7 | ⬜ not started. Their database tables already exist, and the backend design for them is written up in `HANDOFF.md` §3 |

## Phase 0 — Decisions and external input (now, in parallel with Phase 1)

- Founder confirms the remaining proposals (`00-decision-log.md`) and **the login channel (O12:
  SMS or WhatsApp — permanent in Privy)**.
- Provider conversations (`08-provider-questions.md`): Privy (**Scale/Enterprise plan**, bring
  your own Twilio, Tron wallets on Expo, EIP-7702 on Expo), Fonbnk, IvoryPay (coverage + **partner
  fee support**), LI.FI (integrator fee terms), Everstake (revenue share), Bridge, card on-ramp
  shortlist, Twilio (Verify + sender ID registration per country).
- Counsel engaged on the PSAV question and the other items in `06` §8.
- Book the smart-contract audit slot (escrow) and the pen test.
- Company setup: D-U-N-S → Apple organisation account, Google Play organisation account, Google
  Workspace + hardware keys, AWS organisation.

**Exit:** O12 decided. Privy plan + Twilio setup confirmed for UEMOA/CEMAC numbers. Tron go/no-go
for launch known. Counsel engaged.

## Phase 1 — Foundations

- Monorepo (pnpm + Turborepo) at the repository root, strict TypeScript, lint (incl. TSDoc
  enforcement), formatting, tests, CI workflow in `.github/workflows/`.
- Security baseline in CI: Semgrep/CodeQL, gitleaks, OSV/Socket, CODEOWNERS, branch protection.
- `packages/core`: money types (bigint base units, decimal fiat, XOF/XAF 0-decimals), chain +
  asset registry (6 networks), capability map, the transaction-pipeline skeleton, **fee engine**
  (schedule matching, %/fixed/min/max, quote locking, fee verification). Property-based tests.
- `packages/i18n`: FR + EN with **language switch at runtime from Settings (D20)**; locale-aware
  number/date/currency formatting; layouts tested with the longer French strings.
  `packages/ui`: design tokens from `design/README.md`.
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

- Onboarding flow (`03` §3), Privy login (channel per O12), wallet creation on every supported
  network (EVM covers Ethereum, Polygon and BNB Chain; plus Solana, Bitcoin, and Tron if
  confirmed). Referral code created for every user; optional code entry at sign-up.
- Security levels, passkey MFA, email linking, security alerts, Settings → Sécurité, key export.
- Home: total balance (FCFA), asset list with network badges + consolidate entry point, History.
- Receive (asset + network → address QR) with network warnings.
- Send to address (all networks) with network picker + live fees + Recommended tag (P6) + Jokko
  fee line (D17).
- Send to another Jokko user by phone number (direct, no escrow; P3).
- Gasless: EIP-7702 + sponsorship on Polygon/Ethereum/BNB Chain (D14), Kora on Solana; Bitcoin
  and Tron fee display.
- Indexers → `transactions` → chat-style Payments threads + push notifications + in-app inbox.
- Screening adapter wired into the pipeline (stub or Chainalysis sanctions API).

**Exit:** end-to-end on testnets: sign up → receive → send on each network → thread + push
shows it, with the Jokko fee collected and verified in the signed transaction. Privy
configuration baseline checked. Internal security review of signing paths.

## Phase 3 — Top-up and withdrawal (fiat ramps)

- Fonbnk + IvoryPay (XOF/XAF mobile money), Bridge (USD/EUR), chosen card on-ramp.
- Provider-hosted KYC flows embedded/redirected (we store status only).
- Ramp status screens, webhook receiver + idempotency + state machines, reconciliation job.
- Jokko fee on top-up / withdrawal via each provider's partner fee; fee reconciliation.
- **Referral programme (D22):** qualifying top-up detection, hold period, anti-fraud checks,
  rewards wallet payouts, referral screen + invite sharing, admin review queue.

**Exit:** sandbox top-up and withdrawal per provider and country. Replaying any webhook N times
produces exactly one record. A referral goes end to end (invite → sign-up → KYC'd top-up → hold →
$5 USDC paid), and each anti-fraud rule is tested.

## Phase 4 — Swap (LI.FI)

- Same-chain and cross-chain swaps incl. BTC ↔ USDC and TRC20/BEP20 ↔ Polygon, Consolidate
  action, exact approvals, slippage bounds, route status tracking, quote records, Jokko
  commission via the LI.FI integrator fee.

**Exit:** swaps across all supported pairs on testnet/mainnet-fork. The verify step rejects
tampered routes (tested).

## Phase 5 — Staking (behind a flag)

- Everstake ETH (pooled, from 0.01 ETH) and SOL (D16). Polygon is not shown in the staking flow
  at launch but stays supported everywhere else. Positions, unbonding periods, rewards
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

- Admin dashboard complete, as one tool (D19, `01` §10): operations, fee schedules + fee
  revenue, referral settings + review queue, embedded Metabase charts, list builder + consented
  exports, Brevo sync. (Built progressively from Phase 1; finished here.)
- Production infra (`prod` AWS account), on-call, runbooks, status page.
- External pen test (mobile + API + admin), fixes verified.
- Address screening live. Privy configuration audit. Legal texts in-app.
- App store submissions (with licensing documentation per `06` §5).
- **Closed beta** in Senegal → public launch.

**Exit:** go/no-go checklist signed by the founder + engineering: pen test clean, audit clean,
counsel sign-off, monitoring in place, support trained on "what we can't do" (non-custodial).

## After launch (not scheduled yet)

Borrow (Aave V3) · Card (Immersve/Rain) · Julaya cash top-up · Jokko for Business ·
multi-source send · POL staking · Tron (if not ready at launch) · more EVM networks · bug
bounty.
