/* ============ Лёгкие SVG-графики (без внешних библиотек) ============ */
window.SC = window.SC || {};

(function () {
  // Диаграмма рассеяния: рейтинг × количество оценок
  SC.scatterChart = function (items, opts) {
    const o = opts || {};
    const w = 560, h = 340, padL = 56, padR = 18, padT = 20, padB = 44;
    const rMin = Math.floor(SC.minRating * 2) / 2 - 0.25;
    const rMax = Math.ceil(SC.maxRating * 2) / 2 + 0.25;
    const vMax = Math.max(...SC.series.map(s => s.votes || 0));
    const x = r => padL + (r - rMin) / (rMax - rMin) * (w - padL - padR);
    const y = v => h - padB - (v ? Math.log10(v) : 0) / Math.log10(vMax) * (h - padT - padB);
    const gridY = [0, 1000, 10000, 100000, 1000000];
    let g = '';

    gridY.forEach(v => {
      if (y(v) < padT || y(v) > h - padB) return;
      g += `<line x1="${padL}" y1="${y(v).toFixed(1)}" x2="${w - padR}" y2="${y(v).toFixed(1)}" stroke="rgba(169,185,216,.12)"/>
            <text x="${padL - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="#5266A8" font-family="Space Mono">${SC.votesFmt(v)}</text>`;
    });
    for (let r = rMin; r <= rMax; r += 0.5) {
      g += `<line x1="${x(r).toFixed(1)}" y1="${padT}" x2="${x(r).toFixed(1)}" y2="${h - padB}" stroke="rgba(169,185,216,.07)"/>
            <text x="${x(r).toFixed(1)}" y="${h - padB + 16}" text-anchor="middle" font-size="10" fill="#5266A8" font-family="Space Mono">${String(r.toFixed(1)).replace('.', ',')}</text>`;
    }
    g += `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${h - padB}" stroke="rgba(169,185,216,.25)"/>
          <line x1="${padL}" y1="${h - padB}" x2="${w - padR}" y2="${h - padB}" stroke="rgba(169,185,216,.25)"/>
          <text x="${(padL + (w - padR)) / 2}" y="${h - 6}" text-anchor="middle" font-size="11" fill="#A9B9D8" font-family="Inter">рейтинг Кинопоиска →</text>
          <text x="14" y="${(padT + h - padB) / 2}" font-size="11" fill="#A9B9D8" font-family="Inter" transform="rotate(-90 14 ${(padT + h - padB) / 2})" text-anchor="middle">оценок (лог. шкала) →</text>`;

    items.forEach(s => {
      if (s.rating == null || s.votes == null) return;
      const c = s.votes >= SC.medianVotes ? 'var(--teal)' : 'var(--lav)';
      const label = `${s.title}: ★ ${String(s.rating).replace('.', ',')}, ${SC.votesFmt(s.votes)} оценок`;
      g += `<g class="scatter-dot" data-more="${s.id}">
              <circle cx="${x(s.rating).toFixed(1)}" cy="${y(s.votes).toFixed(1)}" r="6" fill="${c}" opacity=".8">
                <title>${SC.esc(label)}</title>
              </circle>
              <text x="${x(s.rating).toFixed(1)}" y="${(y(s.votes) - 10).toFixed(1)}" text-anchor="middle" font-size="9.5" fill="#A9B9D8" font-family="Inter" opacity="0">${SC.esc(s.title)}</text>
              <animate attributeName="nothing" dur="0.1s"/>
            </g>`;
    });
    // показываем название при наведении — минимальный CSS-хак через title достаточно, но добавим hover через JS ниже
    return `<svg class="scatter-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Диаграмма рассеяния: рейтинг и количество оценок">${g}</svg>`;
  };
})();
