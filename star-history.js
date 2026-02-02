/**
 * Star History 模块
 * 使用 star-history.com 嵌入图表
 * 注意：GITHUB_USERNAME 由 script.js 定义
 */

// 生成 star-history.com 的图表 URL
function getStarHistoryUrl(repoFullName, type = 'Date') {
  // star-history.com 图片格式
  // type: Date（按日期）或 Timeline（按时间线）
  return `https://api.star-history.com/svg?repos=${repoFullName}&type=${type}`;
}

// 生成 star-history.com 的页面链接
function getStarHistoryPageUrl(repoFullName) {
  return `https://star-history.com/#${repoFullName}&Date`;
}

// 显示 Star History 模态框
function showStarModal(repoName) {
  // 移除已存在的模态框
  const existingModal = document.getElementById('star-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const repoFullName = `${GITHUB_USERNAME}/${repoName}`;
  const chartUrl = getStarHistoryUrl(repoFullName);
  const pageUrl = getStarHistoryPageUrl(repoFullName);

  const modal = document.createElement('div');
  modal.id = 'star-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content star-history-modal">
      <span class="close-btn">&times;</span>
      <div class="star-chart-container">
        <h3>⭐ ${repoName} Star History</h3>
        <div class="chart-wrapper">
          <img 
            src="${chartUrl}" 
            alt="${repoName} Star History Chart"
            class="star-history-chart"
            onerror="this.onerror=null; this.parentElement.innerHTML='<p class=\\'no-data\\'>该项目暂无 star 历史数据</p>';"
          />
        </div>
        <div class="chart-actions">
          <a href="${pageUrl}" target="_blank" class="view-full-btn">
            🔗 在 star-history.com 查看详情
          </a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 关闭按钮
  modal.querySelector('.close-btn').onclick = () => modal.remove();

  // 点击背景关闭
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  // ESC 键关闭
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}
