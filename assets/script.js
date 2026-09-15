// Mobile nav toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    const expanded = navLinks.classList.contains('open');
    menuToggle.setAttribute('aria-expanded', expanded);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// Animated counters (trigger once, on scroll into view)
const counters = document.querySelectorAll('[data-count]');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
  if (prefersReduced) {
    el.textContent = target.toFixed(decimals) + suffix;
    return;
  }
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = target * eased;
    el.textContent = value.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCount(entry.target);
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
counters.forEach(el => io.observe(el));

// ===== Supabase client (loaded via CDN in the page) =====
let supabaseClient = null;
if (window.supabase && window.SUPABASE_URL && window.SUPABASE_URL.indexOf('YOUR-PROJECT-REF') === -1) {
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}

// ===== Live stat ticker: pull latest numbers from Supabase if configured =====
async function loadLiveStats() {
  if (!supabaseClient) return; // falls back to the static numbers already in the HTML
  try {
    const { data, error } = await supabaseClient
      .from('site_stats')
      .select('client, requests, visits, bandwidth_gb, countries, updated_at')
      .order('updated_at', { ascending: false });
    if (error || !data || !data.length) return;

    // Aggregate across all rows (one row per client) for the top ticker bar
    const totals = data.reduce((acc, row) => {
      acc.requests += Number(row.requests) || 0;
      acc.visits += Number(row.visits) || 0;
      acc.countries = Math.max(acc.countries, Number(row.countries) || 0);
      return acc;
    }, { requests: 0, visits: 0, countries: 0 });

    const requestsEl = document.querySelector('[data-live="requests"]');
    const visitsEl = document.querySelector('[data-live="visits"]');
    const countriesEl = document.querySelector('[data-live="countries"]');
    if (requestsEl) requestsEl.dataset.count = (totals.requests / 1e6).toFixed(2);
    if (visitsEl) visitsEl.dataset.count = (totals.visits / 1e6).toFixed(2);
    if (countriesEl) countriesEl.dataset.count = totals.countries;
  } catch (err) {
    console.warn('Live stats fetch failed, using static fallback numbers.', err);
  }
}
loadLiveStats();
