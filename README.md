# Stellar Forge — Website

Static, SEO-first marketing site. No build step required — this is plain HTML/CSS/JS, ready to deploy as-is.

## 1. Deploy to Cloudflare Pages

1. Go to the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Upload this entire folder (or connect it via a Git repo — push this folder as the repo root).
3. Build settings: **no build command**, output directory = `/` (root).
4. Once deployed, set your custom domain (or use the `*.pages.dev` domain Cloudflare gives you).

> If your final domain differs from `stellarforge.is-a.dev`, update `SITE_URL` references: search-replace `https://stellarforge.is-a.dev` across `sitemap.xml`, `robots.txt` is fine as-is, and re-check canonical/OG tags (these were generated from the domain at build time — see note below).

## 2. Connect Supabase (contact form + admin dashboard)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it. This creates the `enquiries` table with the correct Row Level Security policies (public can submit, only logged-in admin can read).
3. Go to **Project Settings → API**, copy your **Project URL** and **anon public key**.
4. Open `assets/js/supabase-config.js` and paste them in:
   ```js
   window.SF_SUPABASE_URL = "https://xxxxx.supabase.co";
   window.SF_SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```
5. Go to **Authentication → Users → Add User** and create your own admin login (email + password). This is the only account that can view enquiries — public sign-up is intentionally not implemented.
6. Re-upload/redeploy the site with the updated config file.

## 3. Using the admin dashboard

- Visit `/admin/` on your live site and sign in with the admin user you created in Supabase.
- `/admin/dashboard.html` lists every enquiry submitted through the contact form, newest first.
- Both admin pages are excluded from search indexing (`noindex`) and blocked in `robots.txt`.

## 4. What's inside

```
/                          Homepage
/services/                 Services hub + 10 individual service pages
/work/                     Case studies (Stellar Global Supplies, Mayur Masala Center, Snehal Printers)
/about/                    About page
/testimonials/             Client testimonials
/insights/                 Blog / insights hub + 3 starter articles
/contact/                  Enquiry form (writes to Supabase) + direct contact channels
/admin/                    Supabase-authenticated enquiries dashboard
/404.html                  Custom 404 page
/sitemap.xml, /robots.txt  Technical SEO
/assets/                   CSS, JS, images
/supabase/schema.sql       Database schema + RLS policies
```

## 5. Notes & next steps

- **Client logos**: the case study pages currently use styled text initials (SG / MM / SP) instead of real client logos, since I couldn't pull binary image files from the client sites during generation. Drop real logo files into `assets/img/clients/` and swap the `.sf-case-media <span>` markup for an `<img>` with descriptive alt text when you have them.
- **Testimonials**: the quotes on `/testimonials/` and the homepage were written by summarizing the real project context and feedback you described for each client (not verbatim quotes), so no Review/AggregateRating schema was added — that schema type has specific eligibility rules for self-hosted testimonials, and misusing it risks a manual action. If you get written, verbatim reviews from these clients later, they can be swapped in and schema reconsidered.
- **GA4 / Search Console**: add your GA4 snippet and Search Console verification meta tag/file once you have them — placeholders were intentionally left out rather than faked.
- **Domain**: all canonical URLs, sitemap, and structured data currently point to `https://stellarforge.is-a.dev`. Update `generate.py`'s `SITE_URL` and rerun the build scripts (or search-replace across the HTML) if you move to a different domain.
- **WhatsApp link**: currently a generic `wa.me` share link with no number attached (opens WhatsApp with a pre-filled message, lets the user pick who to send it to). Replace with `https://wa.me/<your-number>` in `generate.py` → `WHATSAPP` and rebuild, or find-and-replace in the HTML, once you want a direct number.
