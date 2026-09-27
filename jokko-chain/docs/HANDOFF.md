# Handoff — where the build stopped and how to resume

_Last updated: 2026-09-27. Repository: `jean-jokko/Jokko-test-claude` (see §0)._

This file tells the next person (or Claude session) exactly what exists, what state it is in,
and what to do next. Read it after `CLAUDE.md` and `docs/00-decision-log.md`. Every founder
request so far is quoted in `docs/conversation-log.md`.

---

## 0. Moving to the new repository (2026-09-27, D25)

The founder moved the project to their enterprise Claude and GitHub accounts.

- **Before the move:** the project lived in the `jokko-chain/` folder of the founder's
  personal repository `jeanam14/jeantesting`, branch `claude/eager-mayer-hx3a07`. That copy is
  now a **frozen backup**. Don't develop there.
- **After the move:** this repository, `jean-jokko/Jokko-test-claude`. It was imported from a
  git bundle with the full history of that folder, which is now the repository root. No file
  here refers to the old location, except as history.
- **The conversation itself** cannot move between Claude accounts. What it contains is here:
  - decisions: `docs/00-decision-log.md`;
  - every founder request, verbatim: `docs/conversation-log.md`;
  - the original spec: `docs/archive/original-spec-2026-09-25.md`.

  The founder also keeps a readable transcript of the whole conversation
  (`jokko-conversation-transcript.md`). Upload it to a session when the full reasoning behind
  an answer is needed.
- **The design** was published in the founder's personal claude.ai account. Its link won't
  open for the enterprise account unless it is shared. The complete source is in the repo:
  screens in `design/canvas/`, images in `design/assets/`. To get the design under the
  enterprise account, republish it from those files: create a new "Design" artifact, upload
  the two images, and swap their IDs in `CardWaitlist.dc.html` (see `design/README.md`).
- **The cloud environment** has to be set up again in the enterprise account: network access,
  and the Postgres steps in §6. There were no secrets and no provider accounts yet, so nothing
  else needs moving.
- Commit messages from before the move end with `Claude-Session:` links to sessions in the old
  account. They are harmless, but they won't open for the enterprise account.

---

## 1. What the founder asked for (current scope)

1. **Design first:** done. The design canvas has 37 screens (FR/EN, dark green and lime). Link:
   <https://claude.ai/artifact/HqY939QpvWoTGgixTbwjG7>. It is **private** to the founder's
   personal account (see §0). Its full source is in `design/canvas/` and `design/assets/`.
2. **Then a basic app (D23):** the Privy wallet is real, and every other feature is shown but
   runs in demo mode. **Not started.** It waits for the founder to approve the design.
3. **"Prepare the whole database and backend as well":** **in progress** (see §3).

The engineering bar comes from `CLAUDE.md`: this is financial infrastructure. Every exported
symbol needs TSDoc (enforced by lint), money and security code needs tests, and nothing is
skipped.

---

## 2. Verified state at handoff

Every check passed on the final commit: `pnpm check` (prettier, build, eslint, typecheck,
tests). It also passed on a fresh clone of the export bundle, starting from a clean install.
The build runs before lint because lint needs `@jokko/core`'s compiled types.

| Package | State | Tests |
|---|---|---|
| `packages/core` (`@jokko/core`) | Complete for the current scope. Covers: exact money maths, fiat, formatting, networks, assets, address validation, capabilities, fee engine, security levels, phone. New: `multiplyDecimals`, `parseJsonNumberText`. | 94 pass |
| `apps/api` database layer | Complete. Drizzle schema, migrations `0000` (schema), `0001` (security hardening: append-only triggers, hash-chained audit log, immutable webhooks, analytics views without personal data) and `0002` (rate-limit buckets). Also the seed script and `sql/roles-and-grants.sql`. | 12 pass (real Postgres 16) |
| `apps/api` shared services | Written, typecheck and lint clean, **no unit tests yet**. Covers: config/env validation, field encryption (AES-256-GCM plus HMAC blind index), clock, errors, exception filter, zod pipe, schemas, audit, jobs (Postgres queue), idempotency, app-config cache, `CoreModule`. | none yet |
| `apps/api` written but **not wired and not tested** | `src/auth/*`: Privy token verifier, `UserAuthGuard`, decorators, device headers, attestation stub. Also `src/common/rate-limit.service.ts` (not registered in `CoreModule` yet), `src/common/semver.ts`, `src/providers/http.ts` and `src/providers/privy/privy-server.api.ts`. | none yet |
| `apps/api` HTTP app | **Not started.** None of these exist yet: `main.ts`, `main-admin.ts`, `main-worker.ts`, the Nest modules, or the controllers. The `start:*` scripts in `package.json` point to files that don't exist yet. | — |
| Mobile app (`apps/mobile`) | Not started (waits for design approval). | — |
| CI | Not started. | — |

Commit history: `b79aa93` → `4d5f66b` → `44e7da0` → `8e49eec` → `927b4c8` (this handoff),
then the move-preparation commit. Commit IDs change when history is exported to the new
repository; the commit messages stay the same.

### File inventory (every file in the repository)

**Legend**
- **Tested:** built and covered by automated tests.
- **Built:** compiles and passes lint, but has no tests yet.
- **Not wired:** built, but not connected to any running server yet.
- **Config:** tooling or configuration.

**Root**

| Files | What they are | State |
|---|---|---|
| `package.json` | Workspace scripts, including `pnpm check` (format → build → lint → typecheck → test) | Config |
| `pnpm-workspace.yaml`, `pnpm-lock.yaml` | Workspace, exact versions, 24 h release-age rule | Config |
| `tsconfig.base.json`, `eslint.config.js` | TypeScript and lint rules (TSDoc required, no float parsing, no `Math.random`) | Config |
| `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.nvmrc`, `.gitignore` | Formatting, Node 22, ignores | Config |
| `CLAUDE.md`, `README.md` | Project rules; overview | Docs |

**`packages/core`: shared rules library, used by the server and later the app**

| Files | What they are | State |
|---|---|---|
| `src/money/decimal.ts`, `fiat.ts`, `convert.ts`, `format.ts` | Exact amounts in `bigint`, currencies, crypto ↔ FCFA conversion, FR/EN formatting | Tested |
| `src/networks/networks.ts`, `src/assets/assets.ts` | The 6 networks and the token allowlist (addresses still `pending-review`) | Tested |
| `src/addresses/addresses.ts` | Address validation for all networks; look-alike detection | Tested |
| `src/capabilities/capabilities.ts` | What each network can do; kill switches can only narrow it | Tested |
| `src/fees/fees.ts` | Jokko fee engine (matching, %/fixed/min/max, pre-signing check) | Tested |
| `src/security/security-levels.ts`, `src/phone/phone.ts` | Security levels and thresholds (D13); phone parsing and masking | Tested |
| `src/errors.ts`, `src/index.ts` | Error type; public exports | Tested |

Core coverage: 97.7% of statements, 93.8% of branches.

**`apps/api`: backend (public API, admin API, workers)**

| Files | What they are | State |
|---|---|---|
| `src/database/schema/*.ts` (`enums`, `identity`, `chain`, `money`, `platform`, `admin`, `index`) | All 53 tables | Tested: every table is created on real Postgres, and the key protections have their own tests |
| `src/database/columns.ts`, `db.ts` | Money column types; connection pool | Tested |
| `drizzle/0000–0002*.sql`, `drizzle/meta/*`, `drizzle.config.ts` | Migrations: schema, security hardening, rate-limit buckets | Tested |
| `src/database/migrate.ts`, `seed.ts` | Migration runner; idempotent seed | Tested |
| `src/database/sql/roles-and-grants.sql` | Least-privilege database roles (run by infrastructure, not a migration) | Built |
| `test/database/schema.test.ts`, `test/global-setup.ts`, `test/support/database.ts`, `vitest.config.ts` | 12 database tests on real Postgres | Tested |
| `src/config/env.ts` | Environment validation with production safety rules | Built |
| `src/common/crypto/field-encryption.ts` | AES-256-GCM personal-data encryption, blind indexes | Built |
| `src/common/{jobs,idempotency,audit,app-config,rate-limit}.service.ts` | Job queue, idempotency, audit writer, flags and config cache, shared rate limits | Built (`rate-limit` not registered in `CoreModule` yet) |
| `src/common/{errors,clock,tokens,ids,semver}.ts`, `src/common/http/*` | Error model, clock, DI tokens, UUIDv7, versions, exception filter, validation | Built |
| `src/common/core.module.ts` | Wires the shared services | Built |
| `src/auth/*` (`privy-token.verifier`, `user-auth.guard`, `decorators`, `device-headers`, `request-context`, `attestation`) | Login check, access rules | Not wired |
| `src/providers/http.ts`, `src/providers/privy/privy-server.api.ts` | Safe outbound HTTP; Privy server adapter (flags delegated or imported wallets) | Not wired |
| `package.json`, `tsconfig*.json` | Scripts, dependencies | Config. **No `README.md` yet** (task 8) |

**Design and docs**

| Files | What they are |
|---|---|
| `design/canvas/*.dc.html`, `canvas.json` | 37 screens, identical to the published design |
| `design/assets/*.png` | Logo and card images used by the screens |
| `design/existing-build/**`, `design/reference/revolut/*-redacted.png` | Reference screenshots (personal data blurred) |
| `design/README.md` | Colour tokens, FR/EN rules, fix checklist, image mapping |
| `docs/00`–`10`, `HANDOFF.md`, `conversation-log.md`, `archive/original-spec-2026-09-25.md` | Decisions, architecture, security, onboarding, data model (updated to match the code), providers, compliance, roadmap (with progress), provider questions, fees and referrals, setup checklist, this file, founder requests, original spec |

---

## 3. Next steps, in order

### Task 5: finish the API foundation (in progress)
1. Register `RateLimitService` in `CoreModule`. Register `UserAuthGuard` as the global
   `APP_GUARD` in the public app module. Provide `PrivyTokenVerifier` and
   `ATTESTATION_VERIFIER` (use `UnverifiedAttestationVerifier` for now).
2. Add a health controller: `GET /health/live`, and `GET /health/ready`, which runs `SELECT 1`.
   Mark both `@Public()`.
3. Add a shared Fastify bootstrap (`src/http/bootstrap.ts`):
   - security: `@fastify/helmet`, a global `@fastify/rate-limit`, and a 64 kB body limit;
   - request IDs: generate a UUIDv7, or accept `x-request-id` when it is valid;
   - logging: redact `authorization`, `x-jokko-attestation` and personal-data fields;
   - webhooks: set `rawBody: true` (needed for signature checks);
   - CORS: only on the admin listener (`ADMIN_UI_ORIGIN`; `@fastify/cors` is already
     installed);
   - errors: `ApiExceptionFilter` as the global filter.
4. Add the entry points: `main.ts` (public), `main-admin.ts` (private listener on
   `PORT_ADMIN`) and `main-worker.ts`. Add an `openapi.ts` script that writes the OpenAPI JSON
   (the zod schemas become OpenAPI via `z.toJSONSchema`).
5. Tests:
   - `PrivyTokenVerifier`: sign test tokens with `jose` `generateKeyPair('ES256')`. Cover a
     bad issuer, bad audience, expired token, HS256 confusion, and a non-DID subject.
   - `UserAuthGuard`: 426 on an old app version, a revoked device, a restricted account on
     money routes, and the feature flag being off.
   - `loadConfig`: prod safety rules.
   - `FieldEncryption`: tamper detection and key rotation.
   - `JobsService`: claim with `SKIP LOCKED`, backoff, dead jobs.
   - `IdempotencyService`: same key with a different body, and concurrent requests.
   - `RateLimitService`.
   - `toPrivyUser`: delegated and imported wallets flagged, phone normalised to E.164.

### Task 6: domain modules (public API, provider adapters with demo implementations)
Design already settled during the build; implement as follows.

**Onboarding and account**
- **Session bootstrap `POST /v1/session`** (`@AllowUnregistered`):
  - Fetch the Privy user **server-side**. Never trust a phone or address sent by the app.
  - Upsert the user (encrypted phone plus blind index), enforce the `signup_countries`
    allowlist, then upsert the device and write a login event.
  - When a known user logs in on a new device, send a security notification.
  - Sync wallets from Privy. A wallet with `delegated: true` or `imported: true` → **refuse
    and raise a critical risk alert** (rules 1 and 6, P13).
  - Link any pending phone invites and enqueue `phone_send.auto_claim`.
  - Optionally apply a referral code.
- **Me:**
  - Profile: `GET` and `PATCH /v1/me`.
  - Consents: append-only; the marketing consent updates the notification preference in the
    same transaction.
  - Security:
    - `GET /v1/me/security` uses `evaluateSecurity` with the thresholds in app config.
    - `POST /v1/me/security/sync` reads Privy data: passkey MFA, verified email, and the wallet
      `recovery_method` `icloud`/`google-drive` (which means cloud backup is on).
    - The key-export event is logged, audited, and triggers an alert.
  - Devices: list and revoke. Push token (encrypted). Notification preferences.

**Money movement**
- **Quotes and fees:**
  - Build a `FeeService` on `selectFeeSchedule` and `computeFee`, using prices from a
    `PriceProvider`.
  - The fee destination is the active `company_wallets` `fee_treasury` for that network. When
    the fee is above zero and no treasury wallet exists → `SERVICE_UNAVAILABLE`. Never send a
    fee to an unknown address.
  - Store every quote.
  - Network recommendation per D8/P6 (`docs/01-architecture.md` §7): "Recommended" goes to the
    cheapest suitable network; warn when the fee is over 5% of the amount. Put this in
    `@jokko/core` so the app computes the same answer.
- **Transactions and threads:**
  - History excludes spam. Threads are grouped by counterparty.
  - `POST /v1/transactions` records only the **sender's own** pending transaction. Rows for
    the recipient come only from the indexer, never from a client.
- **Ramps:**
  - Endpoints: quote and create session (idempotent; flag `ramps`; capabilities
    `rampOn`/`rampOff`).
  - For on-ramp, the destination must be one of the user's own wallets.
  - Status follows a state machine with no regressions. Out-of-order webhooks are marked
    `ignored`.
  - Only the demo provider exists for now. Fonbnk, IvoryPay and Bridge adapters wait for
    contracts (O2/O3).
- **Swaps (LI.FI) and staking (Everstake, ETH/SOL only per D16):** quote endpoints plus
  recording of submissions. Demo adapters for now.
- **Phone send (P2, P3, D5):**
  - `resolve` is rate-limited per user through `RateLimitService`, to stop enumeration of who
    uses Jokko.
  - Invites (flag `phone_send_invites`):
    - Pre-generate the recipient's wallets through Privy.
    - Enforce the XOF limits in app config.
    - The fee comes from the `phone_send` schedule.
    - The claim token is stored as a hash. The worker gets the token encrypted inside the job
      payload.
    - Jobs: reminder, `refund_due` at expiry, `auto_claim` on signup.
  - Cancel by the sender.
  - The escrow keeper is an adapter. It throws until the audited contract exists.
- **Referrals (D22, P16):**
  - Apply a code within the window. Reject self-referrals and the same device.
  - `referrals.evaluate` runs when an on-ramp completes: minimum top-up, qualification window,
    monthly cap. Result is `on_hold` for `holdDays`, then `referrals.payout`.
  - `referrals.payout` re-checks the conditions and the daily budget, then pays through the
    `RewardsPayer` adapter from the company rewards wallet (rule 8).

**Platform**
- **Webhooks `POST /webhooks/:provider`:**
  - Verify the signature on the raw body.
  - Store the payload encrypted, with its sha256.
  - Dedupe on `(provider, provider_event_id)`.
  - Enqueue `webhooks.process` in the same transaction.
  - Invalid signatures get a 401 and are not stored.
- **Notifications:** templates (FR/EN), in-app inbox, and an outbox job per channel.
- **Screening:** Chainalysis free sanctions API adapter. Required in prod (rule 4). Flag
  matches and block only on a hard sanctions match.
- **Waitlist:** card and business.
- **Public config `GET /v1/config`:**
  - Flags, effective capabilities, networks and assets for the environment.
  - Thresholds, minimum app version, legal versions, demo flag.

### Task 7: admin API and workers
**Admin API: access control**
- **Authentication:** OIDC with `jose` `createRemoteJWKSet`. The `x-dev-admin` header works
  only when `ADMIN_DEV_AUTH` is on, and config already refuses that in prod.
- **Accounts and roles:** the account must be active. Role-based access (RBAC) comes from
  `admin_user_roles`.
- **Four-eyes:** changes go through `admin_approvals`, and the database refuses self-approval.
  - Immediate: kill switches (turning a flag off, disabling a capability) and restricting a
    user.
  - Approval required: activating a fee schedule, unrestricting a user, `app_config` changes,
    and enabling a flag or capability in prod.

**Admin API: features**
- Users: search by phone or email hash, id, or address. Views are masked. Revealing personal
  data requires a reason and is logged in `pii_access_log` and the audit log.
- Fee schedules: draft → approval → active.
- Referrals review, risk alerts, and reports from the `analytics` views.
- Consented marketing export:
  - Only users with marketing consent currently granted, capped at 10k rows.
  - Protect CSV cells against formula injection.
  - Record each export in `data_exports`.
- Audit viewer, plus `jokko_audit_verify()`. Retry for dead jobs.

**Worker**
- A loop over `JobsService.claim` with a handler per queue. A dead job raises a risk alert.
  Shutdown is graceful on SIGTERM.
- Scheduled jobs, with a `dedupeKey` per period: daily `audit.verify`, hourly
  `maintenance.cleanup` (rate-limit buckets, expired idempotency keys), and hourly
  `phone_send.sweep` (safety net for invites past expiry).

### Task 8: CI, documentation and wrap-up
- CI workflow: `.github/workflows/ci.yml`, with a Postgres 16 service, running `pnpm check`.
  The repository is dedicated to this project, so no path filter is needed.
- Documentation:
  - READMEs for `apps/api` and the `providers`.
  - ADR `docs/adr/0002-postgres-job-queue.md` (Postgres queue instead of BullMQ/Redis).
- Update `docs/07-roadmap.md` (D24 is already in the decision log).

### Beyond the backend: the rest of the project

The backend tasks above are only part of what's left. Everything else is planned in
`docs/07-roadmap.md` (Phases 0–7 plus "After launch"), with a progress table at the top.
The main remaining workstreams:

- **Mobile app (Step B, D23):** Expo shell, the real Privy wallet, demo mode for everything
  else. Also `packages/i18n` (FR/EN) and `packages/ui` (design tokens). Starts once the founder
  approves the design.
- **Admin console screens (`apps/admin`):** staff UI on top of the admin API (task 7), with
  Metabase charts embedded (D19).
- **Blockchain indexer:** watches the networks (QuickNode, TronGrid) and fills `transactions`
  and `balance_snapshots`. History, payment threads, push notifications and referral checks
  depend on it (Phase 2).
- **Real provider adapters:** CoinGecko prices (`parseJsonNumberText` in core is ready for
  exact parsing), Fonbnk, IvoryPay, Bridge, LI.FI, Everstake, Chainalysis, Twilio, FCM/APNs and
  Brevo. The ramp adapters wait for provider answers (`08-provider-questions.md`).
- **Phone-send escrow contract (`contracts/`):** Solidity with Foundry, then an external audit
  before mainnet (Phase 6, P2).
- **Infrastructure (`infra/`):** Terraform for AWS `dev`, `staging` and `prod`, secrets,
  deploys.
- **CI security gates:** Semgrep/CodeQL, gitleaks, OSV/Socket, CODEOWNERS, branch protection.
- **Launch work (Phase 7):** pen test, Privy configuration audit, legal texts in the app, app
  store submissions, closed beta.

---

## 4. Known gaps and risks to keep in mind

- **Privy API shapes.** Field names were checked against Privy's official Go SDK: `phoneNumber`,
  `delegated`, `imported`, `recovery_method`, `connector_type`, `wallet_client_type`. Still
  **assumed**: the phone lookup returns 404 when no user exists. Confirm it with a contract
  test against the Privy sandbox before relying on it.
- **Per-instance HTTP rate limiting.** `@fastify/rate-limit` counts in memory. Sensitive
  actions must also use the Postgres-backed `RateLimitService`, which works across all
  instances.
- **Grants after migrations.** `roles-and-grants.sql` grants on `ALL TABLES`. Re-run it after
  each migration, or add `ALTER DEFAULT PRIVILEGES`. It is not a migration, by design.
- **Attestation is a stub.** App Attest and Play Integrity need the production bundle IDs. The
  guard enforces attestation only when app config `attestation_enforced` is true.
- **Asset contract addresses** are `pending-review`. Mainnet refuses to enable them until a
  person checks each one against the issuer's docs (`packages/core/src/assets/assets.ts`).
- **No fee schedules are seeded.** Fee levels are the founder's decision (O13), set in the
  admin console.
- **Job queue differs from D18.** D18 (accepted proposal P9) lists Redis/BullMQ. The code uses
  a Postgres job queue and transactional outbox instead, so a job is only ever created when the
  money change that causes it commits. This is an engineering change to a decided item: record
  it as a proposal (with ADR 0002) and get the founder's OK before relying on it in
  production.

---

## 5. Decisions still needed from the founder

These are tracked in `docs/00-decision-log.md`:

- **O12 (blocks Privy setup):** SMS or WhatsApp for login codes. Privy allows only one, and
  the choice is permanent. Recommendation P15: SMS through our own Twilio.
- **Privy plan:** Scale or Enterprise is needed for African SMS or WhatsApp.
- **O13:** fee levels per product.
- **Proposals to confirm:** P10 (bottom navigation), P13 (no wallet import), P14 (Privy-native
  login), P16 (referral defaults), P17 (one wallet per user).
- **Provider confirmations:** see `docs/08-provider-questions.md`. Also the Julaya cash
  liquidity question (O5) and the card issuer.

---

## 6. How to run locally

The container used for this build had no Postgres running by default.

```bash
# Postgres 16 (tests expect postgres:postgres@localhost:5432)
sudo pg_ctlcluster 16 main start
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# from the repository root
pnpm install            # pnpm 10.33.0, Node 22 (see .nvmrc)
pnpm check              # format, build, lint, typecheck, all tests
```

- The API tests recreate the database `jokko_api_test` and apply every migration. Override the
  server URL with `TEST_SERVER_URL`.
- Toolchain pins and why:
  - TypeScript stays on **6.0.3**, because typescript-eslint does not support TS 7.
  - `@types/node` is overridden to 22.20.4.
  - Vitest uses `unplugin-swc` for Nest decorator metadata.
- Network notes for cloud sessions: `registry.npmjs.org` works. `docs.privy.io` is readable
  through the Firecrawl tool. Privy, Expo and testnet RPC hosts were blocked by the egress
  proxy (allow them in the environment's network settings if needed).
