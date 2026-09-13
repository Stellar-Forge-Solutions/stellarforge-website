// ===== Hero terminal: a deploy log that types itself out =====
// No dependency on GSAP or any CDN — the lines are real, visible HTML
// by default, so if this script fails to run, the terminal still
// reads perfectly as static text.
(function () {
    const body = document.getElementById('terminalBody');
    if (!body) return;
  
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // leave the static, fully-visible content as-is
  
    const lines = Array.from(body.children);
    lines.forEach((line) => { line.style.visibility = 'hidden'; });
  
    function typeLine(line, done) {
      line.style.visibility = 'visible';
      if (!line.classList.contains('cmd')) {
        setTimeout(done, 90);
        return;
      }
      const full = line.textContent;
      line.textContent = '';
      let i = 0;
      (function typeChar() {
        i++;
        line.textContent = full.slice(0, i);
        if (i < full.length) {
          setTimeout(typeChar, 22 + Math.random() * 20);
        } else {
          setTimeout(done, 280);
        }
      })();
    }
  
    let idx = 0;
    function next() {
      if (idx >= lines.length) return;
      const line = lines[idx];
      idx++;
      typeLine(line, next);
    }
    setTimeout(next, 500); // small pause after the hero copy starts revealing
  })();