# Free testnet deployment

Marketday has no paid service requirement. It runs as a `DEMO LEDGER` without credentials and becomes `REAL TESTNET` only when the funded parent and seeded agent accounts are available. No mainnet transaction path exists.

## 1. Install and prepare local env

```bash
npm install
npm run setup:env
```

The setup command reads `.env.example`, updates ignored `.env.local`, creates random `CRON_SECRET` and `AUTH_SECRET` values when missing, and lists missing values without printing secrets.

## 2. Create and fund the parent

The parent account is `marketday.testnet`:

```bash
npx tsx scripts/make-account.ts --write-env
```

If the account does not exist, create it on NEAR testnet and request free testnet NEAR from [near-faucet.io](https://near-faucet.io/). The seed command needs at least 1.5 NEAR for five accounts, plus transaction fees.

The USDC contract is configured by `NEAR_USDC_CONTRACT_ID`. To verify the testnet contract, open [testnet.nearblocks.io](https://testnet.nearblocks.io), search for `marketday.testnet`, open the `Tokens` tab, and copy the USDC contract ID into `.env.local`. Testnet USDC uses 6 decimals.

Check the parent:

```bash
npx tsx scripts/check-balance.ts
```

## 3. Seed the five testnet agents

```bash
npm run seed:agents
npm run doctor
```

This creates `baker.marketday.testnet`, `farmer.marketday.testnet`, `farmer2.marketday.testnet`, `miller.marketday.testnet`, and `merchant.marketday.testnet`. Each account receives 0.3 NEAR, gets registered for USDC storage, and targets 3.00 USDC from the parent. The operation is idempotent and retries transient failures.

Agent keys are written only to ignored `.near-agents.json` and the server-only `NEAR_AGENT_PRIVATE_KEYS_JSON` value. Private keys are never printed or committed.

## 4. Add a free model key

Create a free Gemini key at [Google AI Studio](https://aistudio.google.com/app/apikey), then put it in `.env.local`:

```text
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

The provider order is Gemini, Groq, then deterministic rules. A model key is optional and the fallback makes no paid calls.

## 5. Add optional Supabase persistence

Create a free Supabase project at [supabase.com](https://supabase.com/). In the SQL Editor, run [`supabase/migrations/001_init.sql`](../supabase/migrations/001_init.sql). Add these server-only values locally and in Vercel:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Without these values, local mode uses memory storage and `/status` warns that production needs a database.

## 6. Add optional GitHub OAuth

Create an OAuth app in GitHub Developer Settings. Use this callback URL, replacing the domain:

```text
https://YOUR_VERCEL_DOMAIN/api/auth/callback/github
```

Set `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `AUTH_SECRET`. Guest watch mode always works. Google OAuth is optional and remains hidden when its two values are absent.

## 7. Deploy on Vercel free

1. Push the repository to GitHub.
2. Open [vercel.com/new](https://vercel.com/new) and import the repository.
3. Keep the install command as `npm install` and the build command as `npm run build`.
4. Add the server variables below in Project Settings, Environment Variables. Add them to Production and Preview when needed.
5. Deploy and open `/`, `/village`, `/about`, `/login`, and `/record`.

Paste the real variable names exactly:

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

Never use a `NEXT_PUBLIC_` prefix for wallet keys, private keys, service role keys, OAuth secrets, or `CRON_SECRET`. `NEXT_PUBLIC_SUPABASE_URL` is accepted as a compatibility fallback but is not needed for this deployment.

## 8. Add a free cron-job.org tick

The protected route is:

```text
GET https://YOUR_VERCEL_DOMAIN/api/cron/tick
Authorization: Bearer YOUR_CRON_SECRET
```

At [cron-job.org](https://cron-job.org/):

1. Create an account and a new cron job.
2. Use the URL above and choose GET.
3. Set the schedule to every minute.
4. Add an `Authorization` request header with the exact bearer value.
5. Save and trigger once. A successful response contains the tick result and event data.

## Final manual checklist

- Fund `marketday.testnet` with testnet NEAR.
- Confirm `NEAR_USDC_CONTRACT_ID` from the NearBlocks Tokens tab.
- Run `npm run seed:agents`.
- Run `npm run doctor` and fix every item marked `FIX`.
- Add a Gemini key if live free model calls are wanted.
- Create Supabase and run the migration for production persistence.
- Create GitHub OAuth if social login is wanted.
- Paste the listed server variables into Vercel.
- Deploy and verify `/village` is labeled `REAL TESTNET` only after funding.
- Add the cron-job.org job if external ticking is wanted.
- Run `npm run check:secrets` before sharing the repository.
