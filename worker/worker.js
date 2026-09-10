/**
 * Stellar Forge — stats-sync worker
 *
 * What it does (simple, one job):
 * 1. Triggered on demand — visit the Worker's URL (GET request) whenever
 *    you want fresh numbers. No cron, nothing runs automatically.
 * 2. For each Cloudflare ACCOUNT listed below (this is account-level
 *    analytics — the same numbers shown on the "Account analytics"
 *    dashboard, summed across every domain in that account), pulls the
 *    last 24h of requests, bandwidth and visits.
 * 3. Upserts one row per client into the Supabase `site_stats` table.
 *
 * No zone IDs needed — just the Cloudflare Account ID for each client.
 *
 * Secrets needed (set with `wrangler secret put <NAME>`):
 *   CF_API_TOKEN        - Cloudflare API token, "Account > Account Analytics > Read" permission
 *   SUPABASE_URL         - e.g. https://xxxxx.supabase.co
 *   SUPABASE_SERVICE_KEY - Supabase service_role key (NOT the anon key — this
 *                           runs server-side only, inside the Worker, and is
 *                           never exposed to the browser)
 */

// Map each Cloudflare ACCOUNT to the client name used in Supabase's site_stats.client column.
// Find the Account ID on the right sidebar of any domain's Overview page in the
// Cloudflare dashboard (it's the same for every domain under that account).
const ACCOUNTS = [
  { accountId: "YOUR_STELLAR_GLOBAL_SUPPLIES_ACCOUNT_ID", client: "stellar-global-supplies" },
  { accountId: "YOUR_MAYUR_MASALA_ACCOUNT_ID", client: "mayur-masala" },
  { accountId: "YOUR_SNEHAL_PRINTERS_ACCOUNT_ID", client: "snehal-printers" },
];

export default {
  // Manual trigger only: visit the Worker's URL (e.g. https://stats-sync.yourname.workers.dev)
  // to run a sync on demand. Nothing runs automatically — there is no scheduler.
  async fetch(request, env, ctx) {
    try {
      const results = await syncAllAccounts(env);
      return new Response(JSON.stringify({ ok: true, results }, null, 2), {
        headers: { "content-type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: err.message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  },
};

async function syncAllAccounts(env) {
  const results = [];
  for (const account of ACCOUNTS) {
    const stats = await fetchAccountStats(account.accountId, env.CF_API_TOKEN);
    await upsertStats(account.client, stats, env);
    results.push({ client: account.client, ...stats });
  }
  return results;
}

async function fetchAccountStats(accountId, apiToken) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const until = new Date().toISOString().slice(0, 10);

  // Account-level analytics — same numbers as the "Account analytics" dashboard,
  // aggregated across every domain in the account. No zone ID needed.
  const query = `
    query {
      viewer {
        accounts(filter: { accountTag: "${accountId}" }) {
          httpRequests1dGroups(
            limit: 31
            filter: { date_geq: "${since}", date_leq: "${until}" }
          ) {
            sum {
              requests
              bytes
            }
            uniq {
              uniques
            }
          }
        }
      }
    }
  `;

  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const json = await res.json();
  const days = json?.data?.viewer?.accounts?.[0]?.httpRequests1dGroups || [];

  if (!days.length) {
    return { requests: 0, visits: 0, bandwidth_gb: 0 };
  }

  // Sum across the returned days to match the "Last 30 days" view in the dashboard
  const totals = days.reduce(
    (acc, day) => {
      acc.requests += day.sum.requests || 0;
      acc.bytes += day.sum.bytes || 0;
      acc.visits += day.uniq.uniques || 0;
      return acc;
    },
    { requests: 0, bytes: 0, visits: 0 }
  );

  return {
    requests: totals.requests,
    visits: totals.visits,
    bandwidth_gb: +(totals.bytes / 1e9).toFixed(2),
  };
}

async function upsertStats(client, stats, env) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/site_stats?on_conflict=client`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify([
      {
        client,
        requests: stats.requests,
        visits: stats.visits,
        bandwidth_gb: stats.bandwidth_gb,
        updated_at: new Date().toISOString(),
      },
    ]),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase upsert failed for ${client}: ${res.status} ${text}`);
  }
}