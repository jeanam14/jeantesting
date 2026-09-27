# Decision log

Single source of truth for what has been decided. Every decision has an ID so code, docs, and
commits can reference it (e.g. "per D5").

- **Decided**: confirmed by the founder, build against it.
- **Proposed**: engineering recommendation awaiting founder confirmation, safe to plan around,
  not to ship against.
- **Open**: needs external input (provider, counsel) or a founder choice before it can be decided.

Changing a decided item requires a new entry that supersedes it. Never rewrite an old entry;
add a "Superseded by" note instead.

---

## Decided

| ID | Date | Decision | Notes |
|---|---|---|---|
| D1 | 2026-09-26 | **Launch scope:** top-up / withdrawal (fiat ramps), send / receive (address + phone number), swap, staking (behind a feature flag, can be switched off for launch). Borrow, card, cash top-up (Julaya), Business, and multi-source send come after launch. | Roadmap: `07-roadmap.md`. Referral added to launch by D22 |
| D2 | 2026-09-26 | **Swap provider: LI.FI** for both same-chain and cross-chain swaps (replaces Layerswap + 1inch/0x + Jupiter), behind the swap adapter interface. | Exact-amount approvals only (`02-security.md`) |
| D3 | 2026-09-26 | **Stablecoins: USDC (default) and USDT.** No euro stablecoin. | Founder: EURC is not recognised by users the way USDC/USDT are |
| D4 | 2026-09-26 | **Legal entity: Jokko Chain SA, Dakar, Senegal.** Used for Apple/Google developer accounts (organisation), Privy, Bridge, and provider KYB. | Apple organisation enrollment needs a D-U-N-S number |
| D5 | 2026-09-26 | **Phone-number sends to non-users are refundable:** the sender can cancel any time before claim; unclaimed funds return automatically after **48 hours**. | Mechanism = P2. Sends to existing Jokko users are instant and final |
| D6 | 2026-09-26 | **Security and recovery:** phone number stays the primary login/recovery. Email can be added (optional). Passkey, biometrics, and iCloud / Google backup are offered. | `03-onboarding-and-recovery.md` |
| D7 | 2026-09-26 | **Networks are visible to users** with familiar labels. An asset appears once its balance is above zero (allowlisted tokens only). The same asset on several networks gets a **Consolidate** action. | `01-architecture.md` §7. Network list extended by D15 |
| D8 | 2026-09-26 | **Network recommendation:** under ~$20 → recommend Polygon; larger → user chooses, Polygon still tagged **Recommended**. Users are never blocked from choosing another network. | Made fee-aware in P6 |
| D9 | 2026-09-26 | **Project isolation:** everything lives in `jokko-chain/`, portable to its own repository and environments. | `README.md` → "Portability". Carried out on 2026-09-27: see D25 |
| D10 | 2026-09-26 | **Quality bar:** highest security standard; every piece of code documented and commented. | `CLAUDE.md` → "Engineering standard" |
| D11 | 2026-09-26 | **Admin dashboard required** for monitoring, reporting and marketing lists with advanced filters and export. | Refined by D19 (one dashboard) |
| D12 | 2026-09-26 | **Notification channels:** push, email, SMS, WhatsApp. | `05-providers-and-tools.md` |
| D13 | 2026-09-26 | **Security levels and balance thresholds accepted** (50,000 / 250,000 / 1,000,000 FCFA, see `03` §4). **No 24-hour hold** on sends after a new-device login. | Accepts P4 minus the hold. The passkey requirement above 250,000 FCFA is the main SIM-swap protection |
| D14 | 2026-09-26 | **Wallet type: EIP-7702.** Gasless + one-tap batching while keeping the normal wallet address, recovery and export. On every EVM network that supports it (Ethereum, Polygon, BNB Chain). | Accepts P1. `01-architecture.md` §6 |
| D15 | 2026-09-26 | **Networks at launch: Ethereum (ERC20), Polygon, BNB Chain (BEP20), Solana, Bitcoin, and Tron (TRC20).** Tron at launch **if Privy confirms in-app (user-signed) Tron wallets on Expo** (O1); otherwise in the first update after launch. | Supersedes O10. `01` §7 |
| D16 | 2026-09-26 | **Staking at launch shows ETH and SOL only.** Polygon stays fully supported for everything else (balances, send, receive, swap, top-up). Only POL *staking* waits. | Accepts P5 (clarified: Polygon itself is not removed) |
| D17 | 2026-09-26 | **Jokko fees:** Jokko can add its own commission, as a % and/or fixed amount (with min/max), on top of provider fees for every product (top-up, withdrawal, send, swap, stake, borrow, card, …), configurable in the admin console. | `09-fees-and-referrals.md` Part 1 |
| D18 | 2026-09-26 | **Providers and tools list accepted** (`05-providers-and-tools.md`), including AWS Paris hosting (P8) and the backend stack NestJS + PostgreSQL/Drizzle + Redis/BullMQ (P9). | If AWS or the backend stack was *not* meant to be included, say so and this entry gets superseded |
| D19 | 2026-09-26 | **One single admin dashboard** combining operations, reporting and list building / exports, with one login. | `01-architecture.md` §10 |
| D20 | 2026-09-26 | **The app is fully bilingual (French + English)**, language switchable any time in Settings; default follows the phone's language (French for UEMOA/CEMAC). | `design/README.md` |
| D21 | 2026-09-26 | **Fix the design issues found in the existing build during the rebuild.** Includes P11 (security alerts always on) and P12 (Invest wording). | Checklist in `design/README.md` |
| D22 | 2026-09-26 | **Referral programme at launch:** invite a friend; when the friend tops up, the referrer earns **$5** (paid in USDC). Amount and rules configurable. | `09-fees-and-referrals.md` Part 2. Resolves O9 |
| D23 | 2026-09-27 | **Build order: design first, then a "wallet shell" app.** Step A: every screen designed on a shared design canvas (FR + EN, fixes from `design/README.md` applied) and approved. Step B: the Expo app with the **real Privy wallet** (login, wallets, addresses, testnet balances, testnet send/receive, app lock, FR/EN) and **every other feature visible in demo mode** (sample data, clearly labelled, not connected to any provider). Testnets only | `07-roadmap.md`, `10-setup-checklist.md` |
| D24 | 2026-09-27 | **Build the whole database and backend now**, alongside the design (not after the wallet shell). Database layer and API foundation done; feature modules, admin API and workers next. | `docs/HANDOFF.md` |
| D25 | 2026-09-27 | **The project moves to its own repository, `jean-jokko/Jokko-test-claude`, under the founder's enterprise Claude and GitHub accounts.** The project folder becomes the repository root, with its full git history. The old copy (`jeanam14/jeantesting`, branch `claude/eager-mayer-hx3a07`) is a frozen backup: don't develop there any more. | `docs/HANDOFF.md` → "Moving to the new repository", `docs/conversation-log.md` |

---

## Proposed — awaiting founder confirmation

| ID | Proposal | Why | Status |
|---|---|---|---|
| P1 | EIP-7702 wallet type | Gasless + same address | **Accepted → D14** |
| P2 | **Phone-send escrow contract** on Polygon/Ethereum: funds locked to (sender, recipient's pregenerated address, amount + Jokko fee, 48h expiry). Claim pays the recipient (fee → Jokko); cancel/refund returns everything to the sender. No admin key, not upgradeable, externally audited. v1: USDC/USDT. | The only way to make D5 refunds possible without Jokko ever controlling funds | Proposed |
| P3 | **Launch phone-send to existing Jokko users first**; non-user invites ship once the escrow audit is complete. | The audit must not block the whole launch | Proposed |
| P4 | Security levels and thresholds | — | **Accepted with changes → D13** |
| P5 | Staking at launch: ETH + SOL | — | **Accepted → D16** |
| P6 | **Fee-aware network recommendation:** "Recommended" goes to the cheapest network the recipient supports, with live fee in FCFA shown on every option; warning when the fee exceeds 5% of the amount. Jokko-to-Jokko sends choose automatically. | Implements D8 correctly on days when fees are unusually high or low | Proposed |
| P7 | **Curated token list:** only allowlisted tokens shown; unknown tokens hidden. | Scam airdrops | Proposed |
| P8 | AWS Paris from day one | — | **Accepted → D18** |
| P9 | NestJS + Drizzle + BullMQ | — | **Accepted → D18** |
| P10 | **Bottom navigation at launch:** Accueil · Paiements · Échanger · Gagner · Plus (Home · Payments · Swap · Earn · More). Card waitlist, Business, Settings, later Borrow live under More. | Borrow and Card aren't in launch scope; Payments hosts the chat threads | Proposed |
| P11 | Security alerts can't be switched off | — | **Accepted → D21** |
| P12 | Invest wording fixes, tab renamed "Gagner / Earn" | — | **Accepted → D21** (tab name still subject to counsel) |
| P13 | **No external wallet import at launch** ("transfer from your other wallet" instead). | Typing a recovery phrase into an app is the #1 scam pattern | Proposed |
| P14 | **Use Privy's own login, never a custom login server.** | A compromised backend must never be able to log in as users | Proposed |
| P15 | **Login codes by SMS through Jokko's own Twilio account** ("bring your own Twilio" in Privy), not WhatsApp. | See O12. Works for every user, messages come from Jokko's sender name, and we control fraud rules and country coverage. WhatsApp stays available for claim links and notifications | Proposed |
| P16 | **Referral defaults:** qualifying top-up ≥ 10,000 FCFA within 30 days, 7-day hold, one reward per verified identity, max 20 rewards per referrer per month. | Anti-fraud (`09` §2.2) | Proposed |
| P17 | **One wallet per user at launch** (the existing build shows a "Wallet 1" selector). Multiple wallets later if needed. | Simplicity; every extra wallet multiplies support and recovery cases | Proposed |

---

## Open — needs external input or a founder choice

| ID | Question | Owner | Where |
|---|---|---|---|
| O1 | **Privy:** plan (international SMS and WhatsApp require **Scale or Enterprise**), BYO Twilio setup, **in-app Tron wallets on Expo**, EIP-7702 on Expo, Google Drive backup on Expo Android, Bitcoin pregeneration, custom email sender (Enterprise only) | Founder → Privy | `08-provider-questions.md` |
| O2 | Fonbnk: countries, operators, settlement network, fees, **partner fee support** | Founder → Fonbnk | `08` |
| O3 | IvoryPay: coverage + **partner fee support** | Founder → IvoryPay | `08` |
| O4 | **Legal opinion** (Senegalese counsel): PSAV status, escrow, fees, referral rewards, marketing, data transfers | Founder → counsel | `06-compliance-and-marketing.md` |
| O5 | Julaya cash top-up liquidity option (engineering recommends option 3) | Founder + partners | `CLAUDE.md` |
| O6 | Card on-ramp: Transak / MoonPay / Ramp / Banxa | Founder | `08` |
| O7 | Address screening: Chainalysis free sanctions API at launch (proposal accepted with the tools list, D18); full KYT provider before scale | Founder, later | `05` |
| O8 | Card issuing: Immersve / Rain coverage | Founder | `CLAUDE.md` |
| O9 | ~~Referral in launch scope?~~ | — | **Resolved → D22** |
| O10 | ~~Add BNB Chain / Tron?~~ | — | **Resolved → D15** |
| O11 | ~~Remaining screenshots~~ | — | **Received 2026-09-26** (`design/README.md`) |
| O12 | **Login channel: SMS or WhatsApp?** Privy allows **only one of the two for login, account-wide, and it cannot be switched later.** Engineering recommends SMS via our own Twilio (P15) | **Founder — needed before Privy setup** | `03-onboarding-and-recovery.md` §3 |
| O13 | Fee levels per product (business setting, can change any time in admin) | Founder, before launch | `09-fees-and-referrals.md` |
| O14 | VAT / tax treatment of Jokko fees and referral rewards | Founder → accountant | `09` §1.6 |
