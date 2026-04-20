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
        const [result, appDocs] = await Promise.all([
          App.data.loadRepos(),
          App.data.loadAppDocs()
        ]);
        const projects = App.data.attachAppDocs(result.data, appDocs);
        App.store.set({ projects });
        App.controller.renderSidebars(projects);
        const languages = App.controller.getLanguages(projects);
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
