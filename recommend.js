/* ============ Система рекомендаций на основе заданных критериев ============ */
window.SC = window.SC || {};

(function () {
  const popLog = s => s.votes ? Math.log10(s.votes) : 0; // 0–6.24

  // Оценка одного сериала под ответы пользователя. Прозрачная система правил.
  SC.scoreSeries = function (s, answers) {
    let score = 0;
    const reasons = [];

    // 1. Настроение → жанры (вес × 12)
    const mood = SC.MOODS[answers.mood];
    if (mood && s.genre && mood.genres[s.genre]) {
      const pts = mood.genres[s.genre] * 12;
      score += pts;
      reasons.push({ t: 'настроение', w: pts, txt: `жанр «${s.genre}» соответствует настроению «${mood.label}»` });
    }

    // 2. Выбранные жанры (+30 за совпадение)
    if (answers.genres && answers.genres.length && s.genre && answers.genres.includes(s.genre)) {
      score += 30;
      reasons.push({ t: 'жанр', w: 30, txt: `вы выбрали жанр «${s.genre}»` });
    }

    // 3. Предпочтение по рейтингу
    if (answers.ratingPref === 'higher') {
      if (s.rating != null) { const p = (s.rating - SC.minRating) * 22; score += p; reasons.push({ t: 'рейтинг', w: p, txt: `высокий рейтинг ★ ${SC.ratingFmt(s.rating)}` }); }
    } else if (answers.ratingPref === 'balance') {
      if (s.rating != null) { const p = (s.rating - SC.minRating) * 14; score += p; reasons.push({ t: 'рейтинг', w: p, txt: `рейтинг ★ ${SC.ratingFmt(s.rating)}` }); }
      if (s.votes != null) { const p = popLog(s.votes) * 10; score += p; reasons.push({ t: 'популярность', w: p, txt: 'широкая популярность у зрителей' }); }
    } else if (answers.ratingPref === 'lesser') {
      if (s.votes != null && s.votes < SC.medianVotes) { score += 25; reasons.push({ t: 'открытие', w: 25, txt: `менее заезженный — ${SC.votesFmt(s.votes)} оценок (ниже медианы)` }); }
      else if (s.votes != null) { score -= 12; }
      if (s.rating != null) { const p = (s.rating - SC.minRating) * 10; score += p; reasons.push({ t: 'рейтинг', w: p, txt: `при этом рейтинг ★ ${SC.ratingFmt(s.rating)}` }); }
    } else { score += 2; }

    // 4. Любимый актёр
    if (answers.actor && s.actors && s.actors.includes(answers.actor)) {
      score += 40;
      reasons.push({ t: 'актёр', w: 40, txt: `в сериале снимается ${answers.actor}` });
    }

    return { score, reasons };
  };

  SC.buildWhy = function (s, reasons, tag) {
    if (tag === 'Популярный выбор') {
      return `собрал ${SC.votesFmt(s.votes)} оценок — самый зрительский отклик среди подходящих под ваши ответы. Рейтинг ★ ${SC.ratingFmt(s.rating)}${s.genre ? `, жанр «${s.genre}»` : ''} тоже соответствует выбору.`;
    }
    if (tag === 'Неожиданный выбор') {
      return `${s.genre ? `жанр «${s.genre}» — не самый очевидный маршрут по вашим ответам, но он` : 'этот вариант'} всё равно совпадает с вашими предпочтениями${s.rating != null ? ` и держит рейтинг ★ ${SC.ratingFmt(s.rating)}` : ''}. Хороший способ открыть что-то новое.`;
    }
    if (!reasons || !reasons.length) return 'совпадает с вашими ответами по доступным критериям.';
    const sorted = [...reasons].sort((a, b) => b.w - a.w);
    return sorted.slice(0, 3).map(r => r.txt).join('; ') + '.';
  };

  // Главная функция: возвращает до трёх рекомендаций с объяснениями
  SC.recommend = function (answers) {
    const scored = SC.series
      .map(s => ({ s, ...SC.scoreSeries(s, answers) }))
      .filter(x => x.score > 6)             // отсечение нерелевантных — не подставляем «первые попавшиеся»
      .sort((a, b) => b.score - a.score);

    const used = new Set();
    const out = [];
    let best = null;

    // 1. Идеальное совпадение — максимум по сумме критериев
    if (scored.length) {
      best = scored[0];
      used.add(best.s.id);
      out.push({ tag: 'Идеальное совпадение', s: best.s, why: SC.buildWhy(best.s, best.reasons, 'Идеальное совпадение') });
    }

    // 2. Неожиданный выбор — другой жанр, чем у идеального, но всё ещё совпадающий
    const alt = scored.find(x => !used.has(x.s.id) &&
      (!best || !best.s.genre || x.s.genre !== best.s.genre));
    if (alt) {
      used.add(alt.s.id);
      out.push({ tag: 'Неожиданный выбор', s: alt.s, why: SC.buildWhy(alt.s, alt.reasons, 'Неожиданный выбор') });
    }

    // 3. Популярный выбор — максимум оценок среди оставшихся подходящих
    const pop = scored.filter(x => !used.has(x.s.id)).sort((a, b) => (b.s.votes || 0) - (a.s.votes || 0))[0];
    if (pop) {
      used.add(pop.s.id);
      out.push({ tag: 'Популярный выбор', s: pop.s, why: SC.buildWhy(pop.s, pop.reasons, 'Популярный выбор') });
    }

    return out; // может быть меньше трёх — честно, без выдуманных результатов
  };

  // Фильтры каталога
  SC.applyFilters = function (f) {
    return SC.series.filter(s => {
      if (f.genre && s.genre !== f.genre) return false;
      if (f.country && s.country !== f.country) return false;
      if (f.actor && !(s.actors || []).includes(f.actor)) return false;
      if (f.minRating != null && (s.rating == null || s.rating < f.minRating)) return false;
      if (f.yearFrom && !(s.yearStart >= f.yearFrom || (s.yearEnd && s.yearEnd >= f.yearFrom))) return false;
      if (f.yearTo && !(s.yearStart <= f.yearTo)) return false;
      return true;
    });
  };
})();
