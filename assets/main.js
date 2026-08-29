// Stellar Forge — progressive enhancement only. No content depends on this file.
(function(){
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  if(toggle && mobileNav){
    toggle.addEventListener('click', function(){
      var open = mobileNav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Subtle scroll reveal (opacity/translate), respects reduced motion, degrades to visible
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!prefersReduced && 'IntersectionObserver' in window){
    var revealEls = document.querySelectorAll('[data-reveal]');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function(el){ io.observe(el); });
  }

  // ---- Enquiry form -> Supabase ----
  // Fill these in from your Supabase project settings (Settings -> API).
  var SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL"; // e.g. https://xxxx.supabase.co
  var SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

  var form = document.querySelector('#enquiry-form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var statusEl = form.querySelector('.form-status');
      var submitBtn = form.querySelector('button[type=submit]');
      var data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        company: form.company ? form.company.value.trim() : null,
        project_type: form.project_type ? form.project_type.value : null,
        budget_range: form.budget_range ? form.budget_range.value : null,
        message: form.message.value.trim(),
        source_page: window.location.pathname
      };

      if(!data.name || !data.email || !data.message){
        statusEl.textContent = "Please fill in your name, email, and a short message.";
        statusEl.setAttribute('data-state', 'err');
        return;
      }

      if(SUPABASE_URL.indexOf('YOUR_SUPABASE') === 0){
        // Not yet configured — tell the developer, not the visitor, what's wrong.
        console.warn('Stellar Forge: Supabase URL/key not configured in main.js — form submissions will not be saved.');
        statusEl.textContent = "Thanks — this form isn't fully wired up yet. Please email workwithstellarforge@gmail.com directly for now.";
        statusEl.setAttribute('data-state', 'err');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch(SUPABASE_URL + '/rest/v1/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      }).then(function(res){
        if(res.ok){
          form.reset();
          statusEl.textContent = "Thanks — your enquiry has been sent. We reply within 1–2 business days.";
          statusEl.setAttribute('data-state', 'ok');
        } else {
          throw new Error('Request failed: ' + res.status);
        }
      }).catch(function(err){
        console.error(err);
        statusEl.textContent = "Something went wrong sending this. Please email workwithstellarforge@gmail.com instead.";
        statusEl.setAttribute('data-state', 'err');
      }).finally(function(){
        submitBtn.disabled = false;
        submitBtn.textContent = "Send enquiry";
      });
    });
  }
})();
