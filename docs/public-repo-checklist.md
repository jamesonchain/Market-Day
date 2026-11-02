# Public repo checklist

- [x] README explains the pitch, setup, architecture, and demo.
- [x] No private key, API key, or OAuth secret is committed.
- [x] Testnet transfer, Intents quote, mainnet swap, and DEMO LEDGER labels are explicit.
- [x] Missing credentials keep the demo runnable.
- [x] Typecheck, lint, and Vitest scripts are included.
- [x] `/about`, `/record`, `/login`, `/api/events`, `/api/demo`, and `/api/cron/tick` are documented.
- [ ] Add real Vercel environment variables before production deployment.
- [ ] Add a funded parent testnet account and agent key map before real transfers.
- [ ] Add OAuth callback URLs for the deployed domain before enabling social login.
- [ ] Create the `marketday_state` Supabase table if persistence is required.
