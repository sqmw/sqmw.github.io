window.App = window.App || {};

App.utils = (() => {
  const escapeHTML = (value) => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const t = (key) => {
    const lang = App.store ? App.store.get().lang : 'zh';
    return (App.I18N[lang] && App.I18N[lang][key]) || key;
  };

  const formatText = (template, vars) => {
    return Object.keys(vars).reduce((result, key) => {
      return result.replace(new RegExp(`\\{${key}\\}`, 'g'), vars[key]);
    }, template);
  };

  const debounce = (fn, delay = 200) => {
    let timer = null;
    return (...args) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  return { escapeHTML, t, formatText, debounce };
})();
