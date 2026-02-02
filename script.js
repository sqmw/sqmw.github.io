// GitHub 用户名
const GITHUB_USERNAME = 'sqmw';

// 显示加载状态
function showLoading() {
  const ul = document.getElementById('project-list');
  if (ul) {
    ul.innerHTML = '<li class="loading">⏳ 正在加载项目列表...</li>';
  }
}

// 显示错误信息
function showError(message) {
  const ul = document.getElementById('project-list');
  if (ul) {
    ul.innerHTML = `
      <li class="error">
        <div>❌ ${message}</div>
        <div class="error-tip">请检查网络连接，或稍后刷新页面重试</div>
      </li>
    `;
  }
}

// 获取 GitHub 仓库列表
async function fetchGitHubRepos() {
  const response = await fetch(
    `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('GitHub API 请求次数超限，请稍后重试');
    } else if (response.status === 404) {
      throw new Error(`用户 ${GITHUB_USERNAME} 不存在`);
    }
    throw new Error(`GitHub API 错误: ${response.status}`);
  }

  const repos = await response.json();

  return repos.map(repo => ({
    name: repo.name,
    desc: repo.description || '暂无描述',
    url: repo.html_url,
    tags: [
      repo.language,
      repo.fork ? 'Fork' : null,
      repo.archived ? '已归档' : null,
    ].filter(Boolean),
    stars: repo.stargazers_count,
    updated: repo.updated_at
  }));
}

// 渲染项目列表
function renderProjects(list) {
  const ul = document.getElementById('project-list');
  if (!ul) return;

  ul.innerHTML = '';

  if (list.length === 0) {
    ul.innerHTML = '<li>没有找到相关项目。</li>';
    return;
  }

  list.forEach(proj => {
    const li = document.createElement('li');
    const tagsHtml = proj.tags.length > 0
      ? `<span class="tags">${proj.tags.join(', ')}</span>`
      : '';

    // Star 按钮 - 点击显示趋势图
    const starsHtml = `<span class="stars clickable" data-repo="${proj.name}">⭐ ${proj.stars}</span>`;

    li.innerHTML = `
      <a href="${proj.url}" target="_blank">${proj.name}</a>
      ${starsHtml}
      ${tagsHtml}
      <div class="desc">${proj.desc}</div>
    `;
    ul.appendChild(li);
  });

  // 绑定 star 点击事件
  document.querySelectorAll('.stars.clickable').forEach(el => {
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

// 搜索过滤
function setupSearch(projects) {
  const searchInput = document.getElementById('search');
  if (!searchInput) return;

  searchInput.addEventListener('input', function () {
    const keyword = this.value.toLowerCase();
    const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.desc.toLowerCase().includes(keyword) ||
      (p.tags && p.tags.join(' ').toLowerCase().includes(keyword))
    );
    renderProjects(filtered);
  });
}

// 全局变量存储所有项目
let allProjects = [];

// 初始化函数
async function init() {
  showLoading();

  try {
    const projects = await fetchGitHubRepos();
    allProjects = projects;
    renderProjects(projects);
    setupSearch(projects);
  } catch (error) {
    console.error('初始化失败:', error);
    showError(error.message);
  }
}

// 确保 DOM 加载完成后再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}