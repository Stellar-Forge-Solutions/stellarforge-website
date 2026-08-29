// Stellar Forge — main.js
// Lightweight, progressive-enhancement only. No content is rendered via JS.

(function () {
  "use strict";

  // Mobile nav toggle
  var toggle = document.querySelector(".sf-nav-toggle");
  var links = document.querySelector(".sf-nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Decorative starfield — canvas, low density, respects reduced motion
  var canvas = document.getElementById("sf-stars");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width = window.innerWidth * DPR;
      canvas.height = Math.min(window.innerHeight * 1.4, 1400) * DPR;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = canvas.height / DPR + "px";
      var count = Math.floor((canvas.width * canvas.height) / 900000);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.4 * DPR + 0.3,
          a: Math.random() * 0.6 + 0.15,
          tw: Math.random() * 0.015 + 0.003,
          dir: Math.random() > 0.5 ? 1 : -1
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.a += s.tw * s.dir;
        if (s.a > 0.75 || s.a < 0.1) s.dir *= -1;
        ctx.beginPath();
        ctx.fillStyle = "rgba(234,238,247," + s.a.toFixed(2) + ")";
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    requestAnimationFrame(draw);
  }

  // Active nav link
  var path = window.location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".sf-nav-links a[data-path]").forEach(function (a) {
    var p = a.getAttribute("data-path");
    if (path === p || (p !== "/" && path.indexOf(p) === 0)) {
      a.setAttribute("aria-current", "page");
    }
  });

  // Reveal-on-scroll (subtle, orchestrated — not scattered)
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el, i) {
      el.style.opacity = "0";
      el.style.transform = "translateY(14px)";
      el.style.transition = "opacity 0.6s ease " + (i % 4) * 0.06 + "s, transform 0.6s ease " + (i % 4) * 0.06 + "s";
      io.observe(el);
    });
  }
})();
