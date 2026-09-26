# Design references

Visual reference only. Everything is rebuilt natively in Expo / React Native, and no code is
ported from the existing build (per `CLAUDE.md`). **Every issue listed in §4 gets fixed in the
rebuild (D21).**

## 1. Files

| Path | What it shows | Source |
|---|---|---|
| `existing-build/home/top.webp` | Home: header (wallet selector, history, scan, notifications), total balance in XOF, Buy / Send / Receive / Sell, "Instant transfer worldwide" carousel, promo tiles | Existing Jokko build |
| `existing-build/home/asset-list.webp` | Home: "My wallet / Trending" tabs, asset rows with network badges | Existing Jokko build |
| `existing-build/swap/empty.webp` | Swap ("Exchange"): token selectors, % buttons, "Swap Now" | Existing Jokko build |
| `existing-build/card-waitlist/default.webp` | Card waitlist: logo + wordmark, card visuals, carousel text, email field, "Join Waitlist" | Existing Jokko build |
| `existing-build/borrow/empty.webp` | Borrow: collateral (USDC · ETH), loan (USDT · TRX), % buttons, LTV / APR, "Get Loan" | Existing Jokko build (feature comes after launch) |
| `existing-build/invest/empty.webp` | Invest (staking) with no positions | Existing Jokko build |
| `existing-build/settings/top.webp` | Settings: profile, Wallet, Transaction History, Referral, Language, Currency (XOF), Biometric Login | Existing Jokko build |
| `existing-build/settings/bottom.webp` | Settings: notification preferences, Help Center, Logout | Existing Jokko build |
| `reference/revolut/home-redacted.png` | Revolut home: balance, action row, alert card, recent activity, anti-scam banner | Revolut (layout only, **personal data blurred**) |
| `reference/revolut/payments-list-redacted.png` | Revolut Payments: one row per contact, the model for our chat-style threads | Revolut (layout only, **personal data blurred**) |

Naming convention: `existing-build/<screen>/<state>.<ext>` (states: `empty`, `loaded`, `error`, …).

> Any screenshot containing real personal data (names, IBANs, phone numbers, balances,
> addresses) must be blurred **before** it is committed.

## 2. Colour tokens

Sampled from compressed screenshots, so values are ±2–3 per channel. **The lime is confirmed
as `#C9F17B`**: identical on the logo, the "Join Waitlist" button, the card illustration and the
"Buy" button. Confirm the rest against the source design file before locking.

| Token | Hex | Seen on |
|---|---|---|
| `bg.gradientTop` | `#041612` | Screen background, top |
| `bg.gradientMid` | `#0C1F16` | Screen background, middle |
| `bg.gradientBottom` | `#162B1D` | Screen background, bottom |
| `surface.card` | `#172B20` | Settings groups, cards, input fields |
| `surface.iconTile` | `#253B26` | Rounded square behind row icons |
| `surface.badge` | `#2A402B` | Network badges ("Ethereum", "BNB Smart Chain") |
| `accent.primary` (lime) | `#C9F17B` | Logo, primary buttons, toggles (on), active nav icon |
| `button.primaryDisabled` | `#688B4D` | "Get Loan" / "Swap Now" when nothing is entered (see §4) |
| `nav.bar` | `#4E7B53` | Bottom navigation pill |
| `nav.active` | `#305436` | Active tab background |
| `nav.label` | `#D5E4D8` | Inactive tab labels |
| `text.primary` | `#FFFFFF` | Titles, row labels |
| `text.secondary` | `#75867E` | Values ("English", "XOF"), subtitles |
| `text.sectionHeader` | `#5A6B63` | "PREFERENCES", "SUPPORT" |
| `positive.text` | `#2EB186` | Positive changes |
| `positive.bg` | `#0F4233` | Positive badge background |
| `warning.bg` | `#50442A` | Warnings (was the "Hot" badge) |
| `danger` | `#F55F5D` | Logout icon, destructive actions, negative changes |

**Logo:** lime "J" mark + "Jokko Chain" wordmark (`card-waitlist/default.webp`). Vector source
files (SVG) are needed from the designer. Don't trace from screenshots.

## 3. Two languages everywhere (D20)

- **Every** visible string goes through `packages/i18n`: screens, errors, notifications,
  emails, SMS/WhatsApp templates, store listing. No text is written directly in components.
- Language can be changed any time in **Settings → Langue / Language**. The first launch follows
  the phone's language, and French is the fallback in UEMOA/CEMAC.
- **Formatting follows the language:** French `12 500 FCFA` / `1 234,56 $` / `26/09/2026`;
  English `12,500 FCFA` / `$1,234.56` / `26 Sep 2026`. FCFA never shows decimals.
- **Layouts must fit French**, which is typically 20–30% longer than English: no fixed-width
  buttons, labels can wrap to two lines, and every screen is checked in both languages before
  it's done.
- **Tone:** French uses **« vous »** throughout (the existing tiles use « tu », which is too
  familiar for a financial product). English is plain and direct.

## 4. What the existing build gets wrong, and the fix (D21 checklist)

### Home (`home/top.webp`, `home/asset-list.webp`)
- [ ] Balance shows `1126.584` XOF → XOF has no decimals: **« 1 127 FCFA »**, labelled ≈.
- [ ] "+0.433 XOF today" → drop meaningless precision: « +0,04 % aujourd'hui ».
- [ ] Remove the **"Instant transfer worldwide"** carousel (spec + wording risk, `06` §4).
- [ ] Promo tiles: static (not a horizontal scroll), approved copy only, footnote. The current
      staking tile's wording must change (`06` §4).
- [ ] Mixed languages (English screen, French tiles) → one language at a time (§3).
- [ ] "My wallet / **Trending**" → "Mon portefeuille / **Historique**" (spec).
- [ ] Asset rows list **zero balances** (ETH 0.00, BNB 0.00…) → show only assets above zero
      (D7); new users get a "Recharger" call-to-action instead.
- [ ] Values shown in **$** with 4 decimals ("$0.0000", "+$0.000756") while the currency setting
      is XOF → the display currency everywhere, sensible precision.
- [ ] "Polygon · 0.00 **MATIC**" → **POL** (MATIC was renamed in 2024).
- [ ] Network badges: keep the idea, rename to user labels: "Ethereum (ERC20)", "BNB Chain
      (BEP20)", "Tron (TRC20)", "Polygon", "Solana", "Bitcoin" (D15).
- [ ] Same asset on several networks → one grouped row with a Consolidate action (D7).
- [ ] "Wallet 1" selector → one wallet per user at launch (P17): show the user's name only.
- [ ] Keep: "Tap to hide" balance (good privacy feature), Buy / Send / Receive / Sell, the header
      icons (history, scan QR, notifications).
- [ ] Add: permanent anti-scam banner « Jokko ne vous appellera jamais » and an alert-card slot
      (security prompts, expiring invites, wrong-network funds).

### Swap (`swap/empty.webp`)
- [ ] Title "Exchange" vs tab "Swap" → one name: « Échanger » / "Swap".
- [ ] Back arrow on a main tab → remove (tabs are top-level).
- [ ] "50%" pre-selected with no token chosen → nothing selected until a token is picked.
- [ ] "Swap Now" looks active with nothing entered → proper disabled state, with a hint about
      what's missing.
- [ ] Amounts in "$" → display currency.
- [ ] Missing before confirmation: network of each token, rate, minimum received, slippage, fees
      (network / LI.FI / **Jokko fee**), estimated time for cross-network swaps.

### Invest → Gagner / Earn (`invest/empty.webp`)
- [ ] Remove "Hot", "LOW RISK" and "Restake"; APY labelled « estimé, variable »; minimums read
      from Everstake (ETH is now 0.01, not 0.1); display currency instead of $ (`06` §4).
- [ ] Only ETH and SOL in the staking flow at launch (D16).

### Card waitlist (`card-waitlist/default.webp`)
- [ ] Keep the layout (logo, card visual, email field, lime button). It's the best-looking screen.
- [ ] Add « Bientôt disponible, sous réserve de disponibilité dans votre pays » (`06` §4).
- [ ] Carousel text in both languages. Email validated, stored in `waitlist_signups` with
      consent.
- [ ] Moves under "Plus / More" if P10 (bottom navigation) is accepted.

### Borrow (`borrow/empty.webp`) — after launch
- [ ] The current design borrows USDT on **Tron** against USDC on **Ethereum**, which implies a
      custodial lender. Rebuild on Aave V3: collateral and loan on the same network, in the
      user's own wallet (`06` §4).
- [ ] Show health factor and a liquidation price, with clear warnings; APR labelled variable.
- [ ] Hidden at launch (feature flag).

### Settings (`settings/top.webp`, `settings/bottom.webp`)
- [ ] Add **Sécurité** section (`docs/03-onboarding-and-recovery.md` §7), replacing the lone
      "Biometric Login" toggle.
- [ ] **Security alerts** always on (no toggle), with a short explanation.
- [ ] Language: switch FR/EN (D20). Currency: XOF default, plus XAF, EUR, USD.
- [ ] Referral entry stays (D22) → leads to the referral screen (`docs/09-fees-and-referrals.md`).
- [ ] "Transaction History" moves to Home / Payments (a shortcut can stay).

## 5. Navigation and key patterns

**Bottom navigation (P10, awaiting confirmation):** the existing build has Home · Swap · Card ·
Borrow · Invest. Borrow and Card aren't in the launch scope, so the proposal is:

> **Accueil · Paiements · Échanger · Gagner · Plus**
> (Home · Payments · Swap · Earn · More)

"Plus" holds Card waitlist, Business waitlist, Referral, Settings, Help, and later Borrow.

**Payments tab = chat-style threads** (modelled on `reference/revolut/payments-list-redacted.png`):
- One row per counterparty: avatar with initials, name (or shortened address), last activity
  (« Vous avez envoyé 10 000 FCFA »), date.
- A small **badge on the avatar** shows the counterparty type: Jokko user · external address ·
  pending phone invite (clock icon) · provider (e.g. Orange Money top-up).
- Opening a row shows the **thread**: message-style bubbles (sent on the right, received on the
  left) with amount, asset, network, status, and quick actions « Envoyer » / « Demander ».
- Dust / zero-value transfers from unknown addresses never create a thread.

**Every confirmation screen** shows: recipient, network, amount, then the fee breakdown
(network fee or « offert par Jokko », provider fee, **Frais Jokko**), total, and the disclosures
required for that product (`docs/06-compliance-and-marketing.md` §3).
