// Basic stats logic
// Reusing some App structure if possible, but keeping it simple and standalone for this page
window.App = window.App || {};

App.stats = (() => {
    const els = {
        form: document.getElementById('stats-form'),
        username: document.getElementById('username'),
        repository: document.getElementById('repository'),
        loading: document.getElementById('loading'),
        content: document.getElementById('stats-content'),
        error: document.getElementById('error-msg'),
        subtitle: document.getElementById('repo-subtitle'),
        totalDownloads: document.getElementById('total-downloads'),
        latestVersion: document.getElementById('latest-version'),
        totalReleases: document.getElementById('total-releases'),
        tableBody: document.getElementById('stats-table-body'),
        themeToggle: document.getElementById('theme-toggle'),
        currentYear: document.getElementById('current-year'),
    };

    let charts = {};

    const init = () => {
        // Theme init
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        if (els.themeToggle) {
            els.themeToggle.addEventListener('click', toggleTheme);
        }
        if (els.currentYear) {
            els.currentYear.textContent = new Date().getFullYear();
        }

        // Parse Params
        const urlParams = new URLSearchParams(window.location.search);
        const user = urlParams.get('username');
        const repo = urlParams.get('repository');

        if (user && repo) {
            els.username.value = user;
            els.repository.value = repo;
            fetchStats(user, repo);
        }

        els.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const u = els.username.value.trim();
            const r = els.repository.value.trim();
            if (u && r) {
                // Update URL without reload
                const newUrl = `${window.location.pathname}?username=${u}&repository=${r}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
                fetchStats(u, r);
            }
        });
    };

    const toggleTheme = () => {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
        // Update charts if needed (colors)
        if (charts.downloads) {
            charts.downloads.update(); // Simplistic update
        }
    };

    const updateThemeIcon = (theme) => {
        const icon = els.themeToggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    };

    const fetchStats = async (user, repo) => {
        showLoading(true);
        showError(null);
        els.content.style.display = 'none';
        els.subtitle.textContent = `${user} / ${repo}`;

        try {
            const response = await fetch(`https://api.github.com/repos/${user}/${repo}/releases?per_page=100`);
            if (!response.ok) {
                if (response.status === 404) throw new Error('Repository or Releases not found.');
                throw new Error(`GitHub API Error: ${response.status}`);
            }
            const data = await response.json();
            processData(data);
        } catch (err) {
            showError(err.message);
        } finally {
            showLoading(false);
        }
    };

    const processData = (releases) => {
        if (!releases || releases.length === 0) {
            showError('No releases found for this repository.');
            return;
        }

        let totalDownloads = 0;
        const releaseStats = [];

        releases.forEach(release => {
            let releaseDownloads = 0;
            const assets = release.assets.map(asset => {
                releaseDownloads += asset.download_count;
                return {
                    name: asset.name,
                    downloads: asset.download_count,
                    size: asset.size,
                    updated: asset.updated_at
                };
            });
            
            totalDownloads += releaseDownloads;
            releaseStats.push({
                name: release.name || release.tag_name,
                tag: release.tag_name,
                date: new Date(release.published_at),
                downloads: releaseDownloads,
                assets: assets,
                url: release.html_url
            });
        });

        // Update Summary
        els.totalDownloads.textContent = totalDownloads.toLocaleString();
        els.totalReleases.textContent = releases.length;
        els.latestVersion.textContent = releaseStats[0].tag; // Assuming sorted by date desc from API

        renderCharts(releaseStats);
        renderTable(releaseStats);
        els.content.style.display = 'block';
    };

    const renderCharts = (data) => {
        const ctx = document.getElementById('downloadsChart').getContext('2d');
        
        // Prepare data: reverse to show oldest to newest left to right if desired, 
        // or just top 10 recent. Let's do all releases, newest first (standard array order).
        // Actually charts are often better oldest -> newest.
        const reversed = [...data].reverse();

        const labels = reversed.map(d => d.tag);
        const counts = reversed.map(d => d.downloads);

        if (charts.downloads) {
            charts.downloads.destroy();
        }

        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const color = isDark ? '#7aa2ff' : '#2563eb';

        charts.downloads = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Downloads',
                    data: counts,
                    backgroundColor: color,
                    borderColor: color,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            color: isDark ? '#9aa3b2' : '#5b6472'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: isDark ? '#9aa3b2' : '#5b6472'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: isDark ? '#e5e7eb' : '#1f2328'
                        }
                    }
                }
            }
        });
    };

    const renderTable = (data) => {
        els.tableBody.innerHTML = '';
        data.forEach(release => {
            const tr = document.createElement('tr');
            
            const dateStr = release.date.toLocaleDateString();
            
            let assetsHtml = '<ul class="asset-list">';
            release.assets.forEach(asset => {
                assetsHtml += `
                    <li>
                        <span class="asset-name">${asset.name}</span>
                        <span class="asset-count">${asset.downloads.toLocaleString()}</span>
                    </li>
                `;
            });
            assetsHtml += '</ul>';

            tr.innerHTML = `
                <td>
                    <div class="release-name">
                        <a href="${release.url}" target="_blank">${release.name}</a>
                    </div>
                    <div class="release-tag"><i class="fas fa-tag"></i> ${release.tag}</div>
                </td>
                <td class="whitespace-nowrap">${dateStr}</td>
                <td>${assetsHtml}</td>
                <td class="text-bold">${release.downloads.toLocaleString()}</td>
            `;
            els.tableBody.appendChild(tr);
        });
    };

    const showLoading = (isLoading) => {
        els.loading.style.display = isLoading ? 'flex' : 'none';
    };

    const showError = (msg) => {
        if (msg) {
            els.error.textContent = msg;
            els.error.style.display = 'block';
        } else {
            els.error.style.display = 'none';
        }
    };

    return { init };
})();

document.addEventListener('DOMContentLoaded', App.stats.init);
