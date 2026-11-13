/* ============ ИГРОВАЯ ЗОНА: четыре мини-игры на реальных данных ============ */
window.SC = window.SC || {};

(function () {
  const GAMES = [
    { key: 'guessRating', num: 'игра 01', title: 'Угадай рейтинг', ico: '🎯',
      d: 'Посмотри на постер и название — и попробуй угадать рейтинг Кинопоиска. Чем точнее, тем больше очков.' },
    { key: 'battle', num: 'игра 02', title: 'Битва сериалов', ico: '⚔️',
      d: 'Два сериала на экране. Определи, какой выше в рейтинге или собрал больше оценок — по реальным данным.' },
    { key: 'who', num: 'игра 03', title: 'Угадай, кто это', ico: '🎭',
      d: 'Угадывай сериал по актёру и актёра по сериалу. Только реальные имена из датасета.' },
    { key: 'viewer', num: 'игра 04', title: 'Какой ты зритель?', ico: '🪞',
      d: 'Развлекательный тест о твоих привычках: в конце — тип зрителя и подборка сериалов под него.' }
  ];

  let active = null; // активная игровая сессия
  const gameArena = document.getElementById('gameArena');

  // клик по карточке игры в хабе
  document.addEventListener('click', function (e) {
    const card = e.target.closest('[data-play]');
    if (card && typeof SC.startGame === 'function') SC.startGame(card.dataset.play);
  });

  function hub() {
    active = null;
    document.getElementById('gameArena').innerHTML = '';
    document.getElementById('gamesHub').innerHTML = `
      <div class="games-hub">
        ${GAMES.map(g => {
          const st = SC.store.games[g.key];
          return `<article class="game-card" data-play="${g.key}" role="button" tabindex="0" aria-label="Играть: ${g.title}">
            <span class="gnum">${g.num}</span>
            <h3>${g.ico} ${g.title}</h3>
            <p>${g.d}</p>
            <span class="gbest">${st ? `сыграно: ${st.played} · лучший результат: ${st.best} очков · последний: ${st.lastScore}` : 'ещё не играли'}</span>
          </article>`;
        }).join('')}
      </div>`;
  }

  function arena(html) {
    document.getElementById('gameArena').innerHTML = `<div class="arena">${html}</div>`;
    document.getElementById('gameArena').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const roundPill = (r, n) => `<span class="stat-pill">раунд <b>${r}</b>/${n}</span>`;
  const scorePill = v => `<span class="stat-pill">очки <b>${v}</b></span>`;
  const streakPill = v => v > 1 ? `<span class="stat-pill">серия <b>🔥 ${v}</b></span>` : '';
  const quitBtn = `<button class="btn btn-ghost btn-sm" id="gQuit">Завершить</button>`;

  function finish(key, title, score, total, extra) {
    SC.logGame(key, title, score, extra);
    arena(`
      <div class="quiz-final">
        <p class="quiz-step-tag">${title} · игра завершена</p>
        <div class="score-big">${score}</div>
        <p>${total ? `из ${total} возможных очков. ` : ''}Результат сохранён в «Моём пространстве».</p>
        <div class="final-actions">
          <button class="btn btn-primary" id="gAgain">Сыграть ещё раз</button>
          <button class="btn btn-ghost" id="gHub">Ко всем играм</button>
        </div>
      </div>`);
    document.getElementById('gAgain').addEventListener('click', () => start(key));
    document.getElementById('gHub').addEventListener('click', () => { hub(); SC.updateNavScore(); });
  }

  /* ---------- Игра 1. УГАДАЙ РЕЙТИНГ ---------- */
  function startGuessRating() {
    const ROUNDS = 5;
    const rounds = SC.shuffle(SC.series.filter(s => s.rating != null)).slice(0, ROUNDS);
    let i = 0, score = 0;
    function render() {
      const s = rounds[i];
      arena(`
        <div class="arena-head"><h2>🎯 Угадай рейтинг</h2>
          <div class="arena-stats">${roundPill(i + 1, ROUNDS)}${scorePill(score)}${streakPill(streak)}${quitBtn}</div></div>
        <p class="game-round">Сериал: <b>${SC.esc(s.title)}</b>${s.years ? `, ${SC.esc(s.years)}` : ''}${s.genre ? `, ${SC.esc(s.genre)}` : ''}. Какой у него рейтинг Кинопоиска?</p>
        <div class="guess-flex">
          <div class="guess-poster"><img src="${SC.esc(SC.bigPoster(s.poster))}" alt="Постер: ${SC.esc(s.title)}" onerror="this.onerror=null;this.src='${SC.esc(s.poster || '')}'"></div>
          <div class="slider-wrap">
            <div class="slider-val" id="gVal">8,0</div>
            <input type="range" id="gSlider" min="6" max="9.5" step="0.1" value="8" aria-label="Ваш прогноз рейтинга">
            <div class="slider-scale"><span>6,0</span><span>7,0</span><span>8,0</span><span>9,0</span><span>9,5</span></div>
            <div class="answer-verb"><button class="btn btn-primary btn-lg" id="gAnswer">Ответить</button></div>
          </div>
        </div>
        <div id="gVerdict"></div>`);
      const sl = document.getElementById('gSlider');
      sl.addEventListener('input', () => {
        document.getElementById('gVal').textContent = (+sl.value).toFixed(1).replace('.', ',');
      });
      document.getElementById('gQuit').addEventListener('click', () => hub());
      document.getElementById('gAnswer').addEventListener('click', () => {
        const guess = +sl.value, diff = Math.abs(guess - s.rating);
        const pts = Math.max(0, Math.round(100 - diff * 40));
        if (diff <= 0.25) streak += 1; else streak = 0;
        score += pts;
        const good = diff <= 0.25, ok = diff <= 0.6;
        document.getElementById('gVerdict').innerHTML = `
          <div class="verdict ${good ? 'good' : ok ? '' : 'bad'}">
            <p><b>Настоящий рейтинг: ★ ${SC.ratingFmt(s.rating)}</b> · ваш ответ: ${guess.toFixed(1).replace('.', ',')} · разница: ${diff.toFixed(1).replace('.', ',')}</p>
            <p>${good ? 'Почти в точку! +' : ok ? 'Неплохо! +' : 'Мимо. +'}${pts} очков</p>
            <a href="${SC.esc(s.link)}" target="_blank" rel="noopener" style="font-size:13px">Проверить на источнике ↗</a>
          </div>`;
        document.getElementById('gAnswer').disabled = true;
        setTimeout(() => { i++; if (i < ROUNDS) render(); else finish('guessRating', 'Угадай рейтинг', score, ROUNDS * 100, `серия: ${streak}`); }, 2200);
      });
    }
    let streak = 0;
    render();
  }

  /* ---------- Игра 2. БИТВА СЕРИАЛОВ ---------- */
  function startBattle() {
    const ROUNDS = 7;
    let i = 0, score = 0, streak = 0;
    const QTYPES = [
      { k: 'rating', q: 'Какой сериал имеет более высокий рейтинг Кинопоиска?' },
      { k: 'votes', q: 'Какой сериал собрал больше оценок?' }
    ];
    function render() {
      const q = SC.rand(QTYPES);
      let a = SC.rand(SC.series), b = SC.rand(SC.series);
      while (b.id === a.id || (a[q.k] == null || b[q.k] == null)) { a = SC.rand(SC.series); b = SC.rand(SC.series); }
      arena(`
        <div class="arena-head"><h2>⚔️ Битва сериалов</h2>
          <div class="arena-stats">${roundPill(i + 1, ROUNDS)}${scorePill(score)}${streakPill(streak)}${quitBtn}</div></div>
        <p class="game-round">${q.q}</p>
        <div class="battle-flex">
          <button class="battle-card" data-side="a"><div class="battle-poster"><img src="${SC.esc(SC.bigPoster(a.poster))}" alt="" onerror="this.onerror=null;this.src='${SC.esc(a.poster || '')}'"></div><h4>${SC.esc(a.title)}</h4><span class="scard-meta">${SC.esc([SC.yearLabel(a), a.genre].filter(Boolean).join(' · '))}</span></button>
          <div class="battle-vs">VS</div>
          <button class="battle-card" data-side="b"><div class="battle-poster"><img src="${SC.esc(SC.bigPoster(b.poster))}" alt="" onerror="this.onerror=null;this.src='${SC.esc(b.poster || '')}'"></div><h4>${SC.esc(b.title)}</h4><span class="scard-meta">${SC.esc([SC.yearLabel(b), b.genre].filter(Boolean).join(' · '))}</span></button>
        </div>
        <div id="gVerdict"></div>`);

      document.getElementById('gQuit').addEventListener('click', () => hub());
      gameArena.querySelectorAll('.battle-card').forEach(btn => btn.addEventListener('click', () => {
        const val = s => q.k === 'rating' ? s.rating : s.votes;
        const right = val(a) >= val(b) ? 'a' : 'b';
        const win = btn.dataset.side === right;
        const pts = win ? 100 + Math.min(100, (streak) * 20) : 0;
        if (win) { streak += 1; score += pts; } else streak = 0;
        const fmt = s => q.k === 'rating' ? `★ ${SC.ratingFmt(s.rating)}` : SC.votesFmt(s.votes) + ' оценок';
        const wa = right === 'a' ? a : b, wb = right === 'a' ? b : a;
        gameArena.querySelectorAll('.battle-card').forEach(x => {
          x.disabled = true;
          x.classList.add(x.dataset.side === right ? 'winner' : 'loser');
        });
        document.getElementById('gVerdict').innerHTML = `
          <div class="verdict ${win ? 'good' : 'bad'}">
            <p>${win ? `Верно! +${pts} очков${streak > 1 ? ` (серия 🔥 ${streak}, бонус +${Math.min(100, (streak - 1) * 20)})` : ''}` : 'Мимо. 0 очков'}</p>
            <p><b>${SC.esc(wa.title)}</b>: ${fmt(wa)} против <b>${SC.esc(wb.title)}</b>: ${fmt(wb)} — реальные показатели Кинопоиска из датасета.</p>
            <p style="font-size:13px;color:var(--pale)">«Лучший сериал» — дело вкуса, поэтому в игре сравниваются только объективные показатели.</p>
          </div>`;
        setTimeout(() => { i++; if (i < ROUNDS) render(); else finish('battle', 'Битва сериалов', score, ROUNDS * 200, `лучшая серия: ${streak}`); }, 2600);
      }));
    }
    render();
  }

  /* ---------- Игра 3. УГАДАЙ, КТО ЭТО ---------- */
  function startWho() {
    const ROUNDS = 8;
    let i = 0, score = 0, streak = 0;
    // раунды только по сериалам, у которых есть реальные актёры
    const pool = SC.shuffle(SC.series.filter(s => s.actors && s.actors.length)).slice(0, ROUNDS);
    function render() {
      const s = pool[i];
      const mode = i % 2 === 0 ? 'actor2series' : 'series2actor';
      let question, correct, options;
      if (mode === 'actor2series') {
        correct = s.title;
        const others = SC.shuffle(SC.series.filter(x => x.id !== s.id)).slice(0, 3).map(x => x.title);
        options = SC.shuffle([correct, ...others]);
        question = `В каком сериале из базы снимается <b>${SC.esc(SC.rand(s.actors))}</b>?`;
      } else {
        correct = SC.rand(s.actors);
        const others = SC.shuffle(SC.actorsList.filter(n => !s.actors.includes(n))).slice(0, 3);
        options = SC.shuffle([correct, ...others]);
        question = `Кто из этих актёров играет в сериале <b>${SC.esc(s.title)}</b>?`;
      }
      arena(`
        <div class="arena-head"><h2>🎭 Угадай, кто это</h2>
          <div class="arena-stats">${roundPill(i + 1, ROUNDS)}${scorePill(score)}${streakPill(streak)}${quitBtn}</div></div>
        <p class="game-round">${question}</p>
        <div class="opt-answers">
          ${options.map(o => `<button class="quiz-opt" data-opt="${SC.esc(o)}"><span class="dot"></span><span>${SC.esc(o)}</span></button>`).join('')}
        </div>
        <div id="gVerdict"></div>`);
      document.getElementById('gQuit').addEventListener('click', () => hub());
      gameArena.querySelectorAll('[data-opt]').forEach(btn => btn.addEventListener('click', () => {
        const win = btn.dataset.opt === correct;
        const pts = win ? 100 + Math.min(100, (streak) * 20) : 0;
        if (win) { streak += 1; score += pts; } else streak = 0;
        gameArena.querySelectorAll('[data-opt]').forEach(x => {
          x.disabled = true;
          if (x.dataset.opt === correct) x.classList.add('selected');
        });
        document.getElementById('gVerdict').innerHTML = `
          <div class="verdict ${win ? 'good' : 'bad'}">
            <p>${win ? `Верно! +${pts} очков${streak > 1 ? ` (серия 🔥 ${streak})` : ''}` : `Правильный ответ: <b>${SC.esc(correct)}</b> — 0 очков`}</p>
            <p style="font-size:13px">«${SC.esc(s.title)}» (${SC.esc(SC.yearLabel(s))}): в ролях — ${SC.esc(s.actors.join(', '))}. Данные из датасета.</p>
          </div>`;
        setTimeout(() => { i++; if (i < ROUNDS) render(); else finish('who', 'Угадай, кто это', score, ROUNDS * 200, `серия: ${streak}`); }, 2200);
      }));
    }
    render();
  }

  /* ---------- Игра 4. КАКОЙ ТЫ ЗРИТЕЛЬ? ---------- */
  // Типы зрителей — оригинальная развлекательная классификация проекта (не психологическая диагностика).
  // Каждому типу сопоставлены реальные жанры датасета.
  const VIEWS_TYPES = [
    { k: 'analyst', ico: '🕵️', t: 'Аналитик сюжета',
      d: 'Тебе нравится распутывать: версии, улики, сложные конструкции. Твой элемент — детективы, триллеры и криминальные истории, где каждое зерно на своём месте.',
      genres: ['детектив', 'триллер', 'криминал'] },
    { k: 'diver', ico: '🌊', t: 'Глубокий ныряльщик',
      d: 'Ты смотришь сериал ради людей и их судеб. Эмоции, отношения, драматургия характеров — твоя территория.',
      genres: ['драма'] },
    { k: 'pioneer', ico: '🚀', t: 'Первопроходец',
      d: 'Новые миры и большие идеи притягивают тебя сильнее всего. Фантастика и фэнтези — твой компас.',
      genres: ['фантастика', 'фэнтези'] },
    { k: 'optimist', ico: '🌤️', t: 'Оптимист-зритель',
      d: 'Телевизор для тебя — источник хорошего настроения. Комедии и лёгкие истории, после которых тепло на душе.',
      genres: ['комедия', 'мультфильм'] },
    { k: 'rebel', ico: '🌀', t: 'Бунтарь формата',
      d: 'Стандартные истории — не про тебя. Нестандартные идеи, неожиданные повороты, дерзкий визуальный язык.',
      genres: ['ужасы', 'фантастика', 'мультфильм', 'триллер'] }
  ];
  const VIEWER_QS = [
    { q: 'Что тебя больше всего цепляет в сериале?', o: [
      { t: 'Сложная логика и загадки', p: { analyst: 2, rebel: 1 } },
      { t: 'Персонажи и их отношения', p: { diver: 2, optimist: 1 } },
      { t: 'Новые миры и масштаб идей', p: { pioneer: 2, rebel: 1 } },
      { t: 'Возможность расслабиться и посмеяться', p: { optimist: 2, diver: 1 } }] },
    { q: 'Как ты относишься к всемирно известным хитам?', o: [
      { t: 'Смотрю всё, что все обсуждают', p: { optimist: 2, diver: 1 } },
      { t: 'Выбираю по рейтингу и отзывам', p: { analyst: 2, diver: 1 } },
      { t: 'Специально ищу недооценённое', p: { rebel: 2, pioneer: 1 } },
      { t: 'Главное — чтобы было интересно', p: { pioneer: 2, optimist: 1 } }] },
    { q: 'Знакомая история или что-то необычное?', o: [
      { t: 'Люблю проверенное и знакомое', p: { diver: 2, analyst: 1 } },
      { t: 'Хочу неожиданные повороты', p: { rebel: 2, pioneer: 1 } },
      { t: 'Зависит от настроения', p: { optimist: 2, pioneer: 1 } },
      { t: 'Чем страннее, тем лучше', p: { rebel: 2, analyst: 1 } }] },
    { q: 'Насколько тебе важен рейтинг при выборе?', o: [
      { t: 'Очень важен — не трачу время на слабое', p: { analyst: 2, diver: 1 } },
      { t: 'Ориентируюсь, но не фанатично', p: { diver: 2, optimist: 1 } },
      { t: 'Готов пробовать малоизвестное', p: { pioneer: 2, rebel: 1 } },
      { t: 'Совсем не смотрю на оценки', p: { rebel: 2, optimist: 1 } }] },
    { q: 'Готов ли ты пробовать новые жанры?', o: [
      { t: 'Всегда — тем и интересен сериальный мир', p: { pioneer: 2, rebel: 1 } },
      { t: 'Иногда, если рекомендуют', p: { optimist: 2, diver: 1 } },
      { t: 'Держусь любимых жанров', p: { analyst: 2, diver: 1 } },
      { t: 'Только если это реально странно', p: { rebel: 2, pioneer: 1 } }] },
    { q: 'Как ты обычно смотришь сериалы?', o: [
      { t: 'Загадками: анализирую каждую сцену', p: { analyst: 2, rebel: 1 } },
      { t: 'Проживаю эмоционально, растягиваю удовольствие', p: { diver: 2, optimist: 1 } },
      { t: 'Запоем, пока не открою весь мир', p: { pioneer: 2, analyst: 1 } },
      { t: 'Легко и без обязательств', p: { optimist: 2, rebel: 1 } }] }
  ];

  function startViewer() {
    let i = 0;
    const pts = {};
    VIEWS_TYPES.forEach(t => pts[t.k] = 0);
    function render() {
      const q = VIEWER_QS[i];
      arena(`
        <div class="arena-head"><h2>🪞 Какой ты зритель?</h2>
          <div class="arena-stats">${roundPill(i + 1, VIEWER_QS.length)}${quitBtn}</div></div>
        <p class="game-round">${q.q}</p>
        <div class="opt-answers">
          ${q.o.map((o, j) => `<button class="quiz-opt" data-j="${j}"><span class="dot"></span><span>${o.t}</span></button>`).join('')}
        </div>
        <p class="quiz-hint">Развлекательный тест проекта, не психологическая диагностика.</p>`);
      document.getElementById('gQuit').addEventListener('click', () => hub());
      gameArena.querySelectorAll('[data-j]').forEach(btn => btn.addEventListener('click', () => {
        const o = VIEWER_QS[i].o[+btn.dataset.j];
        Object.entries(o.p).forEach(([k, v]) => pts[k] += v);
        i++;
        if (i < VIEWER_QS.length) render(); else result();
      }));
    }
    function result() {
      const best = [...VIEWS_TYPES].sort((a, b) => pts[b.k] - pts[a.k])[0];
      const picks = SC.series.filter(s => best.genres.includes(s.genre))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
      SC.store.quizResults.unshift({ t: Date.now(), type: best.t, key: best.k });
      if (SC.store.quizResults.length > 20) SC.store.quizResults.length = 20;
      SC.logGame('viewer', 'Какой ты зритель', 0, `тип: ${best.t}`); // тест развлекательный, без очков
      arena(`
        <div class="quiz-final">
          <p class="quiz-step-tag">результат теста</p>
          <div class="viewer-type">
            <div class="vt-ico">${best.ico}</div>
            <h3>${best.t}</h3>
            <p>${best.d}</p>
          </div>
          ${picks.length ? `<p style="color:var(--pale);margin-bottom:14px">Сериалы этого направления из базы (рейтинг ★ ${SC.ratingFmt(picks[picks.length - 1].rating)}–${SC.ratingFmt(picks[0].rating)}):</p>
          <div class="card-grid" style="margin-bottom:20px">${picks.map(SC.card).join('')}</div>` : ''}
          <div class="final-actions">
            <button class="btn btn-primary" id="gAgain">Пройти ещё раз</button>
            <button class="btn btn-ghost" id="gHub">Ко всем играм</button>
          </div>
        </div>`);
      document.getElementById('gAgain').addEventListener('click', () => start('viewer'));
      document.getElementById('gHub').addEventListener('click', () => hub());
    }
    render();
  }

  const STARTERS = { guessRating: startGuessRating, battle: startBattle, who: startWho, viewer: startViewer };
  function start(key) {
    active = key;
    const g = GAMES.find(x => x.key === key);
    document.getElementById('gamesHub').innerHTML = '';
    arena(`
      <div class="arena-head"><h2>${g.ico} ${g.title}</h2>${quitBtn}</div>
      <p class="game-round">${g.d}</p>
      <div class="answer-verb" style="margin:18px 0 6px"><button class="btn btn-primary btn-lg" id="gGo">Начать игру</button></div>
      ${g.key === 'viewer' ? '<p class="quiz-hint" style="text-align:center">Развлекательный тест, не научная диагностика. В конце — тип зрителя и сериалы из базы.</p>' : ''}`);
    document.getElementById('gQuit').addEventListener('click', () => hub());
    document.getElementById('gGo').addEventListener('click', () => STARTERS[key]());
  }

  SC.views.games = function () {
    if (!active) hub();
  };
  SC.startGame = start;
  SC._gamesHub = hub;
  SC._gameArena = arena;
})();
