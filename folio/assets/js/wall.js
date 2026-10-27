/* Hold the Wall: a 30-second whack-a-crack.
   Cracks are vulnerabilities; patch them before a goblin slips through.
   Mounted into the folio dialog by folio.js via window.HoldTheWall.mount(). */
(() => {
  'use strict';

  const ROUND_MS = 30000;
  const HEARTS = 3;
  // Stones are laid out like a numpad, so 7-8-9 is the top row.
  const KEYS = [7, 8, 9, 4, 5, 6, 1, 2, 3];
  const RANKS = [[30, 'Castellan'], [20, 'Warden'], [10, 'Sentry'], [0, 'Apprentice Guard']];

  const CRACK = '<svg class="crack" viewBox="0 0 60 40" aria-hidden="true"><path d="M31 3l-5 9 7 6-7 8 5 11M33 18l10-3 7 6M26 12l-11-3-7 6M29 26l-9 4"/></svg>';
  const GOBLIN = '<svg class="goblin" viewBox="0 0 60 40" aria-hidden="true">' +
    '<path class="g-face" d="M18 21L3 11l12 16zM42 21l15-10-12 16z"/>' +
    '<ellipse class="g-face" cx="30" cy="25" rx="15" ry="13"/>' +
    '<circle class="g-eye" cx="24" cy="22" r="2.8"/><circle class="g-eye" cx="36" cy="22" r="2.8"/>' +
    '<circle cx="24.6" cy="22.6" r="1.2" fill="#1d2418" stroke="none"/><circle cx="36.6" cy="22.6" r="1.2" fill="#1d2418" stroke="none"/>' +
    '<path class="g-line" d="M23 30q7 4 14 0"/><path d="M26 31l1.2 2.4 1.2-2M32.5 31.6l1.2 2 1.2-2.4" fill="#fff6c8" stroke="none"/>' +
    '</svg>';

  const best = {
    get() { try { return Number(JSON.parse(localStorage.getItem('folio.wallBest'))) || 0; } catch (e) { return 0; } },
    set(v) { try { localStorage.setItem('folio.wallBest', JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  let teardown = null;

  function mount(root, opts = {}) {
    stop();
    const $ = sel => root.querySelector(sel);
    const grid = $('#wall-grid');
    const overlay = $('#wall-overlay');
    const msg = $('#wall-msg');
    const startBtn = $('#wall-start');
    const scoreEl = $('#wall-score');
    const timeEl = $('#wall-time');
    const heartsEl = $('#wall-hearts');
    const bestEl = $('#wall-best');

    let raf = 0;
    let game = null;

    const stones = KEYS.map((key, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'stone';
      el.setAttribute('aria-label', `Stone ${key}`);
      el.innerHTML = `<span class="key" aria-hidden="true">${key}</span>${CRACK}${GOBLIN}<span class="ring"></span>`;
      // pointerdown feels snappier than click; keyboard activation still arrives as a click with detail 0.
      el.addEventListener('pointerdown', e => { e.preventDefault(); hit(i); });
      el.addEventListener('click', e => { if (e.detail === 0) hit(i); });
      grid.append(el);
      return { el, cracked: false, born: 0, life: 0, breachUntil: 0 };
    });

    const b = best.get();
    bestEl.textContent = b ? `Best watch so far: ${b}` : '';

    function renderHearts() {
      [...heartsEl.children].forEach((h, i) => h.classList.toggle('lost', i >= game.hearts));
      heartsEl.setAttribute('aria-label', `${game.hearts} heart${game.hearts === 1 ? '' : 's'} left`);
    }

    function reset() {
      for (const s of stones) {
        s.cracked = false;
        s.breachUntil = 0;
        s.el.classList.remove('cracked', 'breached', 'patched');
        s.el.style.setProperty('--p', 0);
      }
    }

    function start() {
      reset();
      game = { t0: performance.now(), score: 0, hearts: HEARTS, nextSpawn: 0, running: true };
      scoreEl.textContent = '0';
      timeEl.textContent = String(ROUND_MS / 1000);
      renderHearts();
      overlay.hidden = true;
      grid.querySelector('.stone').focus({ preventScroll: true });
      raf = requestAnimationFrame(tick);
    }

    // Gets harder over the round: cracks appear faster, last shorter, and more at once.
    function pace(elapsed) {
      const k = Math.min(elapsed / ROUND_MS, 1);
      return { gap: 1000 - 560 * k, life: 2300 - 1000 * k, max: 2 + Math.round(2 * k) };
    }

    function tick(now) {
      if (!game || !game.running) return;
      const elapsed = now - game.t0;
      if (elapsed >= ROUND_MS) { end(true); return; }
      const p = pace(elapsed);

      if (now >= game.nextSpawn) {
        const active = stones.filter(s => s.cracked).length;
        const free = stones.filter(s => !s.cracked && !s.breachUntil);
        if (active < p.max && free.length) {
          const s = free[Math.floor(Math.random() * free.length)];
          s.cracked = true;
          s.born = now;
          s.life = p.life;
          s.el.classList.add('cracked');
        }
        game.nextSpawn = now + p.gap * (0.7 + Math.random() * 0.6);
      }

      for (const s of stones) {
        if (s.cracked) {
          const t = (now - s.born) / s.life;
          s.el.style.setProperty('--p', t.toFixed(3));
          if (t >= 1) {
            breach(s, now);
            if (game.hearts <= 0) { end(false); return; }
          }
        } else if (s.breachUntil && now > s.breachUntil) {
          s.breachUntil = 0;
          s.el.classList.remove('breached');
        }
      }

      timeEl.textContent = String(Math.ceil((ROUND_MS - elapsed) / 1000));
      raf = requestAnimationFrame(tick);
    }

    function breach(s, now) {
      s.cracked = false;
      s.el.classList.remove('cracked');
      s.el.classList.add('breached');
      s.el.style.setProperty('--p', 0);
      s.breachUntil = now + 900;
      game.hearts -= 1;
      renderHearts();
    }

    function hit(i) {
      if (!game || !game.running) return;
      const s = stones[i];
      if (!s.cracked) return;
      s.cracked = false;
      s.el.classList.remove('cracked', 'patched');
      s.el.style.setProperty('--p', 0);
      void s.el.offsetWidth; // restart the patch animation
      s.el.classList.add('patched');
      game.score += 1;
      scoreEl.textContent = String(game.score);
    }

    function end(survived) {
      game.running = false;
      cancelAnimationFrame(raf);
      if (survived) timeEl.textContent = '0';
      stones.forEach(s => { s.cracked = false; s.el.classList.remove('cracked'); });
      const top = Math.max(best.get(), game.score);
      best.set(top);
      const rank = RANKS.find(([min]) => game.score >= min)[1];
      msg.innerHTML = `${survived ? 'Dawn breaks and the wall holds!' : 'The goblins are in the courtyard!'}<br>` +
        `You patched <strong>${game.score}</strong> crack${game.score === 1 ? '' : 's'}. Rank: <strong>${rank}</strong>.`;
      startBtn.lastChild.textContent = 'Another watch';
      bestEl.textContent = `Best watch so far: ${top}`;
      overlay.hidden = false;
      startBtn.focus({ preventScroll: true });
      if (opts.onFinish) opts.onFinish(game.score, survived);
    }

    function onKey(e) {
      const i = KEYS.indexOf(Number(e.key));
      if (i < 0 || !game || !game.running) return;
      e.preventDefault();
      hit(i);
    }

    startBtn.addEventListener('click', start);
    document.addEventListener('keydown', onKey);

    teardown = () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      game = null;
    };
  }

  function stop() {
    if (teardown) { teardown(); teardown = null; }
  }

  window.HoldTheWall = { mount, stop };
})();
