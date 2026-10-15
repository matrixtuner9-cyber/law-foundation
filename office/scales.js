/* مشهد العدالة الحي: تدرج كحلي، وهج ذهبي متحرك، أعمدة محكمة، غبار ذهبي، وميزان تتأرجح كفتاه */
(function () {
  const G1 = '#16264A', G2 = '#0B1224', G3 = '#050709', GOLD = '#C9A24B', HI = '#E6C77A', LO = '#B8923A', PALE = '#F6E3A6';
  function MQScene(canvas, opts = {}) {
    const ctx = canvas.getContext('2d'), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0, dpr = 1, raf = 0, t0 = performance.now();
    let rnd = 11; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
    const dust = Array.from({ length: 70 }, () => [R(), R(), .25 + R() * .75, .8 + R() * 2, R()]);
    function size() { dpr = Math.min(3, Math.max(1, devicePixelRatio || 1)); /* حتى 3× لشاشات 4K */ const r = canvas.getBoundingClientRect(); w = r.width; h = r.height; canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0) }
    const gold = (x0, y0, x1, y1) => { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, PALE); g.addColorStop(.35, HI); g.addColorStop(.7, GOLD); g.addColorStop(1, LO); return g };
    function bg(t) {
      let g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, G1); g.addColorStop(.55, G2); g.addColorStop(1, G3); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      const cx = w * (.5 + .2 * Math.sin(t * Math.PI * 2)), cy = h * (.24 + .04 * Math.cos(t * Math.PI * 2));
      g = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * .65); g.addColorStop(0, 'rgba(201,162,75,.26)'); g.addColorStop(.45, 'rgba(201,162,75,.06)'); g.addColorStop(1, 'rgba(201,162,75,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    }
    function columns(t) {
      const dx = Math.sin(t * Math.PI * 2) * 6, top = h * .68;
      ctx.fillStyle = 'rgba(230,199,122,.07)'; ctx.strokeStyle = 'rgba(230,199,122,.09)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w * .03 + dx, top - h * .03); ctx.lineTo(w * .5 + dx, top - h * .11); ctx.lineTo(w * .97 + dx, top - h * .03); ctx.closePath(); ctx.fill();
      ctx.fillRect(w * .03 + dx, top - h * .03, w * .94, h * .03);
      const n = 6, cw = w * .085;
      for (let i = 0; i < n; i++) {
        const x = w * .08 + (w * .84 - cw) * i / (n - 1) + dx;
        ctx.fillRect(x - 5, top, cw + 10, h * .014); ctx.fillRect(x, top + h * .014, cw, h - top);
        for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x + cw * k / 4, top + h * .014); ctx.lineTo(x + cw * k / 4, h); ctx.stroke() }
      }
    }
    function particles(t) {
      for (const d of dust) {
        const y = h - (((d[1] + t * d[2]) % 1 + 1) % 1) * h, x = d[0] * w + Math.sin(Math.PI * 2 * (t * (1 + d[2]) + d[4])) * 16;
        const tw = .5 + .5 * Math.sin(Math.PI * 2 * (t * 3 + d[4]));
        ctx.fillStyle = `rgba(230,199,122,${.1 + .45 * tw})`; ctx.beginPath(); ctx.arc(x, y, d[3], 0, Math.PI * 2); ctx.fill();
      }
    }
    function scales(t, cx, cy, S) {
      const ang = .15 * Math.sin(Math.PI * 2 * t * 4) * (.78 + .22 * Math.sin(Math.PI * 2 * t * 8 + 1));
      const px = cx, py = cy - S * .3, half = S * .4, fill = gold(cx - S / 2, cy - S / 2, cx + S / 2, cy + S / 2);
      let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * .62); g.addColorStop(0, `rgba(201,162,75,${.3 + .06 * Math.sin(t * 40)})`); g.addColorStop(1, 'rgba(201,162,75,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, S * .62, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = fill;
      const rr = (x, y, ww, hh, r) => { ctx.beginPath(); ctx.roundRect(x - ww / 2, y - hh / 2, ww, hh, r); ctx.fill() };
      rr(cx, cy + S * .455, S * .46, S * .05, 6); rr(cx, cy + S * .41, S * .32, S * .045, 5);
      ctx.beginPath(); ctx.moveTo(cx - S * .026, py); ctx.lineTo(cx + S * .026, py); ctx.lineTo(cx + S * .04, cy + S * .39); ctx.lineTo(cx - S * .04, cy + S * .39); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy - S * .385, S * .022, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
      ctx.beginPath(); ctx.roundRect(-half, -S * .011, half * 2, S * .022, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-half, -S * .006); ctx.lineTo(half, -S * .006); ctx.stroke();
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * half, 0, S * .02, 0, Math.PI * 2); ctx.fill() }
      ctx.restore();
      ctx.beginPath(); ctx.arc(px, py, S * .042, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = G3; ctx.beginPath(); ctx.arc(px, py, S * .016, 0, Math.PI * 2); ctx.fill();
      for (const s of [-1, 1]) {
        const ex = px + s * half * Math.cos(ang), ey = py + s * half * Math.sin(ang), pcx = ex, pcy = ey + S * .34, pw = S * .3;
        ctx.strokeStyle = 'rgba(230,199,122,.85)'; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(pcx - pw / 2, pcy); ctx.moveTo(ex, ey); ctx.lineTo(pcx + pw / 2, pcy); ctx.stroke();
        ctx.strokeStyle = 'rgba(230,199,122,.45)'; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(pcx, pcy); ctx.stroke();
        ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(pcx, pcy, pw / 2, S * .065, 0, 0, Math.PI); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.fillStyle = HI; ctx.beginPath(); ctx.ellipse(pcx, pcy, pw / 2, S * .011, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    function vignette() { const g = ctx.createRadialGradient(w / 2, h * .4, Math.min(w, h) * .3, w / 2, h * .4, Math.max(w, h) * .85); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h) }
    /* أشعة ضوء ذهبية تنزل من الأعلى */
    function rays(t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * .16 + Math.sin(t * Math.PI * 2 + i) * .03, len = h * 1.1, x0 = w / 2 + mx * 18, y0 = -h * .08;
        const g = ctx.createLinearGradient(x0, y0, x0 + Math.cos(-a) * len, y0 + Math.sin(-a) * len);
        const al = .045 + .03 * Math.sin(t * Math.PI * 6 + i * 1.7);
        g.addColorStop(0, `rgba(246,227,166,${al})`); g.addColorStop(1, 'rgba(246,227,166,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + Math.cos(-a - .05) * len, y0 + Math.sin(-a - .05) * len); ctx.lineTo(x0 + Math.cos(-a + .05) * len, y0 + Math.sin(-a + .05) * len); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    let mx = 0, my = 0, tx = 0, ty = 0;
    addEventListener('pointermove', e => { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2 }, { passive: true });
    function frame(now) {
      const t = still ? .1 : ((now - t0) / 26000) % 1;
      mx += (tx - mx) * .05; my += (ty - my) * .05;
      bg(t); rays(t);
      ctx.save(); ctx.translate(-mx * 10, -my * 6); columns(t); ctx.restore();
      particles(t);
      const S = Math.min(w * .62, h * .42, 340); ctx.save(); ctx.translate(mx * 8, my * 5); scales(t, w / 2, h * (opts.scalesY || .4), S); ctx.restore();
      vignette();
      if (!still) raf = requestAnimationFrame(frame);
    }
    size(); addEventListener('resize', () => { size(); if (still) frame(performance.now()) });
    raf = requestAnimationFrame(frame);
    return { stop() { cancelAnimationFrame(raf) } };
  }
  window.MQScene = MQScene;
})();
