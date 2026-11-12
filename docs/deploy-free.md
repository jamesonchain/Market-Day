# Free testnet deployment

Marketday is testnet only. It has two modes:

- `DEMO MODE` uses a simulated ledger and works without external credentials.
- `REAL TESTNET` requires a funded `marketday.testnet` parent and seeded testnet agents. Only testnet NEAR and USDC actions are enabled.

## 1. Create the local environment

From the repository root:

```bash
npm install
npm run setup:env
```

`setup:env` reads `.env.example`, copies safe non secret defaults, generates `CRON_SECRET` and `AUTH_SECRET` if absent, and reports missing values without printing secrets.

## 2. Create and fund the parent account

Generate a keypair and write the parent values to ignored `.env.local`:

```bash
npx tsx scripts/make-account.ts --write-env
```

The requested named parent is `marketday.testnet`. If the account is not present yet, create or fund it on NEAR testnet, then request testnet NEAR from the faucet at `https://near-faucet.io/`.

The USDC contract variable is `NEAR_USDC_CONTRACT_ID`. The value in `.env.example` is the six decimal testnet USDC contract used by this demo. To verify it, open `https://testnet.nearblocks.io`, open the `marketday.testnet` address, select the `Tokens` tab, and copy the USDC contract ID into `.env.local`.

Check the parent before seeding:

```bash
npx tsx scripts/check-balance.ts
```

## 3. Create the five testnet agents

After the parent has at least 0.3 NEAR available for each account and enough USDC for starting balances:

```bash
npm run seed:agents
npm run doctor
```

The seed command creates these named accounts under the parent, funds each with 0.3 NEAR, registers USDC storage, and targets 3.00 USDC per agent:

```text
baker.marketday.testnet
farmer.marketday.testnet
farmer2.marketday.testnet
miller.marketday.testnet
merchant.marketday.testnet
```

It is safe to rerun. Existing accounts and storage registrations are reused, and agents already at or above 3.00 USDC are not funded again. Keys are written only to ignored `.near-agents.json` and the server only `NEAR_AGENT_PRIVATE_KEYS_JSON` line in `.env.local`. Never print or commit either file.

`doctor` checks the parent, every agent, USDC storage registration, balances, the configured Gemini key, and database mode. Each item prints `PASS` or `FIX` with a repair instruction.

## 4. Add a free AI Studio key

Create a free key at `https://aistudio.google.com/app/apikey` and set:

```text
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Groq is optional. The provider order is Gemini, Groq, then deterministic rules. If no key is present, the app still works without network calls or cost.

## 5. Optional Supabase persistence

Create a free project at `https://supabase.com/`. In SQL Editor, run [`supabase/migrations/001_init.sql`](../supabase/migrations/001_init.sql). Set:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Without these values, local mode uses in memory persistence. Vercel production should use Supabase.

## 6. Optional GitHub OAuth

Create an OAuth app in GitHub Developer Settings. Use this callback:

```text
https://YOUR_VERCEL_DOMAIN/api/auth/callback/github
```

Set `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and the generated `AUTH_SECRET`. Google OAuth is optional and uses `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` with the same Auth.js callback pattern. If either provider is incomplete, it stays hidden and guest watch mode remains available.

## 7. Deploy to Vercel

1. Push the repository to GitHub.
2. Open `https://vercel.com/new` and import the repository.
3. Keep the install command as `npm install` and the build command as `npm run build`.
4. Add the following server environment variables in Project Settings, Environment Variables. Add them for Production and Preview as needed.
5. Deploy, then open `/`, `/market`, `/leash`, `/status`, `/about`, `/login`, and `/record`.

Paste these names exactly. Leave optional values blank when you want guest and demo behavior:

```text
GEMINI_API_KEY
GEMINI_MODEL
GROQ_API_KEY
NEAR_NODE_URL
NEAR_PARENT_ACCOUNT_ID
NEAR_PARENT_PRIVATE_KEY
NEAR_USDC_CONTRACT_ID
NEAR_AGENT_STARTING_NEAR
NEAR_AGENT_STARTING_USDC
NEAR_AGENT_PRIVATE_KEYS_JSON
NEAR_INTENTS_ORIGIN_ASSET
NEAR_INTENTS_DESTINATION_ASSET
NEAR_INTENTS_REFUND_ADDRESS
NEAR_INTENTS_RECIPIENT
CRON_SECRET
AUTH_SECRET
AUTH_GITHUB_ID
AUTH_GITHUB_SECRET
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Never use a `NEXT_PUBLIC_` prefix for a wallet key, private key, service role key, OAuth secret, or cron secret.

## 8. Add cron-job.org

Vercel Cron or an external scheduler can call the protected route:

```text
GET https://YOUR_VERCEL_DOMAIN/api/cron/tick
Authorization: Bearer YOUR_CRON_SECRET
```

For the free backup at `https://cron-job.org/`:

1. Create a new job for the URL above.
2. Choose every five minutes.
3. Choose GET.
4. Add the `Authorization` header with the exact bearer value.
5. Save and trigger once. A successful response contains a tick and events.

## Final checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:secrets
```

## Manual steps still required

- Fund `marketday.testnet` with testnet NEAR.
- Confirm the USDC contract from the NearBlocks Tokens tab.
- Create a Gemini key if live free model calls are desired.
- Run `npm run seed:agents` and `npm run doctor`.
- Create Supabase and run the migration if production persistence is needed.
- Create GitHub OAuth if social login is wanted.
- Paste server variables into Vercel and deploy.
- Add cron-job.org if an external tick schedule is wanted.
