window.App = window.App || {};

App.controller = (() => {
  const { snapshotKey, languageLimit } = App.CONFIG;

  const getStarsSnapshot = () => {
    try {
      return JSON.parse(localStorage.getItem(snapshotKey)) || {};
    } catch {
      return {};
    }
  };

  const saveStarsSnapshot = (projects) => {
    const snapshot = {};
    projects.forEach((p) => {
      snapshot[p.name] = p.stars;
    });
    localStorage.setItem(snapshotKey, JSON.stringify(snapshot));
  };

  const calculateTrending = (projects) => {
    const lastSnapshot = getStarsSnapshot();
    const trendingList = projects.map((p) => {
      const lastStars = lastSnapshot[p.name] !== undefined ? lastSnapshot[p.name] : p.stars;
      return { ...p, delta: p.stars - lastStars };
    });

    saveStarsSnapshot(projects);

    return trendingList
      .sort((a, b) => {
        if (a.delta !== b.delta) return b.delta - a.delta;
        return b.updated - a.updated;
      })
      .slice(0, App.CONFIG.topLimit);
  };

  const filterProjects = (projects, state) => {
    const keyword = state.query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchesQuery = !keyword
        || p.name.toLowerCase().includes(keyword)
        || (p.desc && p.desc.toLowerCase().includes(keyword))
        || p.language.toLowerCase().includes(keyword);
      const matchesLang = state.language === 'all' || p.language === state.language;
      return matchesQuery && matchesLang;
    });
  };

  const sortProjects = (projects, sortKey) => {
    const sorted = [...projects];
    const strategies = {
      stars: (a, b) => b.stars - a.stars,
      updated: (a, b) => b.updated - a.updated,
      created: (a, b) => b.created - a.created,
      name: (a, b) => a.name.localeCompare(b.name)
    };
    return sorted.sort(strategies[sortKey] || strategies.stars);
  };

  const getLanguages = (projects) => {
    const counts = projects.reduce((acc, p) => {
      acc[p.language] = (acc[p.language] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, languageLimit);
  };

  const refresh = () => {
    const state = App.store.get();
    const filtered = filterProjects(state.projects, state);
    const sorted = sortProjects(filtered, state.sort);
    App.ui.setView(state.view);
    App.ui.renderProjects(sorted);
    App.ui.bindStarClickEvents();
    App.ui.renderResultMeta(sorted.length, state);
  };

  const bindControls = () => {
    const { els } = App.ui;
    if (els.searchInput) {
      els.searchInput.addEventListener('input', App.utils.debounce((e) => {
        App.store.set({ query: e.target.value });
        refresh();
      }, 120));
    }

    if (els.searchClear) {
      els.searchClear.addEventListener('click', () => {
        if (els.searchInput) els.searchInput.value = '';
        App.store.set({ query: '' });
        refresh();
      });
    }

    if (els.sortSelect) {
      els.sortSelect.addEventListener('change', (e) => {
        const sort = e.target.value;
        localStorage.setItem('sort', sort);
        App.store.set({ sort });
        refresh();
      });
    }

    if (els.viewGrid) {
      els.viewGrid.addEventListener('click', () => {
        localStorage.setItem('view', 'grid');
        App.store.set({ view: 'grid' });
        refresh();
      });
    }

    if (els.viewList) {
      els.viewList.addEventListener('click', () => {
        localStorage.setItem('view', 'list');
        App.store.set({ view: 'list' });
        refresh();
      });
    }

    if (els.clearFilters) {
      els.clearFilters.addEventListener('click', () => {
        if (els.searchInput) els.searchInput.value = '';
        App.store.set({ query: '', language: 'all' });
        refresh();
        App.ui.renderLanguageFilters(getLanguages(App.store.get().projects), 'all');
      });
    }

    if (els.languageFilters) {
      els.languageFilters.addEventListener('click', (e) => {
        const target = e.target.closest('.chip');
        if (!target) return;
        const lang = target.dataset.lang;
        App.store.set({ language: lang });
        App.ui.renderLanguageFilters(getLanguages(App.store.get().projects), lang);
        refresh();
      });
    }

    if (els.themeToggle) {
      els.themeToggle.addEventListener('click', () => {
        const theme = App.store.get().theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        App.store.set({ theme });
        App.ui.applyTheme(theme);
      });
    }

    if (els.langToggle) {
      els.langToggle.addEventListener('click', () => {
        const lang = App.store.get().lang === 'zh' ? 'en' : 'zh';
        localStorage.setItem('lang', lang);
        App.store.set({ lang });
        App.ui.applyLanguage();
        refresh();
        App.ui.renderLanguageFilters(getLanguages(App.store.get().projects), App.store.get().language);
      });
    }

    if (els.backToTop) {
      window.addEventListener('scroll', () => {
        const show = window.scrollY > 300;
        els.backToTop.classList.toggle('show', show);
      });
      els.backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  const renderSidebars = (projects) => {
    App.ui.renderTopStars(projects);
    const trending = calculateTrending(projects);
    App.ui.renderTrending(projects, trending);
  };

  return { refresh, bindControls, renderSidebars, getLanguages };
})();
