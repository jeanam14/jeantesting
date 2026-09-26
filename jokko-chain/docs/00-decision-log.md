# Decision log

Single source of truth for what has been decided. Every decision has an ID so code, docs, and
commits can reference it (e.g. "per D5").

- **Decided**: confirmed by the founder, build against it.
- **Proposed**: engineering recommendation awaiting founder confirmation, safe to plan around,
  not to ship against.
- **Open**: needs external input (provider, counsel) before it can be decided.

Changing a decided item requires a new entry that supersedes it. Never edit history.

---

## Decided

| ID | Date | Decision | Notes |
|---|---|---|---|
| D1 | 2026-09-26 | **Launch scope:** top-up / withdrawal (fiat ramps), send / receive (address + phone number), swap, staking (behind a feature flag, can be switched off for launch). Borrow, card, cash top-up (Julaya), Business, and multi-source send come after launch. | Roadmap: `07-roadmap.md` |
| D2 | 2026-09-26 | **Swap provider: LI.FI** for both same-chain and cross-chain swaps (replaces Layerswap + 1inch/0x + Jupiter). Integrated behind the swap adapter interface so another provider can be added later. | LI.FI supports EVM, Solana and native Bitcoin (via THORChain). Exact-amount approvals only (see `02-security.md`) |
| D3 | 2026-09-26 | **Stablecoins: USDC (default) and USDT.** No euro stablecoin. | Founder: EURC is not recognised by users the way USDC/USDT are |
| D4 | 2026-09-26 | **Legal entity: Jokko Chain SA, Dakar, Senegal.** Used for Apple/Google developer accounts (organisation), Privy, Bridge, and provider KYB. | Apple organisation enrollment needs a D-U-N-S number for the SA |
| D5 | 2026-09-26 | **Phone-number sends to non-users are refundable:** the sender can cancel any time before the recipient claims; unclaimed funds are returned automatically after **48 hours**. | Mechanism = P2 below. Sends to existing Jokko users are instant and final |
| D6 | 2026-09-26 | **Security and recovery:** phone number stays the primary login/recovery. Email can be added (optional, not forced). Passkey, biometrics, and iCloud / Google backup are offered. | Design: `03-onboarding-and-recovery.md` |
| D7 | 2026-09-26 | **Networks are visible to users**, with familiar labels: "Ethereum (ERC20)", "Polygon", "Solana", "Bitcoin". An asset appears in the list as soon as its balance is above zero. The same asset on several networks shows a **Consolidate** action. | Display rules: `01-architecture.md` → "Networks and assets" |
| D8 | 2026-09-26 | **Network recommendation:** small amounts (under ~$20) → recommend Polygon. Larger amounts → user chooses, Polygon still tagged **Recommended**. Users are never blocked from choosing Ethereum. | Refined to be fee-aware — see P6 |
| D9 | 2026-09-26 | **Project isolation:** everything lives in `jokko-chain/`, portable to its own repository and environments at any time. | `README.md` → "Portability" |
| D10 | 2026-09-26 | **Quality bar:** highest security standard, every piece of code documented and commented. | `CLAUDE.md` → "Engineering standard" |
| D11 | 2026-09-26 | **Admin dashboard required** for monitoring users/transactions, reporting, and marketing list building with advanced filters and export. | Design: `01-architecture.md` → "Admin console and reporting" |
| D12 | 2026-09-26 | **Notification channels needed:** push, email, SMS, WhatsApp. | Tools: `05-providers-and-tools.md` |

---

## Proposed — awaiting founder confirmation

| ID | Proposal | Why | Where |
|---|---|---|---|
| P1 | **Wallet type: EIP-7702** (the user's normal wallet, upgraded in place with smart features) on Ethereum + Polygon, with gas sponsorship. Not a separate ERC-4337 smart-account address. | Same address as the plain wallet (exports cleanly to MetaMask), yet gasless + one-tap batching. Both Ethereum and Polygon support 7702 | `01-architecture.md` → "Wallet type" |
| P2 | **Phone-send escrow contract** on Polygon/Ethereum: funds locked to (sender, recipient's pregenerated address, amount, 48h expiry). Only the recipient can receive them (claim) or the sender (cancel/refund). No admin key, not upgradeable, externally audited. v1 supports USDC/USDT only. | Only way to make D5 refunds possible without Jokko ever controlling funds | `02-security.md` → "Phone-send escrow" |
| P3 | **Launch phone-send to existing Jokko users first** (direct, no escrow); non-user invites ship as soon as the escrow audit is complete. | The audit (typically several weeks) must not block the whole launch | `07-roadmap.md` |
| P4 | **Onboarding flow and security levels** with balance thresholds (in XOF) that trigger prompts for email, passkey, and backup. | Answers "what amounts trigger extra security" | `03-onboarding-and-recovery.md` |
| P5 | **Staking at launch: ETH + SOL only.** POL staking later. | POL staking contracts live on Ethereum mainnet, so it needs POL moved to Ethereum first + Ethereum fees | `07-roadmap.md` |
| P6 | **Fee-aware network recommendation:** the "Recommended" tag goes to the cheapest network the recipient supports, with the live fee shown in FCFA next to every option; a warning when the fee exceeds 5% of the amount. Jokko-to-Jokko sends pick the network automatically. | Ethereum fees swing a lot; a fixed $20 rule gives wrong advice on both cheap and expensive days | `01-architecture.md` |
| P7 | **Curated token list:** only allowlisted tokens are shown; unknown tokens are hidden (spam/scam airdrops). | Auto-showing any token with balance > 0 invites scam tokens into the asset list | `02-security.md` |
| P8 | **Hosting: AWS (Paris, eu-west-3) from day one**, defined in Terraform. | Fintech-grade controls (KMS, private networking, audit trails, WAF) without a later migration | `01-architecture.md` |
| P9 | **Backend: NestJS (Fastify adapter), PostgreSQL + Drizzle ORM, Redis + BullMQ.** | Module structure maps 1:1 to provider adapters; SQL-first migrations are reviewable | `01-architecture.md` |
| P10 | **Bottom navigation at launch:** Home · Payments · Swap · Earn · More. Card waitlist, Borrow (later), Business, Settings live under More. | Borrow and Card aren't in launch scope; Payments hosts the chat-style threads | `design/README.md` |
| P11 | **Security alerts cannot be switched off** (new-device login, recovery changes, key export). Other notification types stay user-controlled. | Security alerts are how users detect a SIM swap | `design/README.md` |
| P12 | **Invest screen wording:** remove "Hot", "LOW RISK" and "Restake"; rename the tab "Earn" (or "Staking"); APY always labelled "estimated, variable". | Compliance (see `06`) + accuracy | `06-compliance-and-marketing.md` |
| P13 | **No external wallet import at launch.** "I already have a wallet" → log in (existing Jokko users) or "transfer from your other wallet" (shows receive addresses). | Typing a recovery phrase into an app is the #1 phishing pattern; we teach users never to do it | `03-onboarding-and-recovery.md` |
| P14 | **Use Privy's own login (SMS/WhatsApp OTP), never a custom login server.** | With custom auth, anyone who compromised our backend could log in as any user and reach their wallet | `03-onboarding-and-recovery.md` |

---

## Open — needs external input

| ID | Question | Owner | Where |
|---|---|---|---|
| O1 | Privy: international SMS/WhatsApp OTP for UEMOA/CEMAC numbers (may require the Enterprise plan), Google Drive backup on Expo Android, Bitcoin pregeneration, EIP-7702 in the Expo SDK | Founder → Privy | `08-provider-questions.md` |
| O2 | Fonbnk: confirm countries (Senegal and Côte d'Ivoire appear in their docs; XAF countries?), operators, settlement network (Polygon USDC?), fees, limits | Founder → Fonbnk | `08` |
| O3 | IvoryPay: UEMOA/CEMAC coverage | Founder → IvoryPay | `08` |
| O4 | **Legal opinion (Senegalese counsel):** is Jokko a "prestataire de services d'actifs virtuels" (PSAV) under the 2023 UEMOA uniform AML law, given the non-custodial design? Also: escrow contract, swap fees, marketing, data transfers | Founder → counsel | `06-compliance-and-marketing.md` |
| O5 | Julaya cash top-up: liquidity option (engineering recommends Option 3) | Founder + Julaya + IvoryPay | `CLAUDE.md` |
| O6 | Card on-ramp: pick one of Transak / MoonPay / Ramp / Banxa | Founder | `08` |
| O7 | Address screening provider (proposal: Chainalysis free sanctions API at launch, full KYT before scale) | Founder | `05` |
| O8 | Card issuing: Immersve / Rain coverage in UEMOA/CEMAC | Founder | `CLAUDE.md` |
| O9 | Referral programme in launch scope? (existing build already shows it in Settings) | Founder | — |
| O10 | Add BNB Chain (BEP20) and/or Tron (TRC20) after launch? Both are common in African P2P markets | Founder, after launch data | `01-architecture.md` |
| O11 | Remaining existing-build screenshots (founder sending) | Founder | `design/README.md` |
