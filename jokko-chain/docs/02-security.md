# Security

Status: **proposed baseline**. Every item here becomes a tracked control once code exists.
Standards targeted: **OWASP MASVS L2 + resilience** (mobile app), **OWASP ASVS L2** (API),
**L3** for signing, addresses, amounts, authentication and admin.

## 1. What we protect, and what "non-custodial" means for security

- Users' funds sit in wallets **only the user can sign for**. Jokko can't move, freeze, reverse
  or recover them. That's the legal model, and it's also a security property: there is no Jokko
  master key to steal.
- **The flip side:** if an attacker gets into a user's wallet, Jokko can't undo it. So the
  security design concentrates on **stopping account takeover before it happens** and on
  **making sure the app only ever signs what the user intended.**
- We still hold things worth attacking: personal data (phones, emails, names), the ability to
  influence *what* users sign (addresses, quotes), operational keys that pay fees, and our
  brand (phishing).

## 2. Threat model

| # | Threat | Impact | Main controls |
|---|---|---|---|
| T1 | **SIM swap / recycled phone number:** attacker receives the user's login code | Full wallet takeover | Privy **wallet MFA** (passkey), which Privy enforces for signing, exporting, and use on a new device; security levels with balance thresholds (`03`); new-device alerts by email + push to the old device; Privy's SMS MFA not offered (same weakness as login). (A 24h hold after new-device login was considered and rejected by the founder, D13) |
| T2 | **Social engineering:** "Jokko support" calls and asks for the code | Takeover | Permanent in-app banner "Jokko ne vous appellera jamais", modelled on Revolut's "Revolut is not calling you"; the OTP message itself says "never share this code"; support scripts never ask for codes |
| T3 | **Backend compromise → address substitution:** our server returns an attacker's address for a phone number or ramp destination | User signs a valid transaction to the attacker | Ramp destination addresses **always come from the device's Privy SDK**; phone→address mappings are **pinned on device** after first use with an alert if one changes; the verify step (`01` §9) checks built transactions against user intent; append-only audit log of every mapping |
| T4 | **Malicious app update or dependency** (supply chain) | Mass key abuse on devices | EAS Update **code signing** + restricted publish rights, or no over-the-air updates in prod; lockfile pinning; Renovate with manual review; Socket.dev / OSV scanning; no secrets in `EXPO_PUBLIC_*`; reproducible builds; release sign-off by two people |
| T5 | **Privy dashboard misconfiguration** (custodial mode, session signers) | Breaks the legal model; server-side key access | Configuration baseline (§5), audited at every release; two named admins with hardware keys; separate Privy apps per environment |
| T6 | **Lost or stolen unlocked phone** | Local misuse | App lock (6-digit passcode + biometric), auto-lock after 60s in background, passcode never leaves the device, 5 wrong attempts → forced re-login |
| T7 | **Malware / rooted device / overlay attacks / clipboard hijack** | Key misuse, address swap | freeRASP detection → warn and restrict high-risk actions; FLAG_SECURE / screen-capture blocking on sensitive screens; the address confirmation screen highlights the first and last 6 characters and warns if a pasted address differs from the one copied in-app |
| T8 | **Address poisoning** (dust from lookalike addresses) and **scam tokens** | User copies the wrong address; phishing links | Zero/dust transfers from unknown senders are hidden from threads and "recent recipients"; curated token allowlist (P7); lookalike-address warning when a new recipient matches the first/last characters of a known one |
| T9 | **Malicious approvals / signing phishing** | Drain via token allowances | **Exact-amount approvals only, never unlimited** (LI.FI suffered an approval-related exploit in July 2024); approvals revoked after use where practical; transaction simulation + Blockaid scanning (available through Privy); the app never signs arbitrary messages from external sites |
| T10 | **Paymaster / fee-payer abuse** | Our gas budget drained | Sponsorship only for allowlisted contracts + methods, per-user daily caps, attestation-gated; the Kora fee payer rejects any transaction where it's anything but the fee payer; low float balances + alerts |
| T11 | **OTP / SMS pumping fraud** | Cost blow-up, degraded delivery | Login codes go through **our own Twilio Verify account** (P15), so we control it: Twilio Fraud Guard, geo-permissions limited to our launch countries, spend limits, alerts on volume spikes. Our other Twilio sends only go to authenticated users, rate-limited per user, per destination, and per country prefix |
| T12 | **Webhook spoofing / replay** | False status, confused users (Julaya option 1: real money loss) | Signature + timestamp verification, unique event IDs, forward-only state machines (`01` §12) |
| T13 | **Insider misuse of the admin console** | Data leak, unauthorised changes | SSO + hardware keys, role-based access, masked personal data, logged reveals, four-eyes on sensitive actions, logged exports, quarterly access review |
| T14 | **Database breach** | Personal data exposure | Field-level encryption (AWS KMS envelope) for phone, email and name, with keyed hashes for lookups; minimal data (no KYC documents, ever); private subnets; encrypted backups |
| T15 | **Bots / DDoS / credential stuffing** | Availability, cost | AWS WAF + rate limiting (Redis); **App Attest / Play Integrity** tokens required on API calls |
| T16 | **Escrow contract bug** | Loss of funds in pending phone-sends | Minimal code, no admin / no upgrade, OpenZeppelin primitives, 100% test coverage + fuzzing + invariant tests, Slither, **external audit**, per-invite cap, bug bounty |
| T17 | **Wrong-network sends** | Funds stuck / lost | Network picker with "which network does the recipient use?", address-format validation, safety-net detection (`01` §7) |
| T18 | **Provider compromise** (ramp, LI.FI, indexer) | Bad quotes, fake statuses | The verify step (the app checks recipient/amount/token in the built transaction), slippage bounds, per-provider kill switches, provider status cross-checked against the chain |
| T19 | **Fee tampering** (a compromised server inflates the Jokko fee or redirects it) | Users overcharged, reputational damage | The quote locks the fee; the verify step checks the fee amount and that the fee goes to a known Jokko fee address compiled into the app; fee schedule changes need two approvers (`09-fees-and-referrals.md`) |
| T20 | **Referral farming** (multiple SIMs / fake accounts) | Marketing budget drained | One reward per KYC-verified identity, minimum top-up, 7-day hold, device checks, per-referrer caps, daily programme budget, review queue (`09` §2.2) |
| T21 | **Theft from Jokko's own wallets** (fee treasury, rewards wallet) | Loss of company money (never user funds) | Treasury = multisig with hardware keys held by different people; rewards wallet = KMS key with daily payout cap and small float; alerts on every movement |

## 3. Phone-send escrow (P2, supports D5)

Goal: let a sender pay someone who isn't on Jokko yet, with **cancel any time before claim** and
an **automatic refund after 48h**, without Jokko ever controlling the funds.

```
Sender ──deposit(recipient, token, amount, jokkoFee, expiry=now+48h)──▶ Escrow contract
                                                                │
   claim(id)  — anyone may call; `amount` can ONLY go to `recipient` (the pregenerated
                wallet of the invited phone number) and `jokkoFee` ONLY to the fee address
                fixed at deployment. Jokko's keeper calls it as soon as the recipient signs
                up, so the recipient never needs gas or a button.
   cancel(id) — ONLY the sender, any time before claim; amount AND fee return to the sender.
   refund(id) — anyone may call after expiry; amount AND fee can ONLY return to the sender.
                Jokko's keeper calls it at expiry so it happens automatically.
```

- **Jokko only earns the fee when the send succeeds** (D17, `09-fees-and-referrals.md`).
- **No owner, no admin, no pause, no upgrade.** The keeper key can only *trigger* functions
  whose destination is fixed by the contract, so compromising it can't steal anything. At worst
  it can call claim/refund early, which the contract's rules forbid anyway.
- **v1 scope:** USDC and USDT on Polygon (Ethereum possible). No Bitcoin or Solana escrow: Privy
  pregeneration covers Ethereum/Solana wallets only, and Solana escrow would need a separate
  audited program.
- **Limits:** per-invite cap (proposal: 100,000 FCFA) and per-sender daily cap on pending
  invites, since invites are a phishing lure if abused.
- **Reminders:** SMS/WhatsApp at send, 24h, and 44h ("your money expires in 4 hours").
- **Recycled numbers:** the 48h window shrinks the recycled-number risk. The claim link opens
  the app store / app, never a web form, and never asks for a code outside the app.
- **Legal:** counsel to confirm the escrow keeps the non-custodial position (O4).
- **Audit lead time:** book the audit early, because it gates non-user invites (P3).

## 4. Operational keys Jokko *does* hold (none of which can move user funds)

| Key | Purpose | Blast radius if stolen | Protection |
|---|---|---|---|
| Escrow keeper | Triggers claim/refund | None beyond gas; destinations fixed by contract | AWS KMS, small gas float, alerts |
| Kora fee payer (Solana) | Pays Solana fees | Its own SOL float | KMS, float cap, strict transaction validation |
| Paymaster / Gas Manager policy | Sponsors EVM gas | Gas budget | Allowlists, caps, provider-side limits |
| Contract deployer | Deploys escrow once | None after deploy (no admin rights exist) | Hardware wallet, retired after deploy |
| Webhook / API secrets | Provider auth | Fake webhooks (mitigated by T12 controls) | Secrets Manager, rotation |
| Privy app secret | Pregeneration, token verification | Can create users/wallets; **cannot sign** (no session signers, §5) | Secrets Manager, server-only, rotation |
| Fee treasury (multisig) | Receives Jokko fees (company revenue) | Company revenue only | 2-of-3 multisig, hardware keys, different holders |
| Rewards wallet | Pays referral rewards | Its float, capped per day | AWS KMS, daily cap, refills need two approvers |
| Twilio account (login SMS) | Delivers Privy login codes (BYO Twilio) | Could disrupt logins or run up costs; **cannot** log anyone in (Privy checks the code) | SSO + hardware key on the Twilio console, spend limits, geo-permissions |

## 5. Privy configuration baseline (checked at every release)

- [ ] Wallets: **self-custodial embedded wallets only**. The custodial wallet option is off.
- [ ] **No session signers / delegated actions / server-side signing** on any wallet.
- [ ] Login methods: SMS **or** WhatsApp OTP (Privy allows only one, account-wide, permanent: O12 / P15) (+ email as a linked method, + passkey). No custom JWT
      auth (P14).
- [ ] Wallet MFA: passkey + authenticator app (TOTP) enabled. **SMS MFA disabled** (same factor
      as login).
- [ ] Allowed app identifiers: only our bundle IDs / package names per environment.
- [ ] Transaction scanning (Blockaid) enabled, if available on our plan.
- [ ] Separate Privy app per environment. Prod dashboard: two named admins, hardware-key 2FA.
- [ ] Any dashboard change is recorded in `00-decision-log.md`.
- [ ] Automated check where Privy's API exposes configuration; otherwise a manual release
      checklist signed by two people.

## 6. Backend controls

- Authentication: verify the Privy access token (signature, issuer, audience, expiry) on every
  request; our own short-lived session is bound to the device and attestation.
- Authorisation: every query scoped to the authenticated user; ID-based access tests in CI.
- Input validation: zod schemas at every boundary; nothing reaches the database unvalidated.
- Rate limits: per user, per IP, per device, per endpoint class.
- Secrets: AWS Secrets Manager; least-privilege IAM per service; no long-lived human
  credentials in prod.
- Data: encryption at rest (RDS/KMS) + field-level for personal data; TLS 1.2+ everywhere;
  backups with point-in-time recovery, restore tested quarterly.
- `audit_log`: append-only, hash-chained (each row includes the previous row's hash) so
  tampering is detectable.

## 7. Development process

- Protected `main`; PRs only; **two approvals** on security-sensitive paths (`CODEOWNERS`):
  signing, pipeline, adapters, auth, contracts, admin, infra.
- CI gates: lint (incl. TSDoc), typecheck, unit + property tests, coverage thresholds, Semgrep /
  CodeQL, dependency and licence scan, gitleaks, contract tests (Foundry + Slither).
- Before launch: **external penetration test** (mobile + API + admin), **smart-contract audit**,
  threat-model review, Privy configuration audit.
- After launch: **bug bounty** (e.g. Immunefi), annual pen test, quarterly access reviews.
- Team: Google Workspace SSO, hardware security keys for all staff, password manager, managed
  laptops.

## 8. Incident response (runbooks to write in `docs/runbooks/`)

1. **User reports SIM swap / theft:** what support can and can't do (can't freeze funds); help
   the user log out of other sessions and rotate MFA; collect details for the police report; flag
   the attacker's addresses in screening.
2. **Provider incident:** kill switch, status banner, user comms.
3. **Suspected key leak** (operational keys §4): rotate, drain floats, post-mortem.
4. **Personal data breach:** containment; notify the Senegalese data protection authority (CDP)
   and affected users within the legal deadline (counsel to confirm; GDPR is 72h for EU users).
5. **Vulnerable app version:** raise the minimum supported version, force update.
