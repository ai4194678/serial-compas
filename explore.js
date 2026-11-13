/* ============ ИССЛЕДОВАНИЕ: аналитика на основе датасета ============ */
window.SC = window.SC || {};

(function () {
  const TABS = [
    { k: 'leaders', t: 'Лидеры рейтинга' },
    { k: 'popular', t: 'Самые популярные' },
    { k: 'gems', t: 'Скрытые жемчужины' },
    { k: 'genres', t: 'Жанры сериалов' },
    { k: 'scatter', t: 'Карта рейтингов' },
    { k: 'actors', t: 'Актёры и их сериалы' },
    { k: 'compare', t: 'Сравнение сериалов' }
  ];
  let current = 'leaders';

  function subnav() {
    document.getElementById('exploreNav').innerHTML = TABS.map(t =>
      `<button role="tab" aria-selected="${t.k === current}" data-tab="${t.k}" class="${t.k === current ? 'active' : ''}">${t.t}</button>`).join('');
    document.querySelectorAll('[data-tab]').forEach(b =>
      b.addEventListener('click', () => { current = b.dataset.tab; subnav(); render(); }));
  }

  const titleBlock = (t, sub) => `<div class="block-head"><h2>${t}</h2><p>${sub}</p></div>`;

  function render() {
    const area = document.getElementById('exploreArea');
    area.innerHTML = '';

    if (current === 'leaders') {
      const top = [...SC.series].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 10);
      area.innerHTML = `<div class="explore-section">
        ${titleBlock('Лидеры рейтинга', 'Топ-10 сериалов по рейтингу Кинопоиска в нашей базе')}
        <div class="rank-list">${top.map((s, i) => SC.rankItem(s, i + 1,
          `★ ${String(s.rating).replace('.', ',')}`, s.votes != null ? SC.votesFmt(s.votes) + ' оценок' : '')).join('')}</div>
      </div>`;

    } else if (current === 'popular') {
      const top = [...SC.series].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 10);
      area.innerHTML = `<div class="explore-section">
        ${titleBlock('Самые популярные', 'Топ-10 сериалов по количеству оценок на Кинопоиске')}
        <div class="rank-list">${top.map((s, i) => SC.rankItem(s, i + 1,
          SC.votesFmt(s.votes), s.rating != null ? '★ ' + String(s.rating).replace('.', ',') : '')).join('')}</div>
      </div>`;

    } else if (current === 'gems') {
      const gems = SC.series.filter(s => s.rating != null && s.votes != null && s.rating >= 8 && s.votes < SC.medianVotes)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
      area.innerHTML = `<div class="explore-section">
        ${titleBlock('Скрытые жемчужины', 'Высокий рейтинг, при этом меньше оценок, чем у большинства')}
        <p class="criteria-note">Критерий отбора: рейтинг Кинопоиска ≥ 8,0 и количество оценок ниже медианы базы (${SC.votesFmt(SC.medianVotes)}). Так отсеиваются широко разрекламированные хиты — остаются истории, которые ценят знатоки.</p>
        ${gems.length ? `<div class="rank-list">${gems.map((s, i) => SC.rankItem(s, i + 1,
          `★ ${String(s.rating).replace('.', ',')}`, SC.votesFmt(s.votes) + ' оценок')).join('')}</div>`
          : `<p class="empty-note">По этому критерию в базе пока нет сериалов.</p>`}
      </div>`;

    } else if (current === 'genres') {
      const stats = SC.genres.map(g => {
        const list = SC.series.filter(s => s.genre === g);
        const rs = list.map(s => s.rating).filter(r => r != null);
        return { g, n: list.length, avg: rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : null };
      }).sort((a, b) => b.n - a.n);
      const maxN = stats[0].n;
      const maxR = Math.max(...stats.map(s => s.avg || 0));
      area.innerHTML = `<div class="explore-section">
        ${titleBlock('Жанры сериалов', 'Сколько сериалов каждого жанра в базе и их средние рейтинги — посчитано из датасета автоматически')}
        <div class="charts-flex">
          <div class="chart-card"><h3>Количество сериалов по жанрам</h3><p class="chart-sub">всего ${SC.series.length} сериалов</p>
            ${stats.map(s => `<div class="bar-row"><span>${SC.esc(s.g)}</span>
              <div class="bar-track"><div class="bar-fill" data-w="${(s.n / maxN * 100).toFixed(1)}"></div></div>
              <span class="bar-val">${s.n}</span></div>`).join('')}</div>
          <div class="chart-card"><h3>Средний рейтинг жанра</h3><p class="chart-sub">среднее по сериалам жанра</p>
            ${stats.filter(s => s.avg != null).sort((a, b) => b.avg - a.avg).map(s => `<div class="bar-row"><span>${SC.esc(s.g)}</span>
              <div class="bar-track"><div class="bar-fill" data-w="${(s.avg / maxR * 100).toFixed(1)}"></div></div>
              <span class="bar-val">${s.avg.toFixed(1).replace('.', ',')}</span></div>`).join('')}</div>
        </div></div>`;
      // анимация столбцов после вставки
      requestAnimationFrame(() => area.querySelectorAll('.bar-fill').forEach(b => b.style.width = b.dataset.w + '%'));

    } else if (current === 'scatter') {
      area.innerHTML = `<div class="explore-section">
        ${titleBlock('Карта рейтингов', 'Каждая точка — сериал из базы: рейтинг по горизонтали, количество оценок по вертикали (логарифмическая шкала)')}
        <div class="chart-card">${SC.scatterChart(SC.series)}</div>
        <p class="criteria-note" style="margin-top:14px">Бирюзовые точки — популярные сериалы (оценок ≥ медианы ${SC.votesFmt(SC.medianVotes)}), лавандовые — менее известные. Нажми на точку, чтобы открыть карточку сериала.</p>
      </div>`;
      area.querySelectorAll('.scatter-dot').forEach(d =>
        d.addEventListener('click', () => { const s = SC.byId(+d.dataset.more); if (s) SC.openModal(SC.bigCard(s)); }));

    } else if (current === 'actors') {
      const byActor = {};
      SC.series.forEach(s => (s.actors || []).forEach(a => { (byActor[a] = byActor[a] || []).push(s); }));
      const names = Object.keys(byActor).sort();
      area.innerHTML = `<div class="explore-section">
        ${titleBlock('Актёры и их сериалы', `${names.length} актёров из датасета — для каждого показаны только сериалы, где участие подтверждено исходными данными`)}
        <ul class="actor-cols">${names.map(n => `<li>
          <button class="actor-btn" data-actor="${SC.esc(n)}"><span>${SC.esc(n)}</span><small>${byActor[n].length} сериал${byActor[n].length > 1 ? 'а' : ''}</small></button>
        </li>`).join('')}</ul>
        <div id="actorDetail" style="margin-top:26px"></div>
      </div>`;
      area.querySelectorAll('[data-actor]').forEach(b => b.addEventListener('click', () => {
        const n = b.dataset.actor;
        const list = byActor[n];
        document.getElementById('actorDetail').innerHTML = `
          <div class="back-row"><h3>${SC.esc(n)}</h3><span class="scard-meta">по данным датасета: ${list.length} сериал${list.length > 1 ? 'а' : ''}</span></div>
          <div class="card-grid">${list.map(SC.card).join('')}</div>`;
        document.getElementById('actorDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));

    } else if (current === 'compare') {
      const opt = s => `<option value="${s.id}">${SC.esc(s.title)}${s.years ? ' (' + SC.esc(s.years) + ')' : ''}</option>`;
      area.innerHTML = `<div class="explore-section">
        ${titleBlock('Сравнение сериалов', 'Выбери два сериала — сравним по характеристикам, реально присутствующим в данных')}
        <div class="compare-selects">
          <select id="cmpA" aria-label="Первый сериал">${SC.series.map(opt).join('')}</select>
          <span class="battle-vs">VS</span>
          <select id="cmpB" aria-label="Второй сериал">${SC.series.map(opt).join('')}</select>
        </div>
        <div id="cmpTable"></div>
      </div>`;
      const a = area.querySelector('#cmpA'), b = area.querySelector('#cmpB');
      a.value = SC.byId(1).id; b.value = SC.byId(2).id;
      const draw = () => {
        const s1 = SC.byId(+a.value), s2 = SC.byId(+b.value);
        const num = v => v == null ? '—' : v;
        const fmtV = v => v == null ? '—' : SC.votesFmt(v) + ' (' + v.toLocaleString('ru-RU') + ')';
        const winner = (v1, v2, better) => v1 == null || v2 == null ? ['', ''] :
          (better(v1, v2) ? ['winner-cell', ''] : better(v2, v1) ? ['', 'winner-cell'] : ['', '']);
        const rows = [];
        if (s1.rating != null || s2.rating != null) {
          const [c1, c2] = winner(s1.rating, s2.rating, (x, y) => x > y);
          rows.push(`<th>Рейтинг Кинопоиска</th><td class="${c1}">${s1.rating != null ? '★ ' + SC.ratingFmt(s1.rating) : '—'}</td><td class="${c2}">${s2.rating != null ? '★ ' + SC.ratingFmt(s2.rating) : '—'}</td>`);
        }
        if (s1.votes != null || s2.votes != null) {
          const [c1, c2] = winner(s1.votes, s2.votes, (x, y) => x > y);
          rows.push(`<th>Количество оценок</th><td class="${c1}">${fmtV(s1.votes)}</td><td class="${c2}">${fmtV(s2.votes)}</td>`);
        }
        rows.push(`<th>Годы выхода</th><td>${SC.esc(SC.yearLabel(s1) || '—')}</td><td>${SC.esc(SC.yearLabel(s2) || '—')}</td>`);
        if (s1.genre || s2.genre) rows.push(`<th>Жанр</th><td>${SC.esc(s1.genre || '—')}</td><td>${SC.esc(s2.genre || '—')}</td>`);
        if (s1.country || s2.country) rows.push(`<th>Страна</th><td>${SC.esc(s1.country || '—')}</td><td>${SC.esc(s2.country || '—')}</td>`);
        if (s1.director || s2.director) rows.push(`<th>Режиссёр</th><td>${SC.esc(s1.director || '—')}</td><td>${SC.esc(s2.director || '—')}</td>`);
        if (SC.hasActors) rows.push(`<th>Актёрский состав</th><td>${s1.actors && s1.actors.length ? SC.esc(s1.actors.join(', ')) : '—'}</td><td>${s2.actors && s2.actors.length ? SC.esc(s2.actors.join(', ')) : '—'}</td>`);
        document.getElementById('cmpTable').innerHTML = `
          <table class="compare-table"><tbody>
            <tr><th></th><td><b>${SC.esc(s1.title)}</b> <a href="${SC.esc(s1.link)}" target="_blank" rel="noopener" style="font-size:12px">источник ↗</a></td><td><b>${SC.esc(s2.title)}</b> <a href="${SC.esc(s2.link)}" target="_blank" rel="noopener" style="font-size:12px">источник ↗</a></td></tr>
            ${rows.map(r => `<tr>${r}</tr>`).join('')}
          </tbody></table>`;
      };
      a.addEventListener('change', draw); b.addEventListener('change', draw);
      draw();
    }
  }

  SC.views.explore = function () { subnav(); render(); };
})();
