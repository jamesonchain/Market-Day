# Ticking and persistence

Marketday uses short polling. While `/village` is visible, the browser submits one tick request and then fetches events every three seconds using the last event id. Failures back off up to thirty seconds and reconnect automatically when the tab becomes visible.

`POST /api/tick` accepts browser requests and requires `Authorization: Bearer CRON_SECRET` for external callers. The route has rate limiting, a request id, an in memory lock for local mode, and Supabase tick run and lock rows when Supabase is configured. The same request id returns the stored result instead of settling twice.

For production, run `supabase/migrations/001_init.sql` in the Supabase SQL editor. The service role writes state, villagers, events, trades, policies, and tick coordination rows. Public clients can read the village tables, but anonymous writes are revoked.

Free cron setup:

1. Create an account at `https://cron-job.org/`.
2. Create a job for `https://YOUR_VERCEL_DOMAIN/api/cron/tick`.
3. Choose GET and an every minute schedule.
4. Add `Authorization` with `Bearer YOUR_CRON_SECRET`.
5. Save and run once. A successful response contains the tick result and latest events.
