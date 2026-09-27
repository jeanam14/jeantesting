# @jokko/core

Pure domain library shared by the API, the workers and the mobile app. **No I/O**: no network,
no database, no clock except what callers pass in. Anything that decides _how much_ money moves,
_where to_, or _what the user is shown about it_ lives here, so the server and the app always
compute the same answer. That's what makes the app-side "verify before signing" step possible
(docs/01-architecture.md §9).

## Modules

| Module          | What it does                                                                                                          | Key rule                                                            |
| --------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `money/decimal` | Exact decimal ↔ `bigint` conversion, `mulDiv` with explicit rounding, rates, locale input parsing                     | Never floating point. Never silently round user input               |
| `money/fiat`    | Supported fiat currencies (XOF, XAF, EUR, USD), CFA/EUR legal parity                                                  | XOF/XAF have **0** decimals                                         |
| `money/convert` | Asset ↔ fiat conversion                                                                                               | Rounds down by default                                              |
| `money/format`  | French/English display formatting (`12 500 FCFA` / `12,500 FCFA`)                                                     | Display only; never parse display strings back                      |
| `networks`      | The 6 supported networks, labels, chain IDs, explorers per environment                                                | Test builds only see `testnet`                                      |
| `assets`        | Curated token allowlist with contract addresses                                                                       | Unreviewed contracts are **never** enabled on mainnet               |
| `addresses`     | Address validation per family (EIP-55, Tron base58check, Solana, Bitcoin bech32/bech32m/legacy), look-alike detection | Wrong environment is an error                                       |
| `capabilities`  | What each network can do in this build; server can only narrow                                                        | A server "enable" beyond the code is ignored                        |
| `fees`          | Fee schedule selection, exact fee computation, anti-tampering verification                                            | Most specific schedule wins; everything rounds in the user's favour |
| `security`      | Security levels and balance thresholds (D13)                                                                          | No waiting period after new-device login                            |
| `phone`         | E.164 parsing for supported countries, masking                                                                        | E.164 is the only stored form                                       |

## Scripts

```bash
pnpm build          # compile to dist/
pnpm typecheck
pnpm test           # unit + property-based tests (fast-check)
pnpm test:coverage  # enforces ≥ 90 % on statements, branches, functions, lines
```

## Before mainnet

Every token contract in `src/assets/assets.ts` has `review.status: 'pending-review'`. A person
must compare each address with the issuer's official documentation, then set `reviewed`,
`reviewedBy` and `reviewedAt` in a reviewed pull request. Until then those tokens are
automatically unavailable on mainnet, and the API refuses to start in production
(`assetsPendingReview()`).
