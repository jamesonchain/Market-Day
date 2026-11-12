# Free testnet deployment

Marketday is testnet only. The app has two runtime modes:

- `DEMO MODE` when the parent account and token contract are absent. The village uses a simulated ledger.
- `REAL TESTNET` when the parent account, private key, testnet token contract, and seeded agent keys are present. Only testnet transfers can happen.

## 1. Install and create the parent account

```bash
npm install
npx tsx scripts/make-account.ts --write-env
```

This writes `NEAR_PARENT_ACCOUNT_ID` and `NEAR_PARENT_PRIVATE_KEY` to ignored `.env.local`. Never paste the private key into a client variable or commit it.

## 2. Fund the testnet account

Use the NEAR testnet faucet at `https://near-faucet.io/` or the current faucet linked from the NEAR testnet docs. Paste the implicit account ID printed by `make-account` and request testnet NEAR. Set the testnet USDC contract in `.env.local` using the token address supplied by the faucet or hackathon instructions.

Check balances with:

```bash
npx tsx scripts/check-balance.ts
```

## 3. Add a free AI key

Create a free Gemini key in Google AI Studio at `https://aistudio.google.com/app/apikey`. Put it in `.env.local` as `GEMINI_API_KEY`. Groq is optional. If both are absent, the deterministic rule brain runs without network calls or cost.

## 4. Configure Supabase

Create a free Supabase project at `https://supabase.com/`. Open SQL Editor and run [`supabase/migrations/001_init.sql`](../supabase/migrations/001_init.sql). Copy the project URL to `SUPABASE_URL` and the service role key to `SUPABASE_SERVICE_ROLE_KEY`. These are server only values.

## 5. Configure observer login

For GitHub login, create an OAuth app in GitHub Developer Settings. Set the callback URL to `https://YOUR_VERCEL_DOMAIN/api/auth/callback/github`. Add `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and a random `AUTH_SECRET`. Leave Google variables blank unless Google OAuth is also configured. Blank providers stay hidden and guest watch remains available.

## 6. Prepare local environment

Copy `.env.example` to `.env.local`, then fill the values you need. Set `NEAR_NETWORK_ID=testnet`, use a testnet RPC, set `NEAR_USDC_CONTRACT_ID`, and keep all private values server only.

Seed the five testnet agent subaccounts after the parent has testnet NEAR:

```bash
npx tsx scripts/seed-agents.ts
npm run check:secrets
```

The seed script writes generated agent keys to ignored `.near-agents.json` and to `NEAR_AGENT_PRIVATE_KEYS_JSON` in `.env.local`. Copy that server only variable into Vercel. Run `npm run dev` and open `/status` to confirm `REAL TESTNET`. If credentials are absent, confirm `DEMO MODE` instead.

## 7. Deploy on Vercel

1. Push the repository to GitHub.
2. Import the repository at `https://vercel.com/new`.
3. Keep the build command as `npm run build`.
4. Add the server variables from `.env.local` in Vercel Project Settings, Environment Variables. Do not add private values with a `NEXT_PUBLIC_` prefix.
5. Add `CRON_SECRET` as a long random value.
6. Deploy and open `/`, `/market`, `/leash`, `/status`, `/about`, `/login`, and `/record`.

The Vercel cron declaration calls `/api/cron/tick`. It requires `Authorization: Bearer CRON_SECRET` and never performs a mainnet action.

## 8. Optional cron-job.org backup

Create a free job at `https://cron-job.org/`:

1. Create a new cron job for `https://YOUR_VERCEL_DOMAIN/api/cron/tick`.
2. Choose every five minutes.
3. Use method GET.
4. Add header `Authorization` with value `Bearer YOUR_CRON_SECRET`.
5. Save and trigger once manually. A successful response is JSON containing a tick and events.

## Final checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run check:secrets
```

## Manual steps still required

- Request testnet NEAR from a faucet.
- Confirm the testnet USDC contract address for the demo.
- Create and enter a Gemini key if desired.
- Create the Supabase project and run the migration.
- Create the GitHub OAuth app if login is desired.
- Add Vercel environment variables and deploy.
- Add the cron-job.org backup if needed.
