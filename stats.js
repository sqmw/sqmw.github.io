// Basic stats logic
// Reusing some App structure if possible, but keeping it simple and standalone for this page
window.App = window.App || {};

App.stats = (() => {
    const PLATFORM_CONFIG = [
        {
            key: 'windows',
            label: 'Windows',
            matcher: /(?:^|[^a-z])(win(?:dows)?|msi|exe)(?:[^a-z]|$)|x64|x86|amd64/i
        },
        {
            key: 'macos',
            label: 'macOS',
            matcher: /(?:^|[^a-z])(mac(?:os)?|osx|darwin|dmg|pkg)(?:[^a-z]|$)|arm64|universal/i
        },
        {
            key: 'linux',
            label: 'Linux',
            matcher: /(?:^|[^a-z])(linux|appimage|deb|rpm|snap|apk)(?:[^a-z]|$)/i
        }
    ];

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

    const getPlatformMeta = (assetName) => {
        const normalized = String(assetName || '').toLowerCase();
        return PLATFORM_CONFIG.find((platform) => platform.matcher.test(normalized)) || {
            key: 'other',
            label: 'Other'
        };
    };

    const aggregatePlatformDownloads = (assets) => {
        const platformMap = new Map();

        assets.forEach((asset) => {
            const platform = getPlatformMeta(asset.name);
            const current = platformMap.get(platform.key) || {
                key: platform.key,
                label: platform.label,
                downloads: 0,
                assets: []
            };

            current.downloads += asset.downloads;
            current.assets.push(asset.name);
            platformMap.set(platform.key, current);
        });

        return Array.from(platformMap.values()).sort((left, right) => right.downloads - left.downloads);
    };

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
            const platformDownloads = aggregatePlatformDownloads(assets);

            totalDownloads += releaseDownloads;
            releaseStats.push({
                name: release.name || release.tag_name,
                tag: release.tag_name,
                date: new Date(release.published_at),
                downloads: releaseDownloads,
                platformDownloads: platformDownloads,
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
            const releaseName = App.utils.escapeHTML(release.name);
            const releaseTag = App.utils.escapeHTML(release.tag);
            const releaseUrl = App.utils.escapeHTML(release.url);

            let assetsHtml = '<ul class="asset-list">';
            release.assets.forEach(asset => {
                const assetName = App.utils.escapeHTML(asset.name);
                assetsHtml += `
                    <li>
                        <span class="asset-name">${assetName}</span>
                    </li>
                `;
            });
            assetsHtml += '</ul>';

            let downloadsHtml = '<ul class="download-breakdown-list">';
            release.platformDownloads.forEach((platform) => {
                const platformLabel = App.utils.escapeHTML(platform.label);
                downloadsHtml += `
                    <li>
                        <span class="download-platform">${platformLabel}</span>
                        <span class="download-count">${platform.downloads.toLocaleString()}</span>
                    </li>
                `;
            });
            downloadsHtml += `
                <li class="download-total-row">
                    <span class="download-platform">Total</span>
                    <span class="download-count">${release.downloads.toLocaleString()}</span>
                </li>
            </ul>`;

            tr.innerHTML = `
                <td class="stats-col-release">
                    <div class="release-name">
                        <a href="${releaseUrl}" target="_blank" rel="noopener noreferrer">${releaseName}</a>
                    </div>
                    <div class="release-tag"><i class="fas fa-tag"></i> ${releaseTag}</div>
                </td>
                <td class="whitespace-nowrap stats-col-date">${dateStr}</td>
                <td class="stats-col-assets">${assetsHtml}</td>
                <td class="stats-col-downloads">${downloadsHtml}</td>
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
