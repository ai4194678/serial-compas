/* ============ Карточки сериалов ============ */
window.SC = window.SC || {};

(function () {
  function posterImg(s, cls) {
    const big = SC.bigPoster(s.poster);
    return `<img src="${SC.esc(big)}" alt="Постер: ${SC.esc(s.title)}" loading="lazy"
      onerror="this.onerror=null;this.src='${SC.esc(s.poster || '')}'">`;
  }

  function listButtons(s) {
    return `
      <button class="icon-btn sc-fav ${SC.inList('favorites', s.id) ? 'active' : ''}" data-fav="${s.id}"
        aria-label="В избранное">${SC.inList('favorites', s.id) ? '♥ В избранном' : '♡ В избранное'}</button>
      <button class="icon-btn sc-watch ${SC.inList('watchlist', s.id) ? 'active' : ''}" data-watch="${s.id}"
        aria-label="Хочу посмотреть">${SC.inList('watchlist', s.id) ? '✓ В списке' : '+ Хочу посмотреть'}</button>`;
  }

  SC.card = function (s) {
    const meta = [SC.yearLabel(s), s.country].filter(Boolean).join(' · ');
    return `
    <article class="scard">
      <div class="scard-poster">
        ${posterImg(s)}
        ${s.rating != null ? `<span class="scard-rating">★ ${SC.ratingFmt(s.rating)}</span>` : ''}
      </div>
      <div class="scard-body">
        <h3 class="scard-title">${SC.esc(s.title)}</h3>
        <span class="scard-meta">${SC.esc(meta)}</span>
        ${s.genre ? `<span class="scard-genre">${SC.esc(s.genre)}</span>` : ''}
        ${s.descRaw ? `<p class="scard-desc">${SC.esc(s.descRaw)}</p>` : ''}
        <div class="scard-actions">
          ${listButtons(s)}
          <button class="icon-btn sc-more" data-more="${s.id}">Подробнее</button>
        </div>
      </div>
    </article>`;
  };

  SC.bigCard = function (s) { // крупная карточка (модал «Удиви меня»)
    return `
    <div class="surprise-flex">
      <div class="rec-poster">${posterImg(s)}</div>
      <div class="rec-info">
        <h3 style="font-size:22px">${SC.esc(s.title)}</h3>
        <div class="rec-metrics" style="margin-top:8px">
          ${s.rating != null ? `<span class="metric">рейтинг <b>★ ${SC.ratingFmt(s.rating)}</b></span>` : ''}
          ${s.votes != null ? `<span class="metric">оценок <b>${SC.votesFmt(s.votes)}</b></span>` : ''}
          ${s.genre ? `<span class="metric">${SC.esc(s.genre)}</span>` : ''}
        </div>
        <p class="scard-meta">${SC.esc([SC.yearLabel(s), s.country, s.director ? 'реж. ' + s.director : ''].filter(Boolean).join(' · '))}</p>
        ${s.actors && s.actors.length ? `<p style="font-size:13px;color:var(--pale);margin-top:8px">В ролях: ${SC.esc(s.actors.join(', '))}</p>` : ''}
        <div class="scard-actions" style="margin-top:14px">
          ${listButtons(s)}
          <a class="btn btn-primary btn-sm" href="${SC.esc(s.link)}" target="_blank" rel="noopener">Подробнее на источнике ↗</a>
        </div>
      </div>
    </div>`;
  };

  SC.recCard = function (s, tag, why, delay) { // карточка рекомендации
    return `
    <article class="rec-card" style="animation-delay:${delay || 0}ms">
      <div class="rec-tag">${SC.esc(tag)}</div>
      <div class="rec-flex">
        <div class="rec-poster">${posterImg(s)}</div>
        <div class="rec-info">
          <h3>${SC.esc(s.title)}</h3>
          <p class="scard-meta">${SC.esc([SC.yearLabel(s), s.country].filter(Boolean).join(' · '))}</p>
          <div class="rec-metrics">
            ${s.rating != null ? `<span class="metric">рейтинг <b>★ ${SC.ratingFmt(s.rating)}</b></span>` : ''}
            ${s.votes != null ? `<span class="metric">оценок <b>${SC.votesFmt(s.votes)}</b></span>` : ''}
            ${s.genre ? `<span class="metric">${SC.esc(s.genre)}</span>` : ''}
          </div>
          ${s.actors && s.actors.length ? `<p class="scard-meta">В ролях: ${SC.esc(s.actors.join(', '))}</p>` : ''}
          <p class="rec-desc">${SC.esc(s.descRaw || '')}</p>
        </div>
      </div>
      <div class="rec-why"><b>Почему мы рекомендуем этот сериал:</b> ${SC.esc(why)}</div>
      <div class="scard-actions" style="margin:0 18px 18px">
        ${listButtons(s)}
        <a class="btn btn-primary btn-sm" href="${SC.esc(s.link)}" target="_blank" rel="noopener">Подробнее ↗</a>
      </div>
    </article>`;
  };

  SC.rankItem = function (s, pos, numHtml, subHtml) {
    return `
    <a class="rank-item" href="${SC.esc(s.link)}" target="_blank" rel="noopener">
      <span class="rank-pos">${pos}</span>
      <span class="rank-poster">${posterImg(s)}</span>
      <span class="rank-info"><h4>${SC.esc(s.title)}</h4><span>${SC.esc([s.genre, SC.yearLabel(s), s.country].filter(Boolean).join(' · '))}</span></span>
      <span class="rank-num">${numHtml}${subHtml ? `<small>${subHtml}</small>` : ''}</span>
    </a>`;
  };

  // делегирование: кнопки списков и «Подробнее» на всех карточках
  document.addEventListener('click', function (e) {
    const fav = e.target.closest('[data-fav]');
    const watch = e.target.closest('[data-watch]');
    const more = e.target.closest('[data-more]');
    if (fav) {
      SC.toggleList('favorites', +fav.dataset.fav);
      fav.classList.toggle('active', SC.inList('favorites', +fav.dataset.fav));
      fav.innerHTML = SC.inList('favorites', +fav.dataset.fav) ? '♥ В избранном' : '♡ В избранное';
    } else if (watch) {
      SC.toggleList('watchlist', +watch.dataset.watch);
      watch.classList.toggle('active', SC.inList('watchlist', +watch.dataset.watch));
      watch.innerHTML = SC.inList('watchlist', +watch.dataset.watch) ? '✓ В списке' : '+ Хочу посмотреть';
    } else if (more) {
      const s = SC.byId(+more.dataset.more);
      if (s) SC.openModal(SC.bigCard(s));
    } else if (e.target.closest('[data-close-modal]')) {
      SC.closeModal();
    }
  });

  SC.refreshListButtons = function (id) {
    document.querySelectorAll(`[data-fav="${id}"]`).forEach(b => {
      b.classList.toggle('active', SC.inList('favorites', id));
      b.innerHTML = SC.inList('favorites', id) ? '♥ В избранном' : '♡ В избранное';
    });
    document.querySelectorAll(`[data-watch="${id}"]`).forEach(b => {
      b.classList.toggle('active', SC.inList('watchlist', id));
      b.innerHTML = SC.inList('watchlist', id) ? '✓ В списке' : '+ Хочу посмотреть';
    });
  };
})();
