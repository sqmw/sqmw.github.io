let projects = [];
fetch('projects.json')
  .then(res => res.json())
  .then(data => {
    projects = data;
    renderProjects(projects);
  });

function renderProjects(list) {
  const ul = document.getElementById('project-list');
  ul.innerHTML = '';
  if (list.length === 0) {
    ul.innerHTML = '<li>没有找到相关项目。</li>';
    return;
  }
  list.forEach(proj => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${proj.url}" target="_blank">${proj.name}</a> <span style="margin-left:8px;color:#888;font-size:0.95em;">${proj.tags ? proj.tags.join(', ') : ''}</span><div style="margin-top:4px;">${proj.desc}</div>`;
    ul.appendChild(li);
  });
}

document.getElementById('search').addEventListener('input', function() {
  const keyword = this.value.toLowerCase();
  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(keyword) ||
    p.desc.toLowerCase().includes(keyword) ||
    (p.tags && p.tags.join(' ').toLowerCase().includes(keyword))
  );
  renderProjects(filtered);
}); 