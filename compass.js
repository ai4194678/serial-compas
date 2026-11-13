/* ============ ЖИВОЙ КОМПАС — фирменный трёхмерный объект (Canvas 2D, без тяжёлых библиотек) ============ */
window.SC = window.SC || {};

(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // цветовая схема под настроение: [основной, акцентный, светлый]
  const MOOD_COLORS = {
    '':          ['#4D9DB5', '#7774B8', '#A9B9D8'],
    mystery:     ['#7774B8', '#5266A8', '#A9B9D8'],
    love:        ['#9B8EC4', '#7774B8', '#D8C9E8'],
    adventure:   ['#4D9DB5', '#5FA9C9', '#A9D8E8'],
    light:       ['#5FA9C9', '#B0899B', '#E8D5C9'],
    twist:       ['#4D9DB5', '#7774B8', '#A9B9D8']
  };

  function makeCompass(canvas, opts) {
    const ctx = canvas.getContext('2d');
    const o = opts || {};
    let W = 0, H = 0, dpr = 1;
    let t = Math.random() * 100;
    let mx = 0, my = 0, tmx = 0, tmy = 0;   // параллакс курсора
    let mood = '';
    let energy = 1;                          // «энергия» анимации (усиливается при подборе)
    let raf = null, running = false;
    let colors = MOOD_COLORS[''];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width || canvas.width; H = rect.height || canvas.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.36;
      const c1 = colors[0], c2 = colors[1], c3 = colors[2];
      const speed = 0.006 * energy * (reduced ? 0 : 1);
      t += speed;
      mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;
      const tiltX = my * 0.35, tiltY = mx * 0.5;

      // --- внешние полупрозрачные кольца ---
      for (let k = 0; k < 3; k++) {
        const rr = R * (1.18 + k * 0.16);
        const a0 = t * (0.4 + k * 0.25) * (k % 2 ? -1 : 1);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a0);
        const grad = ctx.createLinearGradient(-rr, 0, rr, 0);
        grad.addColorStop(0, hexA(c1, 0));
        grad.addColorStop(0.5, hexA(k % 2 ? c2 : c1, 0.55 - k * 0.14));
        grad.addColorStop(1, hexA(c1, 0));
        ctx.strokeStyle = grad; ctx.lineWidth = 2.2 - k * 0.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, rr, rr * (0.94 - k * 0.2), tiltX * 0.4, 0, Math.PI * 2);
        ctx.stroke();
        // дуги-акценты на кольцах
        ctx.strokeStyle = hexA(k % 2 ? c1 : c2, 0.8 - k * 0.2); ctx.lineWidth = 2.6 - k * 0.6;
        ctx.beginPath(); ctx.arc(0, 0, rr, 0.2, 1.1); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, rr, Math.PI + 0.4, Math.PI + 1.2); ctx.stroke();
        ctx.restore();
      }

      // --- сфера: полупрозрачные меридианы (псевдо-3D вращение) ---
      ctx.save();
      ctx.translate(cx + tiltY * R * 0.18, cy + tiltX * R * 0.22);
      const shell = ctx.createRadialGradient(-R * 0.3, -R * 0.35, R * 0.1, 0, 0, R * 1.12);
      shell.addColorStop(0, hexA(c3, 0.13));
      shell.addColorStop(0.55, hexA(c1, 0.10));
      shell.addColorStop(1, hexA(c2, 0.03));
      ctx.fillStyle = shell;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.08, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = hexA(c3, 0.35); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, R * 1.08, 0, Math.PI * 2); ctx.stroke();

      for (let i = 0; i < 6; i++) {
        const ph = t * (1 + (i % 3) * 0.35) + i * Math.PI / 6;
        const rx = Math.abs(Math.cos(ph)) * R * 0.98 + R * 0.04;
        ctx.strokeStyle = hexA(i % 2 ? c2 : c1, 0.22 + 0.2 * Math.abs(Math.sin(ph)));
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, R, tiltX * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
      // горизонтальные слои-«широты»
      for (let j = -3; j <= 3; j++) {
        const yy = (j / 3.4) * R;
        const rx = Math.sqrt(Math.max(0, 1 - (yy / R) ** 2)) * R;
        ctx.strokeStyle = hexA(c3, 0.14);
        ctx.beginPath(); ctx.ellipse(0, yy, rx, rx * 0.24, 0, 0, Math.PI * 2); ctx.stroke();
      }

      // --- орбитальные точки ---
      for (let p = 0; p < 10; p++) {
        const pa = t * (0.7 + (p % 4) * 0.3) + p * Math.PI / 5;
        const pr = R * (0.5 + ((p * 7) % 10) / 22);
        const px = Math.cos(pa) * pr, py = Math.sin(pa) * pr * 0.42 + Math.sin(pa * 2 + p) * R * 0.18;
        const size = 1.6 + 2.2 * Math.abs(Math.sin(pa + p));
        ctx.fillStyle = hexA(p % 2 ? c1 : c3, 0.85);
        ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
      }

      // --- центральная «игла» направления (не географическая — абстрактная) ---
      const na = Math.sin(t * 0.6) * 0.5 + tiltY;
      const nl = R * 0.95;
      const ng = ctx.createLinearGradient(0, -nl, 0, nl);
      ng.addColorStop(0, hexA(c2, 0.95)); ng.addColorStop(1, hexA(c1, 0.95));
      ctx.save(); ctx.rotate(na);
      ctx.fillStyle = ng;
      ctx.beginPath(); ctx.moveTo(0, -nl); ctx.lineTo(nl * 0.13, 0); ctx.lineTo(0, nl * 0.18); ctx.lineTo(-nl * 0.13, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, nl * 0.62); ctx.lineTo(nl * 0.08, 0); ctx.lineTo(-nl * 0.08, 0); ctx.closePath();
      ctx.fillStyle = hexA(c3, 0.3); ctx.fill();
      ctx.restore();

      // световое ядро
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.3);
      core.addColorStop(0, hexA(c3, 0.8)); core.addColorStop(1, hexA(c3, 0));
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(0, 0, R * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function loop() {
      draw();
      if (!reduced && running) raf = requestAnimationFrame(loop);
    }
    function start() { if (!running) { running = true; loop(); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    window.addEventListener('resize', resize);
    if (!reduced) {
      window.addEventListener('mousemove', e => {
        tmx = (e.clientX / window.innerWidth - 0.5) * 2;
        tmy = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }
    // анимация только когда объект реально виден
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()),
        { threshold: 0.05 }).observe(canvas);
    } else start();

    return {
      setMood(key) { mood = key; colors = MOOD_COLORS[key] || MOOD_COLORS['']; if (reduced) draw(); },
      setEnergy(v) { energy = v; },
      draw
    };
  }

  let mainC = null;
  SC.compass = null; // управляющий интерфейс для главного компаса

  SC.initCompasses = function () {
    const main = document.getElementById('mainCompass');
    if (main && !mainC) mainC = makeCompass(main);
    const brand = document.getElementById('brandCompass');
    if (brand && !SC._brandC) SC._brandC = makeCompass(brand, { small: true });
    SC.compass = {
      setMood(k) { if (mainC) mainC.setMood(k); },
      setEnergy(v) { if (mainC) mainC.setEnergy(v); },
      burst() { // активная анимация при подборе
        if (!mainC) return;
        mainC.setEnergy(3.2);
        setTimeout(() => mainC.setEnergy(1), 2600);
      }
    };
    document.addEventListener('sc:store', () => { if (SC._brandC) SC._brandC.draw(); });
  };
})();

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
