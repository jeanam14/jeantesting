# Setup checklist (accounts and access the founder creates)

Everything here is created **by Jokko Chain SA, in Jokko Chain SA's name**, never on a
personal account. Use the company email, store credentials in the company password manager, and
turn on two-factor login (hardware key where supported) on every account.

> **Never paste secrets into chat or into the repository.** "App ID" / "Client ID" values are
> public identifiers and are fine to share. Anything called *secret*, *private key*, *token* or
> *password* goes only into the secret store it's meant for (GitHub secrets, AWS Secrets
> Manager).

## For Step A — Design (nothing mandatory)

Helpful if available, not blocking:
- [ ] Logo as vector files (SVG): the "J" mark and the "Jokko Chain" wordmark
- [ ] Name (or files) of the font used in the existing build
- [ ] Card artwork (the card images on the waitlist screen) and the app icon
- [ ] Figma file of the existing design, if one exists

## For Step B — Wallet shell (real Privy wallet, other features in demo mode)

### 1. Privy (dashboard.privy.io)
- [ ] Create the Privy account for Jokko Chain SA, and one app named **"Jokko Chain (dev)"**
      (separate staging / prod apps come later).
- [ ] Login methods: enable **Email** for development.
      **⚠ Do NOT enable SMS or WhatsApp yet.** Privy allows only one of the two, for the whole
      account, and the choice can never be changed (O12).
- [ ] Embedded wallets: **self-custodial**, created automatically at login, for **Ethereum
      (EVM), Solana and Bitcoin** (Tron once Privy confirms in-app support).
- [ ] Custodial wallets: **off**. Session signers / server-side access: **none** (non-negotiable
      rules 1 and 6 in `CLAUDE.md`).
- [ ] Add a mobile (Expo) client with allowed identifiers `com.jokkochain.app.dev` (iOS bundle ID
      and Android package) and URL scheme `jokkochain-dev`.
- [ ] If the dashboard offers a **test account** (fixed email/phone + fixed code), enable it for
      demos and store review.
- [ ] Send the **App ID** and **Client ID** (public). **Do not send the App Secret** (not needed
      yet).
- Plan: the free/developer plan is enough for Step B (email login). The Scale or Enterprise plan
  is needed later for African phone numbers (bring your own Twilio).

### 2. Expo (expo.dev) — builds the app you install on your phone
- [ ] Create an Expo **organization** "jokkochain" owned by the company account.
- [ ] Create a **robot access token** for that organization.
- [ ] Add it to GitHub: repository → Settings → Secrets and variables → Actions → new secret
      named `EXPO_TOKEN`. Builds then run from GitHub Actions, and nobody handles the token by
      hand afterwards.

### 3. Installing test builds on your phone
- **Android:** nothing else needed. Each build gives an install link.
- **iPhone:** requires the **Apple Developer Program as an organization**, which needs a
  **D-U-N-S number** for Jokko Chain SA (free from Dun & Bradstreet, but it can take days to
  weeks, so **start now**). After enrollment, test builds go through **TestFlight**.
- **Google Play Console** (organization account): only needed for store release, later.

### 4. Decisions still open that the design will show (can be changed on the canvas)
- P10 bottom bar (Accueil · Paiements · Échanger · Gagner · Plus)
- P13 no wallet import at launch
- P16 referral defaults
- P17 one wallet per user
- O12 SMS or WhatsApp login (only the wording of one onboarding screen depends on it)
