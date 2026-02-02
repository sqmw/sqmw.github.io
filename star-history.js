/**
 * Star History 模块
 * 使用 star-history.com 嵌入图表
 */

function getStarHistoryUrl(repoFullName, type = 'Date') {
  return `https://api.star-history.com/svg?repos=${repoFullName}&type=${type}`;
}

function getStarHistoryPageUrl(repoFullName) {
  return `https://star-history.com/#${repoFullName}&Date`;
}

function showStarModal(repoName) {
  const existingModal = document.getElementById('star-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const repoFullName = `${App.CONFIG.githubUser}/${repoName}`;
  const chartUrl = getStarHistoryUrl(repoFullName);
  const pageUrl = getStarHistoryPageUrl(repoFullName);
  const title = App.utils.t('star_history_title');
  const viewText = App.utils.t('star_history_view');
  const noDataText = App.utils.t('star_history_no_data');

  const modal = document.createElement('div');
  modal.id = 'star-modal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content star-history-modal">
      <span class="close-btn">&times;</span>
      <div class="star-chart-container">
        <h3>⭐ ${repoName} ${title}</h3>

        <div class="chart-wrapper">
          <div id="chart-loading" class="loading-spinner">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
          </div>

          <img 
            src="${chartUrl}" 
            alt="${repoName} Star History Chart"
            class="star-history-chart"
            style="display: none;" 
            onload="document.getElementById('chart-loading').style.display='none'; this.style.display='block';"
            onerror="document.getElementById('chart-loading').style.display='none'; this.parentElement.innerHTML='<p class=\\'no-data\\'>${noDataText}</p>';"
          />
        </div>

        <div class="chart-actions">
          <a href="${pageUrl}" target="_blank" class="view-full-btn">
            🔗 ${viewText}
          </a>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.close-btn').onclick = () => modal.remove();

  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };

  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}
