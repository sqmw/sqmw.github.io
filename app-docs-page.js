window.App = window.App || {};

App.docsPage = (() => {
  const els = {};

  const cacheDom = () => {
    els.title = document.getElementById('doc-title');
    els.summary = document.getElementById('doc-summary');
    els.content = document.getElementById('doc-content');
    els.githubLink = document.getElementById('doc-github-link');
    els.statsLink = document.getElementById('doc-stats-link');
    els.themeToggle = document.getElementById('theme-toggle');
    els.currentYear = document.getElementById('current-year');
  };

  const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[-_\s]+/g, '');

  const findDoc = (docs, query) => {
    const key = normalizeKey(query);
    return docs.find((doc) => {
      const keys = [doc.repo, doc.slug, ...(doc.aliases || [])].map(normalizeKey);
      return keys.includes(key);
    });
  };

  const renderInline = (value) => {
    let html = App.utils.escapeHTML(value);

    // Extract code spans first so we don't parse links/bold inside them.
    const codeSpans = [];
    html = html.replace(/`([^`]+)`/g, (_match, code) => {
      const index = codeSpans.length;
      codeSpans.push(`<code>${code}</code>`);
      return `\u0000CODE${index}\u0000`;
    });

    // Autolinks: <https://example.com>
    html = html.replace(/&lt;(https?:\/\/[^\s]+?)&gt;/g, (_match, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
      const normalizedUrl = String(url || '').trim();
      const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(normalizedUrl);
      const isSafe = !hasScheme || /^(https?:|mailto:)/i.test(normalizedUrl);
      if (!isSafe) return text;
      return `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    html = html.replace(/\u0000CODE(\d+)\u0000/g, (_match, index) => codeSpans[Number(index)] || '');
    return html;
  };

  const renderMarkdown = (markdown) => {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const output = [];
    let paragraph = [];
    let listType = null;
    let inCode = false;
    let codeLines = [];
    let codeLang = '';

    const flushParagraph = () => {
      if (!paragraph.length) return;
      output.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
      paragraph = [];
    };

    const flushList = () => {
      if (!listType) return;
      output.push(`</${listType}>`);
      listType = null;
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (inCode) {
          output.push(`<pre><code class="language-${App.utils.escapeHTML(codeLang)}">${App.utils.escapeHTML(codeLines.join('\n'))}</code></pre>`);
          inCode = false;
          codeLines = [];
          codeLang = '';
        } else {
          flushParagraph();
          flushList();
          inCode = true;
          codeLang = trimmed.slice(3).trim();
        }
        return;
      }

      if (inCode) {
        codeLines.push(line);
        return;
      }

      if (!trimmed) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        flushParagraph();
        flushList();
        const level = heading[1].length;
        output.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
        return;
      }

      if (/^---+$/.test(trimmed)) {
        flushParagraph();
        flushList();
        output.push('<hr>');
        return;
      }

      const unordered = trimmed.match(/^[-*]\s+(.+)$/);
      if (unordered) {
        flushParagraph();
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
          output.push('<ul>');
        }
        output.push(`<li>${renderInline(unordered[1])}</li>`);
        return;
      }

      const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
      if (ordered) {
        flushParagraph();
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
          output.push('<ol>');
        }
        output.push(`<li>${renderInline(ordered[1])}</li>`);
        return;
      }

      if (trimmed.startsWith('> ')) {
        flushParagraph();
        flushList();
        output.push(`<blockquote>${renderInline(trimmed.slice(2))}</blockquote>`);
        return;
      }

      paragraph.push(trimmed);
    });

    flushParagraph();
    flushList();
    return output.join('\n');
  };

  const showError = (message) => {
    els.content.innerHTML = `<div class="error">${App.utils.escapeHTML(message)}</div>`;
  };

  const applyTheme = (theme) => {
    document.body.setAttribute('data-theme', theme);
    const icon = els.themeToggle.querySelector('i');
    if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  };

  const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    els.themeToggle.addEventListener('click', () => {
      const nextTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', nextTheme);
      applyTheme(nextTheme);
    });
  };

  const init = async () => {
    cacheDom();
    if (els.currentYear) els.currentYear.textContent = new Date().getFullYear();
    initTheme();

    const params = new URLSearchParams(window.location.search);
    const query = params.get('repo') || params.get('app') || params.get('slug');
    if (!query) {
      showError('缺少文档参数，请从项目主页进入。');
      return;
    }

    try {
      const indexResponse = await fetch('app-docs.json', { cache: 'no-cache' });
      if (!indexResponse.ok) throw new Error('文档索引加载失败');
      const docs = await indexResponse.json();
      const doc = findDoc(docs, query);
      if (!doc) throw new Error('暂未找到该项目的使用文档');

      els.title.textContent = doc.title;
      els.summary.textContent = doc.summary || '';
      els.githubLink.href = doc.githubUrl;
      els.statsLink.href = doc.statsUrl;
      document.title = `${doc.title} - ksun22515`;

      const markdownResponse = await fetch(doc.docPath, { cache: 'no-cache' });
      if (!markdownResponse.ok) throw new Error('文档内容加载失败');
      const markdown = await markdownResponse.text();
      els.content.innerHTML = renderMarkdown(markdown);
    } catch (error) {
      showError(error.message);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
