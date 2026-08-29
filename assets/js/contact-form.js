// Stellar Forge — contact form → Supabase "enquiries" table
(function () {
  "use strict";
  var form = document.getElementById("sf-enquiry-form");
  if (!form) return;

  var statusEl = document.getElementById("sf-form-status");
  var submitBtn = form.querySelector('button[type="submit"]');

  function setStatus(type, msg) {
    statusEl.textContent = msg;
    statusEl.className = type === "success" ? "is-success" : "is-error";
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!window.supabase || !window.SF_SUPABASE_URL || window.SF_SUPABASE_URL.indexOf("YOUR-PROJECT-REF") !== -1) {
      setStatus("error", "Form isn't connected yet — please email workwithstellarforge@gmail.com directly.");
      return;
    }

    var client = window.sfSupabaseClient || (window.sfSupabaseClient = window.supabase.createClient(window.SF_SUPABASE_URL, window.SF_SUPABASE_ANON_KEY));

    var data = new FormData(form);
    var payload = {
      full_name: (data.get("full_name") || "").toString().trim(),
      email: (data.get("email") || "").toString().trim(),
      company: (data.get("company") || "").toString().trim() || null,
      service_interest: (data.get("service_interest") || "").toString() || null,
      budget_range: (data.get("budget_range") || "").toString() || null,
      message: (data.get("message") || "").toString().trim(),
      source_page: window.location.pathname
    };

    if (!payload.full_name || !payload.email || !payload.message) {
      setStatus("error", "Please fill in your name, email, and a short message.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    var { error } = await client.from("enquiries").insert([payload]);

    submitBtn.disabled = false;
    submitBtn.textContent = "Send enquiry";

    if (error) {
      console.error(error);
      setStatus("error", "Something went wrong sending your message. Please try again or email us directly.");
      return;
    }

    form.reset();
    setStatus("success", "Thanks — your enquiry has been received. We usually reply within 1 business day.");
  });
})();
