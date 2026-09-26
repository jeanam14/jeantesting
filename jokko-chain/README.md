# Jokko Chain

Non-custodial mobile wallet for West/Central Africa (UEMOA/CEMAC) and the diaspora.
iOS + Android (Expo / React Native / TypeScript), plus a Node.js backend and an internal admin
console. Built by **Jokko Chain SA** (Dakar, Senegal).

> **Status (2026-09-26):** planning complete, founder decisions D1–D22 recorded, all
> existing-build screenshots received, no application code yet. Next step: Phase 1 foundations —
> see [`docs/07-roadmap.md`](docs/07-roadmap.md).

## Where to start

| If you want to… | Read |
|---|---|
| Know what's decided, proposed, or still open | [`docs/00-decision-log.md`](docs/00-decision-log.md) |
| Understand the rules every change must follow | [`CLAUDE.md`](CLAUDE.md) |
| See how the system fits together | [`docs/01-architecture.md`](docs/01-architecture.md) |
| Understand the threat model and security controls | [`docs/02-security.md`](docs/02-security.md) |
| See the sign-up, login and recovery design | [`docs/03-onboarding-and-recovery.md`](docs/03-onboarding-and-recovery.md) |
| See every database table | [`docs/04-data-model.md`](docs/04-data-model.md) |
| See every provider, tool and platform | [`docs/05-providers-and-tools.md`](docs/05-providers-and-tools.md) |
| Check marketing wording and required disclaimers | [`docs/06-compliance-and-marketing.md`](docs/06-compliance-and-marketing.md) |
| See build phases and launch scope | [`docs/07-roadmap.md`](docs/07-roadmap.md) |
| Send questions to providers | [`docs/08-provider-questions.md`](docs/08-provider-questions.md) |
| Understand Jokko's commissions and the referral programme | [`docs/09-fees-and-referrals.md`](docs/09-fees-and-referrals.md) |
| See design references and colour tokens | [`design/README.md`](design/README.md) |

## Folder layout

```
jokko-chain/
├── CLAUDE.md          Project rules (read by Claude Code automatically in this folder)
├── README.md          This file
├── docs/              Decisions, architecture, security, data model, providers, compliance, roadmap
└── design/            Screenshots (existing build + references) and design tokens
```

Planned once code starts (see `docs/01-architecture.md`):

```
├── apps/mobile        Expo app (iOS + Android)
├── apps/api           Backend API + background workers
├── apps/admin         Internal admin console (staff only)
├── contracts/         Phone-send escrow contract (Solidity, Foundry)
├── packages/          Shared code: core (money, chains, assets), i18n, ui, adapters
└── infra/             Infrastructure as code (Terraform)
```

## Portability

This project lives inside a shared repository but must be movable to its own repository (or
another organisation) at any time without rework. Rules:

1. **Nothing outside `jokko-chain/` is referenced** by code, config, scripts, or docs in here —
   and nothing outside references this folder. All tooling (package manager workspace, lint,
   TypeScript config, env templates) is rooted in this folder.
2. **The one unavoidable exception:** GitHub only runs workflows from the repository root
   (`.github/workflows/`). CI for this project will live in a single root file named
   `jokko-chain-*.yml`, filtered to `jokko-chain/**` and running with
   `working-directory: jokko-chain`. A copy is kept at `jokko-chain/.github/workflows/` so it
   works as-is after extraction.
3. **Separate environments and accounts.** Every external service (Privy, databases, providers,
   Expo/EAS, cloud hosting, monitoring) gets its own dedicated project/app per environment
   (`dev`, `staging`, `prod`), owned by Jokko Chain SA accounts — never shared with anything else
   in this repository.
4. **No secrets in git, ever.** Secrets live in the secret manager; only `*.example` templates
   are committed.

To extract with full history later:

```bash
# Option A — built into git
git subtree split --prefix=jokko-chain -b jokko-chain-only
# then push branch `jokko-chain-only` to the new repository as its main branch

# Option B — cleaner history rewrite (needs git-filter-repo), on a fresh clone
git filter-repo --subdirectory-filter jokko-chain
```

After extraction, move `jokko-chain/.github/workflows/*` to the new repository root and remove
the path filter.
