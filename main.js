/* ============ Роутер, навигация, глобальные действия ============ */
(function () {
  const VIEWS = ['home', 'podborka', 'games', 'explore', 'space'];

  SC.showView = function (name) {
    if (!VIEWS.includes(name)) name = 'home';
    VIEWS.forEach(v => document.getElementById('view-' + v).classList.toggle('active', v === name));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.nav === name));
    // перерисовка раздела при каждом входе (данные/сохранения могли измениться)
    (SC.views[name] || function () {})();
    document.getElementById('mainNav').classList.remove('open');
    document.getElementById('navToggle').setAttribute('aria-expanded', 'false');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  SC.updateNavScore = function () {
    const el = document.getElementById('navScoreValue');
    if (el) el.textContent = SC.store.totalScore.toLocaleString('ru-RU');
  };

  // навигация
  document.addEventListener('click', function (e) {
    const nav = e.target.closest('[data-nav]');
    if (nav) { e.preventDefault(); SC.showView(nav.dataset.nav); return; }
    const act = e.target.closest('[data-action]');
    if (act) {
      e.preventDefault();
      const a = act.dataset.action;
      if (a === 'go-podbor') SC.showView('podborka');
      else if (a === 'go-games') SC.showView('games');
      else if (a === 'go-explore') SC.showView('explore');
      else if (a === 'go-space') SC.showView('space');
      else if (a === 'surprise') SC.surpriseMe();
    }
  });

  // мобильное меню
  document.getElementById('navToggle').addEventListener('click', function () {
    const nav = document.getElementById('mainNav');
    const open = nav.classList.toggle('open');
    this.setAttribute('aria-expanded', String(open));
  });

  // закрытие модала по Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') SC.closeModal();
  });

  function init() {
    SC.initCompasses();
    SC.updateNavScore();
    SC.showView('home');
    // начальная перерисовка подборки при первом входе
    document.addEventListener('sc:store', SC.updateNavScore);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
