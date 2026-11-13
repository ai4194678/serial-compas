/* ============ ПОДБОР: пошаговый тест + рекомендации + фильтры ============ */
window.SC = window.SC || {};

(function () {
  let answers = { mood: null, genres: [], ratingPref: null, actor: null };
  let step = -1; // -1 — стартовый экран

  const STEPS = 4;
  const RATING_PREFS = [
    { k: 'higher', t: 'Чем выше, тем лучше', d: 'Покажи лучшее из лучшего по рейтингу Кинопоиска' },
    { k: 'balance', t: 'Важен баланс рейтинга и популярности', d: 'Хороший рейтинг и подтверждённый зрительский интерес' },
    { k: 'lesser', t: 'Готов открыть менее известный сериал', d: 'Меньше оценок — не значит хуже' },
    { k: 'any', t: 'Рейтинг не имеет значения', d: 'Главное — история' }
  ];

  function progress() {
    const done = [];
    for (let i = 0; i < STEPS; i++) done.push(i <= step ? 'done' : '');
    return `<div class="quiz-progress" aria-hidden="true">${done.map(c => `<span class="${c}"></span>`).join('')}</div>`;
  }

  function renderStart() {
    const a = document.getElementById('quizArea');
    a.innerHTML = `
      <div class="quiz-shell">
        ${progress()}
        <div class="quiz-card" style="text-align:center">
          <p class="quiz-step-tag">этапы подбора</p>
          <h2>Твоя следующая история ждёт</h2>
          <p style="color:var(--pale);max-width:520px;margin:0 auto 8px">Четыре коротких вопроса: настроение, жанр, отношение к рейтингу и любимый актёр. Система рекомендаций на основе заданных критериев сопоставит ответы с реальными данными базы — без случайных подстановок.</p>
          <p class="mood-mapping" style="text-align:left;max-width:520px;margin:14px auto 22px">В датасете нет поля «настроение», поэтому проект использует открытую систему соответствия: каждому настроению сопоставлены жанры из исходных данных (например, «Загадки и напряжение» → триллер, детектив, криминал, ужасы).</p>
          <button class="btn btn-primary btn-lg" id="quizStart">Начать подбор</button>
        </div>
      </div>`;
    a.querySelector('#quizStart').addEventListener('click', () => { step = 0; renderStep(); });
  }

  function renderStep() {
    const a = document.getElementById('quizArea');
    SC.applyMoodTheme(answers.mood || '');
    if (step === 0) {
      a.innerHTML = `
        <div class="quiz-shell">${progress()}
        <div class="quiz-card">
          <p class="quiz-step-tag">этап 1 из 4 · настроение</p>
          <h2>Какую историю тебе хочется посмотреть сегодня?</h2>
          <div class="quiz-options">
            ${Object.entries(SC.MOODS).map(([k, m]) => `
              <button class="quiz-opt ${answers.mood === k ? 'selected' : ''}" data-mood="${k}">
                <span class="dot"></span><span><b>${m.icon} ${m.label}</b><br><small style="color:var(--muted)">жанры в базе: ${m.note}</small></span>
              </button>`).join('')}
          </div>
          <p class="quiz-hint">Выбор настроения меняет цветовое состояние интерфейса.</p>
          <div class="quiz-nav"><span></span><button class="btn btn-primary" id="next" disabled>Дальше →</button></div>
        </div></div>`;
      a.querySelectorAll('[data-mood]').forEach(b => b.addEventListener('click', () => {
        answers.mood = b.dataset.mood;
        SC.applyMoodTheme(answers.mood);
        a.querySelectorAll('[data-mood]').forEach(x => x.classList.toggle('selected', x === b));
        a.querySelector('#next').disabled = false;
      }));
      a.querySelector('#next').addEventListener('click', () => { step = 1; renderStep(); });

    } else if (step === 1) {
      a.innerHTML = `
        <div class="quiz-shell">${progress()}
        <div class="quiz-card">
          <p class="quiz-step-tag">этап 2 из 4 · жанр</p>
          <h2>Какой жанр или тип истории тебе ближе?</h2>
          <p class="quiz-hint" style="margin:0 0 16px">Это все жанры, реально присутствующие в датасете. Можно выбрать несколько.</p>
          <div class="quiz-genre-wrap">
            ${SC.genres.map(g => `<button class="chip ${answers.genres.includes(g) ? 'selected' : ''}" data-genre="${g}">${g} · ${SC.series.filter(s => s.genre === g).length}</button>`).join('')}
          </div>
          <div class="quiz-nav"><button class="btn btn-ghost" id="back">← Назад</button><button class="btn btn-primary" id="next">Дальше →</button></div>
        </div></div>`;
      a.querySelectorAll('[data-genre]').forEach(b => b.addEventListener('click', () => {
        const g = b.dataset.genre;
        const i = answers.genres.indexOf(g);
        if (i >= 0) answers.genres.splice(i, 1); else answers.genres.push(g);
        b.classList.toggle('selected', i < 0);
      }));
      a.querySelector('#back').addEventListener('click', () => { step = 0; renderStep(); });
      a.querySelector('#next').addEventListener('click', () => { step = 2; renderStep(); });

    } else if (step === 2) {
      a.innerHTML = `
        <div class="quiz-shell">${progress()}
        <div class="quiz-card">
          <p class="quiz-step-tag">этап 3 из 4 · рейтинг</p>
          <h2>Насколько для тебя важен высокий рейтинг?</h2>
          <div class="quiz-options">
            ${RATING_PREFS.map(p => `
              <button class="quiz-opt ${answers.ratingPref === p.k ? 'selected' : ''}" data-pref="${p.k}">
                <span class="dot"></span><span><b>${p.t}</b><br><small style="color:var(--muted)">${p.d}</small></span>
              </button>`).join('')}
          </div>
          <div class="quiz-nav"><button class="btn btn-ghost" id="back">← Назад</button><button class="btn btn-primary" id="next" disabled>Дальше →</button></div>
        </div></div>`;
      a.querySelectorAll('[data-pref]').forEach(b => b.addEventListener('click', () => {
        answers.ratingPref = b.dataset.pref;
        a.querySelectorAll('[data-pref]').forEach(x => x.classList.toggle('selected', x === b));
        a.querySelector('#next').disabled = false;
      }));
      a.querySelector('#back').addEventListener('click', () => { step = 1; renderStep(); });
      a.querySelector('#next').addEventListener('click', () => { step = 3; renderStep(); });

    } else if (step === 3) {
      a.innerHTML = `
        <div class="quiz-shell">${progress()}
        <div class="quiz-card">
          <p class="quiz-step-tag">этап 4 из 4 · актёр · необязательно</p>
          <h2>Есть актёр, которого тебе особенно нравится смотреть?</h2>
          <p class="quiz-hint" style="margin:0 0 14px">Имена из датасета. Можно пропустить — ${SC.actorsList.length} актёров в базе.</p>
          <select id="actorSelect" style="width:100%;background:rgba(11,16,32,.6);border:1px solid rgba(169,185,216,.2);color:var(--text);border-radius:12px;padding:12px;font-size:15px">
            <option value="">— Пропустить этот вопрос —</option>
            ${SC.actorsList.map(n => `<option value="${SC.esc(n)}" ${answers.actor === n ? 'selected' : ''}>${SC.esc(n)}</option>`).join('')}
          </select>
          <div class="quiz-nav"><button class="btn btn-ghost" id="back">← Назад</button><button class="btn btn-primary btn-lg" id="show">Показать подбор →</button></div>
        </div></div>`;
      a.querySelector('#actorSelect').addEventListener('change', e => { answers.actor = e.target.value || null; });
      a.querySelector('#back').addEventListener('click', () => { step = 2; renderStep(); });
      a.querySelector('#show').addEventListener('click', showResults);
    }
    a.querySelector('.quiz-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showResults() {
    const a = document.getElementById('quizArea');
    if (!SC.compass) SC.initCompasses();
    if (SC.compass) SC.compass.burst();
    SC.applyMoodTheme(answers.mood || '');

    const recs = SC.recommend(answers);
    // история рекомендаций в личном пространстве
    SC.store.history.unshift({
      t: Date.now(), mood: answers.mood,
      genres: [...answers.genres], ratingPref: answers.ratingPref, actor: answers.actor,
      ids: recs.map(r => r.s.id)
    });
    if (SC.store.history.length > 30) SC.store.history.length = 30;
    SC.save();

    const moodLabel = answers.mood ? SC.MOODS[answers.mood].label : 'не указано';
    const prefLabel = (RATING_PREFS.find(p => p.k === answers.ratingPref) || {}).t || 'не указано';
    a.innerHTML = `
      <div class="quiz-shell">
        <div class="result-head">
          <p class="quiz-step-tag">подбор завершён</p>
          <h2>Твои рекомендации</h2>
          <p>Настроение: ${SC.esc(moodLabel)} · жанр${answers.genres.length > 1 ? 'ы' : ''}: ${answers.genres.length ? SC.esc(answers.genres.join(', ')) : 'любой'} · рейтинг: ${SC.esc(prefLabel)}${answers.actor ? ` · актёр: ${SC.esc(answers.actor)}` : ''}</p>
        </div>
        ${recs.length ? `<div class="result-grid">${recs.map((r, i) => SC.recCard(r.s, r.tag, r.why, i * 260)).join('')}</div>`
          : `<p class="empty-note">Под ваши ответы, к сожалению, не нашлось достаточно совпадений в базе — мы не подставляем случайные результаты. Попробуйте выбрать меньше жанров или изменить предпочтения рейтинга.</p>`}
        <div class="final-actions">
          <button class="btn btn-primary" id="quizRetry">Пройти тест повторно</button>
          <button class="btn btn-ghost" id="toFilters">Классические фильтры ↓</button>
        </div>
      </div>`;

    document.getElementById('filtersBlock').hidden = false;
    renderFilters();
    a.scrollIntoView({ behavior: 'smooth', block: 'start' });
    a.querySelector('#quizRetry').addEventListener('click', () => {
      answers = { mood: null, genres: [], ratingPref: null, actor: null };
      step = 0; renderStep();
    });
    a.querySelector('#toFilters').addEventListener('click', () =>
      document.getElementById('filtersBlock').scrollIntoView({ behavior: 'smooth' }));
  }

  /* ---------- Классические фильтры ---------- */
  function renderFilters() {
    const p = document.getElementById('filtersPanel');
    p.innerHTML = `
      <label>Жанр<select id="fGenre"><option value="">любой</option>${SC.genres.map(g => `<option>${g}</option>`).join('')}</select></label>
      ${SC.hasCountry ? `<label>Страна<select id="fCountry"><option value="">любая</option>${SC.countries.map(c => `<option>${SC.esc(c)}</option>`).join('')}</select></label>` : ''}
      ${SC.hasActors ? `<label>Актёр<select id="fActor"><option value="">любой</option>${SC.actorsList.map(n => `<option>${SC.esc(n)}</option>`).join('')}</select></label>` : ''}
      <label>Рейтинг от<select id="fRating"><option value="">любой</option><option>7.5</option><option>8.0</option><option>8.5</option><option>8.8</option></select></label>
      <label>Год от<input id="fYearFrom" type="number" min="${SC.yearMin}" max="${SC.yearMax}" placeholder="${SC.yearMin}"></label>
      <label>Год до<input id="fYearTo" type="number" min="${SC.yearMin}" max="${SC.yearMax}" placeholder="${SC.yearMax}"></label>
      <div class="filters-actions">
        <button class="btn btn-primary" id="fRandom">🎲 Случайный сериал</button>
        <button class="btn btn-ghost" id="fReset">Сбросить</button>
      </div>`;

    const get = id => p.querySelector(id);
    function run() {
      const f = {
        genre: get('#fGenre').value, country: get('#fCountry') ? get('#fCountry').value : '',
        actor: get('#fActor') ? get('#fActor').value : '',
        minRating: get('#fRating').value ? parseFloat(get('#fRating').value) : null,
        yearFrom: get('#fYearFrom').value ? +get('#fYearFrom').value : null,
        yearTo: get('#fYearTo').value ? +get('#fYearTo').value : null
      };
      const res = SC.applyFilters(f);
      document.getElementById('filtersResults').innerHTML = res.map(SC.card).join('');
      document.getElementById('filtersEmpty').hidden = res.length > 0;
    }
    ['#fGenre', '#fCountry', '#fActor', '#fRating', '#fYearFrom', '#fYearTo'].forEach(id =>
      get(id).addEventListener('input', run));
    get('#fRandom').addEventListener('click', () => {
      const f = {
        genre: get('#fGenre').value, country: get('#fCountry') ? get('#fCountry').value : '',
        actor: get('#fActor') ? get('#fActor').value : '',
        minRating: get('#fRating').value ? parseFloat(get('#fRating').value) : null,
        yearFrom: get('#fYearFrom').value ? +get('#fYearFrom').value : null,
        yearTo: get('#fYearTo').value ? +get('#fYearTo').value : null
      };
      const res = SC.applyFilters(f);
      const s = res.length ? SC.rand(res) : SC.rand(SC.series);
      SC.openModal(`<p class="quiz-step-tag">случайный сериал</p>${SC.bigCard(s)}`);
    });
    get('#fReset').addEventListener('click', () => {
      p.querySelectorAll('select').forEach(s => s.value = '');
      p.querySelectorAll('input').forEach(i => i.value = '');
      run();
    });
    run();
  }

  SC.views.podborka = function () {
    if (step === -1) renderStart();
    document.getElementById('filtersBlock').hidden = false;
    if (!document.getElementById('filtersPanel').hasChildNodes()) renderFilters();
  };
  SC.resetQuiz = function () { renderStart(); };
})();
