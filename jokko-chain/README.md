# Jokko Chain

Non-custodial mobile wallet for West/Central Africa (UEMOA/CEMAC) and the diaspora.
iOS + Android (Expo / React Native / TypeScript), plus a Node.js backend and an internal admin
console. Built by **Jokko Chain SA** (Dakar, Senegal).

> **Status (2026-09-27):** planning done (decisions D1–D25), all screens designed, database
> layer and API foundation built and tested. Next: finish the API foundation, then the feature
> modules. See [`docs/HANDOFF.md`](docs/HANDOFF.md).

## Where to start

| If you want to…                                           | Read                                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Resume the build where it stopped                         | [`docs/HANDOFF.md`](docs/HANDOFF.md)                                         |
| Read every founder request so far, verbatim               | [`docs/conversation-log.md`](docs/conversation-log.md)                       |
| Know what's decided, proposed, or still open              | [`docs/00-decision-log.md`](docs/00-decision-log.md)                         |
| Understand the rules every change must follow             | [`CLAUDE.md`](CLAUDE.md)                                                     |
| See how the system fits together                          | [`docs/01-architecture.md`](docs/01-architecture.md)                         |
| Understand the threat model and security controls         | [`docs/02-security.md`](docs/02-security.md)                                 |
| See the sign-up, login and recovery design                | [`docs/03-onboarding-and-recovery.md`](docs/03-onboarding-and-recovery.md)   |
| See every database table                                  | [`docs/04-data-model.md`](docs/04-data-model.md)                             |
| See every provider, tool and platform                     | [`docs/05-providers-and-tools.md`](docs/05-providers-and-tools.md)           |
| Check marketing wording and required disclaimers          | [`docs/06-compliance-and-marketing.md`](docs/06-compliance-and-marketing.md) |
| See build phases and launch scope                         | [`docs/07-roadmap.md`](docs/07-roadmap.md)                                   |
| Send questions to providers                               | [`docs/08-provider-questions.md`](docs/08-provider-questions.md)             |
| Understand Jokko's commissions and the referral programme | [`docs/09-fees-and-referrals.md`](docs/09-fees-and-referrals.md)             |
| Create the accounts needed to build (Privy, Expo, Apple…) | [`docs/10-setup-checklist.md`](docs/10-setup-checklist.md)                   |
| See design references and colour tokens                   | [`design/README.md`](design/README.md)                                       |

## Repository layout

```
.
├── CLAUDE.md          Project rules (read by Claude Code automatically)
├── README.md          This file
├── apps/api           Backend: public API, private admin API, background workers (NestJS)
├── packages/core      Shared logic: exact money maths, networks, assets, addresses, fees
├── docs/              Decisions, architecture, security, data model, providers, compliance,
│                      roadmap, handoff, conversation log, archive of the original spec
└── design/            Screen designs (canvas source + images), screenshots, colour tokens
```

Still to come (see `docs/01-architecture.md`): `apps/mobile` (Expo app), `apps/admin` (staff
console), `contracts/` (phone-send escrow), more `packages/` (i18n, ui, adapters) and `infra/`
(Terraform).

## Portability

This repository is dedicated to Jokko Chain. It started as the `jokko-chain/` folder of a
shared repository and was moved here with its full git history on 2026-09-27 (D25). It must
stay movable to another repository or organisation without rework:

1. **Self-contained.** All tooling (package manager workspace, lint, TypeScript config, env
   templates) is rooted at the repository root; nothing depends on anything outside it.
2. **Separate environments and accounts.** Every external service (Privy, databases, providers,
   Expo/EAS, cloud hosting, monitoring) gets its own dedicated project/app per environment
   (`dev`, `staging`, `prod`), owned by Jokko Chain SA accounts.
3. **No secrets in git, ever.** Secrets live in the secret manager; only `*.example` templates
   are committed.

To move it again with full history: `git clone --mirror` this repository and push the mirror to
the new remote.
