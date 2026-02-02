// GitHub 用户名
const GITHUB_USERNAME = 'sqmw';
// 过滤掉的仓库名
const EXCLUDED_REPOS = ['sqmw.github.io'];

// I18n 配置
const I18N = {
  zh: {
    header_desc: '✨ 欢迎来到我的项目主页！这里收录了我的主要项目，欢迎浏览和搜索。',
    search_placeholder: '搜索项目 (名称、描述、语言)...',
    hot_projects: '🔥 热门项目 (Top Stars)',
    trending: '📈 趋势榜 (Trending)',
    loading: '加载中...',
    no_projects: '没有找到相关项目。',
    error_tip: '请检查网络连接，或稍后刷新页面重试',
    repo_desc: '暂无描述',
    lang_others: '其他',
    active: '活跃'
  },
  en: {
    header_desc: '✨ Welcome to my project portfolio! Browse and search my open source work.',
    search_placeholder: 'Search projects (name, desc, language)...',
    hot_projects: '🔥 Top Stars',
    trending: '📈 Trending',
    loading: 'Loading...',
    no_projects: 'No projects found.',
    error_tip: 'Check your connection or refresh later',
    repo_desc: 'No description provided',
    lang_others: 'Others',
    active: 'Active'
  }
};

// 状态管理
const STATE = {
  lang: localStorage.getItem('lang') || 'zh', // 'zh' or 'en'
  theme: localStorage.getItem('theme') || 'light', // 'light' or 'dark'
  projects: [] // 缓存项目数据
};

// 语言颜色映射
const LANGUAGE_COLORS = {
  'JavaScript': '#f1e05a',
  'TypeScript': '#2b7489',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Python': '#3572A5',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C': '#555555',
  'Dart': '#00B4AB',
  'Vue': '#41b883',
  'Shell': '#89e051',
  'Others': '#8e908c'
};

// --- 功能函数 ---

function getLanguageColor(lang) {
  return LANGUAGE_COLORS[lang] || LANGUAGE_COLORS['Others'];
}

function t(key) {
  return I18N[STATE.lang][key] || key;
}

// 应用主题
function applyTheme() {
  document.body.setAttribute('data-theme', STATE.theme);
  const icon = document.querySelector('#theme-toggle i');
  if (icon) {
    icon.className = STATE.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }
}

// 应用语言
function applyLanguage() {
  const lang = STATE.lang;

  // 更新按钮文字
  const langText = document.querySelector('#lang-toggle .lang-text');
  if (langText) {
    langText.textContent = lang === 'zh' ? 'EN' : '中';
  }

  // 更新所有带 data-i18n 的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  // 更新 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });

  // 重新渲染列表
  if (STATE.projects.length > 0) {
    renderProjects(STATE.projects);
    renderTopStars(STATE.projects);
    renderTrending(STATE.projects);
  }
}

// 切换主题
function toggleTheme() {
  STATE.theme = STATE.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', STATE.theme);
  applyTheme();
}

// 切换语言
function toggleLanguage() {
  STATE.lang = STATE.lang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', STATE.lang);
  applyLanguage();
}

// 显示加载状态
function showLoading() {
  const ul = document.getElementById('project-list');
  if (ul) {
    ul.innerHTML = `<li class="loading">${t('loading')}</li>`;
  }
}

// 显示错误信息
function showError(message) {
  const ul = document.getElementById('project-list');
  if (ul) {
    ul.innerHTML = `
      <li class="error">
        <div>❌ ${message}</div>
        <div class="error-tip">${t('error_tip')}</div>
      </li>
    `;
  }
}

// --- 数据处理 ---

// 获取 GitHub 仓库列表
async function fetchGitHubRepos() {
  const response = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API Rate Limit Exceeded');
    }
    throw new Error(`GitHub API Error: ${response.status}`);
  }

  const repos = await response.json();

  return repos
    .filter(repo => !EXCLUDED_REPOS.includes(repo.name))
    .map(repo => ({
      name: repo.name,
      desc: repo.description,
      url: repo.html_url,
      language: repo.language || 'Others',
      tags: [
        repo.fork ? 'Fork' : null,
        repo.archived ? 'Archived' : null,
      ].filter(Boolean),
      stars: repo.stargazers_count,
      updated: new Date(repo.updated_at),
      created: new Date(repo.created_at)
    }));
}

// --- Trending 逻辑 (Snapshot) ---
const SNAPSHOT_KEY = 'repo_stars_snapshot';

function getStarsSnapshot() {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOT_KEY)) || {};
  } catch {
    return {};
  }
}

function saveStarsSnapshot(projects) {
  const snapshot = {};
  projects.forEach(p => snapshot[p.name] = p.stars);
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

// 计算 Trending
function calculateTrending(projects) {
  const lastSnapshot = getStarsSnapshot();

  // 计算增量
  const trendingList = projects.map(p => {
    const lastStars = lastSnapshot[p.name] !== undefined ? lastSnapshot[p.name] : p.stars; // 如果是新项目，delta=0
    return {
      ...p,
      delta: p.stars - lastStars
    };
  });

  // 保存最新的快照 (为下次访问做准备)
  saveStarsSnapshot(projects);

  // 排序策略
  // 1. 优先展示 delta > 0 的项目 (增长得快)
  // 2. 如果没有增长, 使用 updated 时间兜底 (最近活跃)
  return trendingList.sort((a, b) => {
    if (a.delta !== b.delta) return b.delta - a.delta; // 增量降序
    return b.updated - a.updated; // 更新时间降序
  }).slice(0, 5);
}

// --- 渲染逻辑 ---

// 渲染项目列表 (网格卡片)
function renderProjects(list) {
  const ul = document.getElementById('project-list');
  if (!ul) return;
  ul.innerHTML = '';

  if (list.length === 0) {
    ul.innerHTML = `<li class="loading">${t('no_projects')}</li>`;
    return;
  }

  list.forEach(proj => {
    const li = document.createElement('li');
    li.className = 'project-card-wrapper';

    const langColor = getLanguageColor(proj.language);
    const desc = proj.desc || t('repo_desc');

    li.innerHTML = `
      <div class="project-card">
        <div class="card-header">
          <a href="${proj.url}" target="_blank" class="project-title">
            <i class="fas fa-book-bookmark"></i> ${proj.name}
          </a>
        </div>
        
        <p class="project-desc">${desc}</p>
        
        <div class="card-footer">
          <div class="project-meta">
            <span class="language-tag">
              <span class="lang-color" style="background-color: ${langColor}"></span>
              ${proj.language}
            </span>
            <span class="star-count clickable" data-repo="${proj.name}" title="Click to view Star History">
              <i class="fas fa-star" style="color: #f0ad4e;"></i> ${proj.stars}
              <i class="fas fa-chart-line star-action-icon"></i>
            </span>
          </div>
        </div>
      </div>
    `;
    ul.appendChild(li);
  });

  bindStarClickEvents();
}

function bindStarClickEvents() {
  document.querySelectorAll('.star-count.clickable').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const repoName = el.dataset.repo;
      if (typeof showStarModal === 'function') {
        showStarModal(repoName);
      }
    });
  });
}

// 渲染 Sidebar：Top Stars
function renderTopStars(projects) {
  const ul = document.getElementById('top-stars-list');
  if (!ul) return;

  const topProjects = [...projects]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 5);

  ul.innerHTML = topProjects.map(p => `
    <li class="sidebar-item">
      <a href="${p.url}" target="_blank" class="sidebar-item-name" title="${p.name}">
        ${p.name}
      </a>
      <span class="sidebar-item-meta">
        ⭐ ${p.stars}
      </span>
    </li>
  `).join('');
}

// 渲染 Sidebar：Trending (趋势)
function renderTrending(projects) {
  const ul = document.getElementById('trending-list');
  if (!ul) return;

  const topTrending = calculateTrending(projects);

  ul.innerHTML = topTrending.map(p => {
    // 如果有增长，显示 +N ⭐，否则显示 Active
    const meta = p.delta > 0
      ? `<span class="trend-up highlight">i<i class="fas fa-arrow-up"></i> ${p.delta}</span>`
      : `<span class="trend-neutral">${t('active')}</span>`;

    return `
      <li class="sidebar-item">
        <a href="${p.url}" target="_blank" class="sidebar-item-name" title="${p.name}">
          ${p.name}
        </a>
        <span class="sidebar-item-meta">
          ${meta}
        </span>
      </li>
    `;
  }).join('');
}

// 搜索过滤
function setupSearch(projects) {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;

  searchInput.addEventListener('input', function () {
    const keyword = this.value.toLowerCase();
    const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      (p.desc && p.desc.toLowerCase().includes(keyword)) ||
      p.language.toLowerCase().includes(keyword)
    );
    renderProjects(filtered);
  });
}

// 初始化函数
async function init() {
  const themeBtn = document.getElementById('theme-toggle');
  const langBtn = document.getElementById('lang-toggle');

  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  if (langBtn) langBtn.addEventListener('click', toggleLanguage);

  applyTheme();
  applyLanguage();
  showLoading();

  try {
    const projects = await fetchGitHubRepos();
    STATE.projects = projects;

    renderProjects(projects);
    renderTopStars(projects);
    renderTrending(projects);
    setupSearch(projects);
  } catch (error) {
    console.error('Initial load failed:', error);
    showError(error.message);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}