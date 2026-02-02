window.App = window.App || {};

App.main = (() => {
  const init = async () => {
    App.ui.cacheDom();
    App.ui.updateYear();

    const state = App.store.get();
    App.ui.applyTheme(state.theme);
    App.ui.applyLanguage();
    App.ui.setView(state.view);
    if (App.ui.els.sortSelect) {
      App.ui.els.sortSelect.value = state.sort;
    }
    App.ui.showLoading();
    App.controller.bindControls();

    const loadAndRender = async () => {
      try {
        const result = await App.data.loadRepos();
        App.store.set({ projects: result.data });
        App.controller.renderSidebars(result.data);
        const languages = App.controller.getLanguages(result.data);
        App.ui.renderLanguageFilters(languages, App.store.get().language);
        App.controller.refresh();
      } catch (error) {
        console.error('Initial load failed:', error);
        App.ui.showError(error.message);
      }
    };

    await loadAndRender();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
