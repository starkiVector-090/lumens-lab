# lumens-lab

[![CI](https://github.com/starkiVector-090/project/actions/workflows/ci.yml/badge.svg)](https://github.com/starkiVector-090/project/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

End-to-end test harness for the Stellar network. Run scenario-based integration tests against Testnet or Futurenet — no local node required.

Covers payments, DEX operations (trustlines, buy/sell offers, path payments), and Soroban smart contract lifecycle (upload, deploy, invoke).

---

## Features

- **Zero infrastructure** — Friendbot funds test accounts automatically
- **Multi-network** — Testnet and Futurenet supported out of the box
- **Scenario-based** — each test file is a self-contained, readable scenario
- **Resilient** — built-in retry logic for flaky Testnet/Futurenet responses
- **TypeScript-first** — strict types, full declarations, source maps

---

## Project Structure

```
src/
  index.ts              # Public API
  network.ts            # TestNetwork helper (fund, load accounts)
  utils.ts              # Retry + error handling utilities
tests/
  scenarios/
    payment.test.ts     # XLM transfer
    dex.test.ts         # Trustline, buy offer, sell offer, path payment
    soroban.test.ts     # Wasm upload, contract deploy, contract invoke
.github/
  workflows/
    ci.yml              # GitHub Actions CI
```

---

## Quick Start

```bash
npm install
npm test
```

All tests run against public Testnet/Futurenet. No `.env` or local node setup needed.

---

## Scenarios

### Payment

Funds two accounts via Friendbot and submits an XLM transfer between them.

### DEX

1. Establishes a USDC trustline
2. Places a buy offer (XLM → USDC)
3. Places a sell offer (USDC → XLM)
4. Executes a path payment strict send

### Soroban

1. Uploads a compiled `.wasm` contract
2. Deploys the contract to get a contract ID
3. Invokes a contract function and asserts the result

> **Note:** Soroban scenarios target Futurenet. Replace the placeholder wasm in `soroban.test.ts` with a real compiled contract:
> ```ts
> const wasmBuffer = fs.readFileSync("path/to/contract.wasm");
> ```

---

## Configuration

| Network   | Horizon URL                              | RPC URL                              |
|-----------|------------------------------------------|--------------------------------------|
| Testnet   | https://horizon-testnet.stellar.org      | —                                    |
| Futurenet | https://horizon-futurenet.stellar.org    | https://rpc-futurenet.stellar.org    |

Custom networks can be passed directly to `TestNetwork`:

```ts
import { TestNetwork } from "lumens-lab";

const net = new TestNetwork({
  horizonUrl: "https://your-horizon.example.com",
  networkPassphrase: "My Custom Network ; 2024",
  friendbotUrl: "https://your-friendbot.example.com",
});
```

---

## Retry Utility

All network calls can be wrapped with the built-in `withRetry` helper:

```ts
import { withRetry } from "./utils";

const result = await withRetry(() => net.server.submitTransaction(tx));
```

Defaults: 3 attempts, 1 s exponential backoff.

---

## Contributing

1. Fork the repo
2. Add a scenario under `tests/scenarios/`
3. Ensure `npm test` passes
4. Open a PR

---

## License

MIT
