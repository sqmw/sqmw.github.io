window.App = window.App || {};

App.ui = (() => {
  const els = {};

  const cacheDom = () => {
    els.projectList = document.getElementById('project-list');
    els.topStars = document.getElementById('top-stars-list');
    els.trending = document.getElementById('trending-list');
    els.searchInput = document.getElementById('search');
    els.searchClear = document.getElementById('search-clear');
    els.langToggle = document.getElementById('lang-toggle');
    els.themeToggle = document.getElementById('theme-toggle');
    els.sortSelect = document.getElementById('sort-select');
    els.viewGrid = document.getElementById('view-grid');
    els.viewList = document.getElementById('view-list');
    els.refreshData = document.getElementById('refresh-data');
    els.languageFilters = document.getElementById('language-filters');
    els.resultCount = document.getElementById('result-count');
    els.activeFilters = document.getElementById('active-filters');
    els.clearFilters = document.getElementById('clear-filters');
    els.backToTop = document.getElementById('back-to-top');
    els.currentYear = document.getElementById('current-year');
  };

  const applyTheme = (theme) => {
    document.body.setAttribute('data-theme', theme);
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
    if (els.themeToggle) {
      els.themeToggle.setAttribute('aria-pressed', theme === 'dark');
    }
  };

  const applyLanguage = () => {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      el.textContent = App.utils.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = App.utils.t(key);
    });

    if (els.langToggle) {
      const lang = App.store.get().lang;
      const langText = els.langToggle.querySelector('.lang-text');
      if (langText) langText.textContent = lang === 'zh' ? 'EN' : '中';
    }

    if (els.searchClear) {
      els.searchClear.setAttribute('aria-label', App.utils.t('search_clear'));
    }

    if (els.backToTop) {
      els.backToTop.setAttribute('aria-label', App.utils.t('back_to_top'));
    }
  };

  const setView = (view) => {
    if (!els.projectList) return;
    els.projectList.classList.toggle('grid-view', view === 'grid');
    els.projectList.classList.toggle('list-view', view === 'list');
    if (els.viewGrid) els.viewGrid.classList.toggle('active', view === 'grid');
    if (els.viewList) els.viewList.classList.toggle('active', view === 'list');
  };

  const showLoading = () => {
    if (!els.projectList) return;
    els.projectList.innerHTML = `<li class="loading">${App.utils.t('loading')}</li>`;
  };

  const showError = (message) => {
    if (!els.projectList) return;
    const escaped = App.utils.escapeHTML(message);
    els.projectList.innerHTML = `
      <li class="error">
        <div>❌ ${escaped}</div>
        <div class="error-tip">${App.utils.t('error_tip')}</div>
      </li>
    `;
  };

  const renderProjects = (list) => {
    if (!els.projectList) return;
    els.projectList.innerHTML = '';

    if (!list.length) {
      els.projectList.innerHTML = `<li class="loading">${App.utils.t('no_projects')}</li>`;
      return;
    }

    const fragment = document.createDocumentFragment();
    list.forEach((proj) => {
      const li = document.createElement('li');
      li.className = 'project-card-wrapper';

      const langColor = App.LANGUAGE_COLORS[proj.language] || App.LANGUAGE_COLORS.Others;
      const desc = proj.desc || App.utils.t('repo_desc');
      const tags = proj.tags && proj.tags.length
        ? `<div class="project-tags">${proj.tags.map((tag) => `<span class="project-tag">${App.utils.escapeHTML(tag)}</span>`).join('')}</div>`
        : '';
      const locale = App.store.get().lang === 'zh' ? 'zh-CN' : 'en-US';
      const updated = App.utils.formatText(App.utils.t('updated_at'), {
        date: proj.updated.toLocaleDateString(locale)
      });
      const docsLink = proj.appDoc
        ? `<a href="docs.html?repo=${encodeURIComponent(proj.appDoc.repo)}" class="project-action" title="${App.utils.t('view_guide')}" aria-label="${App.utils.t('view_guide')}">
            <i class="fas fa-book-open"></i>
            <span>${App.utils.t('view_guide_short')}</span>
          </a>`
        : '';

      li.innerHTML = `
        <div class="project-card">
          <div class="card-header">
            <a href="${proj.url}" target="_blank" rel="noopener noreferrer" class="project-title" aria-label="Open ${App.utils.escapeHTML(proj.name)} on GitHub">
              <i class="fas fa-book-bookmark"></i>
              <span>${App.utils.escapeHTML(proj.name)}</span>
              <i class="fas fa-arrow-up-right-from-square project-title-external"></i>
            </a>
            <div class="project-actions" aria-label="Project actions">
              ${docsLink}
              <a href="stats.html?username=${App.CONFIG.githubUser}&repository=${App.utils.escapeHTML(proj.name)}" class="project-action" title="${App.utils.t('view_stats') || 'View Release Stats'}" aria-label="${App.utils.t('view_stats') || 'View Release Stats'}">
                <i class="fas fa-chart-simple"></i>
                <span>${App.utils.t('view_stats_short')}</span>
              </a>
              <button class="project-action star-history-action" type="button" data-repo="${App.utils.escapeHTML(proj.name)}" title="${App.utils.t('star_history_view')}" aria-label="${App.utils.t('star_history_view')}">
                <i class="fas fa-chart-line"></i>
                <span>${App.utils.t('star_history_view_short')}</span>
              </button>
            </div>
          </div>

          <div class="project-card-main">
            ${tags}
            <p class="project-desc">${App.utils.escapeHTML(desc)}</p>
          </div>

          <div class="card-footer">
            <div class="project-meta-bar">
              ${proj.language ? `
              <span class="project-fact language-tag">
                <span class="lang-color" style="background-color: ${langColor}"></span>
                ${App.utils.escapeHTML(proj.language)}
              </span>` : ''}
              <div class="project-stars" aria-label="${App.utils.t('star_count')}">
                <i class="fas fa-star" style="color: var(--accent-warm);"></i>
                <span>${proj.stars}</span>
              </div>
              <span class="project-fact muted">${updated}</span>
            </div>
          </div>
        </div>
      `;
      fragment.appendChild(li);
    });

    els.projectList.appendChild(fragment);
  };

  const renderTopStars = (projects) => {
    if (!els.topStars) return;
    const topProjects = [...projects].sort((a, b) => b.stars - a.stars).slice(0, App.CONFIG.topLimit);
    els.topStars.innerHTML = topProjects.map((p) => `
      <li class="sidebar-item">
        <a href="${p.url}" target="_blank" class="sidebar-item-name" title="${App.utils.escapeHTML(p.name)}">
          ${App.utils.escapeHTML(p.name)}
        </a>
        <span class="sidebar-item-meta">⭐ ${p.stars}</span>
      </li>
    `).join('');
  };

  const renderTrending = (projects, trending) => {
    if (!els.trending) return;
    els.trending.innerHTML = trending.map((p) => {
      const meta = p.delta > 0
        ? `<span class="trend-up highlight"><i class="fas fa-arrow-up"></i> ${p.delta}</span>`
        : `<span class="trend-neutral">${App.utils.t('active')}</span>`;
      return `
        <li class="sidebar-item">
          <a href="${p.url}" target="_blank" class="sidebar-item-name" title="${App.utils.escapeHTML(p.name)}">
            ${App.utils.escapeHTML(p.name)}
          </a>
          <span class="sidebar-item-meta">${meta}</span>
        </li>
      `;
    }).join('');
  };

  const renderLanguageFilters = (languages, active) => {
    if (!els.languageFilters) return;
    const allLabel = App.utils.t('filter_all');
    const chips = ['all', ...languages];
    els.languageFilters.innerHTML = chips.map((lang) => {
      const label = lang === 'all' ? allLabel : lang;
      const isActive = active === lang;
      return `
        <button class="chip ${isActive ? 'active' : ''}" data-lang="${App.utils.escapeHTML(lang)}" type="button">
          ${App.utils.escapeHTML(label)}
        </button>
      `;
    }).join('');
  };

  const renderResultMeta = (count, state) => {
    if (els.resultCount) {
      els.resultCount.textContent = App.utils.formatText(App.utils.t('results_count'), { count });
    }
    if (els.activeFilters) {
      const filters = [];
      if (state.query) filters.push(`"${state.query}"`);
      if (state.language && state.language !== 'all') filters.push(state.language);
      if (!filters.length) {
        els.activeFilters.textContent = '';
      } else {
        els.activeFilters.textContent = App.utils.formatText(App.utils.t('filters_active'), {
          filters: filters.join(' / ')
        });
      }
    }
  };

  const bindStarClickEvents = () => {
    document.querySelectorAll('.star-history-action').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const repoName = el.dataset.repo;
        if (typeof showStarModal === 'function') {
          showStarModal(repoName);
        }
      });
    });
  };

  const updateYear = () => {
    if (els.currentYear) {
      els.currentYear.textContent = new Date().getFullYear();
    }
  };

  return {
    cacheDom,
    applyTheme,
    applyLanguage,
    setView,
    showLoading,
    showError,
    renderProjects,
    renderTopStars,
    renderTrending,
    renderLanguageFilters,
    renderResultMeta,
    bindStarClickEvents,
    updateYear,
    els
  };
})();
