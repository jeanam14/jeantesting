# Compliance guide: wording, disclaimers and questions for counsel

> **This is not legal advice.** It's an engineering and product checklist, written to make the
> conversation with a Senegalese lawyer (and later CEMAC and EU counsel) fast and concrete.
> Every draft text below must be reviewed by counsel before it ships. Facts marked "as of
> 2026-09" come from public sources checked on 2026-09-26.

## 1. Regulatory context (as of 2026-09)

- **UEMOA has no complete crypto-specific framework yet.** In August 2026 the BCEAO governor
  repeated the central bank's position: caution for users, regulation in preparation, no
  timeline. The BCEAO cites three risks: volatility (capital loss), anonymity of often
  cross-border transactions, and exposure to cyberattacks.
- **The UEMOA uniform AML/CFT law (adopted 31 March 2023, transposed nationally) explicitly
  covers "prestataires de services d'actifs virtuels" (PSAV).** PSAV must obtain approval or
  register with the competent authority, and they carry the same AML duties as financial
  institutions (customer due diligence, suspicious transaction reports to CENTIF, record
  keeping).
- **Crypto-assets are not legal tender** in UEMOA/CEMAC, and they're outside deposit guarantee
  schemes.
- **CEMAC** (Cameroon, Gabon, Congo, Chad, CAR, Equatorial Guinea) is a separate regime
  (BEAC / COBAC / COSUMAF) and needs its own legal analysis before launching there.
- **Diaspora in the EU:** MiCA applies. France additionally restricts crypto advertising and
  influencer promotion by providers that aren't registered or authorised. **Don't run marketing
  aimed at France/EU until counsel clears it.**

### The central question for counsel

> Given that Jokko Chain never holds user funds or keys, never executes exchanges itself, and
> routes users to third-party providers who perform KYC, **is Jokko Chain a PSAV under the 2023
> uniform AML law as transposed in Senegal?** Does that answer change if Jokko earns fees on
> swaps (LI.FI integrator fee), receives revenue share from ramps or staking, or operates the
> phone-send escrow keeper?

The whole architecture is designed so the answer is "no". But this must be **confirmed in
writing before launch**, because a "yes" means approval/registration and an AML programme.

## 2. Vocabulary: what to avoid and what to use

Applies to the app, the website, app store listings, social media, ads, influencer scripts,
push/SMS/email campaigns, and support replies.

| Avoid (FR / EN) | Why | Use instead (FR) | Use instead (EN) |
|---|---|---|---|
| banque, néobanque, compte bancaire / bank, neobank, bank account | Reserved for licensed institutions | application, portefeuille | app, wallet |
| compte (on its own, for the wallet) | Suggests a bank account | portefeuille, votre espace | wallet |
| dépôt, déposer / deposit | Banking term | recharger, ajouter des fonds | top up, add funds |
| épargne, épargner / savings | Regulated savings products | *(don't use)* | *(don't use)* |
| intérêts, taux d'intérêt / interest | Implies a lending or banking product | récompenses de staking **estimées et variables** | estimated, variable staking rewards |
| investir, investissement, placement / invest, investment | May suggest regulated investment services (AMF-UMOA). **Counsel to confirm, including for the "Invest" tab name** | staking, gagner des récompenses | staking, earn rewards |
| garanti, sans risque, sûr, faible risque, « LOW RISK » / guaranteed, risk-free, safe, low risk | Misleading | Name the specific risks instead | Name the specific risks |
| « Hot », « ne ratez pas », « dernière chance » / FOMO language | Pressure selling | Neutral descriptions | Neutral descriptions |
| gratuit / free | Only true if there are no fees at all | sans frais de réseau (when Jokko sponsors the fee) | no network fee |
| transfert d'argent, envoi d'argent, « Instant transfer worldwide » / money transfer, remittance | Money transfer is a regulated payment service | envoyer des USDC, envoyer des cryptoactifs | send USDC, send crypto |
| monnaie, devise (for crypto) / currency, money | Not legal tender | cryptoactif, stablecoin | crypto-asset, stablecoin |
| « stable comme le dollar », « 1 USDC = 1 $ » | The peg isn't guaranteed | vise à suivre la valeur du dollar US | designed to track the US dollar |
| régulé, agréé, approuvé par la BCEAO, conforme / regulated, approved | False unless literally true | Only statements validated by counsel | Same |
| nous sécurisons vos fonds / we keep your money safe | Implies custody (the opposite of our model) | vous gardez le contrôle de vos fonds | you stay in control of your funds |
| « Gagne jusqu'à 6 % par an » (headline, no caveat) | Unqualified yield promise | « Récompenses estimées jusqu'à 6 %/an\* » + footnote | "Estimated rewards up to 6%/yr\*" + footnote |

**Always fine and encouraged (they're true):** "Vous seul contrôlez votre portefeuille",
"Jokko ne détient jamais vos fonds", "Frais affichés avant chaque opération", "Jokko ne vous
appellera jamais".

## 3. Required disclosures (draft French text, for counsel review)

| # | Topic | Draft text (FR) | Where it appears |
|---|---|---|---|
| 1 | General risk | « Les cryptoactifs sont volatils : leur valeur peut baisser fortement, jusqu'à la perte totale. Ils n'ont pas cours légal dans l'UEMOA et ne sont pas couverts par le Fonds de Garantie des Dépôts et de Résolution dans l'UMOA. Jokko Chain n'est ni une banque, ni un établissement de paiement ou de monnaie électronique. » | Onboarding (accepted with the Terms), Settings → Légal, website footer, app store description |
| 2 | Non-custodial | « Jokko Chain ne détient jamais vos fonds ni vos clés. Vous seul pouvez autoriser une transaction. Jokko Chain ne peut donc ni annuler, ni bloquer, ni récupérer une transaction ou des fonds perdus. » | Onboarding, before first send, key export screen, Help Center |
| 3 | Third-party services | « L'achat, la vente, l'échange et le staking sont fournis par des prestataires tiers, dont le nom est affiché avant confirmation, selon leurs propres conditions. » | Every ramp / swap / staking confirmation screen (with provider name + link to their terms) |
| 4 | Fees and rates | Breakdown before confirmation: frais de réseau (or « offerts par Jokko »), frais du prestataire, frais Jokko, taux appliqué, durée de validité du prix | Every confirmation screen |
| 5 | Staking | « Récompenses estimées, variables et non garanties. Vos actifs peuvent rester bloqués pendant la période de déblocage (environ X jours). Risques : baisse du prix, pénalités du réseau, défaillance du prestataire. » | Staking screens, promo tiles (footnote) |
| 6 | Stablecoins | « Un stablecoin vise à suivre la valeur du dollar américain mais peut s'en écarter. Sa valeur dépend de son émetteur (Circle pour l'USDC, Tether pour l'USDT). » | First purchase of a stablecoin, Help Center |
| 7 | Indicative values | « Valeur indicative en FCFA, calculée à partir des prix du marché. » | Next to balances (info icon) |
| 8 | Phone-send to non-users | « Si le destinataire ne réclame pas les fonds sous 48 h, ils vous sont restitués automatiquement. Vous pouvez annuler tant qu'ils ne sont pas réclamés. Une fois réclamés, l'envoi est définitif. » | Phone-send confirmation, invite status screen |
| 9 | Irreversibility | « Les transactions sur la blockchain sont définitives. Vérifiez l'adresse et le réseau. » | Send confirmation (external addresses) |
| 10 | Anti-scam | « Jokko ne vous appellera jamais et ne vous demandera jamais votre code, votre mot de passe ou vos clés. » | Persistent banner (like Revolut's), OTP messages, Help Center |
| 11 | Swap specifics | Slippage, possible cross-chain delay, minimum received amount | Swap confirmation |
| 12 | Age and eligibility | « Réservé aux personnes de 18 ans et plus. Service non disponible dans les pays sous sanctions. » | Onboarding |
| 13 | Tax | « Vous êtes responsable de vos obligations fiscales. » | Terms, Help Center |
| 14 | Marketing footer | « Les cryptoactifs comportent un risque de perte en capital. Les performances passées ne préjugent pas des performances futures. » | Every marketing asset mentioning rewards or prices |
| 15 | Jokko fee | « Frais Jokko : X FCFA » shown as its own line, separate from network and provider fees. Never bundled into the exchange rate without saying so | Every confirmation screen (`09-fees-and-referrals.md`) |
| 16 | Referral programme | « Invitez un ami : recevez 5 $ en USDC quand il recharge au moins 10 000 FCFA. Conditions : une récompense par ami vérifié, recharge sous 30 jours, limites applicables. » + link to the programme terms | Referral screen, invite messages, promo tile |

## 4. Screen-specific rules (from the existing build)

- **Invest screen** (`design/existing-build/invest/empty.webp`):
  - Remove the "Hot" and "LOW RISK" badges.
  - Label the APY "estimé, variable".
  - Read minimums from Everstake. ETH is now 0.01, not the 0.1 shown.
  - Remove "Restake" (it's a different, higher-risk product).
  - Show values in the user's display currency (the screen shows $ while Settings says XOF).
  - Tab name to be validated by counsel (P12).
- **Home promo tiles** (`design/existing-build/home/top.webp`): the current staking tile says
  « Gagne jusqu'à 6% par an — Investis tes cryptos aujourd'hui et commence à recevoir des
  récompenses de manière passive ». Problems: "Investis", unqualified "jusqu'à 6%", "passive".
  Replacement (draft): **« Récompenses de staking — Jusqu'à X %/an estimés\* sur ETH et SOL.
  \*Variable, non garanti. »** Only approved copy from the `promo_tiles` table, each with its
  footnote.
- **"Instant transfer worldwide" banner** (home): removed per the spec. Its wording also
  suggests a money-transfer service (§2).
- **Card waitlist** (`design/existing-build/card-waitlist/default.webp`): « Use your Jokko Chain
  card to pay directly with your cryptocurrencies… » is fine for a waitlist only if clearly
  marked as future and conditional: add « Bientôt disponible, sous réserve de disponibilité dans
  votre pays ».
- **Borrow** (after launch; `design/existing-build/borrow/empty.webp`): the screen shows
  collateral USDC on Ethereum and a loan in USDT on **Tron**. That pattern matches a *custodial*
  lending service where you hand over your collateral, which the non-custodial rules forbid.
  Our borrow feature (Aave V3) keeps collateral and loan on the same network, in the user's own
  wallet. Borrow wording ("prêt", "APR", "LTV", liquidation) needs its own counsel review
  before that feature ships.
- **Home balance:** "≈" + indicative-value tooltip.
- **Notification settings:** security alerts always on (P11). Marketing off by default ✓ (already
  the case in the existing build).

## 5. App stores

- **Apple App Store guideline 3.1.5:** wallet apps must be published by an **organisation**
  (Jokko Chain SA ✓; the enrollment needs a D-U-N-S number). Apps that facilitate crypto
  **exchange** (buy/sell/swap) must only be offered where the app has "appropriate licensing and
  permissions". Apple reviewers often ask for proof. **Prepare:** partner licences (ramp
  providers, LI.FI terms), counsel's opinion letter, and a country list limited to where we're
  covered.
- **Google Play** has a dedicated crypto exchanges and software wallets policy with
  country-specific requirements. Check the current list at submission.
- Store listing text follows §2 and §3 (no yield promises in screenshots or descriptions).

## 6. Personal data and consent

- **Senegal:** personal data law (Loi n° 2008-12) supervised by the **CDP**. A declaration is
  needed before processing, and transfers outside Senegal (e.g. AWS Paris) need a legal basis
  that counsel confirms. Other countries: Côte d'Ivoire (ARTCI), Cameroon (2024 law), GDPR for
  EU residents.
- **Consent:** Terms/Privacy/Risk accepted at onboarding (versioned). **Marketing consent
  separate and never pre-ticked.** WhatsApp/SMS marketing only with opt-in. Contact matching
  (if ever built) needs its own consent.
- **Minimisation:** no KYC documents, no contact books, personal data encrypted
  (`04-data-model.md`).

## 7. Marketing channel rules

- Influencers: disclosed partnership (#sponsorisé), approved script, no yield promises, no
  "get rich" framing, no France/EU targeting until cleared.
- Referral rewards (if O9): clear terms, no "free money" framing, fraud limits.
- Every campaign goes through a two-person review (marketing + compliance) with this document as
  the checklist.

## 8. Questions to send to counsel

1. PSAV status (the central question in §1), including the effect of fees and revenue shares.
2. Does the phone-send escrow contract, or operating its keeper, change Jokko's status?
3. Could "send by phone number" be characterised as a money transfer / payment service?
4. Staking features and the tab name ("Invest" vs "Earn" vs "Staking"): any AMF-UMOA angle?
5. Advertising rules or mandatory warnings for crypto in Senegal / UEMOA today.
6. Review and adapt the draft disclosures in §3 and the Terms / Privacy / Risk documents (FR + EN).
7. CDP declaration, cross-border transfer to the EU (AWS Paris), retention periods (AML record
   keeping vs deletion requests).
8. CEMAC: what applies before launching in Cameroon/Gabon?
9. EU diaspora: MiCA and French advertising rules. Can we serve and market to them, and how?
10. Julaya options 1–3: regulatory consequence of each (the spec's open question).
11. Apple/Google: which licences or letters to provide for the exchange-related features.
12. Jokko's own fees on top of provider fees (D17): disclosure requirements, and whether charging
    them changes the PSAV analysis (Q1).
13. Referral rewards paid in USDC (D22): any declaration needed for promotional rewards, tax
    treatment for Jokko and for the user, programme terms.
