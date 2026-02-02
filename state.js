window.App = window.App || {};

App.store = (() => {
  const listeners = new Set();
  const state = {
    lang: localStorage.getItem('lang') || 'zh',
    theme: localStorage.getItem('theme') || 'light',
    view: localStorage.getItem('view') || 'grid',
    sort: localStorage.getItem('sort') || 'stars',
    query: '',
    language: 'all',
    projects: []
  };

  const get = () => ({ ...state });

  const set = (patch) => {
    Object.assign(state, patch);
    listeners.forEach((listener) => listener(get()));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { get, set, subscribe };
})();
