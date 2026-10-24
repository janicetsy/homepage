// 每日机会：读取 /data/daily.json 并渲染（首页预览 + /daily 页面）
(function () {
  const CAT = {
    job: { label: '香港职位', cls: 't-indigo' },
    remote: { label: '远程 AI 任务', cls: 't-teal' },
    freelance: { label: '自由职业', cls: 't-amber' },
    followup: { label: '持续跟进', cls: 't-rose' }
  };
  const HK = {
    yes: { label: '香港可申请', cls: 'hk-yes' },
    no: { label: '不含香港', cls: 'hk-no' },
    unknown: { label: '香港资格待确认', cls: 'hk-unknown' }
  };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null && text !== '') e.textContent = text;
    return e;
  }
  function safeUrl(u) {
    try { const x = new URL(u); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : null; }
    catch (_) { return null; }
  }
  function fmtDate(d) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
    return m ? `${m[1]} 年 ${+m[2]} 月 ${+m[3]} 日` : d;
  }

  function card(item, compact) {
    const c = el('article', 'card opp' + (compact ? ' compact' : ''));
    c.dataset.cat = item.category || 'job';
    const top = el('div', 'opp-top');
    const cat = CAT[item.category] || CAT.job;
    top.appendChild(el('span', 'tag ' + cat.cls, cat.label));
    const hk = HK[item.hk] || HK.unknown;
    top.appendChild(el('span', 'hk ' + hk.cls, hk.label));
    c.appendChild(top);

    c.appendChild(el('h3', '', item.title));
    if (item.org) c.appendChild(el('p', 'opp-org', item.org));

    const rows = el('ul', 'opp-rows');
    const add = (icon, label, val) => {
      if (!val) return;
      const li = el('li');
      li.appendChild(el('span', 'k', icon + ' ' + label));
      li.appendChild(el('span', 'v', val));
      rows.appendChild(li);
    };
    add('📍', '地点', item.location);
    add('💰', '薪酬', item.pay);
    add('🕒', '发布', item.posted);
    add('⏳', '截止', item.deadline);
    if (!compact) add('🌏', '地区', item.hk_note);
    c.appendChild(rows);

    if (!compact && item.requirements && item.requirements.length) {
      const req = el('div', 'opp-req');
      req.appendChild(el('p', 'opp-req-h', '主要要求'));
      const ul = el('ul');
      item.requirements.forEach(r => ul.appendChild(el('li', '', r)));
      req.appendChild(ul);
      c.appendChild(req);
    }
    if (!compact && item.note) c.appendChild(el('p', 'opp-note', item.note));

    const foot = el('div', 'opp-foot');
    const u = safeUrl(item.url);
    if (u) {
      const a = el('a', 'link', '查看原页面 ↗');
      a.href = u; a.target = '_blank'; a.rel = 'noopener nofollow';
      foot.appendChild(a);
    }
    if (item.source) foot.appendChild(el('span', 'src', '来源：' + item.source));
    c.appendChild(foot);
    return c;
  }

  async function load() {
    const r = await fetch('/data/daily.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    const days = (d.days || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    return { updated: d.updated, days };
  }

  // 首页预览
  async function renderPreview(root) {
    try {
      const { days } = await load();
      const day = days[0];
      if (!day) { root.closest('section').hidden = true; return; }
      document.getElementById('dailyDate').textContent = fmtDate(day.date);
      document.getElementById('dailySummary').textContent = day.summary || '';
      const items = (day.items || []).slice(0, 3);
      items.forEach(it => root.appendChild(card(it, true)));
      const more = document.getElementById('dailyCount');
      if (more) more.textContent = day.items.length ? `查看今日全部 ${day.items.length} 条 →` : '查看往期机会 →';
    } catch (e) {
      root.closest('section').hidden = true;
    }
  }

  // /daily 页面
  async function renderPage(root) {
    const dateEl = document.getElementById('dayDate');
    const sumEl = document.getElementById('daySummary');
    const archive = document.getElementById('archive');
    const chips = document.querySelectorAll('#dayFilters .chip');
    const exBox = document.getElementById('excluded');
    let state = { filter: 'all' };
    try {
      const { days } = await load();
      if (!days.length) { sumEl.textContent = '暂时还没有内容，敬请期待。'; return; }
      const want = new URLSearchParams(location.search).get('date');
      let day = days.find(x => x.date === want) || days[0];

      function applyFilter() {
        root.querySelectorAll('.opp').forEach(c => {
          c.classList.toggle('hide', state.filter !== 'all' && c.dataset.cat !== state.filter);
        });
        const visible = root.querySelectorAll('.opp:not(.hide)').length;
        document.getElementById('emptyHint').hidden = visible > 0;
      }
      function show(dd) {
        day = dd;
        dateEl.textContent = fmtDate(dd.date);
        sumEl.textContent = dd.summary || '';
        root.innerHTML = '';
        (dd.items || []).forEach(it => root.appendChild(card(it, false)));
        exBox.innerHTML = '';
        if (dd.excluded && dd.excluded.length) {
          exBox.hidden = false;
          exBox.appendChild(el('h3', '', '已排除'));
          const ul = el('ul');
          dd.excluded.forEach(x => {
            const li = el('li');
            li.appendChild(el('strong', '', x.title));
            if (x.reason) li.appendChild(document.createTextNode('：' + x.reason));
            ul.appendChild(li);
          });
          exBox.appendChild(ul);
        } else exBox.hidden = true;
        archive.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.date === dd.date));
        applyFilter();
      }
      days.forEach(dd => {
        const b = el('button', 'chip', fmtDate(dd.date).replace(/^\d{4} 年 /, '') + ` · ${dd.items.length} 条`);
        b.dataset.date = dd.date;
        b.addEventListener('click', () => {
          history.replaceState(null, '', dd === days[0] ? '/daily' : '/daily?date=' + dd.date);
          show(dd);
          window.scrollTo({ top: document.getElementById('dayTop').offsetTop - 80, behavior: 'smooth' });
        });
        archive.appendChild(b);
      });
      chips.forEach(ch => ch.addEventListener('click', () => {
        chips.forEach(x => x.classList.remove('active'));
        ch.classList.add('active');
        state.filter = ch.dataset.filter;
        applyFilter();
      }));
      show(day);
    } catch (e) {
      sumEl.textContent = '内容加载失败，请稍后刷新重试。';
    }
  }

  const p = document.getElementById('dailyPreview');
  if (p) renderPreview(p);
  const g = document.getElementById('dailyGrid');
  if (g) renderPage(g);
})();
