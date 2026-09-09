// ===== Supabase config =====
// Fill these in from your Supabase project settings (Project Settings > API).
// The anon key is safe to expose publicly — it only allows what your
// Row Level Security (RLS) policies permit.
window.SUPABASE_URL = "https://rkjyyisjvqulgdxgajot.supabase.co";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJranl5aXNqdnF1bGdkeGdham90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMTQ0MTEsImV4cCI6MjEwMzU5MDQxMX0._iz77X8G_26zvuDC9T_NX2HvskWJTnRWo2ax-9Lq4Zw";

// Expected tables (create these in Supabase):
//
// 1) site_stats  — updated by your automation pushing Cloudflare numbers
//    columns: id (int8, pk), client text, requests numeric, visits numeric,
//             bandwidth_gb numeric, countries int4, updated_at timestamptz
//
// 2) leads — new inquiries from the contact form
//    columns: id (uuid, pk, default gen_random_uuid()), created_at (timestamptz, default now()),
//             name text, email text, project text, budget text, message text
//
// Suggested RLS:
//   site_stats: enable RLS, add a policy "Allow public read" -> SELECT using (true)
//   leads: enable RLS, add a policy "Allow public insert" -> INSERT with check (true)
//          (no public SELECT policy, so submitted leads stay private)
