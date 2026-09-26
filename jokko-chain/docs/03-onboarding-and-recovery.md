# Onboarding, login, security levels and recovery

Status: security levels **decided (D13)**; the onboarding flow (P13, P14, P15) is **proposed**. Builds on
founder decision D6.

## 1. Who handles login?

**Privy handles both login and the wallet, in one step.** When a user verifies their phone
number with Privy's code, Privy logs them in *and* creates or unlocks their
wallets (EVM for Ethereum + Polygon, Solana, Bitcoin). There is no separate "Jokko login"
behind it.

**Why not our own login system (P14):** if our servers issued logins (Privy's "custom auth"), an
attacker who broke into our backend could log in as any user and reach their wallet. With
Privy's own login, even a fully compromised Jokko backend can't open a user's wallet. That's
worth more than any flexibility custom auth would give us. It also keeps one system instead of
two.

**What Jokko's backend does:** it stores the profile (name, preferences, consents), verifies
Privy's login token on each API call, and links everything to the Privy user ID.

## 2. Three different things people call "security"

| Thing | What it protects | Where it lives | Example |
|---|---|---|---|
| **App lock** (passcode + Face ID / fingerprint) | Someone picking up your unlocked phone | Only on this phone; never sent to Jokko | 6-digit code to open the app |
| **Login methods** (phone, email) | Getting back in on a new phone. **Any one** of them works (OR) | Privy | Lost SIM → log in with email instead |
| **Wallet MFA** (passkey or authenticator app) | Someone who hijacked your phone number. It's needed **in addition** to login (AND) for sending, exporting, and using the wallet on a new phone | Privy enforces it, not our app | SIM-swapper gets the code, but has no passkey → can't send |

Adding an email is **"OR"**: it's a second way back in, which helps recovery. It isn't
protection "on top", because if the email account is hacked it's another way in for the
attacker. **Protection "on top" comes from the passkey (wallet MFA).** The best setup is:
phone + verified email (so you're never locked out) + passkey (so a SIM swap isn't enough).

A passkey is not a password to remember. It's created with Face ID / fingerprint and synced by
iCloud Keychain / Google Password Manager, so for the user it feels like "confirm with Face
ID".

## 3. Proposed sign-up flow (about 60–90 seconds)

1. **Welcome** (French by default in UEMOA/CEMAC, based on phone language) → "Créer un compte" /
   "Se connecter".
2. **Phone number** (country picker, defaults from the SIM/locale) + checkbox accepting Terms,
   Privacy Policy and risk summary (versions recorded) + "I am 18 or older" + optional referral
   code (pre-filled from an invite link) → receive the code → enter the 6-digit code. Wallets are
   created silently at this point.

   > **Channel decision needed (O12):** Privy allows **either SMS or WhatsApp** for login codes,
   > not both, for the whole account, and **the choice cannot be changed later**.
   > Recommendation (P15): **SMS through Jokko's own Twilio account** (Privy's "bring your own
   > Twilio", required anyway for African numbers). Why: it works for every user, including
   > people without WhatsApp; the message shows Jokko's sender name; we control fraud protection
   > and country coverage. WhatsApp remains our channel for claim links, reminders and
   > notifications. Privy requires its **Scale or Enterprise** plan for both international SMS
   > and WhatsApp.

   If the number already has an account, this is simply a login.
3. **Name** (first + last). Shown to people you pay and who pay you (chat threads), and used on
   receipts.
4. **Email, optional** with a visible "Passer" (skip). If entered, it's **verified with a
   6-digit code**, because an unverified email can't be used for recovery and a typo would send
   security alerts to a stranger. Copy: "Récupérez votre compte si vous perdez votre numéro, et
   recevez les alertes de sécurité."
5. **App lock:** create a 6-digit passcode, then turn on Face ID / fingerprint.
6. **Home**, with a "Sécurisez votre compte" card showing level 1 of 3.

No identity verification (KYC) at sign-up. The ramp providers run it the first time the user
tops up or withdraws (per the spec).

**"J'ai déjà un portefeuille" (P13):**
- Existing Jokko user → "Se connecter" (same phone flow).
- Wallet from another app (MetaMask, Binance, …) → **"Transférer depuis un autre portefeuille"**,
  which shows the user's Jokko receive addresses. **No recovery-phrase import at launch:**
  "type your 12 words into this app" is the most common crypto scam, and we want Jokko users to
  learn *never* to do it. Can be revisited later.

## 4. Security levels and thresholds (answers "what amounts trigger extra security?")

Thresholds are in FCFA (≈ USD at about 565 FCFA per dollar; the exact rate moves with EUR/USD).
They live in server configuration so they can be tuned without an app release. **Accepted by the
founder (D13), without any waiting period after a new-device login.**

| Level | Setup | Required when… | Prompt style |
|---|---|---|---|
| **1 — Basic** | Phone login + app lock | Always (sign-up) | — |
| **2 — Protected** | + verified email + **passkey (wallet MFA)** | Balance ≥ **50,000 FCFA** (~$90): prompt. Balance ≥ **250,000 FCFA** (~$440): passkey **required to send** (receiving is never blocked) | Dismissible card at 50k, reappears weekly; full-screen step before a send above 250k |
| **3 — Maximum** | + cloud backup (iCloud on iOS / Google Drive on Android, availability on Expo Android to confirm with Privy) | Balance ≥ **1,000,000 FCFA** (~$1,770): strongly recommended | Persistent card in Settings → Security |

**Extra rules:**
- **Any single send ≥ 500,000 FCFA:** an extra confirmation screen showing the recipient's name
  or full address and the amount.
- **Every new-device login:** email alert (if an email is linked) + push to the other devices.
  These alerts can't be switched off (P11).

## 5. Recovery — on Jokko vs in another app

**Recovering on Jokko (normal case)**

| Situation | What the user does |
|---|---|
| New phone, same number | Install Jokko, log in with the phone code (+ passkey if enrolled). The wallet is back. |
| Lost SIM | Get the same number back from the operator (usual in Senegal with ID), **or** log in with the linked email, then update the phone number |
| Lost phone number **and** no email **and** never exported keys | **Funds cannot be recovered, by Jokko or anyone.** That's the price of non-custodial, and it's why we push email + backup as the balance grows |

**Recovering in another app (MetaMask, Phantom, a Bitcoin wallet)**

Yes, it's different. Other apps can't log in with a Jokko phone number, because the wallet is
tied to Jokko's Privy app. To use the same funds elsewhere, the user **exports** their keys from
Jokko and imports them there, exactly like moving from MetaMask to another wallet:
- The **Ethereum key** covers Ethereum **and** Polygon (same address, and still the same address
  with EIP-7702, P1).
- **Solana** and **Bitcoin** each have their own key.
- Privy wallets are standard HD wallets (BIP-39). Privy supports exporting the seed phrase or the
  private key. Exact export options on Expo for each chain to confirm with Privy (O1).

## 6. The recovery phrase in Settings

In Jokko, the recovery phrase is **not** part of "securing your wallet". Securing means email,
passkey and backup (§4). The phrase is an **exit key** for people who want to use their wallet
outside Jokko, and it carries a real danger: **anyone who sees the phrase gets everything,
bypassing the passkey and every other Jokko protection.** So:

- Location: Settings → Sécurité → Avancé → "Exporter mes clés".
- Before revealing: an education screen (3 short points: never share it, Jokko will never ask
  for it, anyone who has it owns your money) + a confirmation checkbox.
- Gate: passcode/biometric + Privy MFA if enrolled.
- The screen blocks screenshots and screen recording, and hides the phrase until
  press-and-hold.
- Every export triggers a security alert (email + push) and an `audit_log` entry.

## 7. Settings → Sécurité (new section; replaces the lone "Biometric Login" toggle)

- Security level (1/2/3) with what's missing
- Phone number · Email (add / verify / change)
- Passkey (add / remove)
- Cloud backup (iCloud / Google Drive)
- App lock: change passcode, Face ID / fingerprint, auto-lock delay
- Devices logged in (with "log out other devices")
- Advanced → Export keys
