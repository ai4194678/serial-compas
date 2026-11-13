/* ============ МОЁ ПРОСТРАНСТВО: личная коллекция (localStorage) ============ */
window.SC = window.SC || {};

(function () {
  const TABS = [
    { k: 'fav', t: 'Избранное' },
    { k: 'watch', t: 'Хочу посмотреть' },
    { k: 'history', t: 'История рекомендаций' },
    { k: 'quiz', t: 'Результаты тестов' },
    { k: 'stats', t: 'Игровая статистика' }
  ];
  let current = 'fav';

  const empty = (ico, title, text, btnHtml) => `
    <div class="empty-state">
      <div class="big">${ico}</div>
      <h3>${title}</h3>
      <p>${text}</p>
      ${btnHtml || '<button class="btn btn-primary" data-nav="podborka">Найти мой сериал</button>'}
    </div>`;

  function statsSummary() {
    const st = SC.store;
    return `<div class="space-stats">
      <div class="space-stat"><dt>Сыграно игр</dt><dd>${st.totalGames}</dd></div>
      <div class="space-stat"><dt>Всего очков</dt><dd>${st.totalScore}</dd></div>
      <div class="space-stat"><dt>В избранном</dt><dd>${st.favorites.length}</dd></div>
      <div class="space-stat"><dt>Хочу посмотреть</dt><dd>${st.watchlist.length}</dd></div>
    </div>`;
  }

  function likedGenresChart() {
    const entries = Object.entries(SC.store.likedGenres).sort((a, b) => b[1] - a[1]);
    if (!entries.length) return '';
    const max = entries[0][1];
    return `<div class="block-head" style="margin-top:26px"><h3 style="font-size:18px">Любимые жанры</h3><p>Считается автоматически из сериалов, которые ты добавил в списки</p></div>
      <div class="chart-card">${entries.map(([g, n]) => `
        <div class="bar-row"><span>${SC.esc(g)}</span>
        <div class="bar-track"><div class="bar-fill" data-w="${(n / max * 100).toFixed(1)}"></div></div>
        <span class="bar-val">${n}</span></div>`).join('')}</div>`;
  }

  function render() {
    const area = document.getElementById('spaceArea');
    const st = SC.store;

    let panel = '';
    if (current === 'fav' || current === 'watch') {
      const ids = current === 'fav' ? st.favorites : st.watchlist;
      const list = ids.map(SC.byId).filter(Boolean);
      const isFav = current === 'fav';
      panel = list.length
        ? `<div class="list-head"><h3>${isFav ? '♥ Избранные сериалы' : '📌 Хочу посмотреть'}</h3><span>${list.length} сериал(ов) · хранится в этом браузере</span></div>
           <div class="card-grid">${list.map(SC.card).join('')}</div>` + likedGenresChart()
        : empty(isFav ? '♡' : '🪐',
            isFav ? 'В избранном пока пусто' : 'Список «хочу посмотреть» пока пуст',
            isFav ? 'Отмечай сериалы кнопкой «♡ В избранное» на любой карточке — они соберутся здесь.' : 'Добавляй сериалы кнопкой «+ Хочу посмотреть», чтобы вернуться к ним позже.');

    } else if (current === 'history') {
      panel = st.history.length
        ? `<div class="list-head"><h3>История полученных рекомендаций</h3><span>последние ${st.history.length} подборов</span></div>
           ${st.history.map(h => {
             const moodLabel = h.mood ? SC.MOODS[h.mood].label : 'настроение не указано';
             const ser = h.ids.map(SC.byId).filter(Boolean);
             return `<div class="history-item">
               <p class="h-date">${SC.fmtDate(h.t)}</p>
               <p class="h-mood">${SC.MOODS[h.mood] ? SC.MOODS[h.mood].icon : ''} ${SC.esc(moodLabel)}${h.genres.length ? ' · жанры: ' + SC.esc(h.genres.join(', ')) : ''}${h.actor ? ' · актёр: ' + SC.esc(h.actor) : ''}</p>
               <div class="card-grid" style="margin-top:10px">${ser.map(SC.card).join('') || '<span class="scard-meta">рекомендации не найдены</span>'}</div>
             </div>`;
           }).join('')}`
        : empty('🧭', 'Рекомендаций пока не было', 'Пройди подбор — каждая выдача сохранится здесь, чтобы ты мог вернуться к ней.');

    } else if (current === 'quiz') {
      panel = st.quizResults.length
        ? `<div class="list-head"><h3>Твои типы зрителя</h3><span>${st.quizResults.length} прохождений</span></div>
           ${st.quizResults.map(r => {
             const t = { 'Аналитик сюжета': '🕵️', 'Глубокий ныряльщик': '🌊', 'Первопроходец': '🚀', 'Оптимист-зритель': '🌤️', 'Бунтарь формата': '🌀' }[r.type] || '🪞';
             return `<div class="history-item"><p class="h-date">${SC.fmtDate(r.t)}</p><p style="font-size:16px"><b>${t} ${SC.esc(r.type)}</b></p></div>`;
           }).join('')}`
        : empty('🪞', 'Тест «Какой ты зритель?» ещё не пройден', 'Это развлекательный тест о твоих привычках просмотра. Результат сохранится здесь.', '<button class="btn btn-primary" data-play-viewer>Пройти тест</button>');

    } else if (current === 'stats') {
      const g = st.games;
      const rows = [
        ['🎯 Угадай рейтинг', g.guessRating],
        ['⚔️ Битва сериалов', g.battle],
        ['🎭 Угадай, кто это', g.who],
        ['🪞 Какой ты зритель', g.viewer]
      ];
      panel = statsSummary() + `
        <div class="chart-card">
          <div class="game-log-row"><span>игра</span><span>сыграно · лучший · последний результат</span></div>
          ${rows.map(([n, d]) => `<div class="game-log-row"><b>${n}</b><span>${d ? `${d.played} · ${d.best} · ${d.lastScore}` : 'не играли'}</span></div>`).join('')}
        </div>
        <div class="block-head" style="margin-top:24px"><h3 style="font-size:18px">Журнал игр</h3><p>Последние завершённые игры</p></div>
        ${st.gameLog.length ? `<div class="chart-card">${st.gameLog.map(l => `
          <div class="game-log-row"><b>${SC.esc(l.game)}</b><span>${l.score} очков · ${SC.fmtDate(l.t)}${l.extra ? ' · ' + SC.esc(l.extra) : ''}</span></div>`).join('')}</div>`
          : '<p class="empty-note" style="padding:18px">Ещё ни одной завершённой игры.</p>'}
        <div style="margin-top:22px"><button class="btn btn-ghost" id="wipeAll">Очистить все мои данные</button></div>`;
    }

    area.innerHTML = `<div class="space-panel">${statsSummary()}<div class="space-tabs" id="spaceTabsInner"></div>${panel}</div>`;
    const tabsInner = document.getElementById('spaceTabsInner');
    tabsInner.innerHTML = TABS.map(t =>
      `<button data-stab2="${t.k}" class="chip ${t.k === current ? 'selected' : ''}">${t.t}</button>`).join('');
    tabsInner.querySelectorAll('[data-stab2]').forEach(b => b.addEventListener('click', () => {
      current = b.dataset.stab2; render();
    }));
    area.querySelectorAll('[data-nav]').forEach(b => b.addEventListener('click', e => {
      e.preventDefault(); SC.showView(b.dataset.nav);
    }));
    const pv = area.querySelector('[data-play-viewer]');
    if (pv) pv.addEventListener('click', () => {
      SC.showView('games');
      setTimeout(() => SC.startGame('viewer'), 30);
    });
    const wipe = area.querySelector('#wipeAll');
    if (wipe) wipe.addEventListener('click', () => {
      if (confirm('Удалить все сохранённые данные (избранное, списки, историю и игровые результаты)?')) {
        localStorage.removeItem(SC.STORE_KEY);
        SC.store = { favorites: [], watchlist: [], history: [], quizResults: [], games: {}, gameLog: [], totalGames: 0, totalScore: 0, likedGenres: {} };
        SC.save(); current = 'fav'; render();
        SC.toast('Все данные удалены');
      }
    });
    requestAnimationFrame(() => area.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.w + '%'));
  }

  SC.views.space = function () { render(); };
})();
