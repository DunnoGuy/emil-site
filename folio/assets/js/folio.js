/* Emil Kuli-Zade · Folio
   Everything interactive on the page: the journey HUD, the night sky, quest scrolls,
   the inventory, achievements and a few secrets. No frameworks, no build step. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;

  // Progress lives in this browser only; every access is guarded because storage can be blocked.
  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem('folio.' + key); return v === null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('folio.' + key, JSON.stringify(value)); } catch (e) { /* private mode */ }
    },
  };

  /* ---------------- Achievements ---------------- */
  const ACHIEVEMENTS = [
    { id: 'reader', icon: 'scroll', name: 'Quest Reader', desc: 'Opened every quest scroll.' },
    { id: 'traveller', icon: 'mug', name: 'Well-Travelled', desc: 'Reached the tavern at the end of the road.' },
    { id: 'skimmer', icon: 'book', name: 'Busy Recruiter', desc: 'Read the short version. No judgement.' },
    { id: 'lamplighter', icon: 'lantern', name: 'Lamplighter', desc: 'Changed the time of day.' },
    { id: 'raven', icon: 'raven', name: 'Raven Dispatched', desc: 'Found my email address.' },
    { id: 'warden', icon: 'tower', name: 'Wall Warden', desc: 'Finished a watch in Hold the Wall.' },
    { id: 'donut', icon: 'sparkle', name: 'Sweet Tooth', desc: 'Admired the obligatory donut.' },
    { id: 'konami', icon: 'key', name: 'Old Magic', desc: 'Remembered the ancient code.', secret: true },
  ];
  let unlocked = new Set(store.get('ach', []));
  const achBtn = $('#ach-btn');

  function renderAchCount(bump) {
    const n = ACHIEVEMENTS.filter(a => unlocked.has(a.id)).length;
    $('#ach-count').textContent = `${n}/${ACHIEVEMENTS.length}`;
    achBtn.setAttribute('aria-label', `Achievements: ${n} of ${ACHIEVEMENTS.length} unlocked`);
    if (bump) {
      achBtn.classList.remove('bump');
      void achBtn.offsetWidth;
      achBtn.classList.add('bump');
    }
  }

  function unlock(id) {
    if (unlocked.has(id)) return;
    const a = ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return;
    unlocked.add(id);
    store.set('ach', [...unlocked]);
    renderAchCount(true);
    toast(a);
    if (dialogMode === 'achievements') renderAchievements();
  }

  function toast(a) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="toast-icon">${icon(a.icon)}</span><div><small>Achievement unlocked</small><b></b><p></p></div>`;
    $('b', el).textContent = a.name;
    $('p', el).textContent = a.desc;
    $('#toasts').append(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 450);
    }, 4200);
  }

  function renderAchievements() {
    const list = $('#ach-list');
    if (!list) return;
    list.innerHTML = '';
    for (const a of ACHIEVEMENTS) {
      const got = unlocked.has(a.id);
      const hidden = a.secret && !got;
      const li = document.createElement('li');
      li.className = got ? 'got' : 'locked';
      li.innerHTML = `<span class="ach-icon">${icon(got ? a.icon : 'lock')}</span><div><b></b><span></span></div>`;
      $('b', li).textContent = hidden ? '???' : a.name;
      $('div > span', li).textContent = hidden ? 'A secret. Some old magic still works here.' : a.desc;
      list.append(li);
    }
  }

  // Lets the mini-game (wall.js) report back.
  window.folio = { unlock };

  /* ---------------- Time of day ---------------- */
  const themeBtn = $('#theme-btn');
  function labelTheme() {
    themeBtn.setAttribute('aria-label', root.dataset.theme === 'night' ? 'Switch to day' : 'Switch to night');
  }
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'night' ? 'day' : 'night';
    root.dataset.theme = next;
    try { localStorage.setItem('folio.theme', next); } catch (e) { /* ignore */ }
    labelTheme();
    unlock('lamplighter');
  });
  labelTheme();

  /* ---------------- Journey HUD ---------------- */
  const chapters = $$('[data-chapter]');
  const stops = $$('.journey-stops a');
  const fill = $('.journey-fill');
  const token = $('.journey-token');
  const trails = $$('.trail svg');
  trails.forEach(t => t.style.setProperty('--p', 0));

  function updateJourney() {
    const probe = scrollY + innerHeight * 0.4;
    let idx = 0;
    chapters.forEach((c, i) => { if (c.offsetTop <= probe) idx = i; });
    let frac = 0;
    const next = chapters[idx + 1];
    if (next) frac = clamp((probe - chapters[idx].offsetTop) / (next.offsetTop - chapters[idx].offsetTop), 0, 1);
    const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 8;
    if (atBottom) { idx = chapters.length - 1; frac = 0; }

    const p = (idx + frac) / (chapters.length - 1);
    fill.style.width = `${p * 100}%`;
    token.style.left = `${p * 100}%`;
    stops.forEach((s, i) => {
      s.classList.toggle('reached', i <= idx);
      s.classList.toggle('current', i === idx);
      if (i === idx) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
    });
    if (idx === chapters.length - 1) unlock('traveller');

    // The dotted trail between chapters draws itself as you walk past it.
    for (const t of trails) {
      const r = t.getBoundingClientRect();
      t.style.setProperty('--p', clamp((innerHeight * 0.95 - r.top) / (r.height + innerHeight * 0.25), 0, 1).toFixed(3));
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; updateJourney(); });
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  addEventListener('load', updateJourney);
  updateJourney();

  /* ---------------- Reveal on scroll ---------------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }

  /* ---------------- Prologue: sky, parallax, fireflies ---------------- */
  const prologue = $('#prologue');

  (function stars() {
    const g = $('.stars');
    const ns = 'http://www.w3.org/2000/svg';
    for (let i = 0; i < 80; i++) {
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', (Math.random() * 1440).toFixed(1));
      c.setAttribute('cy', (Math.random() * 620).toFixed(1));
      c.setAttribute('r', (0.6 + Math.random() * 1.3).toFixed(2));
      c.style.setProperty('--o', (0.4 + Math.random() * 0.6).toFixed(2));
      c.style.setProperty('--d', `${(2.5 + Math.random() * 4).toFixed(2)}s`);
      c.style.setProperty('--dl', `${(-Math.random() * 5).toFixed(2)}s`);
      g.append(c);
    }
  })();

  // Wide screens: fit the landscape to its band (hills run past the edges).
  // Narrow screens: crop the sides instead so the castle stays a decent size.
  const sceneSvg = $('#scene-svg');
  const VIEW_ASPECT = 1440 / 510;
  function fitScene() {
    const r = sceneSvg.getBoundingClientRect();
    if (!r.height) return;
    sceneSvg.setAttribute('preserveAspectRatio', r.width / r.height < VIEW_ASPECT ? 'xMaxYMax slice' : 'xMidYMax meet');
  }
  fitScene();
  addEventListener('resize', fitScene);

  const layers = $$('.scene .layer');
  if (finePointer && !reduceMotion) {
    prologue.addEventListener('pointermove', e => {
      const r = prologue.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      for (const l of layers) {
        const d = parseFloat(l.dataset.depth);
        l.style.transform = `translate(${(-x * d * 70).toFixed(1)}px, ${(-y * d * 18).toFixed(1)}px)`;
      }
    });
    prologue.addEventListener('pointerleave', () => layers.forEach(l => { l.style.transform = ''; }));
  }

  const flies = (function fireflies() {
    const canvas = $('#fireflies');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    let W = 0, H = 0, running = false, visible = true;
    const mouse = { x: -1e4, y: -1e4 };
    const count = innerWidth < 720 ? 16 : 32;
    let sprite = null, spriteNight = null;

    function makeSprite(night) {
      const s = document.createElement('canvas');
      s.width = s.height = 64;
      const c = s.getContext('2d');
      const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      const col = night ? '255, 214, 130' : '214, 158, 52';
      g.addColorStop(0, `rgba(${col}, 1)`);
      g.addColorStop(0.18, `rgba(${col}, .85)`);
      g.addColorStop(0.45, `rgba(${col}, .22)`);
      g.addColorStop(1, `rgba(${col}, 0)`);
      c.fillStyle = g;
      c.fillRect(0, 0, 64, 64);
      return s;
    }

    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    addEventListener('resize', resize);

    const list = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: H * (0.3 + Math.random() * 0.65),
      vx: 0, vy: 0,
      a: Math.random() * Math.PI * 2,
      s: 0.5 + Math.random() * 0.9,
      r: 1 + Math.random() * 1.6,
      ph: Math.random() * Math.PI * 2,
    }));

    function draw(t) {
      const night = root.dataset.theme === 'night';
      if (spriteNight !== night) { sprite = makeSprite(night); spriteNight = night; }
      ctx.clearRect(0, 0, W, H);
      for (const f of list) {
        if (!reduceMotion) {
          f.a += (Math.random() - 0.5) * 0.35;
          let ax = Math.cos(f.a) * 0.035 * f.s;
          let ay = Math.sin(f.a) * 0.025 * f.s;
          const dx = mouse.x - f.x, dy = mouse.y - f.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 170 * 170 && d2 > 400) {
            const d = Math.sqrt(d2);
            ax += (dx / d) * 0.05;
            ay += (dy / d) * 0.05;
          }
          f.vx = (f.vx + ax) * 0.965;
          f.vy = (f.vy + ay) * 0.965;
          f.x += f.vx; f.y += f.vy;
          if (f.x < -20) f.x = W + 20;
          if (f.x > W + 20) f.x = -20;
          if (f.y < H * 0.12) f.vy += 0.03;
          if (f.y > H + 20) f.y = H * 0.4;
        }
        const pulse = 0.5 + 0.5 * Math.sin(t / 700 * f.s + f.ph);
        const R = f.r * (night ? 9 : 6);
        ctx.globalAlpha = night ? 0.3 + 0.7 * pulse : 0.2 + 0.35 * pulse;
        ctx.drawImage(sprite, f.x - R, f.y - R, R * 2, R * 2);
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      draw(t);
      if (running) requestAnimationFrame(loop);
    }
    function setRunning(on) {
      if (reduceMotion) { draw(0); return; }
      if (on && !running) { running = true; requestAnimationFrame(loop); }
      else if (!on) running = false;
    }

    prologue.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    prologue.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(visible && !document.hidden); }).observe(prologue);
    }
    document.addEventListener('visibilitychange', () => setRunning(visible && !document.hidden));
    setRunning(true);

    return {
      scatter(x, y) {
        for (const f of list) {
          const dx = f.x - x, dy = f.y - y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 260) { f.vx += (dx / d) * 3; f.vy += (dy / d) * 3; }
        }
      },
    };
  })();

  // A little sparkle wherever the sky is clicked.
  prologue.addEventListener('click', e => {
    if (e.target.closest('a, button')) return;
    const r = prologue.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (flies) flies.scatter(x, y);
    if (reduceMotion) return;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement('span');
      s.className = 'burst';
      const ang = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 30 + Math.random() * 40;
      s.style.left = `${x - 3}px`;
      s.style.top = `${y - 3}px`;
      s.style.setProperty('--x', `${Math.cos(ang) * dist}px`);
      s.style.setProperty('--y', `${Math.sin(ang) * dist}px`);
      prologue.append(s);
      setTimeout(() => s.remove(), 800);
    }
  });

  /* ---------------- Inventory ---------------- */
  const tabs = $$('.tabs [role="tab"]');
  const slots = $$('.slot');

  function selectSlot(slot) {
    if (!slot) return;
    slots.forEach(s => s.setAttribute('aria-pressed', String(s === slot)));
    $('#inv-type').textContent = slot.dataset.type;
    $('#inv-name').textContent = slot.dataset.name;
    $('#inv-desc').textContent = slot.dataset.desc;
    $('#inv-found').textContent = slot.dataset.found;
  }
  function selectTab(i) {
    tabs.forEach((t, j) => {
      const on = i === j;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    selectSlot($(`#${tabs[i].getAttribute('aria-controls')} .slot`));
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(i));
    tab.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(j);
      tabs[j].focus();
    });
  });
  slots.forEach(s => {
    s.addEventListener('click', () => selectSlot(s));
    s.addEventListener('focus', () => selectSlot(s));
    if (finePointer) s.addEventListener('mouseenter', () => selectSlot(s));
  });
  selectSlot(slots[0]);

  /* ---------------- Quests ---------------- */
  const questCards = $$('.quest');
  const QUESTS = questCards.map(c => c.dataset.quest);
  const seen = new Set(store.get('seen', []).filter(q => QUESTS.includes(q)));

  function renderSeen() {
    questCards.forEach(c => c.classList.toggle('seen', seen.has(c.dataset.quest)));
    const n = seen.size, total = QUESTS.length;
    $('.qp-bar span').style.width = `${(n / total) * 100}%`;
    $('.qp-text').textContent = n === total
      ? `All ${total} scrolls read. Thorough!`
      : `${n} of ${total} scrolls read`;
    const note = $('#tavern-note');
    note.hidden = n !== total;
    note.textContent = 'You read every quest scroll. Thorough — I like that in a teammate.';
  }
  function markSeen(id) {
    if (seen.has(id)) return;
    seen.add(id);
    store.set('seen', [...seen]);
    renderSeen();
    if (seen.size === QUESTS.length) unlock('reader');
  }
  renderSeen();

  const saveData = navigator.connection && navigator.connection.saveData;
  questCards.forEach((card, i) => {
    $('.quest-open', card).addEventListener('click', () => openDialog('quest', i));

    const video = $('video', card);
    if (!video || reduceMotion || saveData) return;
    const play = () => {
      if (!video.src) video.src = video.dataset.src;
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };
    const stop = () => { video.pause(); card.classList.remove('previewing'); };
    video.addEventListener('playing', () => card.classList.add('previewing'));
    if (finePointer) {
      card.addEventListener('pointerenter', play);
      card.addEventListener('pointerleave', stop);
    } else if ('IntersectionObserver' in window) {
      // Touch screens have no hover, so previews play while a card is mostly in view.
      new IntersectionObserver(([e]) => (e.isIntersecting ? play() : stop()), { threshold: 0.7 }).observe(card);
    }
  });

  $$('[data-quest-link]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    openDialog('quest', QUESTS.indexOf(a.dataset.questLink));
  }));

  /* ---------------- Sketchbook ---------------- */
  const sketches = $$('.sketch');
  sketches.forEach((s, i) => s.addEventListener('click', () => openDialog('sketch', i)));

  /* ---------------- Party cards ---------------- */
  $$('.flip-btn').forEach(btn => {
    const flip = btn.previousElementSibling;
    const toggle = () => {
      const on = !flip.classList.contains('flipped');
      flip.classList.toggle('flipped', on);
      btn.setAttribute('aria-pressed', String(on));
      $('.flip-label', btn).textContent = on ? 'Show the class' : 'Show proof';
    };
    btn.addEventListener('click', toggle);
    flip.addEventListener('click', toggle);
  });

  /* ---------------- Dialog (scrolls, lightbox, mini-game, panels) ---------------- */
  const dlg = $('#dialog');
  const dlgBody = $('#dialog-body');
  const dlgNav = $('#dialog-nav');
  const dlgPos = $('#dialog-pos');
  let dialogMode = null;
  let dialogIndex = 0;

  function stopMedia() {
    $$('video', dlgBody).forEach(v => v.pause());
    if (window.HoldTheWall) window.HoldTheWall.stop();
  }

  function openDialog(mode, index = 0) {
    stopMedia();
    dialogMode = mode;
    dialogIndex = index;
    dlg.classList.toggle('is-lightbox', mode === 'sketch');
    dlgBody.innerHTML = '';

    if (mode === 'quest') {
      const id = QUESTS[index];
      dlgBody.append($(`#q-${id}`).content.cloneNode(true));
      markSeen(id);
      setNav(index, QUESTS.length, 'Scroll');
    } else if (mode === 'sketch') {
      const s = sketches[index];
      const img = document.createElement('img');
      img.src = s.dataset.full;
      img.alt = $('img', s).alt;
      const cap = document.createElement('p');
      cap.id = 'dialog-title';
      cap.textContent = s.dataset.caption;
      dlgBody.append(img, cap);
      setNav(index, sketches.length, 'Sketch');
      if (s.hasAttribute('data-donut')) unlock('donut');
    } else {
      dlgBody.append($(`#t-${mode}`).content.cloneNode(true));
      dlgNav.hidden = true;
      if (mode === 'achievements') {
        renderAchievements();
        $('#ach-reset').addEventListener('click', resetProgress);
      }
      if (mode === 'short') unlock('skimmer');
      if (mode === 'wall' && window.HoldTheWall) {
        window.HoldTheWall.mount(dlgBody, { onFinish: () => unlock('warden') });
      }
    }

    dlgBody.scrollTop = 0;
    if (!dlg.open) dlg.showModal();
  }

  function setNav(i, n, noun) {
    dlgNav.hidden = false;
    dlgPos.textContent = `${noun} ${i + 1} of ${n}`;
  }

  function step(dir) {
    const n = dialogMode === 'quest' ? QUESTS.length : sketches.length;
    openDialog(dialogMode, (dialogIndex + dir + n) % n);
  }

  $$('[data-step]', dlgNav).forEach(b => b.addEventListener('click', () => step(Number(b.dataset.step))));
  $('[data-close]', dlg).addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  // 'close' is dispatched asynchronously; if another dialog was opened meanwhile, leave it alone.
  dlg.addEventListener('close', () => {
    if (dlg.open) return;
    stopMedia();
    dialogMode = null;
    dlgBody.innerHTML = '';
  });
  dlg.addEventListener('keydown', e => {
    if ((dialogMode !== 'quest' && dialogMode !== 'sketch') || e.target.closest('video')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  });
  dlgBody.addEventListener('click', e => {
    const go = e.target.closest('[data-goto]');
    if (!go) return;
    dlg.close();
    $('#' + go.dataset.goto).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  $$('[data-open-short]').forEach(b => b.addEventListener('click', () => openDialog('short')));
  $('#wall-open').addEventListener('click', () => openDialog('wall'));
  achBtn.addEventListener('click', () => openDialog('achievements'));

  function resetProgress() {
    unlocked = new Set();
    seen.clear();
    store.set('ach', []);
    store.set('seen', []);
    store.set('wallBest', 0);
    renderSeen();
    renderAchCount(false);
    renderAchievements();
  }

  /* ---------------- Send a raven ---------------- */
  const ravenBtn = $('#raven-btn');
  const address = ['emil', 'kuli-zade.com'].join('@');
  ravenBtn.addEventListener('click', () => {
    const r = ravenBtn.getBoundingClientRect();
    if (!reduceMotion && Element.prototype.animate) {
      const bird = document.createElement('div');
      bird.className = 'flying-raven';
      bird.innerHTML = icon('raven');
      bird.style.left = `${r.left + 12}px`;
      bird.style.top = `${r.top + 4}px`;
      document.body.append(bird);
      const dx = innerWidth - r.left + 60, dy = -r.top - 80;
      bird.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.45}px, ${dy * 0.15 - 40}px) scale(1.15) rotate(-8deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(.6) rotate(-14deg)`, opacity: 0 },
      ], { duration: 1500, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = () => bird.remove();
    }
    $('#raven-addr').textContent = address;
    $('#raven-mail').href = `mailto:${address}`;
    ravenBtn.hidden = true;
    $('#raven-reveal').hidden = false;
    $('#raven-mail').focus();
    unlock('raven');
  });
  $('#raven-copy').addEventListener('click', e => {
    const label = $('span', e.currentTarget);
    const done = ok => {
      label.textContent = ok ? 'Copied!' : 'Press Ctrl+C';
      setTimeout(() => { label.textContent = 'Copy'; }, 1800);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(address).then(() => done(true), () => done(false));
    else done(false);
  });

  /* ---------------- Old magic ---------------- */
  const CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let codePos = 0;
  addEventListener('keydown', e => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    codePos = key === CODE[codePos] ? codePos + 1 : (key === CODE[0] ? 1 : 0);
    if (codePos === CODE.length) {
      codePos = 0;
      starfall();
      unlock('konami');
    }
  });

  function starfall() {
    if (reduceMotion) return;
    const box = document.createElement('div');
    box.className = 'starfall';
    for (let i = 0; i < 60; i++) {
      const s = document.createElement('i');
      s.style.left = `${Math.random() * 100}%`;
      s.style.setProperty('--t', `${2 + Math.random() * 2.5}s`);
      s.style.setProperty('--x', `${(Math.random() - 0.5) * 200}px`);
      s.style.animationDelay = `${Math.random() * 1.2}s`;
      s.style.width = s.style.height = `${8 + Math.random() * 12}px`;
      box.append(s);
    }
    document.body.append(box);
    setTimeout(() => box.remove(), 5000);
  }

  renderAchCount(false);
})();
