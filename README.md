# Marketday

Marketday is a tiny animated village where every villager is an AI agent with a NEAR identity, wallet, needs, and deterministic spending rules. Agents farm, craft, get hungry, and trade in the market square. A visitor logs in socially and watches the village without ever seeing a wallet popup.

The demo goal is invisible infrastructure: the chain is real underneath, while the experience feels like a living little world. Agent decisions can use Anthropic when `ANTHROPIC_API_KEY` is configured, with a deterministic rules fallback. Spending rules are always plain code and never delegated to a model.

## Current implementation

- Stage 1: Next.js App Router + TypeScript + Tailwind foundations, environment contract, and NEAR capability notes.
- Stage 2: PixiJS dot-matrix village renderer with parallax, camera drift, trees, four buildings, and day/night palette changes.
- NEAR Intents settlement is represented by an explicit adapter boundary. On testnet, the UI labels this as `SIMULATED` because Intents solvers are mainnet-only. The real adapter can be connected for mainnet without changing scene code.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

## Hackathon window

Marketday is being built for the NEAR hackathon dev window of November 1–14, 2026. See [`docs/near-notes.md`](docs/near-notes.md) for verified capability notes and links.
