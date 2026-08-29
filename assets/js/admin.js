// Stellar Forge — Admin auth + enquiries dashboard (Supabase Auth)
(function () {
  "use strict";

  function getClient() {
    if (!window.supabase || !window.SF_SUPABASE_URL || window.SF_SUPABASE_URL.indexOf("YOUR-PROJECT-REF") !== -1) {
      return null;
    }
    return window.sfSupabaseClient || (window.sfSupabaseClient = window.supabase.createClient(window.SF_SUPABASE_URL, window.SF_SUPABASE_ANON_KEY));
  }

  // ---------- LOGIN PAGE ----------
  var loginForm = document.getElementById("sf-login-form");
  if (loginForm) {
    var loginStatus = document.getElementById("sf-login-status");
    var client = getClient();

    (async function redirectIfLoggedIn() {
      if (!client) return;
      var { data } = await client.auth.getSession();
      if (data && data.session) window.location.href = "./dashboard.html";
    })();

    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!client) {
        loginStatus.textContent = "Supabase isn't configured yet. Add your project URL and anon key to assets/js/supabase-config.js.";
        loginStatus.className = "is-error";
        return;
      }
      var email = document.getElementById("sf-email").value.trim();
      var password = document.getElementById("sf-password").value;
      var { error } = await client.auth.signInWithPassword({ email: email, password: password });
      if (error) {
        loginStatus.textContent = "Sign in failed: " + error.message;
        loginStatus.className = "is-error";
        return;
      }
      window.location.href = "./dashboard.html";
    });
  }

  // ---------- DASHBOARD PAGE ----------
  var tableBody = document.getElementById("sf-enquiries-body");
  if (tableBody) {
    var client2 = getClient();
    var logoutBtn = document.getElementById("sf-logout");
    var emptyState = document.getElementById("sf-empty-state");
    var whoami = document.getElementById("sf-whoami");

    function escapeHtml(str) {
      var div = document.createElement("div");
      div.textContent = str == null ? "" : str;
      return div.innerHTML;
    }

    async function loadEnquiries() {
      var { data, error } = await client2
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        tableBody.innerHTML = '<tr><td colspan="7">Couldn\'t load enquiries: ' + escapeHtml(error.message) + "</td></tr>";
        return;
      }

      if (!data || data.length === 0) {
        emptyState.style.display = "block";
        return;
      }
      emptyState.style.display = "none";

      tableBody.innerHTML = data
        .map(function (row) {
          var date = new Date(row.created_at).toLocaleString();
          return (
            "<tr>" +
            '<td><span class="sf-status-pill ' + (row.status === "new" ? "new" : "") + '">' + escapeHtml(row.status) + "</span></td>" +
            "<td>" + date + "</td>" +
            "<td><strong>" + escapeHtml(row.full_name) + "</strong><br><span style='color:var(--sf-text-mute)'>" + escapeHtml(row.email) + "</span></td>" +
            "<td>" + escapeHtml(row.company || "—") + "</td>" +
            "<td>" + escapeHtml(row.service_interest || "—") + "</td>" +
            "<td style='max-width:320px;white-space:pre-wrap'>" + escapeHtml(row.message) + "</td>" +
            "<td>" + escapeHtml(row.source_page || "—") + "</td>" +
            "</tr>"
          );
        })
        .join("");
    }

    (async function init() {
      if (!client2) {
        tableBody.innerHTML = '<tr><td colspan="7">Supabase isn\'t configured yet.</td></tr>';
        return;
      }
      var { data: sessionData } = await client2.auth.getSession();
      if (!sessionData || !sessionData.session) {
        window.location.href = "./index.html";
        return;
      }
      whoami.textContent = sessionData.session.user.email;
      loadEnquiries();
    })();

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async function () {
        await client2.auth.signOut();
        window.location.href = "./index.html";
      });
    }
  }
})();
