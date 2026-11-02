# NEAR capability notes

Verified November 2, 2026 against the official NEAR developer documentation and current NEAR product documentation. This file intentionally records limitations instead of assuming a testnet feature exists.

## Accounts and subaccounts

NEAR accounts support named subaccounts. A parent account can create a child account such as `baker.village.near`; the parent account is the account that authorizes the creation transaction and the new account owns its own state and balance. Account creation is a regular on-chain action and requires funding/storage. The village will keep subaccount creation behind a server-side account service so the browser never receives agent private keys.

Relevant official docs: [NEAR accounts](https://docs.near.org/protocol/accounts), [NEAR account model](https://docs.near.org/protocol/accounts/account-model), and [near-api-js account operations](https://docs.near.org/tools/near-api-js).

## NEAR Intents

NEAR Intents is a solver/market-maker system for expressing an outcome and settling swaps/transfers across supported assets and chains. The developer flow is not a generic NEAR testnet contract call: it uses the Intents/1Click service and a one-time deposit/quote flow. API access may require a partner/API key.

As of this build, Intents settlement and solver liquidity are available on mainnet. There are no Intents solvers on NEAR testnet, so Intents-dependent requests cannot be treated as real testnet transactions. Marketday therefore uses an `IntentsSettlementAdapter` interface: `real` is reserved for mainnet integration, while `simulated` is the explicit testnet/demo path and is labeled in the UI and README.

Relevant docs: [NEAR Intents developer docs](https://docs.near-intents.org/), [Intents for Agents](https://www.intents.work/), and the [1Click API](https://docs.near-intents.org/1click-api).

## Social login

NEAR Auth provides social and passwordless onboarding through Google, Apple, email, and passkeys. It provisions a real NEAR account backed by MPC and supports gasless meta-transactions through a relayer. The current product documentation describes it as live on NEAR mainnet. This is distinct from silently creating arbitrary autonomous agent wallets in the browser; agents need their own server-controlled account/key strategy.

Relevant docs: [NEAR Auth](https://auth.near.org/) and [NEAR Auth GitHub](https://github.com/near/near-fastauth-wallet).

## Network policy for Marketday

- `testnet`: real NEAR account reads/writes can be added, but NEAR Intents trades must remain simulated and visibly labeled.
- `mainnet`: real NEAR calls and real Intents settlement are the goal, subject to API credentials, funded accounts, and production safety controls.
- No API name, endpoint, or testnet capability is assumed here unless it is documented by NEAR. The adapter boundary exists to prevent UI code from pretending that simulation is settlement.
