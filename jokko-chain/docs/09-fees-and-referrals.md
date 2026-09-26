# Jokko fees (commissions) and the referral programme

Status: **decided in principle** (D17 fees, D22 referrals, 2026-09-26). The mechanisms below
are the engineering design. Actual fee levels and reward amounts are business settings that the
founder sets in the admin console. Nothing here is hard-coded.

---

## Part 1 — Jokko fees

### 1.1 Rules

1. **Jokko can add its own fee on every product**, on top of the provider's fees: top-up,
   withdrawal, send (address, Jokko user, phone), swap, consolidate, stake, and later borrow,
   card transactions, cash top-up. A fee can be a **percentage**, a **fixed amount**, or
   **both**, with an optional **minimum** and **maximum**.
2. **Jokko never holds user funds to collect a fee.** A fee is collected in one of two ways:
   - **Inside the transaction the user signs:** an extra transfer of exactly the fee amount to
     Jokko's fee address, in the same signature as the main action; or
   - **By the provider:** the provider adds Jokko's fee to its price, collects it, and pays it
     out to Jokko.

   Money in Jokko's fee addresses is **company revenue**, not customer funds.
3. **Always shown before confirmation**, as its own line "Frais Jokko", next to the network fee
   and provider fee (disclosure #4 in `06-compliance-and-marketing.md`).
4. **The quote locks the fee.** Each quote records which fee schedule version applied, so a
   schedule change never affects a quote the user has already seen.
5. **The app verifies the fee.** At the pipeline's verify step (`01-architecture.md` §9), the
   app checks that the fee transfer inside the built transaction equals the quoted fee and goes
   to a known Jokko fee address. So a compromised server can't inflate fees or redirect them.
6. **Rounding always favours the user** (fee rounded down in base units).
7. Fee changes are made in the admin console, need a **second approver**, and take effect at a
   future date/time, never retroactively.

### 1.2 How the fee is collected, per product

| Product | Collection method | Notes |
|---|---|---|
| **Top-up** (Fonbnk, IvoryPay, Bridge, card on-ramp) | **Provider partner fee:** the provider adds Jokko's fee to its quote and pays it out to Jokko (fiat or USDC) | Each provider must confirm they support partner fees and how they pay them out (`08`). This is the only clean method: the user receives crypto directly from the provider |
| **Withdrawal** (off-ramp) | Provider partner fee, **or** a fee transfer inside the user's signed transaction that sends crypto to the provider | Whichever the provider supports |
| **Send to address / Jokko user** | Fee transfer inside the same signed transaction: an extra transfer (EVM, one-tap batch via EIP-7702), an extra instruction (Solana), an extra output (Bitcoin), a second transfer (Tron) | Also where Jokko recovers the gas it sponsors |
| **Phone-send to non-user (escrow)** | Deposit = amount + fee. **On claim:** amount → recipient, fee → Jokko fee address. **On cancel/refund:** amount **and fee** → sender | Jokko only earns when the send succeeds. The fee address is fixed in the contract at deployment (still no admin key) |
| **Swap / consolidate** | **LI.FI integrator fee:** a % deducted from the input token inside LI.FI's fee contract, withdrawn by Jokko from LI.FI's portal / API | LI.FI supports % natively. A fixed part would be an extra transfer in the same batch. LI.FI keeps a share of integrator volume: confirm commercial terms |
| **Stake / unstake** | **Everstake revenue share** (a share of their commission on rewards) and/or an upfront fee transfer at stake time | Everstake partner terms (`08`) |
| **Borrow** (after launch) | Upfront origination fee transfer in the same batch as the Aave borrow | Aave has no integrator fee |
| **Card** (after launch) | Program fees / interchange share / FX markup set in the issuer's programme | Provider-dependent |
| **Cash top-up** (after launch) | Depends on the Julaya option (O5) | — |

### 1.3 Fee configuration (admin console)

A fee schedule row:

| Field | Example |
|---|---|
| product / action | `send` / `external_address` |
| network (optional) | `polygon` |
| asset (optional) | `USDC` |
| country / user segment (optional) | `SN`, `new_users` |
| percentage (basis points) | `50` (= 0.50%) |
| fixed amount + currency | `100 XOF` |
| minimum / maximum | min `50 XOF`, max `5 000 XOF` |
| valid from / to | `2026-11-01` → open |
| status | draft → pending approval → active → retired |

- The **most specific matching row wins** (e.g. "send · Polygon · USDC · SN" beats
  "send · any").
- **Promotions** (e.g. "first top-up without Jokko fee", "free sends between Jokko users this
  month") are separate time-boxed override rows.
- Fixed amounts in FCFA are converted into the asset at quote time.

### 1.4 Tracking fee revenue

- Every charged fee creates a `fee_collections` row: expected amount, method, status
  (`expected → collected → reconciled`), and the provider payout or on-chain receipt it matched.
- **Reconciliation jobs** compare expected fees with LI.FI fee balances, provider payout
  statements, and on-chain receipts at Jokko's fee addresses. Any mismatch raises an alert in
  the admin console.
- The admin dashboard shows fee revenue by product, provider, network, country and period.

### 1.5 Jokko's own wallets (company money)

| Wallet | Purpose | Control |
|---|---|---|
| **Fee treasury** (one per network family) | Receives Jokko fees | Multisig (e.g. Safe 2-of-3 on EVM chains, Squads on Solana, multisig on Bitcoin/Tron), hardware keys held by different people. Receive-only in daily operations |
| **Rewards wallet** (hot) | Pays referral rewards automatically | KMS-held key, **daily payout cap**, small balance topped up from the treasury with two-person approval, alerts on every refill and on unusual payout rates |

These wallets hold company money only. They never receive or hold customer funds.

### 1.6 Open points (for founder / counsel / accountant)

- The fee levels themselves (business decision; set in admin).
- Whether fees affect the PSAV analysis (already in counsel questions, `06` §8).
- VAT or other taxes on Jokko fees in Senegal (accountant).

---

## Part 2 — Referral programme (at launch)

### 2.1 How it works for the user

> **« Invitez un ami. Quand il recharge au moins 10 000 FCFA, vous recevez 5 $ en USDC. »**
> ("Invite a friend. When they top up at least 10,000 FCFA, you receive $5 in USDC.")

1. Every user has a personal referral code and link, shareable in one tap (WhatsApp first).
2. The friend installs Jokko. The code is pre-filled from the link when possible (Android
   supports this natively through the Play Install Referrer) or typed at sign-up (a "Code de
   parrainage" field, optional).
3. The friend completes a **qualifying top-up** (proposed: at least 10,000 FCFA, completed
   through a ramp provider, within 30 days of sign-up).
4. After a short **hold period** (proposed: 7 days, so a top-up that is immediately withdrawn
   again doesn't count), the referrer receives **$5 in USDC on Polygon** from Jokko's rewards
   wallet, with a push notification and a thread entry.

Every value (reward amount, token, minimum top-up, time window, hold, caps, optional reward for
the friend) is a **setting in the admin console**, so the programme can change without an app
release. Adding a reward for the invited friend too ("double-sided") usually converts better. It
can be switched on later.

### 2.2 Anti-fraud (the main risk)

Where $5 is meaningful, referral farming with multiple SIM cards is guaranteed. Controls:

| Control | Why |
|---|---|
| **Qualifying top-up must pass the ramp provider's KYC** | Proves a real, verified person. One reward per verified identity (deduplicated with the provider's customer ID) |
| **Minimum top-up** worth well above the reward | Makes farming uneconomic |
| **7-day hold** + the top-up must not be reversed | Blocks top-up-and-withdraw loops |
| **Same device / same attestation can't be referrer and friend** | Blocks self-referral from one phone |
| **Caps:** max rewards per referrer per month (proposed 20) and a programme-wide daily budget | Limits damage from anything missed |
| **Velocity alerts + review queue** in the admin console (e.g. 5 friends with sequential numbers in one hour) | Human review for suspicious clusters |
| **Rewards paid from a hot wallet with a daily cap** (§1.5) | Even a bug can't drain the treasury |

### 2.3 Where it appears

- Settings → Parrainage (code, share button, list of invited friends with status: signed up /
  topped up / reward pending / paid).
- A home promo tile (approved copy, see below).
- Referral statistics and payouts in the admin dashboard.

### 2.4 Wording (see `06-compliance-and-marketing.md`)

- ✅ « Recevez 5 $ en USDC » / "Receive $5 in USDC". Say what the reward is.
- ✅ Always link the programme terms: « Conditions : recharge minimale de 10 000 FCFA sous 30
  jours, une récompense par ami vérifié, limites applicables. »
- ❌ « Argent gratuit », « Gagnez de l'argent facilement », "free money".
- Counsel to confirm: whether promotional rewards need any declaration, and their tax treatment.

### 2.5 Build timing

Referral depends on top-up (ramps) and KYC status, so it's built **with Phase 3 (ramps)** and
launches together with it (`07-roadmap.md`). Referral codes are created at sign-up from day one
(Phase 2), so early users can already share their code.
