/* ============ SERIAL COMPASS — ядро: состояние, localStorage, утилиты ============ */
window.SC = window.SC || {};

SC.DATA_SOURCE = (window.SERIES_DATA && window.SERIES_DATA.source) || 'исходный CSV';
SC.series = (window.SERIES_DATA && window.SERIES_DATA.series) || [];

/* ---------- Производные данные ---------- */
SC.bigPoster = function (url) {
  // тот же источник изображений, более крупный размер; фолбэк — на исходную ссылку
  return url ? url.replace(/72x108$/, '300x450') : '';
};
SC.votesFmt = function (v) {
  if (v == null) return '—';
  return v >= 1e6 ? (v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1).replace('.', ',') + ' млн'
       : v >= 1e3 ? Math.round(v / 1e3) + ' тыс.'
       : String(v);
};
SC.ratingFmt = function (r) { return r == null ? '—' : r.toFixed(1).replace('.', ','); };
SC.yearLabel = function (s) { return s.years || ''; };
SC.hasActors = SC.series.some(function (s) { return s.actors && s.actors.length; });
SC.hasCountry = SC.series.some(function (s) { return s.country; });

SC.genres = [...new Set(SC.series.map(s => s.genre).filter(Boolean))];
SC.countries = [...new Set(SC.series.map(s => s.country).filter(Boolean))];
SC.actorsList = [...new Set(SC.series.flatMap(s => s.actors || []))].sort();
SC.ratings = SC.series.map(s => s.rating).filter(r => r != null);
SC.minRating = Math.min(...SC.ratings);
SC.maxRating = Math.max(...SC.ratings);
SC.medianVotes = (function () {
  const v = SC.series.map(s => s.votes).filter(x => x != null).sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2);
})();
SC.medianRating = (function () {
  const v = [...SC.ratings].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
})();
SC.yearMin = Math.min(...SC.series.map(s => s.yearStart).filter(Boolean));
SC.yearMax = Math.max(...SC.series.map(s => (s.ongoing ? 2026 : s.yearEnd || s.yearStart)).filter(Boolean));

/* ---------- Настроения: прозрачная система соответствия жанров ----------
   Это НЕ исходные данные датасета: жанры в файле не привязаны к настроениям.
   Соответствие жанров настроениям задано проектом открыто и показано пользователю. */
SC.MOODS = {
  mystery: {
    label: 'Загадки и напряжение', icon: '🕵️',
    genres: { 'триллер': 3, 'детектив': 3, 'криминал': 2.5, 'ужасы': 1.5 },
    note: 'триллер, детектив, криминал, ужасы'
  },
  love: {
    label: 'Любовь и отношения', icon: '💜',
    genres: { 'драма': 3 },
    note: 'драма — истории об отношениях и людях'
  },
  adventure: {
    label: 'Приключения и открытия', icon: '🚀',
    genres: { 'фантастика': 2.5, 'фэнтези': 2.5, 'драма': 0.5 },
    note: 'фантастика, фэнтези, отчасти драма'
  },
  light: {
    label: 'Лёгкость и юмор', icon: '🌤️',
    genres: { 'комедия': 3, 'мультфильм': 2 },
    note: 'комедия, мультфильм'
  },
  twist: {
    label: 'Нестандартные идеи и неожиданные повороты', icon: '🌀',
    genres: { 'фантастика': 2.5, 'ужасы': 1.5, 'триллер': 1.5, 'детектив': 1, 'мультфильм': 1 },
    note: 'фантастика, ужасы, триллер, детектив, мультфильм'
  }
};
SC.applyMoodTheme = function (moodKey) {
  document.body.dataset.mood = moodKey || '';
  if (SC.compass) SC.compass.setMood(moodKey);
};

/* ---------- localStorage ---------- */
SC.STORE_KEY = 'serial-compass-v1';
SC.store = (function load() {
  let d;
  try { d = JSON.parse(localStorage.getItem(SC.STORE_KEY)); } catch (e) { d = null; }
  d = d || {};
  return {
    favorites: d.favorites || [],            // id сериалов
    watchlist: d.watchlist || [],            // id сериалов
    history: d.history || [],                // рекомендации подбора
    quizResults: d.quizResults || [],        // результаты теста «какой ты зритель»
    games: d.games || {},                    // статистика по играм
    gameLog: d.gameLog || [],                // журнал игр
    totalGames: d.totalGames || 0,
    totalScore: d.totalScore || 0,
    likedGenres: d.likedGenres || {}         // жанры из избранного/списков — считаем сами
  };
})();
SC.save = function () {
  try { localStorage.setItem(SC.STORE_KEY, JSON.stringify(SC.store)); }
  catch (e) { /* приватный режим — просто продолжаем */ }
  SC.updateNavScore();
  document.dispatchEvent(new CustomEvent('sc:store'));
};
SC.toggleList = function (listName, id, btnLabelOn, btnLabelOff) {
  const list = SC.store[listName];
  const i = list.indexOf(id);
  if (i >= 0) { list.splice(i, 1); SC.toast('Удалено из списка'); }
  else {
    list.push(id);
    SC.toast(btnLabelOn || 'Добавлено');
    // любимые жанры — производная статистика из сохранённых сериалов
    const s = SC.byId(id);
    if (s && s.genre) SC.store.likedGenres[s.genre] = (SC.store.likedGenres[s.genre] || 0) + 1;
  }
  SC.save();
  if (btnLabelOff !== undefined) SC.refreshListButtons(id);
};
SC.byId = function (id) { return SC.series.find(s => s.id === id) || null; };
SC.inList = function (listName, id) { return SC.store[listName].includes(id); };

/* ---------- Журнал игр ---------- */
SC.logGame = function (gameKey, gameTitle, score, extra) {
  SC.store.totalGames += 1;
  SC.store.totalScore += score;
  const g = SC.store.games[gameKey] = SC.store.games[gameKey] || { played: 0, best: 0, lastScore: 0 };
  g.played += 1; g.lastScore = score; g.best = Math.max(g.best, score);
  SC.store.gameLog.unshift({ t: Date.now(), game: gameTitle, score, extra: extra || '' });
  if (SC.store.gameLog.length > 40) SC.store.gameLog.length = 40;
  SC.save();
};

/* ---------- UI-хелперы ---------- */
SC.esc = function (str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};
SC.toastTimer = null;
SC.toast = function (msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(SC.toastTimer);
  SC.toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
};
SC.openModal = function (html) {
  const m = document.getElementById('surpriseModal');
  document.getElementById('surpriseBody').innerHTML =
    '<button class="modal-close" data-close-modal aria-label="Закрыть">✕</button>' + html;
  m.hidden = false;
};
SC.closeModal = function () { document.getElementById('surpriseModal').hidden = true; };
SC.fmtDate = function (ts) {
  return new Date(ts).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};
SC.rand = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
SC.shuffle = function (arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
