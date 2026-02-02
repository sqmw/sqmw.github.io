// GitHub 用户名
const GITHUB_USERNAME = 'sqmw';

// 获取 GitHub 仓库列表
async function fetchGitHubRepos() {
  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`
    );

    if (!response.ok) {
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
  } catch (error) {
    console.error('获取仓库失败:', error);
    return [];
  }
}

// 渲染项目列表
function renderProjects(list) {
  const ul = document.getElementById('project-list');
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
      const repoName = el.dataset.repo;
      showStarModal(repoName);
    });
  });
}

// 搜索过滤
function setupSearch(projects) {
  document.getElementById('search').addEventListener('input', function () {
    const keyword = this.value.toLowerCase();
    const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.desc.toLowerCase().includes(keyword) ||
      (p.tags && p.tags.join(' ').toLowerCase().includes(keyword))
    );
    renderProjects(filtered);
  });
}

// 初始化
let allProjects = [];

fetchGitHubRepos().then(projects => {
  allProjects = projects;

  // 记录今天的 star 数据
  recordAllStars(projects);

  renderProjects(projects);
  setupSearch(projects);
});