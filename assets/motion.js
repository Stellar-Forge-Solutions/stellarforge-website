// ===== Stellar Forge — motion controller =====
// Everything here is additive: base CSS never hides content, so if
// GSAP fails to load (CDN blocked, offline) the page is simply static
// and fully readable — nothing is stuck invisible.
(function () {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof window.gsap === 'undefined') return;
  
    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  
    // ---- Header: subtle solidify on scroll ----
    const header = document.querySelector('.site-header');
    if (header) {
      const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  
    if (prefersReduced) return; // everything below is genuine motion — skip entirely
  
    // ---- Hero load sequence: the one orchestrated moment ----
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const eyebrow = document.querySelector('.hero .eyebrow-tag');
    const heroH1 = document.querySelector('.hero h1');
    const heroLead = document.querySelector('.hero p.lead');
    const heroActions = document.querySelector('.hero-actions');
    const heroProofItems = document.querySelectorAll('.hero-proof .item');
    const hudEls = document.querySelectorAll('.hero-visual .hud, .hero-visual .corner');
  
    if (eyebrow) heroTl.from(eyebrow, { y: 12, opacity: 0, duration: 0.6 }, 0.05);
    if (heroH1) {
      gsap.set(heroH1, { clipPath: 'inset(0 0 100% 0)' });
      heroTl.to(heroH1, { clipPath: 'inset(0 0 0% 0)', duration: 0.9 }, 0.15);
    }
    if (heroLead) heroTl.from(heroLead, { y: 14, opacity: 0, duration: 0.7 }, 0.45);
    if (heroActions) heroTl.from(heroActions.children, { y: 14, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.6);
    if (heroProofItems.length) heroTl.from(heroProofItems, { y: 10, opacity: 0, duration: 0.5, stagger: 0.06 }, 0.75);
    if (hudEls.length) heroTl.from(hudEls, { opacity: 0, duration: 0.8 }, 0.5);
  
    // ---- Generic scroll reveals ----
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      gsap.from(el, {
        y: 20, opacity: 0, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  
    document.querySelectorAll('[data-reveal-group]').forEach((group) => {
      gsap.from(group.children, {
        y: 18, opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: group, start: 'top 85%', once: true },
      });
    });
  
    // ---- Section heading wipe-reveal ----
    document.querySelectorAll('.section-head h2, .section-head h1').forEach((el) => {
      gsap.set(el, { clipPath: 'inset(0 0 100% 0)' });
      gsap.to(el, {
        clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  
    // ---- Magnetic primary buttons ----
    document.querySelectorAll('.btn-primary').forEach((btn) => {
      const strength = 0.3;
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        xTo((e.clientX - rect.left - rect.width / 2) * strength);
        yTo((e.clientY - rect.top - rect.height / 2) * strength);
      });
      btn.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  
    // ---- Process rail: fills as the four steps scroll through ----
    const railFill = document.querySelector('.process-rail .fill');
    const processGrid = document.querySelector('#process .process-grid');
    if (railFill && processGrid) {
      gsap.to(railFill, {
        width: '100%', ease: 'none',
        scrollTrigger: { trigger: processGrid, start: 'top 75%', end: 'bottom 65%', scrub: 0.6 },
      });
    }
  
    // ---- System map: draw the flagship client's real platform graph ----
    const map = document.querySelector('.system-map svg');
    if (map) {
      const lines = map.querySelectorAll('.sm-line');
      const rings = map.querySelectorAll('.sm-node-ring');
      const labels = map.querySelectorAll('.sm-label, .sm-caption');
      const core = map.querySelector('.sm-core');
  
      lines.forEach((line) => {
        const len = line.getTotalLength();
        gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
      });
  
      const tl = gsap.timeline({
        scrollTrigger: { trigger: map, start: 'top 80%', once: true },
      });
      if (core) tl.from(core, { scale: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2)' });
      tl.to(lines, { strokeDashoffset: 0, duration: 0.7, stagger: 0.06, ease: 'power2.out' }, 0.1);
      tl.from(rings, { scale: 0, transformOrigin: '50% 50%', duration: 0.4, stagger: 0.06, ease: 'back.out(2.2)' }, 0.35);
      tl.from(labels, { opacity: 0, duration: 0.5, stagger: 0.03 }, 0.6);
  
      // periodic pulse traveling from core outward along one line, like live traffic
      const pulse = map.querySelector('.sm-pulse');
      const pulseLine = lines[Math.floor(lines.length / 2)];
      if (pulse && pulseLine) {
        const len = pulseLine.getTotalLength();
        function firePulse() {
          gsap.fromTo(pulse, { opacity: 1 }, {
            opacity: 1, duration: 1.6, ease: 'none',
            onUpdate: function () {
              const p = this.progress();
              const pt = pulseLine.getPointAtLength(len * p);
              pulse.setAttribute('cx', pt.x);
              pulse.setAttribute('cy', pt.y);
            },
            onComplete: () => { pulse.setAttribute('opacity', 0); },
          });
        }
        ScrollTrigger.create({
          trigger: map, start: 'top 80%', once: true,
          onEnter: () => {
            firePulse();
            setInterval(firePulse, 3200);
          },
        });
      }
    }
  
    // ---- Sparkline: draw-in for the 30-day trend graph ----
    document.querySelectorAll('.sparkline polyline').forEach((line) => {
      const len = line.getTotalLength();
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
      gsap.to(line, {
        strokeDashoffset: 0, duration: 1.2, ease: 'power2.out',
        scrollTrigger: { trigger: line, start: 'top 85%', once: true },
      });
    });
  })();