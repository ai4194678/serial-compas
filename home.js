/* ============ ГЛАВНАЯ ============ */
window.SC = window.SC || {};
SC.views = SC.views || {};

SC.views.home = function () {
  // Статистика из реальных данных
  const withGenre = SC.genres.length;
  const countries = SC.countries.length;
  const ongoing = SC.series.filter(s => s.ongoing).length;
  document.getElementById('homeStats').innerHTML = `
    <div><dt>Сериалов в базе</dt><dd>${SC.series.length}</dd></div>
    <div><dt>Рейтинги</dt><dd>${SC.ratingFmt(SC.minRating)}–${SC.ratingFmt(SC.maxRating)}</dd></div>
    <div><dt>Жанров</dt><dd>${withGenre}</dd></div>
    <div><dt>Стран</dt><dd>${countries}</dd></div>`;

  // Рекомендательный блок: лидеры рейтинга (реальные данные)
  const top = [...SC.series].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8);
  document.getElementById('homeTop').innerHTML = top.map(SC.card).join('');
};

// «Удиви меня» — случайный реальный сериал из датасета
SC.surpriseMe = function () {
  const s = SC.rand(SC.series);
  SC.openModal(`
    <p class="quiz-step-tag">компас указывает на…</p>
    ${SC.bigCard(s)}`);
};
