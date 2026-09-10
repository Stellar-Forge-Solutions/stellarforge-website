# Stellar Forge — stats-sync Worker

A single Cloudflare Worker that keeps your Supabase `site_stats` table up to
date — on demand only. No scheduler, no cron. It runs when you (or your own
automation) hit its URL, and does nothing otherwise.

## What it does
1. Calls Cloudflare's GraphQL Analytics API at the **account level** for each
   client — the same numbers shown on the "Account analytics" dashboard
   (Requests, Bandwidth, Visits), summed across every domain in that account.
2. Upserts one row per client into Supabase's `site_stats` table.
3. Your website's homepage already reads from that table live — no other
   changes needed.

No zone IDs needed — just one Cloudflare **Account ID** per client.

## Setup

### 1. One-time Supabase change
Add a unique constraint on `client` so upserts work (skip if you already
added this):
```sql
alter table site_stats
  add constraint site_stats_client_unique unique (client);
```

### 2. Install Wrangler (Cloudflare's CLI) if you don't have it
```bash
npm install -g wrangler
wrangler login
```

### 3. Fill in your account IDs
Open `worker.js` and replace the placeholder account IDs with the real ones.
Find the **Account ID** in the Cloudflare dashboard: open any domain under
that account → Overview page → right sidebar. It's the same ID for every
domain in that account, so you only need one per client, not one per domain.
```js
const ACCOUNTS = [
  { accountId: "abc123...", client: "stellar-global-supplies" },
  { accountId: "def456...", client: "mayur-masala" },
  { accountId: "ghi789...", client: "snehal-printers" },
];
```

### 4. Create a Cloudflare API token
Go to **Cloudflare dashboard → My Profile → API Tokens → Create Token** →
use a custom token with **Account → Account Analytics → Read** permission
for each relevant account.

### 5. Set secrets (from inside the stellarforge-worker folder)
```bash
wrangler secret put CF_API_TOKEN
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_KEY
```

- `SUPABASE_URL` is your project URL, e.g. `https://xxxxx.supabase.co`
- `SUPABASE_SERVICE_KEY` is the **service_role** key from Supabase
  (Project Settings → API) — never the anon key. This key stays inside the
  Worker and is never sent to the browser.

### 6. Deploy
```bash
wrangler deploy
```

That's it. Nothing runs automatically. Whenever you want fresh numbers in
Supabase, open the Worker's URL in a browser (or call it from your own
automation with a plain GET request) — it returns a JSON summary of what
it synced:

```json
{
  "ok": true,
  "results": [
    { "client": "stellar-global-supplies", "requests": 2090000, "visits": 1870000, "bandwidth_gb": 9.53 }
  ]
}
```

Your automation just needs to `GET https://stellarforge-stats-sync.<your-subdomain>.workers.dev`
whenever you want it to run — no auth needed on that endpoint by default
(the Worker itself holds the real credentials as secrets). If you want to
lock the endpoint down so randoms can't trigger it, add a simple shared
secret check — happy to add that if you want it.

## Adding a new client later
Just add another `{ accountId, client }` entry to the `ACCOUNTS` array in
`worker.js` and redeploy with `wrangler deploy` — the homepage ticker
already sums across all rows in `site_stats`, so no frontend changes needed.