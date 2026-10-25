// AI 资讯：读取 /data/news.json 并渲染（首页预览 + /news 页面）
(function () {
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null && text !== '') e.textContent = text;
    return e;
  }
  function safeUrl(u) {
    try { const x = new URL(u); return x.protocol === 'https:' ? x.href : null; }
    catch (_) { return null; }
  }
  function fmtDate(d) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
    return m ? `${m[1]} 年 ${+m[2]} 月 ${+m[3]} 日` : d;
  }
  function stars(n) {
    return (typeof n === 'number' && n >= 0) ? '+' + n.toLocaleString('en-US') : '';
  }
  function linkTo(url, text, cls) {
    const u = safeUrl(url);
    const a = el('a', cls || 'link', text);
    if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener nofollow'; }
    return a;
  }

  function newsCard(it) {
    const c = el('article', 'card news-card');
    const top = el('div', 'opp-top');
    top.appendChild(el('span', 'tag t-indigo', 'AI 软件'));
    if (it.date) top.appendChild(el('span', 'news-date', it.date));
    c.appendChild(top);
    c.appendChild(el('h3', '', it.title));
    c.appendChild(el('p', 'news-desc', it.desc));
    if (it.note) c.appendChild(el('p', 'opp-note', it.note));
    const foot = el('div', 'opp-foot');
    foot.appendChild(linkTo(it.url, '官方来源 ↗'));
    if (it.source) foot.appendChild(el('span', 'src', it.source));
    c.appendChild(foot);
    return c;
  }

  function repoCard(it, rank) {
    const c = el('article', 'card repo-card');
    const top = el('div', 'opp-top');
    top.appendChild(el('span', 'repo-rank', '#' + rank));
    const s = stars(it.stars_today);
    if (s) top.appendChild(el('span', 'star-badge', '★ ' + s + ' 今日'));
    c.appendChild(top);
    const parts = (it.repo || '').split('/');
    const h = el('h3', 'repo-name');
    if (parts.length === 2) {
      h.appendChild(el('span', 'repo-owner', parts[0] + ' / '));
      h.appendChild(document.createTextNode(parts[1]));
    } else h.textContent = it.repo;
    c.appendChild(h);
    c.appendChild(el('p', 'news-desc', it.desc));
    if (it.note) c.appendChild(el('p', 'opp-note', it.note));
    const foot = el('div', 'opp-foot');
    foot.appendChild(linkTo(it.url, '查看仓库 ↗'));
    foot.appendChild(el('span', 'src', 'GitHub'));
    c.appendChild(foot);
    return c;
  }

  async function load() {
    const r = await fetch('/data/news.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    return (d.days || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  // 首页预览：左列 AI 软件标题，右列 GitHub 热门
  async function renderPreview() {
    const sec = document.getElementById('news');
    try {
      const days = await load();
      const day = days[0];
      if (!day) { sec.hidden = true; return; }
      document.getElementById('newsDate').textContent = fmtDate(day.date);
      document.getElementById('newsSummary').textContent = day.summary || '';
      const sw = document.getElementById('newsPreviewSoftware');
      (day.software || []).slice(0, 3).forEach(it => {
        const li = el('li');
        li.appendChild(linkTo(it.url, it.title, 'np-title'));
        li.appendChild(el('p', '', it.desc));
        sw.appendChild(li);
      });
      if (!(day.software || []).length) sw.appendChild(el('li', 'np-empty', '今天没有收录新的软件动态。'));
      const gh = document.getElementById('newsPreviewGithub');
      (day.github || []).slice(0, 4).forEach(it => {
        const li = el('li');
        li.appendChild(linkTo(it.url, it.repo, 'np-title mono'));
        const s = stars(it.stars_today);
        if (s) li.appendChild(el('span', 'star-badge sm', '★ ' + s));
        gh.appendChild(li);
      });
      if (!(day.github || []).length) gh.appendChild(el('li', 'np-empty', '今天没有收录热门项目。'));
    } catch (e) { sec.hidden = true; }
  }

  // /news 页面
  async function renderPage() {
    const dateEl = document.getElementById('newsDayDate');
    const sumEl = document.getElementById('newsDaySummary');
    const swGrid = document.getElementById('softwareGrid');
    const ghGrid = document.getElementById('githubGrid');
    const ghSrc = document.getElementById('githubSource');
    const archive = document.getElementById('newsArchive');
    try {
      const days = await load();
      if (!days.length) { sumEl.textContent = '暂时还没有内容，敬请期待。'; return; }
      const want = new URLSearchParams(location.search).get('date');
      function show(day) {
        dateEl.textContent = fmtDate(day.date);
        sumEl.textContent = day.summary || '';
        swGrid.innerHTML = ''; ghGrid.innerHTML = '';
        (day.software || []).forEach(it => swGrid.appendChild(newsCard(it)));
        (day.github || []).forEach((it, i) => ghGrid.appendChild(repoCard(it, i + 1)));
        document.getElementById('softwareEmpty').hidden = !!(day.software || []).length;
        document.getElementById('githubEmpty').hidden = !!(day.github || []).length;
        const u = safeUrl(day.github_source);
        ghSrc.hidden = !u;
        if (u) ghSrc.querySelector('a').href = u;
        archive.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.date === day.date));
      }
      days.forEach(dd => {
        const n = (dd.software || []).length + (dd.github || []).length;
        const b = el('button', 'chip', fmtDate(dd.date).replace(/^\d{4} 年 /, '') + ` · ${n} 条`);
        b.dataset.date = dd.date;
        b.addEventListener('click', () => {
          history.replaceState(null, '', dd === days[0] ? '/news' : '/news?date=' + dd.date);
          show(dd);
          window.scrollTo({ top: document.getElementById('newsTop').offsetTop - 80, behavior: 'smooth' });
        });
        archive.appendChild(b);
      });
      show(days.find(x => x.date === want) || days[0]);
    } catch (e) {
      sumEl.textContent = '内容加载失败，请稍后刷新重试。';
    }
  }

  if (document.getElementById('newsPreviewSoftware')) renderPreview();
  if (document.getElementById('softwareGrid')) renderPage();
})();
