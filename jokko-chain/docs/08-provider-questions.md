# Questions to send to providers

Ready to paste into emails or sales calls. Get the answers **in writing**, and record them (with
date and contact) in `00-decision-log.md`.

## Privy (O1)

1. We are Jokko Chain SA (Senegal). Our users are in UEMOA (Senegal, Côte d'Ivoire, Mali,
   Burkina Faso, Benin, Togo, Niger, Guinea-Bissau), CEMAC (Cameroon, Gabon, Congo, Chad) and the
   diaspora (France/EU, US). **Is international SMS and WhatsApp OTP login available for these
   country codes, on which plan, at what cost per message, and with what fraud/SMS-pumping
   protection?**
2. On the **Expo SDK**, confirm support for: TEE-based wallets; EVM + Solana + **Bitcoin**
   embedded wallets with **client-side** signing; **EIP-7702** authorisation signing; passkey and
   TOTP **wallet MFA**; **iCloud (iOS) and Google Drive (Android)** user-managed recovery;
   wallet **export** (seed phrase and/or private key) per chain.
3. Can **Bitcoin** wallets be **pregenerated** (docs mention Ethereum and Solana)?
4. Which Bitcoin address types are supported (SegWit `bc1q`, Taproot `bc1p`)?
5. Can we **lock** the custodial-wallet option and session signers off at the account level so
   they can't be enabled by mistake? Is there a **dashboard audit log** of configuration changes?
6. Is **Blockaid** transaction scanning available on our plan and in Expo?
7. KYB requirements for a Senegalese SA. Data residency. SLA / uptime history. Pricing per
   monthly active user.
8. What happens to our users' wallets if Privy or Jokko ceases operating (continuity / export
   guarantees)?
9. **Login channel:** we understand an account can use SMS **or** WhatsApp, not both, and the choice
   is permanent. Please confirm. Can SMS be delivered through our own Twilio Verify account for all
   our countries ("bring your own Twilio", Scale/Enterprise)? For WhatsApp login, **whose WhatsApp
   Business sender** is used (Privy's or ours), and what name does the user see?
10. **Email codes:** confirm that on non-Enterprise plans login/verification emails come from a
    Privy address. On Enterprise, can they come from `@jokkochain.com` with our branding, in
    French and English?
11. **Tron (announced 2026-09-23):** does it cover **user-owned embedded wallets signed on the
    device in the Expo SDK** (not only server/API wallets)? Address derivation, TRC20 transfers,
    energy/fee handling, export, and pregeneration.
12. **BNB Chain:** confirm the same EVM embedded wallet works on BNB Chain with EIP-7702.
13. Can the OTP message text be localised (French / English) per user?

## Fonbnk (O2)

1. Countries and currencies supported **today** for **on-ramp** and **off-ramp** separately:
   Senegal, Côte d'Ivoire, Mali, Burkina Faso, Benin, Togo, Niger (XOF); Cameroon, Gabon, Congo
   (XAF).
2. Payment methods per country: Orange Money, Wave, Free Money, MTN MoMo, Moov Money, bank
   transfer, airtime?
3. **Which networks and tokens do you settle to?** We need USDC (and USDT) on **Polygon**
   (preferred), Ethereum, Solana.
4. Fees, FX spread, min/max limits per transaction and per user, settlement times.
5. KYC: who performs it, is the flow embeddable in a mobile app, is it available in **French**,
   what do we receive (status only)?
6. API: sandbox, webhooks (signing method, retries, event IDs), status model, reconciliation.
7. Your licences/registrations per country (needed for Apple review and our counsel).
8. (Julaya) Could you accept a Julaya cash-collection receipt as the trigger to release crypto to
   our user (option 3)?
9. **Partner fee:** can we add our own commission (% and/or fixed) on top of your fees, shown to the
   user in your quote? How and how often is it paid out to us (fiat to our bank, or USDC to our
   wallet)? What reporting do we get for reconciliation?
10. Can your KYC result be used to confirm a unique, verified person (we need it for our referral
    programme's "one reward per verified person" rule)? What identifier can you share without
    sending us the documents?
11. Do you support TRC20 (Tron) and BEP20 (BNB Chain) USDT delivery as well?

## IvoryPay (O3)

Same questions as Fonbnk 1–11.

## LI.FI

1. Integrator fee setup and payout; commercial terms, including **the share of our integrator fee
   LI.FI keeps**, and whether a fixed-amount fee is possible (or only a percentage).
2. Native **Bitcoin** routes (via THORChain): how the BTC leg is built and signed (PSBT / deposit
   address + memo), minimums, timing, and how it works with a Privy Bitcoin wallet.
3. Route security: how we verify the calldata / recipient in a returned route. Allowlist of
   contract addresses (needed for our gas-sponsorship policy). Changes since the July 2024
   incident.
4. Status API / webhooks for cross-chain routes; failure and refund handling.
5. Rate limits, API key tiers, SLA.

## Everstake

1. SDK/API for ETH pooled staking (0.01 ETH minimum), SOL, and POL (later): current methods,
   unbonding times, reward reporting API.
2. Compatibility with EIP-7702-delegated wallets.
3. Revenue share / fee model for wallet partners; white-label terms; required disclosures.

## Bridge

1. KYB for a Senegalese SA. Which end-user countries can use USD/EUR on/off-ramp (diaspora:
   France, EU, US, UK)? Partner / developer fee support (our commission on top)?
2. Delivery of USDC on Polygon to a self-custodial address. Embedded KYC flow. Webhooks.

## Card on-ramp shortlist (O6): Transak, MoonPay, Ramp Network, Banxa

1. Card acceptance rates for cards issued in Senegal, Côte d'Ivoire and Cameroon (Visa /
   Mastercard / GIM-UEMOA).
2. USDC/USDT on Polygon delivery (also TRC20 / BEP20). Fees. **Partner fee on top (ours) and its
   payout.** Limits. KYC in French. Mobile SDK. Webhooks.
3. Licences relevant to our countries (for Apple review).

## Twilio

1. **Twilio Verify for login codes** (used by Privy via "bring your own Twilio"): Fraud Guard,
   geo-permissions for our countries, per-country pricing, French message templates.
2. WhatsApp Business sender approval for Jokko Chain SA; template approval for claim-link,
   reminder and referral-invite messages.
3. SMS sender ID registration requirements in Senegal, Côte d'Ivoire, Cameroon (alphanumeric
   "JOKKO").
4. Delivery rates and costs per country.

## Alchemy (P1)

1. EIP-7702 + Gas Manager on Ethereum, Polygon **and BNB Chain** mainnet with a Privy signer on
   Expo.
2. Sponsorship policy features: contract/method allowlists, per-user caps, spend alerts.
3. Notify webhooks + Transfers API coverage for Ethereum and Polygon; pricing.

## Chainalysis (O7)

1. Terms and limits of the free sanctions screening API; upgrade path to KYT; pricing.

## Tron infrastructure (if Privy confirms Tron wallets)

1. QuickNode / TronGrid: endpoints, rate limits, transaction webhooks for TRC20 transfers.
2. Energy: cost of staking TRX for energy vs renting energy per transfer, and reliable rental
   providers with an API, so we can quote and optionally sponsor TRC20 transfer fees.
