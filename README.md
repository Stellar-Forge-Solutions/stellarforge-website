# Stellar Forge — Website

Static site (HTML/CSS/JS). No build step — upload as-is to any static host
(Cloudflare Pages, Vercel, Render Static Site, S3, etc.)

## File structure
```
index.html                  → homepage
blog/index.html             → blog listing
blog/*.html                 → individual posts
assets/style.css            → all styles
assets/script.js            → counters, nav, form, Supabase wiring
assets/supabase-config.js   → YOUR Supabase URL + anon key go here
assets/img/logo.png         → Stellar Forge logo
robots.txt / sitemap.xml    → SEO
```

## Connect Supabase (live stats + lead capture)

1. Create a free project at supabase.com.
2. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
3. Open `assets/supabase-config.js` and paste them in:
   ```js
   window.SUPABASE_URL = "https://xxxxx.supabase.co";
   window.SUPABASE_ANON_KEY = "eyJ...";
   ```
4. In the Supabase SQL editor, create the two tables below.

### Table: site_stats (your Cloudflare numbers, pushed by automation)
```sql
create table site_stats (
  id bigint generated always as identity primary key,
  client text not null,
  requests numeric not null,
  visits numeric not null,
  bandwidth_gb numeric,
  countries int4,
  updated_at timestamptz default now()
);

alter table site_stats enable row level security;

create policy "Allow public read"
  on site_stats for select
  using (true);
```

Your automation should **upsert one row per client** (e.g. `stellar-global-supplies`,
`mayur-masala`, `snehal-printers`) every time it pulls fresh Cloudflare analytics.
The homepage ticker automatically sums `requests` and `visits` across all rows
and takes the max `countries` value — no code changes needed when you add a
new client row.

Example upsert your automation can run (Node/Python/n8n/Zapier, anything
that can call the Supabase REST API with the **anon key** works, but for
writes from a trusted backend job we'd actually recommend using the
**service_role key** instead of anon, kept server-side only):

```
POST https://xxxxx.supabase.co/rest/v1/site_stats
apikey: <service_role_key>
Authorization: Bearer <service_role_key>
Prefer: resolution=merge-duplicates

{
  "client": "stellar-global-supplies",
  "requests": 2050000,
  "visits": 1840000,
  "bandwidth_gb": 9.39,
  "countries": 13
}
```

### Table: leads (contact form submissions)
```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text,
  email text,
  project text,
  budget text,
  message text
);

alter table leads enable row level security;

create policy "Allow public insert"
  on leads for insert
  with check (true);
```

No public **select** policy is added on purpose — anyone can submit a lead,
but only you (via the Supabase dashboard, or an authenticated query) can
read them back.

## Notes
- If `supabase-config.js` is left with the placeholder values, the site
  quietly falls back to the static numbers already written into `index.html`
  and the contact form falls back to a `mailto:` link — nothing breaks.
- Update `og-image.jpg` under `assets/img/` with a real 1200×630 social
  preview image before launch (referenced in the meta tags but not yet
  created).
- Swap the two starter blog posts' dates/content as you publish more —
  they're placeholders showing the pattern; add real posts as new
  `blog/your-slug.html` files and list them in `sitemap.xml`.
