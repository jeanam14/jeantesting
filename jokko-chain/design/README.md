# Design references

Visual reference only. Everything is rebuilt natively in Expo / React Native, and no code is
ported from the existing build (per `CLAUDE.md`).

## Files

| Path | What it shows | Source |
|---|---|---|
| `existing-build/settings/top.webp` | Settings: profile, Wallet, Transaction History, Referral, Language, Currency (XOF), Biometric Login | Existing Jokko build |
| `existing-build/settings/bottom.webp` | Settings: notification preferences, Help Center, Logout | Existing Jokko build |
| `existing-build/invest/empty.webp` | Invest (staking) with no positions; bottom navigation | Existing Jokko build |
| `reference/revolut/home-redacted.png` | Revolut home: balance, action row, alert card, recent activity, anti-scam banner | Revolut (layout only, **personal data blurred**) |
| `reference/revolut/payments-list-redacted.png` | Revolut Payments: one row per contact, which is the model for our chat-style threads | Revolut (layout only, **personal data blurred**) |

More existing-build screenshots are coming from the founder (O11). Naming convention:
`existing-build/<screen>/<state>.<ext>` (states: `empty`, `loaded`, `error`, …).

> Any screenshot containing real personal data (names, IBANs, phone numbers, balances,
> addresses) must be blurred **before** it is committed.

## Colour tokens (sampled from screenshots, 2026-09-26)

Sampled from compressed screenshots, so values are approximate (±2–3 per channel). **Confirm
against the source design file before locking.** Note that the lime is `#C9F17B`, softer than
the `#c6f24e` guessed in the original spec.

| Token | Hex | Seen on |
|---|---|---|
| `bg.gradientTop` | `#041612` | Screen background, top |
| `bg.gradientMid` | `#0C1F16` | Screen background, middle |
| `bg.gradientBottom` | `#162B1D` | Screen background, bottom |
| `surface.card` | `#172B20` | Settings groups, cards |
| `surface.iconTile` | `#253B26` | Rounded square behind row icons |
| `accent.primary` (lime) | `#C9F17B` | Toggles (on), icon strokes, active nav icon |
| `nav.bar` | `#4E7B53` | Bottom navigation pill |
| `nav.active` | `#305436` | Active tab background |
| `nav.label` | `#D5E4D8` | Inactive tab labels |
| `text.primary` | `#FFFFFF` | Titles, row labels |
| `text.secondary` | `#75867E` | Values ("English", "XOF"), subtitles |
| `text.sectionHeader` | `#5A6B63` | "PREFERENCES", "SUPPORT" |
| `positive.text` | `#2EB186` (≈ `#28B988`–`#32AD84`) | "+0.00%", positive amounts |
| `positive.bg` | `#0F4233` | Positive badge background |
| `warning.bg` | `#50442A` | (was the "Hot" badge; reuse for warnings) |
| `danger` | `#F55F5D` | Logout icon, destructive actions |

## Screen notes and proposals

**Bottom navigation (P10):** the existing build has Home · Swap · Card · Borrow · Invest. Borrow
and Card aren't in the launch scope (D1), so the proposal is:

> **Accueil · Paiements · Échanger · Gagner · Plus**
> (Home · Payments · Swap · Earn · More)

"Plus" holds Card waitlist, Business waitlist, Settings, Help, and later Borrow. New features go
there or behind flags without redesigning the bar.

**Payments tab = chat-style threads** (modelled on `reference/revolut/payments-list-redacted.png`):
- One row per counterparty: avatar with initials, name (or shortened address), last activity
  ("Vous avez envoyé 10 000 FCFA"), date.
- A small **badge on the avatar** says what kind of counterparty it is: Jokko user · external
  address · pending phone invite (clock icon) · provider (e.g. Orange Money top-up).
- Tapping a row opens the **thread**: message-style bubbles (sent right, received left) with
  amount, asset, network, status, and quick actions "Envoyer" / "Demander".
- Dust / zero-value transfers from unknown addresses never create a thread (T8).

**Home** (from the spec + Revolut reference):
- Total balance in FCFA ("≈"), action row **Acheter · Envoyer · Recevoir · Vendre**, asset list
  (network badges, grouped + Consolidate), static promo tiles (with approved copy).
- A **permanent anti-scam banner** in the style of Revolut's "Revolut is not calling you":
  « Jokko ne vous appellera jamais ».
- An **alert card** slot like Revolut's ("We froze your card…"), used for "Sécurisez votre
  compte", pending invites about to expire, and wrong-network funds detected.

**Settings** (from `existing-build/settings/*`):
- Keep the visual style (grouped rounded cards, icon tiles, lime toggles).
- Add a **Sécurité** section (`docs/03-onboarding-and-recovery.md` §7). It replaces the lone
  "Biometric Login" toggle.
- **Security alerts** can't be toggled off (P11). Show them as always on, with an explanation.
- "Transaction History" moves to Home / Payments (keep a shortcut if wanted).
- Language: French by default in UEMOA/CEMAC (the screenshot shows English).
- Currency: XOF default; also offer XAF, EUR, USD.
- Referral: pending O9.

**Invest → "Gagner" / Earn** (from `existing-build/invest/empty.webp`): see
`docs/06-compliance-and-marketing.md` §4. Remove "Hot" / "LOW RISK" / "Restake", label APY as
estimated and variable, read minimums from the provider (ETH is now 0.01), and use the display
currency.
