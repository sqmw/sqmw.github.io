window.App = window.App || {};

App.data = (() => {
  const { githubUser, excludedRepos, cacheKey, cacheTTL } = App.CONFIG;

  const restoreDates = (repos = []) => {
    return repos.map((repo) => ({
      ...repo,
      updated: new Date(repo.updated),
      created: new Date(repo.created)
    }));
  };

  const getCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      if (!cached || !cached.timestamp || !cached.data) return null;
      if (Date.now() - cached.timestamp > cacheTTL) return null;
      return cached.data;
    } catch {
      return null;
    }
  };

  const setCache = (data) => {
    const payload = { timestamp: Date.now(), data };
    localStorage.setItem(cacheKey, JSON.stringify(payload));
  };

  const normalizeRepos = (repos) => {
    return repos
      .filter((repo) => !excludedRepos.includes(repo.name))
      .map((repo) => ({
        name: repo.name,
        desc: repo.description,
        url: repo.html_url,
        language: repo.language || 'Others',
        tags: [repo.fork ? 'Fork' : null, repo.archived ? 'Archived' : null].filter(Boolean),
        stars: repo.stargazers_count,
        updated: new Date(repo.updated_at),
        created: new Date(repo.created_at)
      }));
  };

  const fetchRepos = async () => {
    const response = await fetch(
      `https://api.github.com/users/${githubUser}/repos?sort=updated&per_page=100`
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('GitHub API Rate Limit Exceeded');
      }
      throw new Error(`GitHub API Error: ${response.status}`);
    }

    const repos = await response.json();
    return normalizeRepos(repos);
  };

  const loadRepos = async () => {
    try {
      const data = await fetchRepos();
      setCache(data);
      return { data, fromCache: false };
    } catch (err) {
      const cached = getCache();
      if (cached) return { data: restoreDates(cached), fromCache: true, error: err };
      throw err;
    }
  };

  return { loadRepos, setCache, getCache, normalizeRepos };
})();
